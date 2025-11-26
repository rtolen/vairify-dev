-- Add Dispute Resolution system to TrueRevu
-- Feature: Dispute Resolution for Reviews

-- Create disputes table
CREATE TABLE IF NOT EXISTS public.review_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  complainant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  respondent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dispute_reason VARCHAR(50) NOT NULL CHECK (dispute_reason IN ('inaccurate', 'false', 'defamatory')),
  statement TEXT NOT NULL,
  evidence_urls JSONB DEFAULT '[]'::jsonb,
  dm_attachments JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(50) DEFAULT 'pending_panel' CHECK (status IN ('pending_panel', 'panel_review', 'voting', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_action VARCHAR(50) CHECK (resolution_action IN ('dismissed', 'review_removed', 'warning_issued', 'no_action')),
  resolution_notes TEXT
);

-- Create dispute_panel_members table
CREATE TABLE IF NOT EXISTS public.dispute_panel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES public.review_disputes(id) ON DELETE CASCADE,
  panel_member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_type VARCHAR(20) NOT NULL CHECK (member_type IN ('client', 'provider')),
  invitation_sent_at TIMESTAMP WITH TIME ZONE,
  invitation_accepted_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(dispute_id, panel_member_id)
);

-- Create dispute_votes table (encrypted votes)
CREATE TABLE IF NOT EXISTS public.dispute_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES public.review_disputes(id) ON DELETE CASCADE,
  panel_member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_decision VARCHAR(50) NOT NULL CHECK (vote_decision IN ('favor_complainant', 'favor_respondent', 'no_decision')),
  vote_encrypted TEXT NOT NULL, -- Encrypted vote data
  vote_hash TEXT NOT NULL, -- Hash for verification
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(dispute_id, panel_member_id)
);

-- Create dispute_vote_tallies table (admin-visible tallies)
CREATE TABLE IF NOT EXISTS public.dispute_vote_tallies (
  dispute_id UUID PRIMARY KEY REFERENCES public.review_disputes(id) ON DELETE CASCADE,
  favor_complainant_count INTEGER DEFAULT 0,
  favor_respondent_count INTEGER DEFAULT 0,
  no_decision_count INTEGER DEFAULT 0,
  total_votes INTEGER DEFAULT 0,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create dispute_notifications table
CREATE TABLE IF NOT EXISTS public.dispute_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES public.review_disputes(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('panel_invitation', 'vote_reminder', 'outcome_notification')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.review_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_panel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_vote_tallies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for review_disputes
CREATE POLICY "Users can view disputes they're involved in"
  ON public.review_disputes FOR SELECT
  USING (
    auth.uid() = complainant_id OR 
    auth.uid() = respondent_id OR
    EXISTS (
      SELECT 1 FROM public.dispute_panel_members
      WHERE dispute_panel_members.dispute_id = review_disputes.id
      AND dispute_panel_members.panel_member_id = auth.uid()
    ) OR
    public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE POLICY "Users can create disputes for reviews about them"
  ON public.review_disputes FOR INSERT
  WITH CHECK (auth.uid() = complainant_id);

CREATE POLICY "Admins can update disputes"
  ON public.review_disputes FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- RLS Policies for dispute_panel_members
CREATE POLICY "Panel members can view their own panel assignments"
  ON public.dispute_panel_members FOR SELECT
  USING (
    auth.uid() = panel_member_id OR
    public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE POLICY "System can create panel assignments"
  ON public.dispute_panel_members FOR INSERT
  WITH CHECK (true); -- Edge function will create these

CREATE POLICY "Panel members can update their own status"
  ON public.dispute_panel_members FOR UPDATE
  USING (auth.uid() = panel_member_id);

-- RLS Policies for dispute_votes
CREATE POLICY "Panel members can view their own votes"
  ON public.dispute_votes FOR SELECT
  USING (
    auth.uid() = panel_member_id OR
    public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE POLICY "Panel members can create their own votes"
  ON public.dispute_votes FOR INSERT
  WITH CHECK (
    auth.uid() = panel_member_id AND
    EXISTS (
      SELECT 1 FROM public.dispute_panel_members
      WHERE dispute_panel_members.dispute_id = dispute_votes.dispute_id
      AND dispute_panel_members.panel_member_id = auth.uid()
      AND dispute_panel_members.status = 'accepted'
    )
  );

-- RLS Policies for dispute_vote_tallies (admin only)
CREATE POLICY "Admins can view vote tallies"
  ON public.dispute_vote_tallies FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- RLS Policies for dispute_notifications
CREATE POLICY "Users can view their own notifications"
  ON public.dispute_notifications FOR SELECT
  USING (auth.uid() = recipient_id);

-- Create indexes
CREATE INDEX idx_review_disputes_review_id ON public.review_disputes(review_id);
CREATE INDEX idx_review_disputes_complainant_id ON public.review_disputes(complainant_id);
CREATE INDEX idx_review_disputes_respondent_id ON public.review_disputes(respondent_id);
CREATE INDEX idx_review_disputes_status ON public.review_disputes(status);
CREATE INDEX idx_dispute_panel_members_dispute_id ON public.dispute_panel_members(dispute_id);
CREATE INDEX idx_dispute_panel_members_panel_member_id ON public.dispute_panel_members(panel_member_id);
CREATE INDEX idx_dispute_votes_dispute_id ON public.dispute_votes(dispute_id);
CREATE INDEX idx_dispute_votes_panel_member_id ON public.dispute_votes(panel_member_id);
CREATE INDEX idx_dispute_notifications_recipient_id ON public.dispute_notifications(recipient_id);

-- Function to encrypt vote (simple hash for demo - use proper encryption in production)
CREATE OR REPLACE FUNCTION encrypt_vote(vote_decision TEXT, panel_member_id UUID, dispute_id UUID)
RETURNS TEXT AS $$
BEGIN
  -- In production, use proper encryption (e.g., pgcrypto)
  -- For demo, return a hash
  RETURN encode(digest(vote_decision || panel_member_id::TEXT || dispute_id::TEXT, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to update vote tallies
CREATE OR REPLACE FUNCTION update_dispute_vote_tallies()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.dispute_vote_tallies (dispute_id, favor_complainant_count, favor_respondent_count, no_decision_count, total_votes)
  SELECT 
    dispute_id,
    COUNT(*) FILTER (WHERE vote_decision = 'favor_complainant'),
    COUNT(*) FILTER (WHERE vote_decision = 'favor_respondent'),
    COUNT(*) FILTER (WHERE vote_decision = 'no_decision'),
    COUNT(*)
  FROM public.dispute_votes
  WHERE dispute_id = NEW.dispute_id
  GROUP BY dispute_id
  ON CONFLICT (dispute_id) DO UPDATE SET
    favor_complainant_count = EXCLUDED.favor_complainant_count,
    favor_respondent_count = EXCLUDED.favor_respondent_count,
    no_decision_count = EXCLUDED.no_decision_count,
    total_votes = EXCLUDED.total_votes,
    last_updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update tallies when vote is added
CREATE TRIGGER update_vote_tallies_trigger
  AFTER INSERT ON public.dispute_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_dispute_vote_tallies();

-- Comments
COMMENT ON TABLE public.review_disputes IS 'Dispute records for reviews';
COMMENT ON TABLE public.dispute_panel_members IS 'Panel members assigned to review disputes';
COMMENT ON TABLE public.dispute_votes IS 'Encrypted votes from panel members';
COMMENT ON TABLE public.dispute_vote_tallies IS 'Vote tallies visible to admins';
COMMENT ON TABLE public.dispute_notifications IS 'Notifications for dispute participants';


