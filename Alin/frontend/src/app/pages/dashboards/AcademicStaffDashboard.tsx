import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { BookOpen, FileText, CheckSquare, Calendar, AlertCircle } from "lucide-react";
import { api } from "../../../services/api";

interface Stats {
  totalModules: number;
  atRiskLearners: number;
  pendingGrades: number;
  totalEvidence: number;
  atRiskList: { name: string; student_id: string; module: string; grade: string | null }[];
  todaysSessions: { id: number; module_code: string; module_title: string; session_date: string; topic: string }[];
  upcomingSessions: { id: number; module_code: string; session_date: string; topic: string }[];
}

export default function AcademicStaffDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get<Stats>('/dashboard/stats').then(setStats).catch(() => {});
  }, []);

  const s = stats;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl text-gray-800">Academic Staff Dashboard</h1>
        <p className="text-gray-600 mt-1">Operational overview and teaching management</p>
      </div>

      {/*Quick Stats*/}
      <div className="grid grid-cols-4 gap-6 mb-6">
        {[
          { label: "Total Modules",    value: s?.totalModules ?? "—",    icon: BookOpen,    color: "text-teal-600",  bg: "bg-teal-50" },
          { label: "At-Risk Learners", value: s?.atRiskLearners ?? "—",  icon: AlertCircle, color: "text-red-600",   bg: "bg-red-50" },
          { label: "Pending Grades",   value: s?.pendingGrades ?? "—",   icon: FileText,    color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Evidence Items",   value: s?.totalEvidence ?? "—",   icon: CheckSquare, color: "text-green-600", bg: "bg-green-50" },
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
        {/*At-Risk Learners*/}
        <div className="col-span-2 bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h2 className="text-lg text-gray-800">At-Risk Learners</h2>
          </div>
          {!s ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : s.atRiskList?.length === 0 ? (
            <p className="text-sm text-gray-500">No at-risk learners — great work!</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-red-50">
                  <th className="px-3 py-2 text-left text-sm text-gray-700">Student</th>
                  <th className="px-3 py-2 text-left text-sm text-gray-700">ID</th>
                  <th className="px-3 py-2 text-left text-sm text-gray-700">Module</th>
                  <th className="px-3 py-2 text-left text-sm text-gray-700">Grade</th>
                </tr>
              </thead>
              <tbody>
                {s.atRiskList?.map((r, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-3 py-2 text-sm text-gray-800">{r.name}</td>
                    <td className="px-3 py-2 text-sm text-gray-600 font-mono">{r.student_id}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{r.module}</td>
                    <td className="px-3 py-2 text-sm text-red-600">{r.grade ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/*Upcoming Sessions*/}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg text-gray-800">Upcoming Sessions</h2>
          </div>
          {!s ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : (s.upcomingSessions?.length === 0) ? (
            <p className="text-sm text-gray-500">No upcoming sessions scheduled.</p>
          ) : (
            <div className="space-y-3">
              {s.upcomingSessions?.map((session, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg border-l-4 border-l-teal-500">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm text-gray-800 font-medium">{session.module_code}</p>
                    <span className="text-xs text-teal-600">{session.session_date}</span>
                  </div>
                  <p className="text-xs text-gray-600">{session.topic}</p>
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
          <button onClick={() => navigate("/dashboard/schedule")} className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors">Generate Schedule</button>
          <button onClick={() => navigate("/dashboard/grades")} className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors">Import Grades</button>
          <button onClick={() => navigate("/dashboard/ksb-map")} className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors">View KSB Map</button>
          <button onClick={() => navigate("/dashboard/evidence")} className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors">Upload Evidence</button>
        </div>
      </div>
    </div>
  );
}
