import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LanguageSelection = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to registration page as language selection has been removed from flow
    navigate("/onboarding/registration", { replace: true });
  }, [navigate]);

  return null;
};

export default LanguageSelection;
