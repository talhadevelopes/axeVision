import authRoutes from "./authRoute";
import websiteRoutes from "./websiteRoute";
import snapshotRoutes from "./snapshotRoute";
import accessibilityRoutes from "./accessibilityRoute";
import memberRoutes from "./memberRoute";
import chatbot from "./chatbotRoute";
import messagesRoutes from "./messagesRoute";



export const routes = {
  auth: authRoutes,
  websites: websiteRoutes,
  snapshots: snapshotRoutes,
  accessibility: accessibilityRoutes,
  chatbot: chatbot, 
  members: memberRoutes,
  messages: messagesRoutes,
};

export default routes;
