import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Users, Settings, Shield, UserPlus } from "lucide-react";
import { api } from "../../../services/api";

interface RoleCount { role: string; count: number; }
interface RecentUser { id: number; name: string; email: string; role: string; created_at: string; }

interface Stats {
  totalUsers: number;
  totalLearners: number;
  totalModules: number;
  totalEvidence: number;
  usersByRole: RoleCount[];
  recentUsers: RecentUser[];
}

const roleLabel: Record<string, string> = {
  academic_staff:   "Academic Staff",
  programme_lead:   "Programme Leader",
  coach:            "Apprenticeship Coach",
  employer:         "Employer/Mentor",
  ofsted_inspector: "Ofsted Inspector",
  system_admin:     "System Administrator",
};

const roleColour: Record<string, string> = {
  academic_staff:   "bg-blue-500",
  programme_lead:   "bg-purple-500",
  coach:            "bg-green-500",
  employer:         "bg-amber-500",
  ofsted_inspector: "bg-red-500",
  system_admin:     "bg-teal-500",
};

export default function SystemAdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get<Stats>('/dashboard/stats').then(setStats).catch(() => {});
  }, []);

  const s = stats;
  const totalUsers = s?.totalUsers ?? 0;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl text-gray-800">System Administrator Dashboard</h1>
        <p className="text-gray-600 mt-1">User management and system configuration</p>
      </div>

      {/*System Stats*/}
      <div className="grid grid-cols-4 gap-6 mb-6">
        {[
          { label: "Total Users",    value: s?.totalUsers ?? "—",    icon: Users,    color: "text-blue-600",   bg: "bg-blue-50" },
          { label: "Total Learners", value: s?.totalLearners ?? "—", icon: UserPlus, color: "text-green-600",  bg: "bg-green-50" },
          { label: "Total Modules",  value: s?.totalModules ?? "—",  icon: Settings, color: "text-teal-600",   bg: "bg-teal-50" },
          { label: "Evidence Items", value: s?.totalEvidence ?? "—", icon: Shield,   color: "text-purple-600", bg: "bg-purple-50" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
              <div className={`${stat.bg} p-3 rounded-lg inline-block mb-4`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <p className="text-2xl text-gray-800 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/*Users by Role*/}
        <div className="col-span-2 bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg text-gray-800 mb-4">Users by Role</h2>
          {!s ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : s.usersByRole?.length === 0 ? (
            <p className="text-sm text-gray-500">No users yet.</p>
          ) : (
            <div className="space-y-4">
              {s.usersByRole?.map((item, i) => {
                const pct = totalUsers > 0 ? Math.round((item.count / totalUsers) * 100) : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-700">{roleLabel[item.role] ?? item.role}</span>
                      <span className="text-sm text-gray-600">{item.count} users ({pct}%)</span>
                    </div>
                    <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full ${roleColour[item.role] ?? "bg-gray-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/*Recent Users*/}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg text-gray-800 mb-4">Recently Registered</h2>
          {!s ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : s.recentUsers?.length === 0 ? (
            <p className="text-sm text-gray-500">No users yet.</p>
          ) : (
            <div className="space-y-3">
              {s.recentUsers?.map((u) => (
                <div key={u.id} className="border-l-4 border-l-teal-500 pl-3 py-1">
                  <p className="text-sm text-gray-800 font-medium">{u.name}</p>
                  <p className="text-xs text-gray-600">{u.email}</p>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">{roleLabel[u.role] ?? u.role}</span>
                    <span className="text-xs text-gray-400">{u.created_at?.split('T')[0]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/*Quick Actions*/}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg mb-4 text-gray-800">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-4">
          <button onClick={() => navigate("/dashboard/users")} className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors">Manage Users</button>
          <button onClick={() => navigate("/dashboard/roles")} className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors">Manage Roles</button>
          <button onClick={() => navigate("/dashboard/system")} className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors">System Settings</button>
          <button onClick={() => navigate("/dashboard/logs")} className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors">View Logs</button>
        </div>
      </div>
    </div>
  );
}
