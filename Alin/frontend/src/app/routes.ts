import { createBrowserRouter } from "react-router";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Schedule from "./pages/Schedule";
import Grades from "./pages/Grades";
import KSBMap from "./pages/KSBMap";
import Assessments from "./pages/Assessments";
import Evidence from "./pages/Evidence";
import Modules from "./pages/Modules";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Contact from "./pages/Contact";

// Apprenticeship Coach pages
import Learners from "./pages/Learners";
import Progress from "./pages/Progress";
import Sessions from "./pages/Sessions";
import Targets from "./pages/Targets";
import Feedback from "./pages/Feedback";

// Programme Leader pages
import Analytics from "./pages/Analytics";
import Quality from "./pages/Quality";
import StaffManagement from "./pages/StaffManagement";
import Resources from "./pages/Resources";
import Reports from "./pages/Reports";

// Employer/Mentor pages
import Apprentices from "./pages/Apprentices";
import FeedbackForm from "./pages/FeedbackForm";
import Visits from "./pages/Visits";

// Ofsted Inspector pages
import Compliance from "./pages/Compliance";
import QualityReview from "./pages/QualityReview";
import Documentation from "./pages/Documentation";
import Observations from "./pages/Observations";

// System Administrator pages
import Users from "./pages/Users";
import Roles from "./pages/Roles";
import System from "./pages/System";
import Logs from "./pages/Logs";

export const router = createBrowserRouter([
  // Public routes
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/contact",
    Component: Contact,
  },
  // Authenticated routes
  {
    path: "/dashboard",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      
      // Academic Staff routes
      { path: "modules", Component: Modules },
      { path: "schedule", Component: Schedule },
      { path: "grades", Component: Grades },
      { path: "ksb-map", Component: KSBMap },
      { path: "assessments", Component: Assessments },
      { path: "evidence", Component: Evidence },
      
      // Apprenticeship Coach routes
      { path: "learners", Component: Learners },
      { path: "progress", Component: Progress },
      { path: "sessions", Component: Sessions },
      { path: "targets", Component: Targets },
      { path: "feedback", Component: Feedback },
      
      // Programme Leader routes
      { path: "analytics", Component: Analytics },
      { path: "quality", Component: Quality },
      { path: "staff", Component: StaffManagement },
      { path: "resources", Component: Resources },
      { path: "reports", Component: Reports },
      
      // Employer/Mentor routes
      { path: "apprentices", Component: Apprentices },
      { path: "feedback-form", Component: FeedbackForm },
      { path: "visits", Component: Visits },
      
      // Ofsted Inspector routes
      { path: "compliance", Component: Compliance },
      { path: "quality-review", Component: QualityReview },
      { path: "documentation", Component: Documentation },
      { path: "observations", Component: Observations },
      
      // System Administrator routes
      { path: "users", Component: Users },
      { path: "roles", Component: Roles },
      { path: "system", Component: System },
      { path: "logs", Component: Logs },
    ],
  },
]);
