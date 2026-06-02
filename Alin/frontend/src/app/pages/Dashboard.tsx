import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import AcademicStaffDashboard from "./dashboards/AcademicStaffDashboard";
import ProgrammeLeaderDashboard from "./dashboards/ProgrammeLeaderDashboard";
import ApprenticeshipCoachDashboard from "./dashboards/ApprenticeshipCoachDashboard";
import EmployerMentorDashboard from "./dashboards/EmployerMentorDashboard";
import OfstedInspectorDashboard from "./dashboards/OfstedInspectorDashboard";
import SystemAdminDashboard from "./dashboards/SystemAdminDashboard";

export default function Dashboard() {
  const [userRole, setUserRole] = useState<string>("Academic Staff");
  const location = useLocation();

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "Academic Staff";
    setUserRole(role);
  }, [location]); // Re-check when location changes

  // Route to appropriate dashboard based on role
  switch (userRole) {
    case "Programme Leader":
      return <ProgrammeLeaderDashboard />;
    case "Apprenticeship Coach":
      return <ApprenticeshipCoachDashboard />;
    case "Employer/Mentor":
    case "Employer / Mentor":
      return <EmployerMentorDashboard />;
    case "Ofsted Inspector":
      return <OfstedInspectorDashboard />;
    case "System Administrator":
      return <SystemAdminDashboard />;
    case "Academic Staff":
    default:
      return <AcademicStaffDashboard />;
  }
}