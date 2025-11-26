-- Create payment_apps table with comprehensive list
CREATE TABLE IF NOT EXISTS public.payment_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_name TEXT NOT NULL,
  app_category TEXT NOT NULL, -- 'p2p', 'crypto_wallet', 'bank'
  app_region TEXT NOT NULL, -- 'us', 'global', 'eu', 'asia', 'latam', 'africa'
  logo_url TEXT,
  download_url_ios TEXT,
  download_url_android TEXT,
  website_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_payment_methods table
CREATE TABLE IF NOT EXISTS public.user_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_app_id UUID NOT NULL REFERENCES public.payment_apps(id) ON DELETE CASCADE,
  preference_order INTEGER NOT NULL DEFAULT 1,
  qr_code_image_url TEXT,
  username_handle TEXT, -- For apps that use @username
  wallet_address TEXT, -- For crypto wallets
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, payment_app_id)
);

-- Enable RLS
ALTER TABLE public.payment_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_apps (public read)
CREATE POLICY "Anyone can view payment apps"
  ON public.payment_apps
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage payment apps"
  ON public.payment_apps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- RLS Policies for user_payment_methods
CREATE POLICY "Users can view their own payment methods"
  ON public.user_payment_methods
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active payment methods"
  ON public.user_payment_methods
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can manage their own payment methods"
  ON public.user_payment_methods
  FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_user_payment_methods_user_id ON public.user_payment_methods(user_id);
CREATE INDEX idx_user_payment_methods_preference ON public.user_payment_methods(user_id, preference_order);
CREATE INDEX idx_payment_apps_category ON public.payment_apps(app_category);
CREATE INDEX idx_payment_apps_region ON public.payment_apps(app_region);

-- Insert comprehensive list of 85 P2P apps and crypto wallets
INSERT INTO public.payment_apps (app_name, app_category, app_region, download_url_ios, download_url_android, website_url) VALUES
-- US P2P Apps
('Venmo', 'p2p', 'us', 'https://apps.apple.com/us/app/venmo/id351727428', 'https://play.google.com/store/apps/details?id=com.venmo', 'https://venmo.com'),
('Cash App', 'p2p', 'us', 'https://apps.apple.com/us/app/cash-app/id711923939', 'https://play.google.com/store/apps/details?id=com.squareup.cash', 'https://cash.app'),
('Zelle', 'p2p', 'us', 'https://apps.apple.com/us/app/zelle/id1260755201', 'https://play.google.com/store/apps/details?id=com.zellepay.zelle', 'https://zellepay.com'),
('PayPal', 'p2p', 'global', 'https://apps.apple.com/us/app/paypal/id283646709', 'https://play.google.com/store/apps/details?id=com.paypal.android.p2pmobile', 'https://paypal.com'),
('Apple Pay', 'p2p', 'global', 'https://www.apple.com/apple-pay/', null, 'https://www.apple.com/apple-pay/'),
('Google Pay', 'p2p', 'global', null, 'https://play.google.com/store/apps/details?id=com.google.android.apps.walletnfcrel', 'https://pay.google.com'),

