--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'moderator',
    'user',
    'influencer',
    'affiliate'
);


--
-- Name: referral_tier; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.referral_tier AS ENUM (
    'founding_council',
    'first_movers',
    'standard'
);


--
-- Name: can_activate_dateguard(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_activate_dateguard(p_encounter_id uuid) RETURNS TABLE(can_activate boolean, reason text, days_remaining integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_encounter RECORD;
  v_days_passed INTEGER;
  v_days_remaining INTEGER;
BEGIN
  -- Get encounter
  SELECT * INTO v_encounter
  FROM public.encounters
  WHERE id = p_encounter_id;
  
  -- Check if encounter exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Encounter not found', 0;
    RETURN;
  END IF;
  
  -- Check if encounter is accepted
  IF v_encounter.status NOT IN ('accepted', 'in_progress', 'completed') THEN
    RETURN QUERY SELECT false, 'Encounter not accepted via V.A.I.-CHECK', 0;
    RETURN;
  END IF;
  
  -- Check if window is already closed
  IF NOT v_encounter.dateguard_window_open THEN
    IF v_encounter.reviews_window_closed_reason = 'reviews_posted' THEN
      RETURN QUERY SELECT false, 'Activation window closed - reviews already posted', 0;
    ELSE
      RETURN QUERY SELECT false, 'Activation window closed - 7 days passed', 0;
    END IF;
    RETURN;
  END IF;
  
  -- Check if reviews already published
  IF v_encounter.reviews_published THEN
    RETURN QUERY SELECT false, 'Activation window closed - reviews already posted', 0;
    RETURN;
  END IF;
  
  -- Calculate days passed
  v_days_passed := EXTRACT(DAY FROM (now() - v_encounter.accepted_at));
  v_days_remaining := 7 - v_days_passed;
  
  -- Check if 7 days have passed
  IF v_days_remaining <= 0 THEN
    RETURN QUERY SELECT false, 'Activation window closed - 7 days passed', 0;
    RETURN;
  END IF;
  
  -- All checks passed
  RETURN QUERY SELECT true, 'Window open', v_days_remaining;
END;
$$;


--
-- Name: generate_session_code(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_session_code() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'auth'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    participant_1_id uuid NOT NULL,
    participant_2_id uuid NOT NULL,
    last_message_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: dateguard_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dateguard_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    sender_id uuid,
    sender_type text NOT NULL,
    sender_name text NOT NULL,
    message text NOT NULL,
    message_type text DEFAULT 'text'::text NOT NULL,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: dateguard_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dateguard_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    guardian_group_id uuid,
    location_name text NOT NULL,
    location_address text NOT NULL,
    location_gps text NOT NULL,
    photo_url text,
    memo text NOT NULL,
    duration_minutes integer NOT NULL,
    alarm_delay_minutes integer DEFAULT 0,
    status text DEFAULT 'active'::text NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    ends_at timestamp with time zone NOT NULL,
    last_checkin_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    encounter_id uuid
);


--
-- Name: emergency_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.emergency_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    session_id uuid,
    trigger_type text NOT NULL,
    location_gps text,
    location_address text,
    triggered_at timestamp with time zone DEFAULT now() NOT NULL,
    resolved_at timestamp with time zone,
    guardians_notified jsonb,
    status text DEFAULT 'active'::text NOT NULL,
    resolution_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT emergency_events_status_check CHECK ((status = ANY (ARRAY['active'::text, 'resolved'::text, 'false_alarm'::text]))),
    CONSTRAINT emergency_events_trigger_type_check CHECK ((trigger_type = ANY (ARRAY['panic_button'::text, 'decoy_code'::text, 'missed_checkin'::text, 'manual'::text])))
);


--
-- Name: emergency_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.emergency_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    task_type text NOT NULL,
    claimed_by uuid,
    claimed_by_name text,
    claimed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: encounters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.encounters (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    provider_id uuid NOT NULL,
    client_id uuid NOT NULL,
    status text DEFAULT 'accepted'::text NOT NULL,
    accepted_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    closed_at timestamp with time zone,
    reviews_window_open boolean DEFAULT true NOT NULL,
    reviews_window_closed_at timestamp with time zone,
    reviews_window_closed_reason text,
    dateguard_window_open boolean DEFAULT true NOT NULL,
    dateguard_window_closed_at timestamp with time zone,
    provider_review_submitted boolean DEFAULT false,
    client_review_submitted boolean DEFAULT false,
    both_reviews_submitted_at timestamp with time zone,
    reviews_publish_scheduled_for timestamp with time zone,
    reviews_published boolean DEFAULT false,
    reviews_published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.favorites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    favorited_user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: founding_council_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.founding_council_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    assigned_by uuid,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: guardian_group_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guardian_group_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    guardian_id uuid NOT NULL,
    group_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: guardian_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guardian_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    group_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_default boolean DEFAULT false
);


--
-- Name: guardians; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guardians (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    invited_at timestamp with time zone DEFAULT now(),
    accepted_at timestamp with time zone,
    last_resent_at timestamp with time zone
);


--
-- Name: guardian_group_counts; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.guardian_group_counts WITH (security_invoker='true') AS
 SELECT gg.id AS group_id,
    gg.user_id,
    gg.group_name,
    gg.is_default,
    count(DISTINCT ggm.guardian_id) FILTER (WHERE (g.status = 'active'::text)) AS active_count,
    count(DISTINCT ggm.guardian_id) FILTER (WHERE (g.status = 'pending'::text)) AS pending_count,
    count(DISTINCT ggm.guardian_id) AS total_count
   FROM ((public.guardian_groups gg
     LEFT JOIN public.guardian_group_members ggm ON ((gg.id = ggm.group_id)))
     LEFT JOIN public.guardians g ON ((ggm.guardian_id = g.id)))
  GROUP BY gg.id, gg.user_id, gg.group_name, gg.is_default;


--
-- Name: influencer_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.influencer_applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    application_type text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    social_handles jsonb DEFAULT '{}'::jsonb,
    audience_size text,
    application_notes text,
    admin_notes text,
    applied_at timestamp with time zone DEFAULT now() NOT NULL,
    reviewed_at timestamp with time zone,
    reviewed_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT influencer_applications_application_type_check CHECK ((application_type = ANY (ARRAY['influencer'::text, 'affiliate'::text]))),
    CONSTRAINT influencer_applications_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    recipient_id uuid NOT NULL,
    content text NOT NULL,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    read boolean DEFAULT false,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    image_url text,
    likes_count integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text,
    full_name text,
    avatar_url text,
    subscription_status text DEFAULT 'free'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: provider_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provider_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    username text NOT NULL,
    avatar_url text,
    public_gallery jsonb DEFAULT '[]'::jsonb,
    members_gallery jsonb DEFAULT '[]'::jsonb,
    height text,
    weight text,
    hair_color text,
    hair_length text,
    eye_color text,
    body_type text,
    ethnicity text,
    age_range text,
    services_offered jsonb DEFAULT '[]'::jsonb,
    add_ons jsonb DEFAULT '[]'::jsonb,
    availability jsonb DEFAULT '{"tours": true, "incalls": false, "outcalls": false, "acceptingClients": true}'::jsonb,
    profile_settings jsonb DEFAULT '{"showOnlineStatus": false, "allowDirectBooking": true, "visibleInDirectory": true}'::jsonb,
    profile_completion_percentage integer DEFAULT 0,
    is_verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: referral_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referral_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    referral_code text NOT NULL,
    tier public.referral_tier DEFAULT 'standard'::public.referral_tier NOT NULL,
    commission_rate numeric(4,3) DEFAULT 0.05 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: referral_earnings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referral_earnings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referrer_id uuid NOT NULL,
    referral_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    month_year text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: referral_invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referral_invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referrer_id uuid NOT NULL,
    invite_method text NOT NULL,
    invite_target text NOT NULL,
    message text,
    status text DEFAULT 'pending'::text NOT NULL,
    invited_at timestamp with time zone DEFAULT now() NOT NULL,
    accepted_at timestamp with time zone,
    last_resent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT referral_invitations_invite_method_check CHECK ((invite_method = ANY (ARRAY['email'::text, 'sms'::text]))),
    CONSTRAINT referral_invitations_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'cancelled'::text])))
);


