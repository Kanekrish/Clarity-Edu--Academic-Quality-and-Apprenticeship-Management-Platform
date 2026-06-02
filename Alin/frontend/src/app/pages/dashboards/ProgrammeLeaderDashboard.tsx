import { useEffect, useState } from "react";
import { Users, Award, AlertTriangle, BookOpen } from "lucide-react";
import { api } from "../../../services/api";

interface ModuleOverview {
  id: number;
  code: string;
  title: string;
  learner_count: number;
  assessment_count: number;
  at_risk_count: number;
}

interface Stats {
  totalLearners: number;
  totalModules: number;
  atRiskLearners: number;
  passRate: number | null;
  overdueAssessments: number;
  totalEvidence: number;
  moduleOverview: ModuleOverview[];
  atRiskList: { name: string; student_id: string; module: string; grade: string | null }[];
}

export default function ProgrammeLeaderDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get<Stats>('/dashboard/stats').then(setStats).catch(() => {});
  }, []);

  const s = stats;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl text-gray-800">Programme Leader Dashboard</h1>
        <p className="text-gray-600 mt-1">Strategic oversight and quality management</p>
      </div>

      {/*Key Metrics*/}
      <div className="grid grid-cols-4 gap-6 mb-6">
        {[
          { label: "Total Learners",        value: s?.totalLearners ?? "—",         icon: Users,         color: "text-blue-600",   bg: "bg-blue-50" },
          { label: "Overall Pass Rate",     value: s?.passRate != null ? `${s.passRate}%` : "—", icon: Award, color: "text-green-600",  bg: "bg-green-50" },
          { label: "At Risk Learners",      value: s?.atRiskLearners ?? "—",        icon: AlertTriangle, color: "text-amber-600",  bg: "bg-amber-50" },
          { label: "Total Modules",         value: s?.totalModules ?? "—",          icon: BookOpen,      color: "text-teal-600",   bg: "bg-teal-50" },
        ].map((metric, i) => {
          const Icon = metric.icon;
          return (
            <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
              <div className={`${metric.bg} p-3 rounded-lg inline-block mb-4`}>
                <Icon className={`w-6 h-6 ${metric.color}`} />
              </div>
              <p className="text-2xl text-gray-800 mb-1">{metric.value}</p>
              <p className="text-sm text-gray-600">{metric.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/*Module Overview*/}
        <div className="col-span-2 bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg text-gray-800 mb-4">Module Overview</h2>
          {!s ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : s.moduleOverview?.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No modules in database yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-teal-600 text-white">
                    <th className="px-4 py-3 text-left">Code</th>
                    <th className="px-4 py-3 text-left">Title</th>
                    <th className="px-4 py-3 text-center">Learners</th>
                    <th className="px-4 py-3 text-center">Assessments</th>
                    <th className="px-4 py-3 text-center">At Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {s.moduleOverview?.map((m, i) => (
                    <tr key={m.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-3 text-gray-700 font-mono text-sm">{m.code}</td>
                      <td className="px-4 py-3 text-gray-800">{m.title}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{m.learner_count}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{m.assessment_count}</td>
                      <td className="px-4 py-3 text-center">
                        {m.at_risk_count > 0 ? (
                          <span className="text-amber-600 font-medium">{m.at_risk_count}</span>
                        ) : (
                          <span className="text-green-600">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/*At-Risk Learners*/}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg text-gray-800 mb-4">At-Risk Learners</h2>
          {!s ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : s.atRiskList?.length === 0 ? (
            <p className="text-sm text-gray-500">No at-risk learners.</p>
          ) : (
            <div className="space-y-3">
              {s.atRiskList?.map((r, i) => (
                <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 font-medium">{r.name}</p>
                  <p className="text-xs text-amber-700">{r.module} — Grade: {r.grade ?? "—"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/*Stats summary bar*/}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg text-gray-800 mb-4">Quality Summary</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Overdue Assessments</p>
            <p className={`text-2xl mt-1 ${s?.overdueAssessments ? "text-red-600" : "text-green-600"}`}>{s?.overdueAssessments ?? "—"}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Evidence Items</p>
            <p className="text-2xl mt-1 text-teal-600">{s?.totalEvidence ?? "—"}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Overall Pass Rate</p>
            <p className={`text-2xl mt-1 ${(s?.passRate ?? 0) >= 70 ? "text-green-600" : "text-amber-600"}`}>{s?.passRate != null ? `${s.passRate}%` : "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