-- European P2P Apps
('Revolut', 'p2p', 'eu', 'https://apps.apple.com/app/revolut/id932493382', 'https://play.google.com/store/apps/details?id=com.revolut.revolut', 'https://revolut.com'),
('N26', 'p2p', 'eu', 'https://apps.apple.com/app/n26/id956857223', 'https://play.google.com/store/apps/details?id=de.number26.android', 'https://n26.com'),
('Wise', 'p2p', 'global', 'https://apps.apple.com/app/wise/id612261027', 'https://play.google.com/store/apps/details?id=com.transferwise.android', 'https://wise.com'),
('Monzo', 'p2p', 'eu', 'https://apps.apple.com/app/monzo/id1052238659', 'https://play.google.com/store/apps/details?id=co.uk.getmondo', 'https://monzo.com'),
('Lydia', 'p2p', 'eu', 'https://apps.apple.com/app/lydia/id815644496', 'https://play.google.com/store/apps/details?id=com.lydia', 'https://lydia-app.com'),
('Paylib', 'p2p', 'eu', 'https://apps.apple.com/app/paylib/id911868445', 'https://play.google.com/store/apps/details?id=com.lyf.pay', 'https://paylib.fr'),
('Tikkie', 'p2p', 'eu', 'https://apps.apple.com/app/tikkie/id1142944669', 'https://play.google.com/store/apps/details?id=com.abnamro.tikkie', 'https://tikkie.me'),
('Swish', 'p2p', 'eu', 'https://apps.apple.com/app/swish/id563204724', 'https://play.google.com/store/apps/details?id=se.bankgirot.swish', 'https://swish.nu'),
('MobilePay', 'p2p', 'eu', 'https://apps.apple.com/app/mobilepay/id624499138', 'https://play.google.com/store/apps/details?id=dk.danskebank.mobilepay', 'https://mobilepay.dk'),
('Vipps', 'p2p', 'eu', 'https://apps.apple.com/app/vipps/id984380185', 'https://play.google.com/store/apps/details?id=no.dnb.vipps', 'https://vipps.no'),
('TWINT', 'p2p', 'eu', 'https://apps.apple.com/app/twint/id1051583273', 'https://play.google.com/store/apps/details?id=ch.twint', 'https://twint.ch'),

-- Asian P2P Apps
('WeChat Pay', 'p2p', 'asia', 'https://apps.apple.com/app/wechat/id414478124', 'https://play.google.com/store/apps/details?id=com.tencent.mm', 'https://pay.weixin.qq.com'),
('Alipay', 'p2p', 'asia', 'https://apps.apple.com/app/alipay/id333206289', 'https://play.google.com/store/apps/details?id=com.eg.android.AlipayGphone', 'https://alipay.com'),
('Paytm', 'p2p', 'asia', 'https://apps.apple.com/app/paytm/id473941634', 'https://play.google.com/store/apps/details?id=net.one97.paytm', 'https://paytm.com'),
('PhonePe', 'p2p', 'asia', 'https://apps.apple.com/app/phonepe/id1170055821', 'https://play.google.com/store/apps/details?id=com.phonepe.app', 'https://phonepe.com'),
('Google Pay India', 'p2p', 'asia', 'https://apps.apple.com/app/google-pay/id1193357041', 'https://play.google.com/store/apps/details?id=com.google.android.apps.nbu.paisa.user', 'https://pay.google.com'),
('GCash', 'p2p', 'asia', 'https://apps.apple.com/app/gcash/id520001029', 'https://play.google.com/store/apps/details?id=com.globe.gcash.android', 'https://gcash.com'),
('PayMaya', 'p2p', 'asia', 'https://apps.apple.com/app/paymaya/id944682612', 'https://play.google.com/store/apps/details?id=com.paymaya', 'https://paymaya.com'),
('GoPay', 'p2p', 'asia', 'https://apps.apple.com/app/gojek/id944875099', 'https://play.google.com/store/apps/details?id=com.gojek.app', 'https://gopay.co.id'),
('LINE Pay', 'p2p', 'asia', 'https://apps.apple.com/app/line/id443904275', 'https://play.google.com/store/apps/details?id=jp.naver.line.android', 'https://pay.line.me'),
('KakaoTalk Pay', 'p2p', 'asia', 'https://apps.apple.com/app/kakaotalk/id362057947', 'https://play.google.com/store/apps/details?id=com.kakao.talk', 'https://kakaopay.com'),
('Grab Pay', 'p2p', 'asia', 'https://apps.apple.com/app/grab/id647268330', 'https://play.google.com/store/apps/details?id=com.grabtaxi.passenger', 'https://grab.com/sg/pay'),