--
-- Name: referral_payouts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referral_payouts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    payout_date date NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    payment_method text DEFAULT 'bank'::text NOT NULL,
    payment_reference text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    CONSTRAINT referral_payouts_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])))
);


--
-- Name: referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referrals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referrer_id uuid NOT NULL,
    referred_user_id uuid NOT NULL,
    invitation_id uuid,
    subscription_status text DEFAULT 'free'::text NOT NULL,
    monthly_subscription_amount numeric(10,2) DEFAULT 0,
    upgraded_to_premium_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT referrals_subscription_status_check CHECK ((subscription_status = ANY (ARRAY['free'::text, 'premium'::text, 'cancelled'::text])))
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    encounter_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    reviewed_user_id uuid NOT NULL,
    punctuality_rating integer,
    communication_rating integer,
    respectfulness_rating integer,
    attitude_rating integer,
    accuracy_rating integer,
    safety_rating integer,
    overall_rating numeric,
    notes text,
    submitted boolean DEFAULT false,
    submitted_at timestamp with time zone,
    published boolean DEFAULT false,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: safety_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.safety_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    deactivation_code text NOT NULL,
    decoy_code text NOT NULL,
    face_verification_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email_notifications boolean DEFAULT true,
    push_notifications boolean DEFAULT true,
    sms_notifications boolean DEFAULT false,
    emergency_alerts boolean DEFAULT true,
    referral_updates boolean DEFAULT true,
    marketing_emails boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    application_status_emails boolean DEFAULT true
);


