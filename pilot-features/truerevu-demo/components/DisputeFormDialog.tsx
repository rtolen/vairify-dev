import { useState, useEffect } from "react";
import { AlertTriangle, Upload, FileText, MessageSquare, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DisputeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewId: string;
  reviewText: string;
  reviewerVAI: string;
  reviewedUserId: string;
}

export const DisputeFormDialog = ({
  open,
  onOpenChange,
  reviewId,
  reviewText,
  reviewerVAI,
  reviewedUserId
}: DisputeFormDialogProps) => {
  const [disputeReason, setDisputeReason] = useState<string>("");
  const [statement, setStatement] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [dmAttachments, setDmAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDMs, setLoadingDMs] = useState(false);

  useEffect(() => {
    if (open) {
      loadRelevantDMs();
    }
  }, [open, reviewedUserId]);

  const loadRelevantDMs = async () => {
    setLoadingDMs(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load DMs between complainant and respondent related to this review
      const { data: messages } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .or(`sender_id.eq.${reviewedUserId},receiver_id.eq.${reviewedUserId}`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (messages) {
        setDmAttachments(messages);
      }
    } catch (error) {
      console.error('Error loading DMs:', error);
    } finally {
      setLoadingDMs(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setEvidenceFiles([...evidenceFiles, ...files]);
  };

  const removeFile = (index: number) => {
    setEvidenceFiles(evidenceFiles.filter((_, i) => i !== index));
  };

  const uploadEvidence = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `dispute-evidence/${fileName}`;

        const { data, error } = await supabase.storage
          .from('disputes')
          .upload(filePath, file);

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('disputes')
          .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
          uploadedUrls.push(urlData.publicUrl);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (!disputeReason || !statement.trim()) {
      toast.error("Please select a reason and provide a statement");
      return;
    }

    if (statement.length < 50) {
      toast.error("Statement must be at least 50 characters");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to file a dispute");
        return;
      }

      // Upload evidence files
      const evidenceUrls = evidenceFiles.length > 0 
        ? await uploadEvidence(evidenceFiles)
        : [];

      // Prepare DM attachments (just IDs and metadata)
      const dmData = dmAttachments.map(dm => ({
        id: dm.id,
        created_at: dm.created_at,
        preview: dm.content?.substring(0, 100) || ''
      }));

      // Create dispute via edge function
      const { data, error } = await supabase.functions.invoke('create-dispute', {
        body: {
          review_id: reviewId,
          complainant_id: user.id,
          respondent_id: reviewedUserId,
          dispute_reason: disputeReason,
          statement: statement,
          evidence_urls: evidenceUrls,
          dm_attachments: dmData
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Dispute filed successfully! A panel will review your case.");
        onOpenChange(false);
        // Reset form
        setDisputeReason("");
        setStatement("");
        setEvidenceFiles([]);
        setDmAttachments([]);
      } else {
        throw new Error(data?.error || 'Failed to create dispute');
      }
    } catch (error: any) {
      console.error('Error creating dispute:', error);
      toast.error(error.message || "Failed to file dispute. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Dispute This Review
          </DialogTitle>
          <DialogDescription>
            File a dispute if you believe this review is inaccurate, false, or defamatory. 
            A panel of 6 community members (3 clients, 3 providers) will review your case.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Review Preview */}
          <Alert>
            <AlertDescription>
              <strong>Review in question:</strong>
              <p className="mt-2 text-sm italic">"{reviewText}"</p>
              <p className="mt-1 text-xs text-muted-foreground">Reviewer: VAI {reviewerVAI.substring(0, 8)}...</p>
            </AlertDescription>
          </Alert>

          {/* Dispute Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason for Dispute <span className="text-destructive">*</span>
            </Label>
            <Select value={disputeReason} onValueChange={setDisputeReason} required>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inaccurate">Inaccurate - Contains false information</SelectItem>
                <SelectItem value="false">False - Review is completely fabricated</SelectItem>
                <SelectItem value="defamatory">Defamatory - Contains harmful false statements</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Statement */}
          <div className="space-y-2">
            <Label htmlFor="statement">
              Your Statement <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="statement"
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder="Explain why this review is inaccurate, false, or defamatory. Provide specific details and context..."
              rows={6}
              required
              minLength={50}
            />
            <p className="text-xs text-muted-foreground">
              {statement.length} / 50 characters minimum (recommended: 200+)
            </p>
          </div>

          {/* Evidence Upload */}
          <div className="space-y-2">
            <Label>Evidence (Optional)</Label>
            <div className="border-2 border-dashed rounded-lg p-4">
              <input
                type="file"
                multiple
                accept="image/*,application/pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
                id="evidence-upload"
              />
              <label
                htmlFor="evidence-upload"
                className="cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <Upload className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click to upload evidence (images, PDFs, documents)
                </span>
              </label>
            </div>
            {evidenceFiles.length > 0 && (
              <div className="space-y-2">
                {evidenceFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm truncate flex-1">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-6 w-6 p-0"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DM Attachments */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Relevant Direct Messages (Auto-attached)
            </Label>
            {loadingDMs ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading relevant messages...
              </div>
            ) : dmAttachments.length > 0 ? (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {dmAttachments.map((dm, index) => (
                  <div key={dm.id} className="p-2 bg-muted rounded text-xs">
                    <p className="text-muted-foreground">
                      {new Date(dm.created_at).toLocaleDateString()}: {dm.content?.substring(0, 80)}...
                    </p>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  {dmAttachments.length} message(s) will be included as evidence
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No relevant direct messages found
              </p>
            )}
          </div>

          {/* Warning */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Filing a false dispute may result in account penalties. 
              Only file disputes for legitimate concerns. The panel's decision is final.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !disputeReason || statement.length < 50}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Filing Dispute...
              </>
            ) : (
              "File Dispute"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