-- Latin America P2P Apps
('Mercado Pago', 'p2p', 'latam', 'https://apps.apple.com/app/mercado-pago/id925436649', 'https://play.google.com/store/apps/details?id=com.mercadopago.wallet', 'https://mercadopago.com'),
('PicPay', 'p2p', 'latam', 'https://apps.apple.com/app/picpay/id924127678', 'https://play.google.com/store/apps/details?id=com.picpay', 'https://picpay.com'),
('Nequi', 'p2p', 'latam', 'https://apps.apple.com/app/nequi/id1093785174', 'https://play.google.com/store/apps/details?id=com.nequi.MobileApp', 'https://nequi.com.co'),
('Yape', 'p2p', 'latam', 'https://apps.apple.com/app/yape/id1195555491', 'https://play.google.com/store/apps/details?id=com.yape', 'https://yape.com.pe'),
('BBVA Send', 'p2p', 'latam', 'https://apps.apple.com/app/bbva-send/id1449581172', 'https://play.google.com/store/apps/details?id=com.bbva.send', 'https://bbva.com'),
('Rappi Pay', 'p2p', 'latam', 'https://apps.apple.com/app/rappi/id1040259480', 'https://play.google.com/store/apps/details?id=com.grability.rappi', 'https://rappi.com'),

-- Middle East & Africa P2P Apps
('M-Pesa', 'p2p', 'africa', 'https://apps.apple.com/app/m-pesa/id1435321531', 'https://play.google.com/store/apps/details?id=com.safaricom.mpesa', 'https://mpesa.com'),
('Easypaisa', 'p2p', 'asia', 'https://apps.apple.com/app/easypaisa/id1142286395', 'https://play.google.com/store/apps/details?id=pk.com.telenor.phoenix', 'https://easypaisa.com'),
('JazzCash', 'p2p', 'asia', 'https://apps.apple.com/app/jazzcash/id882983588', 'https://play.google.com/store/apps/details?id=com.techlogix.mobilinkcustomer', 'https://jazzcash.com.pk'),
('Careem Pay', 'p2p', 'asia', 'https://apps.apple.com/app/careem/id592978487', 'https://play.google.com/store/apps/details?id=com.careem.acma', 'https://careem.com'),

-- Crypto Wallets
('MetaMask', 'crypto_wallet', 'global', 'https://apps.apple.com/app/metamask/id1438144202', 'https://play.google.com/store/apps/details?id=io.metamask', 'https://metamask.io'),
('Trust Wallet', 'crypto_wallet', 'global', 'https://apps.apple.com/app/trust-wallet/id1288339409', 'https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp', 'https://trustwallet.com'),
('Coinbase Wallet', 'crypto_wallet', 'global', 'https://apps.apple.com/app/coinbase-wallet/id1278383455', 'https://play.google.com/store/apps/details?id=org.toshi', 'https://wallet.coinbase.com'),
('Ledger Live', 'crypto_wallet', 'global', 'https://apps.apple.com/app/ledger-live/id1361671700', 'https://play.google.com/store/apps/details?id=com.ledger.live', 'https://ledger.com'),
('Exodus', 'crypto_wallet', 'global', 'https://apps.apple.com/app/exodus/id1414384820', 'https://play.google.com/store/apps/details?id=exodusmovement.exodus', 'https://exodus.com'),
('Phantom', 'crypto_wallet', 'global', 'https://apps.apple.com/app/phantom-solana-wallet/id1598432977', 'https://play.google.com/store/apps/details?id=app.phantom', 'https://phantom.app'),
('Rainbow', 'crypto_wallet', 'global', 'https://apps.apple.com/app/rainbow-ethereum-wallet/id1457119021', 'https://play.google.com/store/apps/details?id=me.rainbow', 'https://rainbow.me'),
('Atomic Wallet', 'crypto_wallet', 'global', 'https://apps.apple.com/app/atomic-wallet/id1478257827', 'https://play.google.com/store/apps/details?id=io.atomicwallet', 'https://atomicwallet.io'),
('Binance Wallet', 'crypto_wallet', 'global', 'https://apps.apple.com/app/binance/id1436799971', 'https://play.google.com/store/apps/details?id=com.binance.dev', 'https://binance.com'),
('Crypto.com DeFi Wallet', 'crypto_wallet', 'global', 'https://apps.apple.com/app/crypto-com-defi-wallet/id1512048310', 'https://play.google.com/store/apps/details?id=com.defi.wallet', 'https://crypto.com'),