--
-- Name: vai_check_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vai_check_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    client_id uuid,
    session_code text NOT NULL,
    qr_data text,
    qr_expires_at timestamp with time zone,
    provider_verified boolean DEFAULT false,
    client_verified boolean DEFAULT false,
    provider_decision text,
    client_decision text,
    contract_signed_provider boolean DEFAULT false,
    contract_signed_client boolean DEFAULT false,
    contract_data jsonb,
    provider_signature text,
    client_signature text,
    final_verification_provider boolean DEFAULT false,
    final_verification_client boolean DEFAULT false,
    status text DEFAULT 'initiated'::text,
    encounter_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    metadata jsonb,
    provider_face_verified boolean DEFAULT false,
    client_face_verified boolean DEFAULT false,
    provider_final_verified boolean DEFAULT false,
    client_final_verified boolean DEFAULT false,
    provider_face_url text,
    client_face_url text,
    provider_final_face_url text,
    client_final_face_url text,
    CONSTRAINT vai_check_sessions_client_decision_check CHECK ((client_decision = ANY (ARRAY['pending'::text, 'accept'::text, 'decline'::text]))),
    CONSTRAINT vai_check_sessions_provider_decision_check CHECK ((provider_decision = ANY (ARRAY['pending'::text, 'accept'::text, 'decline'::text]))),
    CONSTRAINT vai_check_sessions_status_check CHECK ((status = ANY (ARRAY['initiated'::text, 'qr_shown'::text, 'profiles_viewed'::text, 'contract_review'::text, 'contract_signed'::text, 'final_verification'::text, 'completed'::text, 'failed'::text, 'declined'::text])))
);


