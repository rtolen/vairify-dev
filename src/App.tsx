import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Feed from "./pages/Feed";
import CreateVAI from "./components/vai/CreateVAI";
import Welcome from "./pages/onboarding/Welcome";
import LanguageSelection from "./pages/onboarding/LanguageSelection";
import RoleSelection from "./pages/onboarding/RoleSelection";
import Registration from "./pages/onboarding/Registration";
import VerifyOTP from "./pages/onboarding/VerifyOTP";
import Success from "./pages/onboarding/Success";
import VAICallback from "./pages/onboarding/VAICallback";
import FoundingMemberWelcome from "./pages/onboarding/FoundingMemberWelcome";
import BusinessRegistration from "./pages/business/BusinessRegistration";
import BusinessDashboard from "./pages/business/BusinessDashboard";
import BusinessControlPanel from "./pages/business/BusinessControlPanel";
import BusinessDirectory from "./pages/business/BusinessDirectory";
import VAIRedemption from "./components/business/VAIRedemption";
import DateGuardHome from "./pages/dateguard/DateGuardHome";
import GuardiansManagement from "./pages/dateguard/GuardiansManagement";
import ActivateDateGuard from "./pages/dateguard/ActivateDateGuard";
import ActiveSession from "./pages/dateguard/ActiveSession";
import GuardianChat from "./pages/dateguard/GuardianChat";
import SafetyCodesSetup from "./pages/dateguard/SafetyCodesSetup";
import SetupCodes from "./pages/dateguard/SetupCodes";
import GuardianGroups from "./pages/dateguard/GuardianGroups";
import EmergencyCommandCenter from "./pages/dateguard/EmergencyCommandCenter";
import TestEmergency from "./pages/dateguard/TestEmergency";
import VAICheckIntro from "./pages/vai-check/VAICheckIntro";
import FaceScanProvider from "./pages/vai-check/FaceScanProvider";
import FaceScanLogin from "./pages/vai-check/FaceScanLogin";
import ShowQRCode from "./pages/vai-check/ShowQRCode";
import ScanQRCode from "./pages/vai-check/ScanQRCode";
import MutualProfileView from "./pages/vai-check/MutualProfileView";
import DateGuardActivate from "./pages/dateguard/DateGuardActivate";
import FinalVerification from "./pages/vai-check/FinalVerification";
import Complete from "./pages/vai-check/Complete";
import VairidateFlow from "./pages/vairidate/VairidateFlow";
import VairipaySetup from "./pages/vairipay/VairipaySetup";
import Declined from "./pages/vai-check/Declined";
import ContractReview from "./pages/vai-check/ContractReview";
import ReviewForm from "./pages/vai-check/ReviewForm";
import Referrals from "./pages/Referrals";
import ReferralHelp from "./pages/ReferralHelp";
import ReferralPayouts from "./pages/ReferralPayouts";
import InviteEmail from "./pages/referrals/InviteEmail";
import InviteSMS from "./pages/referrals/InviteSMS";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CouponGenerator from "./pages/admin/CouponGenerator";
import UserManagement from "./pages/admin/UserManagement";
import ReferralManagement from "./pages/admin/ReferralManagement";
import SystemMonitor from "./pages/admin/SystemMonitor";
import InfluencerManagement from "./pages/admin/InfluencerManagement";
import EmailTest from "./pages/admin/EmailTest";
import EmailLogs from "./pages/admin/EmailLogs";
import CountryRepresentatives from "./pages/admin/CountryRepresentatives";
import Settings from "./pages/Settings";
import ReferralLeaderboard from "./pages/ReferralLeaderboard";
import Chat from "./pages/Chat";
import Search from "./pages/Search";
import Favorites from "./pages/Favorites";
import ActivityTimeline from "./pages/ActivityTimeline";
import Pricing from "./pages/Pricing";
import ProfileCreation from "./pages/ProfileCreation";
import ProfileWizard from "./pages/ProfileWizard";
import ApplyInfluencer from "./pages/ApplyInfluencer";
import ApplicationStatus from "./pages/ApplicationStatus";
import Notifications from "./pages/Notifications";
import AvailabilitySettings from "./pages/AvailabilitySettings";
import AvailableNow from "./pages/AvailableNow";
import MarketplaceFeed from "./pages/MarketplaceFeed";
import Calendar from "./pages/Calendar";
import ClientProfile from "./pages/ClientProfile";
import VAIManagement from "./pages/vai-check/VAIManagement";
import ManualVerificationReviewPage from "./pages/vai-check/ManualVerificationReviewPage";
import VAISessionsAdmin from "./pages/admin/VAISessionsAdmin";
import ReviewsAdmin from "./pages/admin/ReviewsAdmin";
import DisputesAdmin from "./pages/admin/DisputesAdmin";
import TrueRevuDashboard from "./pages/TrueRevuDashboard";
import PanelDisputeReview from "./pages/disputes/PanelDisputeReview";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/create-vai" element={<CreateVAI />} />
            <Route path="/feed" element={<Feed />} />
          <Route path="/onboarding/welcome" element={<Welcome />} />
          <Route path="/onboarding/language" element={<LanguageSelection />} />
          <Route path="/onboarding/role" element={<RoleSelection />} />
          <Route path="/onboarding/registration" element={<Registration />} />
          <Route path="/onboarding/verify-otp" element={<VerifyOTP />} />
          <Route path="/onboarding/success" element={<Success />} />
          <Route path="/onboarding/vai-callback" element={<VAICallback />} />
          <Route path="/onboarding/founding-member" element={<FoundingMemberWelcome />} />
          <Route path="/dateguard" element={<DateGuardActivate />} />
          <Route path="/dateguard/home" element={<DateGuardHome />} />
          <Route path="/dateguard/guardians" element={<GuardiansManagement />} />
          <Route path="/dateguard/activate" element={<ActivateDateGuard />} />
          <Route path="/dateguard/activate/:encounterId" element={<ActivateDateGuard />} />
          <Route path="/dateguard/session/:sessionId" element={<ActiveSession />} />
          <Route path="/dateguard/chat/:sessionId" element={<GuardianChat />} />
          <Route path="/dateguard/safety-codes" element={<SafetyCodesSetup />} />
          <Route path="/dateguard/setup/codes" element={<SetupCodes />} />
          <Route path="/dateguard/setup/groups" element={<GuardianGroups />} />
          <Route path="/dateguard/emergency/:sessionId" element={<EmergencyCommandCenter />} />
          <Route path="/dateguard/test-emergency" element={<TestEmergency />} />
          <Route path="/vai-check" element={<VAICheckIntro />} />
          <Route path="/vai-check/face-scan" element={<FaceScanProvider />} />
          <Route path="/vai-check/face-scan-login" element={<FaceScanLogin />} />
          <Route path="/vai-check/show-qr/:sessionId" element={<ShowQRCode />} />
          <Route path="/vai-check/scan-qr" element={<ScanQRCode />} />
          <Route path="/vai-check/mutual-view/:sessionId/:role" element={<MutualProfileView />} />
          <Route path="/vai-check/contract/:sessionId/:role" element={<ContractReview />} />
          
          <Route path="/vai-check/final-verification/:sessionId/:role" element={<FinalVerification />} />
          <Route path="/vai-check/complete/:sessionId" element={<Complete />} />
          <Route path="/vai-check/declined/:sessionId" element={<Declined />} />
          <Route path="/vai-check/review/:sessionId" element={<ReviewForm />} />
          <Route path="/vai-check/manual-review/:sessionId" element={<ManualVerificationReviewPage />} />
          <Route path="/vai-management" element={<VAIManagement />} />
          <Route path="/vairidate/:providerId/:providerName" element={<VairidateFlow />} />
          <Route path="/vairipay/setup" element={<VairipaySetup />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/referrals/help" element={<ReferralHelp />} />
          <Route path="/referrals/payouts" element={<ReferralPayouts />} />
          <Route path="/referrals/invite/email" element={<InviteEmail />} />
          <Route path="/referrals/invite/sms" element={<InviteSMS />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/activity" element={<ActivityTimeline />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/search" element={<Search />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/profile-creation" element={<ProfileCreation />} />
        <Route path="/profile-wizard" element={<ProfileWizard />} />
        <Route path="/apply/influencer" element={<ApplyInfluencer />} />
        <Route path="/application/status" element={<ApplicationStatus />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/availability-settings" element={<AvailabilitySettings />} />
        <Route path="/available-now" element={<AvailableNow />} />
        <Route path="/marketplace" element={<MarketplaceFeed />} />
        <Route path="/calendar" element={<Calendar />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/coupons" element={<CouponGenerator />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/referrals" element={<ReferralManagement />} />
          <Route path="/admin/influencers" element={<InfluencerManagement />} />
          <Route path="/admin/system-monitor" element={<SystemMonitor />} />
          <Route path="/admin/email-test" element={<EmailTest />} />
          <Route path="/admin/email-logs" element={<EmailLogs />} />
          <Route path="/admin/country-reps" element={<CountryRepresentatives />} />
          <Route path="/admin/vai-sessions" element={<VAISessionsAdmin />} />
          <Route path="/admin/reviews" element={<ReviewsAdmin />} />
          <Route path="/admin/disputes" element={<DisputesAdmin />} />
          <Route path="/referral-leaderboard" element={<ReferralLeaderboard />} />
          <Route path="/truerevu" element={<TrueRevuDashboard />} />
          <Route path="/truerevu/disputes/:disputeId" element={<PanelDisputeReview />} />
          
          {/* Business Routes */}
          <Route path="/business/register" element={<BusinessRegistration />} />
          <Route path="/business/:businessId/dashboard" element={<BusinessDashboard />} />
          <Route path="/business/:businessId/control-panel" element={<BusinessControlPanel />} />
          <Route path="/business/:businessId/directory" element={<BusinessDirectory />} />
          <Route path="/vai-redemption" element={<VAIRedemption />} />
          <Route path="/client-profile" element={<ClientProfile />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
