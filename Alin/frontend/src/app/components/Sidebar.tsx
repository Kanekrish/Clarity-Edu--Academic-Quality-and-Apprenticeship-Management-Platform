import { Link, useLocation, useNavigate } from "react-router";
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  CheckSquare, 
  Layers, 
  Folder, 
  User, 
  Bell, 
  LogOut,
  Users,
  TrendingUp,
  MessageSquare,
  ClipboardCheck,
  Settings,
  BarChart3,
  Target,
  Award
} from "lucide-react";
import { useState, useEffect } from "react";

interface NavItem {
  path: string;
  label: string;
  icon: any;
}

const roleNavigation: Record<string, NavItem[]> = {
  "Academic Staff": [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/dashboard/modules", label: "Modules", icon: Layers },
    { path: "/dashboard/schedule", label: "Schedule", icon: Calendar },
    { path: "/dashboard/grades", label: "Grades", icon: FileText },
    { path: "/dashboard/ksb-map", label: "KSB Map", icon: CheckSquare },
    { path: "/dashboard/assessments", label: "Assessments", icon: Layers },
    { path: "/dashboard/evidence", label: "Evidence", icon: Folder },
  ],
  "Programme Leader": [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    { path: "/dashboard/quality", label: "Quality", icon: Award },
    { path: "/dashboard/staff", label: "Staff", icon: Users },
    { path: "/dashboard/resources", label: "Resources", icon: Folder },
    { path: "/dashboard/reports", label: "Reports", icon: FileText },
  ],
  "Apprenticeship Coach": [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/dashboard/learners", label: "My Learners", icon: Users },
    { path: "/dashboard/progress", label: "Progress", icon: TrendingUp },
    { path: "/dashboard/sessions", label: "Sessions", icon: Calendar },
    { path: "/dashboard/targets", label: "Targets", icon: Target },
    { path: "/dashboard/feedback", label: "Feedback", icon: MessageSquare },
  ],
  "Employer/Mentor": [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/dashboard/apprentices", label: "Apprentices", icon: Users },
    { path: "/dashboard/feedback-form", label: "Feedback", icon: MessageSquare },
    { path: "/dashboard/visits", label: "Visits", icon: Calendar },
  ],
  "Employer / Mentor": [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/dashboard/apprentices", label: "Apprentices", icon: Users },
    { path: "/dashboard/feedback-form", label: "Feedback", icon: MessageSquare },
    { path: "/dashboard/visits", label: "Visits", icon: Calendar },
  ],
  "Ofsted Inspector": [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/dashboard/compliance", label: "Compliance", icon: ClipboardCheck },
    { path: "/dashboard/quality-review", label: "Quality", icon: Award },
    { path: "/dashboard/documentation", label: "Documents", icon: Folder },
    { path: "/dashboard/observations", label: "Observations", icon: FileText },
  ],
  "System Administrator": [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/dashboard/users", label: "Users", icon: Users },
    { path: "/dashboard/roles", label: "Roles", icon: Settings },
    { path: "/dashboard/system", label: "System", icon: Settings },
    { path: "/dashboard/logs", label: "Logs", icon: FileText },
  ],
};

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState("Academic Staff");
  const [userName, setUserName] = useState("John Smith");

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "Academic Staff";
    const name = localStorage.getItem("userName") || "John Smith";
    setUserRole(role);
    setUserName(name);
  }, [location]); // Re-check on location change

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  const navItems = roleNavigation[userRole] || roleNavigation["Academic Staff"];

  return (
    <div className="w-48 bg-slate-800 text-white flex flex-col">
      <div className="p-6">
        <h1 className="text-xl text-teal-400">Clarity</h1>
      </div>
      <nav className="flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-6 py-3 transition-colors ${
                isActive
                  ? "bg-teal-600 text-white"
                  : "text-gray-300 hover:bg-slate-700"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* User Profile Section */}
      <div className="border-t border-slate-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{userName}</p>
            <p className="text-xs text-gray-400 truncate">{userRole}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex-1 p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <Bell className="w-4 h-4 mx-auto text-gray-300" />
          </button>
          <button 
            onClick={handleLogout}
            className="flex-1 p-2 hover:bg-slate-700 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4 mx-auto text-gray-300" />
          </button>
        </div>
      </div>
    </div>
  );
}