--
-- Name: vai_verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vai_verifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    vai_number text NOT NULL,
    biometric_photo_url text NOT NULL,
    le_disclosure_accepted boolean DEFAULT false NOT NULL,
    signature_agreement_accepted boolean DEFAULT false NOT NULL,
    complycube_transaction_number text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: conversations conversations_participant_1_id_participant_2_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_participant_1_id_participant_2_id_key UNIQUE (participant_1_id, participant_2_id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: dateguard_messages dateguard_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dateguard_messages
    ADD CONSTRAINT dateguard_messages_pkey PRIMARY KEY (id);


--
-- Name: dateguard_sessions dateguard_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dateguard_sessions
    ADD CONSTRAINT dateguard_sessions_pkey PRIMARY KEY (id);


--
-- Name: emergency_events emergency_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_events
    ADD CONSTRAINT emergency_events_pkey PRIMARY KEY (id);


--
-- Name: emergency_tasks emergency_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_tasks
    ADD CONSTRAINT emergency_tasks_pkey PRIMARY KEY (id);


--
-- Name: encounters encounters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.encounters
    ADD CONSTRAINT encounters_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_user_id_favorited_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_favorited_user_id_key UNIQUE (user_id, favorited_user_id);


--
-- Name: founding_council_members founding_council_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.founding_council_members
    ADD CONSTRAINT founding_council_members_pkey PRIMARY KEY (id);


--
-- Name: founding_council_members founding_council_members_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.founding_council_members
    ADD CONSTRAINT founding_council_members_user_id_key UNIQUE (user_id);


--
-- Name: guardian_group_members guardian_group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardian_group_members
    ADD CONSTRAINT guardian_group_members_pkey PRIMARY KEY (id);


--
-- Name: guardian_groups guardian_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardian_groups
    ADD CONSTRAINT guardian_groups_pkey PRIMARY KEY (id);


--
-- Name: guardians guardians_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardians
    ADD CONSTRAINT guardians_pkey PRIMARY KEY (id);


--
-- Name: influencer_applications influencer_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.influencer_applications
    ADD CONSTRAINT influencer_applications_pkey PRIMARY KEY (id);


--
-- Name: influencer_applications influencer_applications_user_id_application_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.influencer_applications
    ADD CONSTRAINT influencer_applications_user_id_application_type_key UNIQUE (user_id, application_type);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: provider_profiles provider_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_profiles
    ADD CONSTRAINT provider_profiles_pkey PRIMARY KEY (id);


--
-- Name: provider_profiles provider_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_profiles
    ADD CONSTRAINT provider_profiles_user_id_key UNIQUE (user_id);


--
-- Name: provider_profiles provider_profiles_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_profiles
    ADD CONSTRAINT provider_profiles_username_key UNIQUE (username);


--
-- Name: referral_codes referral_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_codes
    ADD CONSTRAINT referral_codes_pkey PRIMARY KEY (id);


--
-- Name: referral_codes referral_codes_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_codes
    ADD CONSTRAINT referral_codes_referral_code_key UNIQUE (referral_code);


--
-- Name: referral_earnings referral_earnings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_earnings
    ADD CONSTRAINT referral_earnings_pkey PRIMARY KEY (id);


--
-- Name: referral_invitations referral_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_invitations
    ADD CONSTRAINT referral_invitations_pkey PRIMARY KEY (id);


--
-- Name: referral_payouts referral_payouts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_payouts
    ADD CONSTRAINT referral_payouts_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_referred_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referred_user_id_key UNIQUE (referred_user_id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: safety_codes safety_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.safety_codes
    ADD CONSTRAINT safety_codes_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: user_settings user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (id);


--
-- Name: user_settings user_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_key UNIQUE (user_id);


--
-- Name: vai_check_sessions vai_check_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vai_check_sessions
    ADD CONSTRAINT vai_check_sessions_pkey PRIMARY KEY (id);


--
-- Name: vai_check_sessions vai_check_sessions_session_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vai_check_sessions
    ADD CONSTRAINT vai_check_sessions_session_code_key UNIQUE (session_code);


--
-- Name: vai_verifications vai_verifications_complycube_transaction_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vai_verifications
    ADD CONSTRAINT vai_verifications_complycube_transaction_number_key UNIQUE (complycube_transaction_number);


--
-- Name: vai_verifications vai_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vai_verifications
    ADD CONSTRAINT vai_verifications_pkey PRIMARY KEY (id);


--
-- Name: vai_verifications vai_verifications_vai_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vai_verifications
    ADD CONSTRAINT vai_verifications_vai_number_key UNIQUE (vai_number);


--
-- Name: idx_emergency_events_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_emergency_events_status ON public.emergency_events USING btree (status);


--
-- Name: idx_emergency_events_triggered_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_emergency_events_triggered_at ON public.emergency_events USING btree (triggered_at DESC);


--
-- Name: idx_emergency_events_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_emergency_events_user_id ON public.emergency_events USING btree (user_id);


--
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree (read);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_provider_profiles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_provider_profiles_user_id ON public.provider_profiles USING btree (user_id);


--
-- Name: idx_provider_profiles_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_provider_profiles_username ON public.provider_profiles USING btree (username);


--
-- Name: idx_referral_codes_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_referral_codes_code ON public.referral_codes USING btree (referral_code);


--
-- Name: idx_referral_codes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_referral_codes_user_id ON public.referral_codes USING btree (user_id);


--
-- Name: idx_referral_earnings_referrer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_referral_earnings_referrer ON public.referral_earnings USING btree (referrer_id);


--
-- Name: idx_referral_invitations_referrer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_referral_invitations_referrer ON public.referral_invitations USING btree (referrer_id);


--
-- Name: idx_referral_payouts_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_referral_payouts_user ON public.referral_payouts USING btree (user_id);


--
-- Name: idx_referrals_referred_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_referrals_referred_user ON public.referrals USING btree (referred_user_id);


--
-- Name: idx_referrals_referrer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_referrals_referrer ON public.referrals USING btree (referrer_id);


--
-- Name: idx_vai_verifications_transaction_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vai_verifications_transaction_number ON public.vai_verifications USING btree (complycube_transaction_number);


--
-- Name: idx_vai_verifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vai_verifications_user_id ON public.vai_verifications USING btree (user_id);


--
-- Name: idx_vai_verifications_vai_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vai_verifications_vai_number ON public.vai_verifications USING btree (vai_number);


--
-- Name: conversations update_conversations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dateguard_sessions update_dateguard_sessions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dateguard_sessions_updated_at BEFORE UPDATE ON public.dateguard_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: emergency_events update_emergency_events_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_emergency_events_updated_at BEFORE UPDATE ON public.emergency_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: encounters update_encounters_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_encounters_updated_at BEFORE UPDATE ON public.encounters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: guardian_groups update_guardian_groups_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_guardian_groups_updated_at BEFORE UPDATE ON public.guardian_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: guardians update_guardians_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_guardians_updated_at BEFORE UPDATE ON public.guardians FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: influencer_applications update_influencer_applications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_influencer_applications_updated_at BEFORE UPDATE ON public.influencer_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: notifications update_notifications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: posts update_posts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: provider_profiles update_provider_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_provider_profiles_updated_at BEFORE UPDATE ON public.provider_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: referral_codes update_referral_codes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_referral_codes_updated_at BEFORE UPDATE ON public.referral_codes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: referrals update_referrals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: reviews update_reviews_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: safety_codes update_safety_codes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_safety_codes_updated_at BEFORE UPDATE ON public.safety_codes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_settings update_user_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: vai_verifications update_vai_verifications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vai_verifications_updated_at BEFORE UPDATE ON public.vai_verifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: conversations conversations_participant_1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_participant_1_id_fkey FOREIGN KEY (participant_1_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_participant_2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_participant_2_id_fkey FOREIGN KEY (participant_2_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: dateguard_messages dateguard_messages_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dateguard_messages
    ADD CONSTRAINT dateguard_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.dateguard_sessions(id) ON DELETE CASCADE;


--
-- Name: dateguard_sessions dateguard_sessions_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dateguard_sessions
    ADD CONSTRAINT dateguard_sessions_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id);


--
-- Name: dateguard_sessions dateguard_sessions_guardian_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dateguard_sessions
    ADD CONSTRAINT dateguard_sessions_guardian_group_id_fkey FOREIGN KEY (guardian_group_id) REFERENCES public.guardian_groups(id);


--
-- Name: emergency_events emergency_events_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_events
    ADD CONSTRAINT emergency_events_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.dateguard_sessions(id);


--
-- Name: emergency_tasks emergency_tasks_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_tasks
    ADD CONSTRAINT emergency_tasks_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.dateguard_sessions(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_favorited_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_favorited_user_id_fkey FOREIGN KEY (favorited_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: founding_council_members founding_council_members_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.founding_council_members
    ADD CONSTRAINT founding_council_members_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES auth.users(id);


--
-- Name: founding_council_members founding_council_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.founding_council_members
    ADD CONSTRAINT founding_council_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: guardian_group_members guardian_group_members_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardian_group_members
    ADD CONSTRAINT guardian_group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.guardian_groups(id) ON DELETE CASCADE;


--
-- Name: guardian_group_members guardian_group_members_guardian_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guardian_group_members
    ADD CONSTRAINT guardian_group_members_guardian_id_fkey FOREIGN KEY (guardian_id) REFERENCES public.guardians(id) ON DELETE CASCADE;


--
-- Name: influencer_applications influencer_applications_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.influencer_applications
    ADD CONSTRAINT influencer_applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);


--
-- Name: influencer_applications influencer_applications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.influencer_applications
    ADD CONSTRAINT influencer_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: posts posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: provider_profiles provider_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_profiles
    ADD CONSTRAINT provider_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: referral_codes referral_codes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_codes
    ADD CONSTRAINT referral_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: referral_earnings referral_earnings_referral_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_earnings
    ADD CONSTRAINT referral_earnings_referral_id_fkey FOREIGN KEY (referral_id) REFERENCES public.referrals(id) ON DELETE CASCADE;


--
-- Name: referral_earnings referral_earnings_referrer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_earnings
    ADD CONSTRAINT referral_earnings_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: referral_invitations referral_invitations_referrer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_invitations
    ADD CONSTRAINT referral_invitations_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: referral_payouts referral_payouts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_payouts
    ADD CONSTRAINT referral_payouts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: referrals referrals_invitation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_invitation_id_fkey FOREIGN KEY (invitation_id) REFERENCES public.referral_invitations(id);


--
-- Name: referrals referrals_referred_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referred_user_id_fkey FOREIGN KEY (referred_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: referrals referrals_referrer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_encounter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_encounter_id_fkey FOREIGN KEY (encounter_id) REFERENCES public.encounters(id);


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_settings user_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: vai_check_sessions vai_check_sessions_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vai_check_sessions
    ADD CONSTRAINT vai_check_sessions_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.users(id);


--
-- Name: vai_check_sessions vai_check_sessions_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vai_check_sessions
    ADD CONSTRAINT vai_check_sessions_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES auth.users(id);


--
-- Name: vai_verifications vai_verifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vai_verifications
    ADD CONSTRAINT vai_verifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles Admins can delete roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can insert roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: founding_council_members Admins can manage founding council; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage founding council" ON public.founding_council_members TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: emergency_events Admins can update all emergency events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all emergency events" ON public.emergency_events FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can update all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: provider_profiles Admins can update all provider profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all provider profiles" ON public.provider_profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: influencer_applications Admins can update applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update applications" ON public.influencer_applications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: referral_payouts Admins can update payouts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update payouts" ON public.referral_payouts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: referrals Admins can update referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update referrals" ON public.referrals FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can update roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: dateguard_sessions Admins can view all DateGuard sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all DateGuard sessions" ON public.dateguard_sessions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: vai_check_sessions Admins can view all VAI sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all VAI sessions" ON public.vai_check_sessions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: vai_verifications Admins can view all VAI verifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all VAI verifications" ON public.vai_verifications FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: influencer_applications Admins can view all applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all applications" ON public.influencer_applications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: referral_earnings Admins can view all earnings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all earnings" ON public.referral_earnings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: emergency_events Admins can view all emergency events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all emergency events" ON public.emergency_events FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: referral_payouts Admins can view all payouts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all payouts" ON public.referral_payouts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: provider_profiles Admins can view all provider profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all provider profiles" ON public.provider_profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: referral_codes Admins can view all referral codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all referral codes" ON public.referral_codes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: referrals Admins can view all referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all referrals" ON public.referrals FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: founding_council_members Anyone can view founding council members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view founding council members" ON public.founding_council_members FOR SELECT TO authenticated USING (true);


--
-- Name: reviews Anyone can view published reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view published reviews" ON public.reviews FOR SELECT USING ((published = true));


--
-- Name: vai_check_sessions Providers can create sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can create sessions" ON public.vai_check_sessions FOR INSERT WITH CHECK (((auth.uid() = provider_id) OR (provider_id = '00000000-0000-0000-0000-000000000000'::uuid)));


--
-- Name: provider_profiles Public can view visible provider profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view visible provider profiles" ON public.provider_profiles FOR SELECT USING ((((profile_settings ->> 'visibleInDirectory'::text))::boolean = true));


--
-- Name: notifications Service role can insert notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);


--
-- Name: conversations Users can create conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK ((auth.uid() = participant_1_id));


--
-- Name: encounters Users can create encounters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create encounters" ON public.encounters FOR INSERT WITH CHECK (((auth.uid() = provider_id) OR (auth.uid() = client_id)));


--
-- Name: favorites Users can create favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create favorites" ON public.favorites FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: dateguard_messages Users can create messages for their sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create messages for their sessions" ON public.dateguard_messages FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.dateguard_sessions
  WHERE ((dateguard_sessions.id = dateguard_messages.session_id) AND (dateguard_sessions.user_id = auth.uid())))));


--
-- Name: influencer_applications Users can create their own application; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own application" ON public.influencer_applications FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: emergency_events Users can create their own emergency events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own emergency events" ON public.emergency_events FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: guardian_groups Users can create their own groups; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own groups" ON public.guardian_groups FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: guardians Users can create their own guardians; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own guardians" ON public.guardians FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: referral_invitations Users can create their own invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own invitations" ON public.referral_invitations FOR INSERT WITH CHECK ((auth.uid() = referrer_id));


--
-- Name: posts Users can create their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own posts" ON public.posts FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: provider_profiles Users can create their own provider profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own provider profile" ON public.provider_profiles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: referral_codes Users can create their own referral code; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own referral code" ON public.referral_codes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: reviews Users can create their own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own reviews" ON public.reviews FOR INSERT WITH CHECK ((auth.uid() = reviewer_id));


--
-- Name: safety_codes Users can create their own safety codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own safety codes" ON public.safety_codes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: dateguard_sessions Users can create their own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own sessions" ON public.dateguard_sessions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_settings Users can create their own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own settings" ON public.user_settings FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: favorites Users can delete their own favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own favorites" ON public.favorites FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: guardian_groups Users can delete their own groups; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own groups" ON public.guardian_groups FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: guardians Users can delete their own guardians; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own guardians" ON public.guardians FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: referral_invitations Users can delete their own invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own invitations" ON public.referral_invitations FOR DELETE USING ((auth.uid() = referrer_id));


--
-- Name: notifications Users can delete their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: posts Users can delete their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: safety_codes Users can delete their own safety codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own safety codes" ON public.safety_codes FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: vai_verifications Users can insert their own VAI verification; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own VAI verification" ON public.vai_verifications FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: emergency_tasks Users can manage tasks for their sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage tasks for their sessions" ON public.emergency_tasks USING ((EXISTS ( SELECT 1
   FROM public.dateguard_sessions
  WHERE ((dateguard_sessions.id = emergency_tasks.session_id) AND (dateguard_sessions.user_id = auth.uid())))));


