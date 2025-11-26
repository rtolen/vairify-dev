import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function InviteEmail() {
  const navigate = useNavigate();
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [message, setMessage] = useState("Hey! I'm using Vairify for verified safety in my work. You should check it out!");
  const [bulkEmails, setBulkEmails] = useState("");
  const [sending, setSending] = useState(false);

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const addEmail = () => {
    const trimmed = emailInput.trim();
    if (!trimmed) return;

    if (!validateEmail(trimmed)) {
      toast.error("Invalid email address");
      return;
    }

    if (emails.includes(trimmed)) {
      toast.error("Email already added");
      return;
    }

    setEmails([...emails, trimmed]);
    setEmailInput("");
  };

  const removeEmail = (email: string) => {
    setEmails(emails.filter(e => e !== email));
  };

  const parseBulkEmails = () => {
    const parsed = bulkEmails
      .split(/[,;\s\n]+/)
      .map(e => e.trim())
      .filter(e => e.length > 0);

    const valid = parsed.filter(validateEmail);
    const invalid = parsed.filter(e => !validateEmail(e));

    if (invalid.length > 0) {
      toast.error(`${invalid.length} invalid email(s) skipped`);
    }

    const newEmails = valid.filter(e => !emails.includes(e));
    setEmails([...emails, ...newEmails]);
    setBulkEmails("");
    
    if (newEmails.length > 0) {
      toast.success(`Added ${newEmails.length} email(s)`);
    }
  };

  const sendInvitations = async () => {
    if (emails.length === 0) return;

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to send invitations");
        return;
      }

      // Insert invitations into database
      const invitations = emails.map(email => ({
        referrer_id: user.id,
        invite_method: 'email',
        invite_target: email,
        message: message || null,
        status: 'pending'
      }));

      const { error } = await supabase
        .from('referral_invitations')
        .insert(invitations);

      if (error) throw error;

      toast.success(`${emails.length} invitation(s) sent!`);
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
      addEmail();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-accent rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">INVITE VIA EMAIL</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">
        <Card className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <Mail className="w-6 h-6 text-primary mt-1" />
            <div>
              <h2 className="font-bold text-lg">Send Email Invitations</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your friends will receive a personalized email with your referral link
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold mb-4">ENTER EMAIL ADDRESSES</h3>
          
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="email@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={addEmail} variant="outline">
              Add
            </Button>
          </div>

          {emails.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-sm font-semibold">Added ({emails.length}):</p>
              {emails.map((email) => (
                <div key={email} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                  <span className="text-sm">{email}</span>
                  <button onClick={() => removeEmail(email)} className="p-1 hover:bg-background rounded">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-border pt-4 mt-4">
            <p className="text-sm font-semibold mb-2">OR paste multiple (comma separated):</p>
            <Textarea
              placeholder="sarah@example.com, jordan@test.com, alex@email.com"
              value={bulkEmails}
              onChange={(e) => setBulkEmails(e.target.value)}
              rows={3}
              className="mb-2"
            />
            <Button onClick={parseBulkEmails} variant="outline" disabled={!bulkEmails.trim()}>
              Paste & Add
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold mb-4">PERSONALIZE MESSAGE (Optional)</h3>
          
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={280}
            className="mb-2"
          />
          <p className="text-sm text-muted-foreground">
            {280 - message.length} characters remaining
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Your referral link will be automatically included
          </p>
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
              Access to safety features
            </li>
            <li className="flex items-center gap-2 text-sm">
              <span className="text-success">✅</span>
              Priority support
            </li>
          </ul>

          <h3 className="font-bold mb-2">WHAT YOU'LL EARN:</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm">
              <span>💰</span>
              10% of their subscription
            </li>
            <li className="flex items-center gap-2 text-sm">
              <span>💰</span>
              Every month they stay Premium
            </li>
            <li className="flex items-center gap-2 text-sm">
              <span>💰</span>
              Forever (lifetime commission)
            </li>
          </ul>
          <p className="text-sm text-muted-foreground mt-3">
            Example: $2/month if they pay $20/month for Premium
          </p>
        </Card>

        <Button
          onClick={sendInvitations}
          disabled={emails.length === 0 || sending}
          className="w-full"
          size="lg"
        >
          {sending ? "SENDING..." : `SEND INVITATIONS (${emails.length})`}
        </Button>
      </div>
    </div>
  );
}