-- Additional Global P2P Apps
('Skrill', 'p2p', 'global', 'https://apps.apple.com/app/skrill/id686162453', 'https://play.google.com/store/apps/details?id=com.skrill.moneytransfer', 'https://skrill.com'),
('Neteller', 'p2p', 'global', 'https://apps.apple.com/app/neteller/id515110850', 'https://play.google.com/store/apps/details?id=com.neteller.app', 'https://neteller.com'),
('Payoneer', 'p2p', 'global', 'https://apps.apple.com/app/payoneer/id761055484', 'https://play.google.com/store/apps/details?id=com.payoneer.android', 'https://payoneer.com'),
('Western Union', 'p2p', 'global', 'https://apps.apple.com/app/western-union/id476920017', 'https://play.google.com/store/apps/details?id=com.westernunion.moneytransferr3app.us', 'https://westernunion.com'),
('Remitly', 'p2p', 'global', 'https://apps.apple.com/app/remitly/id721724616', 'https://play.google.com/store/apps/details?id=com.remitly.android', 'https://remitly.com'),
('WorldRemit', 'p2p', 'global', 'https://apps.apple.com/app/worldremit/id529112062', 'https://play.google.com/store/apps/details?id=com.worldremit.android', 'https://worldremit.com'),

-- Bank Apps with P2P
('Chase QuickPay', 'bank', 'us', 'https://apps.apple.com/app/chase-mobile/id298867247', 'https://play.google.com/store/apps/details?id=com.chase.sig.android', 'https://chase.com'),
('Bank of America', 'bank', 'us', 'https://apps.apple.com/app/bank-of-america/id284847138', 'https://play.google.com/store/apps/details?id=com.infonow.bofa', 'https://bankofamerica.com'),
('Wells Fargo', 'bank', 'us', 'https://apps.apple.com/app/wells-fargo-mobile/id311548341', 'https://play.google.com/store/apps/details?id=com.wf.wellsfargomobile', 'https://wellsfargo.com'),

-- More Asian Apps
('FamPay', 'p2p', 'asia', 'https://apps.apple.com/app/fampay/id1494308120', 'https://play.google.com/store/apps/details?id=com.fampay.in', 'https://fampay.in'),
('Paysend', 'p2p', 'global', 'https://apps.apple.com/app/paysend/id1211868130', 'https://play.google.com/store/apps/details?id=com.paysend.paysend', 'https://paysend.com'),
('TransferGo', 'p2p', 'global', 'https://apps.apple.com/app/transfergo/id669796917', 'https://play.google.com/store/apps/details?id=com.transfergo.mobileapp', 'https://transfergo.com'),
('OFX', 'p2p', 'global', 'https://apps.apple.com/app/ofx/id1139649900', 'https://play.google.com/store/apps/details?id=com.ofx.online', 'https://ofx.com'),
('Azimo', 'p2p', 'global', 'https://apps.apple.com/app/azimo/id549713949', 'https://play.google.com/store/apps/details?id=com.azimo.sendmoney', 'https://azimo.com'),
('Xoom', 'p2p', 'global', 'https://apps.apple.com/app/xoom/id589805594', 'https://play.google.com/store/apps/details?id=com.xoom', 'https://xoom.com'),
('Instarem', 'p2p', 'global', 'https://apps.apple.com/app/instarem/id1109786641', 'https://play.google.com/store/apps/details?id=com.instarem.mobileapp', 'https://instarem.com'),

