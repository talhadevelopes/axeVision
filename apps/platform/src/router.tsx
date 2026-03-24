import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/dashboard/Dashboard";
import SignUp from "./pages/auth/SignUp";
import Login from "./pages/auth/Login";
import WebsiteDetails from "./pages/websites/WebsiteDetails";
import WebsiteMindPage from "./pages/mind/WebsiteMind";
import Websites from "./pages/websites/Websites"; 
import TeamManagementPage from "./pages/team/TeamManagement";
import OnboardingPage from "./pages/auth/Onboarding";
import NotFound from "./pages/NotFound";
import ChatPage from "./pages/chat/Chat";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "signup", element: <SignUp /> },
      { path: "login", element: <Login /> },
      { path: "manage", element: <TeamManagementPage /> },
      { path: "onboard", element: <OnboardingPage /> },
      { path: "chat", element: <ChatPage /> },
      { path: "websites", element: <Websites /> },
      { path: "websites/:id", element: <WebsiteDetails /> },
      { path: "mind/:websiteId", element: <WebsiteMindPage /> },
    ],
  },
  { path: "*", element: <NotFound /> },
]);