--
-- Name: guardian_group_members Users can manage their guardian group members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their guardian group members" ON public.guardian_group_members USING ((EXISTS ( SELECT 1
   FROM public.guardians
  WHERE ((guardians.id = guardian_group_members.guardian_id) AND (guardians.user_id = auth.uid())))));


--
-- Name: messages Users can send messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK ((auth.uid() = sender_id));


--
-- Name: conversations Users can update their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their conversations" ON public.conversations FOR UPDATE USING (((auth.uid() = participant_1_id) OR (auth.uid() = participant_2_id)));


--
-- Name: emergency_events Users can update their own emergency events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own emergency events" ON public.emergency_events FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: encounters Users can update their own encounters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own encounters" ON public.encounters FOR UPDATE USING (((auth.uid() = provider_id) OR (auth.uid() = client_id)));


--
-- Name: guardian_groups Users can update their own groups; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own groups" ON public.guardian_groups FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: guardians Users can update their own guardians; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own guardians" ON public.guardians FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: referral_invitations Users can update their own invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own invitations" ON public.referral_invitations FOR UPDATE USING ((auth.uid() = referrer_id));


--
-- Name: notifications Users can update their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: referral_payouts Users can update their own payouts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own payouts" ON public.referral_payouts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: posts Users can update their own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id));


