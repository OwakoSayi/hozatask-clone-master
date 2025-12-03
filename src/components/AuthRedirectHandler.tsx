import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export const AuthRedirectHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for recovery token in URL hash (from password reset email)
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      // Redirect to reset password page with the hash intact
      navigate(`/reset-password${hash}`, { replace: true });
    }
  }, [navigate, location]);

  return null;
};
