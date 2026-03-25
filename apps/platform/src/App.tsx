import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./stores/authStore";
import './App.css'
import Header from "./components/layout/Header";

export default function App() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect logic
  const publicPaths = ["/", "/login", "/signup"];
  const isOnPublicPath = publicPaths.includes(location.pathname);
  
  // Paths where header should not be shown
  const noHeaderPaths = ["/chat"];
  const shouldShowHeader = user && user.onboarded && !noHeaderPaths.includes(location.pathname);

  useEffect(() => {
    if (!isAuthenticated && !isOnPublicPath) {
      // Not logged in and trying to access a protected path
      navigate("/login");
      return;
    }

    if (user && !user.onboarded && location.pathname !== "/onboard") {
      // Logged in but not onboarded, redirect to onboarding page
      navigate("/onboard");
      return;
    }
  }, [isAuthenticated, user, location.pathname, navigate, isOnPublicPath]);

  return (
    <>
        {shouldShowHeader && <Header />}
        <Outlet />
    </>
  );
}