--
-- Name: provider_profiles Users can update their own provider profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own provider profile" ON public.provider_profiles FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: referral_codes Users can update their own referral code; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own referral code" ON public.referral_codes FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: referrals Users can update their own referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own referrals" ON public.referrals FOR UPDATE USING ((auth.uid() = referrer_id));


--
-- Name: reviews Users can update their own reviews before submission; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own reviews before submission" ON public.reviews FOR UPDATE USING (((auth.uid() = reviewer_id) AND (submitted = false)));


--
-- Name: safety_codes Users can update their own safety codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own safety codes" ON public.safety_codes FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: dateguard_sessions Users can update their own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own sessions" ON public.dateguard_sessions FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: vai_check_sessions Users can update their own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own sessions" ON public.vai_check_sessions FOR UPDATE USING (((auth.uid() = provider_id) OR (auth.uid() = client_id) OR (provider_id = '00000000-0000-0000-0000-000000000000'::uuid) OR (client_id = '00000000-0000-0000-0000-000000000000'::uuid)));


--
-- Name: user_settings Users can update their own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own settings" ON public.user_settings FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: messages Users can update their received messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their received messages" ON public.messages FOR UPDATE USING ((auth.uid() = recipient_id));


--
-- Name: posts Users can view all posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all posts" ON public.posts FOR SELECT USING (true);


