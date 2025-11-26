-- Create marketplace_posts table
CREATE TABLE public.marketplace_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caption TEXT,
  location_city TEXT,
  location_state TEXT,
  media_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  available_now BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  boost_type TEXT CHECK (boost_type IN ('none', 'standard', 'premium', 'spotlight')),
  boost_expires_at TIMESTAMP WITH TIME ZONE,
  boost_bid_amount INTEGER DEFAULT 0,
  boost_position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create marketplace_post_likes table
CREATE TABLE public.marketplace_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.marketplace_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create marketplace_post_comments table
CREATE TABLE public.marketplace_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.marketplace_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create golden_roses_balance table
CREATE TABLE public.golden_roses_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance INTEGER NOT NULL DEFAULT 1000,
  lifetime_earned INTEGER DEFAULT 1000,
  lifetime_spent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create golden_roses_transactions table
CREATE TABLE public.golden_roses_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('boost_purchase', 'referral_bonus', 'achievement', 'admin_grant', 'refund')),
  description TEXT,
  related_post_id UUID REFERENCES public.marketplace_posts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_marketplace_posts_user_id ON public.marketplace_posts(user_id);
CREATE INDEX idx_marketplace_posts_created_at ON public.marketplace_posts(created_at DESC);
CREATE INDEX idx_marketplace_posts_boost ON public.marketplace_posts(boost_type, boost_expires_at) WHERE boost_type != 'none';
CREATE INDEX idx_marketplace_posts_boost_position ON public.marketplace_posts(boost_position) WHERE boost_position IS NOT NULL;
CREATE INDEX idx_marketplace_post_likes_post_id ON public.marketplace_post_likes(post_id);
CREATE INDEX idx_marketplace_post_comments_post_id ON public.marketplace_post_comments(post_id);

-- Enable RLS
ALTER TABLE public.marketplace_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golden_roses_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golden_roses_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for marketplace_posts
CREATE POLICY "Anyone can view posts"
  ON public.marketplace_posts FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own posts"
  ON public.marketplace_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON public.marketplace_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON public.marketplace_posts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for marketplace_post_likes
CREATE POLICY "Anyone can view likes"
  ON public.marketplace_post_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like posts"
  ON public.marketplace_post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON public.marketplace_post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for marketplace_post_comments
CREATE POLICY "Anyone can view comments"
  ON public.marketplace_post_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON public.marketplace_post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.marketplace_post_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.marketplace_post_comments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for golden_roses_balance
CREATE POLICY "Users can view their own balance"
  ON public.golden_roses_balance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own balance"
  ON public.golden_roses_balance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can update balances"
  ON public.golden_roses_balance FOR UPDATE
  USING (true);

-- RLS Policies for golden_roses_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.golden_roses_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert transactions"
  ON public.golden_roses_transactions FOR INSERT
  WITH CHECK (true);

-- Trigger to update likes_count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.marketplace_posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.marketplace_posts
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER marketplace_post_likes_count_trigger
AFTER INSERT OR DELETE ON public.marketplace_post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Trigger to update comments_count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.marketplace_posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.marketplace_posts
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER marketplace_post_comments_count_trigger
AFTER INSERT OR DELETE ON public.marketplace_post_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Trigger to update updated_at
CREATE TRIGGER update_marketplace_posts_updated_at
BEFORE UPDATE ON public.marketplace_posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_post_comments_updated_at
BEFORE UPDATE ON public.marketplace_post_comments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_golden_roses_balance_updated_at
BEFORE UPDATE ON public.golden_roses_balance
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();