import { useEffect, useState, useRef } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

const PrivateRoute = () => {
  const navigate = useNavigate();
  const [isValid, setIsValid] = useState(null);
  const intervalRef = useRef(null);

  const cleanupAndLogout = () => {
    Cookies.remove("access_token");
    localStorage.removeItem("dashboardCache");
    localStorage.removeItem("provactiveCache");
    navigate("/login", { replace: true });
  };

  const validateToken = () => {
    const token = Cookies.get("access_token");

    if (!token) {
      cleanupAndLogout();
      return false;
    }

    try {
      const decoded = jwtDecode(token);
      const now = Date.now() / 1000;

      if (decoded.exp < now) {
        cleanupAndLogout();
        return false;
      }

      return true;
    } catch {
      cleanupAndLogout();
      return false;
    }
  };

  useEffect(() => {
    const valid = validateToken();
    setIsValid(valid);

    if (!valid) return;

    intervalRef.current = setInterval(() => {
      if (!validateToken()) {
        setIsValid(false);
      }
    }, 120000);

    const handleFocus = () => validateToken();
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  if (isValid === null) {
    return <div>Loading...</div>;
  }

  return isValid ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