--
-- Name: dateguard_messages Users can view messages for their sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view messages for their sessions" ON public.dateguard_messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.dateguard_sessions
  WHERE ((dateguard_sessions.id = dateguard_messages.session_id) AND (dateguard_sessions.user_id = auth.uid())))));


--
-- Name: emergency_tasks Users can view tasks for their sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view tasks for their sessions" ON public.emergency_tasks FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.dateguard_sessions
  WHERE ((dateguard_sessions.id = emergency_tasks.session_id) AND (dateguard_sessions.user_id = auth.uid())))));


--
-- Name: guardian_group_members Users can view their guardian group members; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their guardian group members" ON public.guardian_group_members FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.guardians
  WHERE ((guardians.id = guardian_group_members.guardian_id) AND (guardians.user_id = auth.uid())))));


--
-- Name: vai_verifications Users can view their own VAI verification; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own VAI verification" ON public.vai_verifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: influencer_applications Users can view their own application; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own application" ON public.influencer_applications FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: conversations Users can view their own conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own conversations" ON public.conversations FOR SELECT USING (((auth.uid() = participant_1_id) OR (auth.uid() = participant_2_id)));


--
-- Name: referral_earnings Users can view their own earnings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own earnings" ON public.referral_earnings FOR SELECT USING ((auth.uid() = referrer_id));


