import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, MessageSquare, Users, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SendResult {
  invitation_id: string;
  phone: string;
  success: boolean;
  error?: string;
}

export default function InviteSMSFixed() {
  const navigate = useNavigate();
  const [phoneInput, setPhoneInput] = useState("");
  const [phones, setPhones] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState<SendResult[]>([]);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [customCode, setCustomCode] = useState<string | null>(null);
  const [referrerType, setReferrerType] = useState<'user' | 'influencer'>('user');

  useEffect(() => {
    loadReferralCode();
  }, []);

  const loadReferralCode = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user has referral code
      const { data: referralCodeData } = await supabase
        .from('referral_codes')
        .select('referral_code')
        .eq('user_id', user.id)
        .single();

      if (referralCodeData) {
        setReferralCode(referralCodeData.referral_code);
        setReferrerType('user');
      } else {
        // Check if user is influencer with custom code
        const { data: influencerData } = await supabase
          .from('influencers')
          .select('custom_code')
          .eq('user_id', user.id)
          .eq('status', 'approved')
          .single();

        if (influencerData?.custom_code) {
          setCustomCode(influencerData.custom_code);
          setReferrerType('influencer');
        }
      }
    } catch (error) {
      console.error('Error loading referral code:', error);
    }
  };

  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10 || cleaned.length === 11;
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const addPhone = () => {
    const trimmed = phoneInput.trim();
    if (!trimmed) return;

    if (!validatePhone(trimmed)) {
      toast.error("Invalid phone number");
      return;
    }

    const formatted = formatPhone(trimmed);
    if (phones.includes(formatted)) {
      toast.error("Phone number already added");
      return;
    }

    setPhones([...phones, formatted]);
    setPhoneInput("");
  };

  const removePhone = (phone: string) => {
    setPhones(phones.filter(p => p !== phone));
  };

  const getDefaultMessage = () => {
    const codeToUse = customCode || referralCode || 'YOURCODE';
    return `Hey! I'm on Vairify - the verified safety platform. Join with my code & get 20% off: vairify.com/join/${codeToUse}\n\nReply STOP to unsubscribe`;
  };

  const getMessage = () => {
    if (customMessage.trim()) {
      return customMessage;
    }
    return getDefaultMessage();
  };

  const handleContactPicker = async () => {
    if (!('contacts' in navigator && 'select' in navigator.contacts)) {
      toast.error("Contact picker not supported in your browser");
      return;
    }

    try {
      const contacts = await (navigator.contacts as any).select(['tel'], { multiple: true });
      const contactPhones = contacts
        .flatMap((contact: any) => contact.tel || [])
        .map((tel: any) => tel.value || tel)
        .filter((phone: string) => validatePhone(phone))
        .map((phone: string) => formatPhone(phone));

      const newPhones = contactPhones.filter((p: string) => !phones.includes(p));
      setPhones([...phones, ...newPhones]);
      
      if (newPhones.length > 0) {
        toast.success(`Added ${newPhones.length} contact(s)`);
      } else {
        toast.info("No new phone numbers found in selected contacts");
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Contact picker error:', error);
        toast.error("Failed to access contacts");
      }
    }
  };

  const sendInvitations = async () => {
    if (phones.length === 0) return;

    if (!referralCode && !customCode) {
      toast.error("No referral code found. Please complete your profile first.");
      return;
    }

    setSending(true);
    setSendResults([]);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to send invitations");
        return;
      }

      const results: SendResult[] = [];
      const message = getMessage();

      // Create invitations and send SMS
      for (const phone of phones) {
        try {
          // Create invitation record
          const { data: invitation, error: insertError } = await supabase
            .from('referral_invitations')
            .insert({
              referrer_id: user.id,
              invite_method: 'sms',
              invite_target: phone,
              message: message,
              status: 'pending',
              referrer_type: referrerType,
              custom_code: customCode || null,
              delivery_status: 'pending'
            })
            .select()
            .single();

          if (insertError) throw insertError;

          // Send SMS via edge function
          const { data: sendData, error: sendError } = await supabase.functions.invoke('send-referral-sms', {
            body: {
              invitation_id: invitation.id,
              to_phone: phone,
              referral_code: referralCode,
              custom_code: customCode,
              message: message
            }
          });

          if (sendError || !sendData?.success) {
            results.push({
              invitation_id: invitation.id,
              phone,
              success: false,
              error: sendError?.message || sendData?.error || 'Failed to send'
            });
          } else {
            results.push({
              invitation_id: invitation.id,
              phone,
              success: true
            });
          }
        } catch (error: any) {
          results.push({
            invitation_id: '',
            phone,
            success: false,
            error: error.message || 'Failed to send'
          });
        }
      }

      setSendResults(results);

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        toast.success(`${successCount} SMS invitation(s) sent successfully!`);
      }

      if (failCount > 0) {
        toast.error(`${failCount} SMS invitation(s) failed to send`);
      }

      // Wait a moment to show results, then navigate
      setTimeout(() => {
        navigate('/referrals');
      }, 2000);
    } catch (error) {
      console.error('Error sending invitations:', error);
      toast.error("Failed to send invitations");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addPhone();
    }
  };

  const calculateCost = () => {
    const costPerSMS = 0.05;
    return (phones.length * costPerSMS).toFixed(2);
  };

  const codeToDisplay = customCode || referralCode || 'Loading...';

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-accent rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">INVITE VIA SMS</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
        <Card className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <MessageSquare className="w-6 h-6 text-primary mt-1" />
            <div>
              <h2 className="font-bold text-lg">Send Text Message Invitations</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Friends receive SMS with your referral link (standard rates apply)
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Your referral code: <code className="bg-muted px-2 py-1 rounded">{codeToDisplay}</code>
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold mb-4">ENTER PHONE NUMBERS</h3>
          
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="+1 (555) 123-4567"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={addPhone} variant="outline">
              Add
            </Button>
            <Button onClick={handleContactPicker} variant="outline" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Contacts
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mb-4">US/Canada format</p>

          {phones.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Added ({phones.length}):</p>
              {phones.map((phone) => (
                <div key={phone} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                  <span className="text-sm">{phone}</span>
                  <button onClick={() => removePhone(phone)} className="p-1 hover:bg-background rounded">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-bold mb-4">MESSAGE PREVIEW</h3>
          
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <p className="text-sm whitespace-pre-wrap font-mono">
              {getMessage()}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {getMessage().length}/160 characters
            </p>
          </div>

          <Button 
            onClick={() => setCustomMessage(getDefaultMessage())} 
            variant="outline"
            className="mb-3"
          >
            Personalize Message
          </Button>

          {customMessage !== "" && (
            <div>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={5}
                maxLength={160}
                className="mb-2 font-mono text-sm"
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  {customMessage.length}/160 characters
                </p>
                <Button 
                  onClick={() => setCustomMessage("")} 
                  variant="ghost"
                  size="sm"
                >
                  Reset to Default
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Send Results */}
        {sendResults.length > 0 && (
          <Card className="p-6">
            <h3 className="font-bold mb-4">SEND RESULTS</h3>
            <div className="space-y-2">
              {sendResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">{result.phone}</span>
                  {result.success ? (
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs">Sent</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-destructive">
                      <XCircle className="w-4 h-4" />
                      <span className="text-xs">{result.error || 'Failed'}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-6 bg-gradient-to-br from-primary/10 to-cyan-500/10">
          <h3 className="font-bold mb-4">WHAT THEY'LL GET:</h3>
          <ul className="space-y-2 mb-4">
            <li className="flex items-center gap-2 text-sm">
              <span className="text-success">✅</span>
              20% off first year
            </li>
            <li className="flex items-center gap-2 text-sm">
              <span className="text-success">✅</span>
              V.A.I. verification
            </li>
            <li className="flex items-center gap-2 text-sm">
              <span className="text-success">✅</span>
              DateGuard protection
            </li>
          </ul>

          <h3 className="font-bold mb-2">WHAT YOU'LL EARN:</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm">
              <span>💰</span>
              $2/month per Premium referral
            </li>
            <li className="flex items-center gap-2 text-sm">
              <span>💰</span>
              Forever (10% lifetime)
            </li>
          </ul>

          <div className="mt-4 p-3 bg-primary/10 rounded-lg">
            <p className="text-sm font-semibold">💡 SMS invites convert 3x better!</p>
          </div>
        </Card>

        {phones.length > 0 && (
          <Card className="p-4 bg-warning/10 border-warning/20">
            <p className="text-sm">
              <span className="font-semibold">Cost:</span> ${calculateCost()} ({phones.length} SMS × $0.05)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Deducted from earnings or charged to payment method
            </p>
          </Card>
        )}

        <Button
          onClick={sendInvitations}
          disabled={phones.length === 0 || sending || (!referralCode && !customCode)}
          className="w-full"
          size="lg"
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              SENDING SMS...
            </>
          ) : (
            `SEND TEXT MESSAGES (${phones.length})`
          )}
        </Button>
      </div>
    </div>
  );
}


