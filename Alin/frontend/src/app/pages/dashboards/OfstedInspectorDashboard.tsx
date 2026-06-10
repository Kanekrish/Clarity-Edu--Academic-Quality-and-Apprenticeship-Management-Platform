import { useEffect, useState } from "react";
import { ClipboardCheck, FileText, Award, AlertTriangle } from "lucide-react";
import { api } from "../../../services/api";

interface EvidenceItem {
  id: number;
  title: string;
  category: string | null;
  uploaded_at: string;
  uploaded_by_name: string | null;
}

interface CategoryCount {
  category: string | null;
  count: number;
}

interface Stats {
  totalLearners: number;
  totalEvidence: number;
  atRiskLearners: number;
  passRate: number | null;
  evidenceByCategory: CategoryCount[];
  recentEvidence: EvidenceItem[];
}

export default function OfstedInspectorDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Stats>('/dashboard/stats')
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading dashboard…</div>;

  const s = stats;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl text-gray-800">Ofsted Inspector Dashboard</h1>
        <p className="text-gray-600 mt-1">Read-only access for inspection and quality review</p>
      </div>

      {/*Key Data*/}
      <div className="grid grid-cols-4 gap-6 mb-6">
        {[
          { label: "Evidence Items",   value: s?.totalEvidence ?? "—",                            icon: FileText,      color: "text-blue-600",   bg: "bg-blue-50" },
          { label: "Total Learners",   value: s?.totalLearners ?? "—",                            icon: ClipboardCheck,color: "text-green-600",  bg: "bg-green-50" },
          { label: "Pass Rate",        value: s?.passRate != null ? `${s.passRate}%` : "—",       icon: Award,         color: "text-teal-600",   bg: "bg-teal-50" },
          { label: "At-Risk Learners", value: s?.atRiskLearners ?? "—",                           icon: AlertTriangle, color: "text-amber-600",  bg: "bg-amber-50" },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
              <div className={`${item.bg} p-3 rounded-lg inline-block mb-4`}>
                <Icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <p className="text-2xl text-gray-800 mb-1">{item.value}</p>
              <p className="text-sm text-gray-600">{item.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/*Evidence by Category*/}
        <div className="col-span-2 bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg text-gray-800 mb-4">Evidence by Category</h2>
          {!s ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : s.evidenceByCategory?.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No evidence items uploaded yet.</p>
          ) : (
            <div className="space-y-3">
              {s.evidenceByCategory?.map((cat, i) => {
                const total = s.totalEvidence || 1;
                const pct = Math.round((cat.count / total) * 100);
                return (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-700">{cat.category ?? "Uncategorised"}</span>
                      <span className="text-sm text-gray-600">{cat.count} items ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/*Summary*/}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg text-gray-800 mb-4">Programme Summary</h2>
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Total Learners</p>
              <p className="text-xl text-gray-800">{s?.totalLearners ?? "—"}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Pass Rate</p>
              <p className={`text-xl ${(s?.passRate ?? 0) >= 70 ? "text-green-600" : "text-amber-600"}`}>
                {s?.passRate != null ? `${s.passRate}%` : "—"}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">At-Risk Learners</p>
              <p className={`text-xl ${s?.atRiskLearners ? "text-amber-600" : "text-green-600"}`}>
                {s?.atRiskLearners ?? "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/*Evidence Library*/}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg text-gray-800 mb-4">Evidence Library (Read-Only)</h2>
        {!s ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : s.recentEvidence?.length === 0 ? (
          <p className="text-sm text-gray-500">No evidence uploaded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-teal-600 text-white">
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Uploaded By</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {s.recentEvidence?.map((e, i) => (
                  <tr key={e.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 text-gray-800">{e.title}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{e.category ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{e.uploaded_by_name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{e.uploaded_at?.split('T')[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>     
    </div>
  );
}
