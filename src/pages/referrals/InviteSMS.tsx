import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function InviteSMS() {
  const navigate = useNavigate();
  const [phoneInput, setPhoneInput] = useState("");
  const [phones, setPhones] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);

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
    return `Hey! I'm on Vairify - the verified safety platform. Join with my code & get 20% off: vairify.com/join/9I7T35L

Reply STOP to unsubscribe`;
  };

  const getMessage = () => {
    if (customMessage.trim()) {
      return customMessage;
    }
    return getDefaultMessage();
  };

  const sendInvitations = async () => {
    if (phones.length === 0) return;

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to send invitations");
        return;
      }

      const invitations = phones.map(phone => ({
        referrer_id: user.id,
        invite_method: 'sms',
        invite_target: phone,
        message: getMessage(),
        status: 'pending'
      }));

      const { error } = await supabase
        .from('referral_invitations')
        .insert(invitations);

      if (error) throw error;

      toast.success(`${phones.length} SMS invitation(s) sent!`);
      navigate('/referrals');
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
          disabled={phones.length === 0 || sending}
          className="w-full"
          size="lg"
        >
          {sending ? "SENDING..." : `SEND TEXT MESSAGES (${phones.length})`}
        </Button>
      </div>
    </div>
  );
}