-- European Additional
('Bunq', 'p2p', 'eu', 'https://apps.apple.com/app/bunq/id1021178365', 'https://play.google.com/store/apps/details?id=com.bunq.android', 'https://bunq.com'),
('Curve', 'p2p', 'eu', 'https://apps.apple.com/app/curve/id1049397112', 'https://play.google.com/store/apps/details?id=com.imaginecurve.curve.prd', 'https://curve.com'),
('Klarna', 'p2p', 'eu', 'https://apps.apple.com/app/klarna/id1115120118', 'https://play.google.com/store/apps/details?id=com.myklarnamobile', 'https://klarna.com'),

-- African Additional
('Chipper Cash', 'p2p', 'africa', 'https://apps.apple.com/app/chipper-cash/id1398032047', 'https://play.google.com/store/apps/details?id=com.chippercash', 'https://chippercash.com'),
('Wave', 'p2p', 'africa', 'https://apps.apple.com/app/wave/id1474010697', 'https://play.google.com/store/apps/details?id=com.wave.personal', 'https://wave.com'),
('Flutterwave', 'p2p', 'africa', 'https://apps.apple.com/app/flutterwave/id1391592879', 'https://play.google.com/store/apps/details?id=com.flutterwave.flutterwaveapp', 'https://flutterwave.com'),
('Paystack', 'p2p', 'africa', 'https://apps.apple.com/app/paystack/id1234573331', 'https://play.google.com/store/apps/details?id=co.paystack.android', 'https://paystack.com'),

-- More Crypto Wallets
('SafePal', 'crypto_wallet', 'global', 'https://apps.apple.com/app/safepal-wallet/id1548297139', 'https://play.google.com/store/apps/details?id=io.safepal.wallet', 'https://safepal.com'),
('Tangem', 'crypto_wallet', 'global', 'https://apps.apple.com/app/tangem/id1354868448', 'https://play.google.com/store/apps/details?id=com.tangem.wallet', 'https://tangem.com'),
('Trezor Suite', 'crypto_wallet', 'global', 'https://apps.apple.com/app/trezor-suite/id1631884497', 'https://play.google.com/store/apps/details?id=io.trezor.suite', 'https://trezor.io'),
('Zengo', 'crypto_wallet', 'global', 'https://apps.apple.com/app/zengo/id1440147115', 'https://play.google.com/store/apps/details?id=com.zengo.wallet', 'https://zengo.com'),
('Argent', 'crypto_wallet', 'global', 'https://apps.apple.com/app/argent/id1358741926', 'https://play.google.com/store/apps/details?id=im.argent.contractwalletclient', 'https://argent.xyz'),

-- Latin America Additional
('Ualá', 'p2p', 'latam', 'https://apps.apple.com/app/uala/id1287856695', 'https://play.google.com/store/apps/details?id=com.uala', 'https://uala.com.ar'),
('Nubank', 'bank', 'latam', 'https://apps.apple.com/app/nubank/id814456780', 'https://play.google.com/store/apps/details?id=com.nu.production', 'https://nubank.com.br'),
('Inter', 'bank', 'latam', 'https://apps.apple.com/app/banco-inter/id1077944556', 'https://play.google.com/store/apps/details?id=br.com.intermedium', 'https://inter.co'),

-- US Additional
('Chime', 'bank', 'us', 'https://apps.apple.com/app/chime/id839653608', 'https://play.google.com/store/apps/details?id=com.onedebit.chime', 'https://chime.com'),
('Current', 'bank', 'us', 'https://apps.apple.com/app/current/id1065791795', 'https://play.google.com/store/apps/details?id=us.current.android', 'https://current.com'),
('Varo', 'bank', 'us', 'https://apps.apple.com/app/varo-bank/id1374533576', 'https://play.google.com/store/apps/details?id=com.varomoney.varo', 'https://varomoney.com');

COMMENT ON TABLE public.payment_apps IS 'Comprehensive list of P2P payment apps and crypto wallets worldwide';
COMMENT ON TABLE public.user_payment_methods IS 'User payment methods with preference ordering for Vairipay system';