--
-- Name: emergency_events Users can view their own emergency events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own emergency events" ON public.emergency_events FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: encounters Users can view their own encounters; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own encounters" ON public.encounters FOR SELECT USING (((auth.uid() = provider_id) OR (auth.uid() = client_id)));


--
-- Name: favorites Users can view their own favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own favorites" ON public.favorites FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: guardian_groups Users can view their own groups; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own groups" ON public.guardian_groups FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: guardians Users can view their own guardians; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own guardians" ON public.guardians FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: referral_invitations Users can view their own invitations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own invitations" ON public.referral_invitations FOR SELECT USING ((auth.uid() = referrer_id));


--
-- Name: messages Users can view their own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own messages" ON public.messages FOR SELECT USING (((auth.uid() = sender_id) OR (auth.uid() = recipient_id)));


--
-- Name: notifications Users can view their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: referral_payouts Users can view their own payouts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own payouts" ON public.referral_payouts FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = id));


--
-- Name: provider_profiles Users can view their own provider profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own provider profile" ON public.provider_profiles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: referral_codes Users can view their own referral code; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own referral code" ON public.referral_codes FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: referrals Users can view their own referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own referrals" ON public.referrals FOR SELECT USING ((auth.uid() = referrer_id));


--
-- Name: reviews Users can view their own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own reviews" ON public.reviews FOR SELECT USING (((auth.uid() = reviewer_id) OR (auth.uid() = reviewed_user_id)));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: safety_codes Users can view their own safety codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own safety codes" ON public.safety_codes FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: dateguard_sessions Users can view their own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own sessions" ON public.dateguard_sessions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: vai_check_sessions Users can view their own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own sessions" ON public.vai_check_sessions FOR SELECT USING (((auth.uid() = provider_id) OR (auth.uid() = client_id) OR (provider_id = '00000000-0000-0000-0000-000000000000'::uuid) OR (client_id = '00000000-0000-0000-0000-000000000000'::uuid)));


--
-- Name: user_settings Users can view their own settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own settings" ON public.user_settings FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: dateguard_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dateguard_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: dateguard_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dateguard_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: emergency_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.emergency_events ENABLE ROW LEVEL SECURITY;

--
-- Name: emergency_tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.emergency_tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: encounters; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.encounters ENABLE ROW LEVEL SECURITY;

--
-- Name: favorites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

--
-- Name: founding_council_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.founding_council_members ENABLE ROW LEVEL SECURITY;

--
-- Name: guardian_group_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.guardian_group_members ENABLE ROW LEVEL SECURITY;

--
-- Name: guardian_groups; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.guardian_groups ENABLE ROW LEVEL SECURITY;

--
-- Name: guardians; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;

--
-- Name: influencer_applications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.influencer_applications ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: provider_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: referral_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: referral_earnings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;

--
-- Name: referral_invitations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.referral_invitations ENABLE ROW LEVEL SECURITY;

--
-- Name: referral_payouts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.referral_payouts ENABLE ROW LEVEL SECURITY;

--
-- Name: referrals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

--
-- Name: reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: safety_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.safety_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: vai_check_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vai_check_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: vai_verifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vai_verifications ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


