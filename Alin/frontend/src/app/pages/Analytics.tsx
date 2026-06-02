import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, Users, Award, Target, AlertTriangle } from "lucide-react";
import { api } from "../../services/api";

interface PLData {
  kpis: { totalLearners: number; passRate: number | null; atRiskLearners: number; retention: number | null };
  learnerBreakdown: { level: number | null; on_track: number; at_risk: number; total: number }[];
  moduleStats: { id: number; code: string; title: string; level: number | null; learner_count: number; assessment_count: number; at_risk_count: number; avg_grade: number | null }[];
  staffList: { id: number; name: string; role: string; email: string; assessment_count: number }[];
}

export default function Analytics() {
  const [data, setData] = useState<PLData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<PLData>('/dashboard/programme-leader')
      .then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const kpis = data ? [
    { label: "Total Learners",       value: String(data.kpis.totalLearners),                   change: null, trend: "up"   as const, icon: Users,         color: "text-teal-600",   bg: "bg-teal-50" },
    { label: "Overall Pass Rate",    value: data.kpis.passRate != null ? `${data.kpis.passRate}%` : "—", change: null, trend: "up" as const, icon: Target, color: "text-green-600",  bg: "bg-green-50" },
    { label: "Programme Retention",  value: data.kpis.retention != null ? `${data.kpis.retention}%` : "—", change: null, trend: "up" as const, icon: Award, color: "text-blue-600",   bg: "bg-blue-50" },
    { label: "At Risk Learners",     value: String(data.kpis.atRiskLearners),                   change: null, trend: "down" as const, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
  ] : [];

  const breakdownChartData = (data?.learnerBreakdown ?? []).map(b => ({
    cohort: b.level != null ? `Level ${b.level}` : "Other",
    onTrack: b.on_track,
    atRisk: b.at_risk,
  }));

  const moduleChartData = (data?.moduleStats ?? []).map(m => ({
    name: m.code,
    avgGrade: m.avg_grade ?? 0,
    learners: m.learner_count,
  }));

  // Synthetic pass-rate trend from module avg grades grouped by level
  const trendData = (data?.learnerBreakdown ?? []).map(b => ({
    month: b.level != null ? `Level ${b.level}` : "Other",
    passRate: data?.kpis.passRate ?? 0,
    atRisk: b.at_risk,
  }));

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading analytics…</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl text-gray-800">Programme Analytics</h1>
        <p className="text-gray-600 mt-1">Strategic insights and performance monitoring</p>
      </div>

      {/*KPI Cards*/}
      <div className="grid grid-cols-4 gap-6 mb-6">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          const TrendIcon = kpi.trend === "up" ? TrendingUp : TrendingDown;
          return (
            <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className={`${kpi.bg} p-3 rounded-lg`}><Icon className={`w-5 h-5 ${kpi.color}`} /></div>
                <TrendIcon className={`w-4 h-4 ${kpi.trend === "up" ? "text-green-500" : "text-red-500"}`} />
              </div>
              <div className="text-3xl text-gray-800 mb-1">{kpi.value}</div>
              <div className="text-sm text-gray-600">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      {/*Learner Progress by Level*/}
      <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
        <h2 className="text-lg text-gray-800 mb-1">Learner Status by Level</h2>
        <p className="text-sm text-gray-500 mb-4">On-track vs at-risk across each programme level</p>
        {breakdownChartData.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No enrolment data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={breakdownChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" stroke="#6b7280" />
              <YAxis dataKey="cohort" type="category" width={80} stroke="#6b7280" />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Legend />
              <Bar dataKey="onTrack" stackId="a" fill="#10b981" name="On Track" />
              <Bar dataKey="atRisk"  stackId="a" fill="#f59e0b" name="At Risk" />
            </BarChart>
          </ResponsiveContainer>
        )}
        {breakdownChartData.length > 0 && (
          <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl text-green-600">{data?.learnerBreakdown.reduce((s, b) => s + b.on_track, 0)}</div>
              <div className="text-xs text-gray-600">On Track</div>
            </div>
            <div>
              <div className="text-2xl text-amber-600">{data?.kpis.atRiskLearners}</div>
              <div className="text-xs text-gray-600">At Risk</div>
            </div>
            <div>
              <div className="text-2xl text-teal-600">{data?.kpis.totalLearners}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/*Module Avg Grade Chart*/}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg text-gray-800 mb-1">Average Grade by Module</h2>
          <p className="text-sm text-gray-500 mb-4">From graded enrolments</p>
          {moduleChartData.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No graded data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={moduleChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" angle={-30} textAnchor="end" height={60} />
                <YAxis stroke="#6b7280" domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="avgGrade" fill="#14b8a6" name="Avg Grade (%)" />
                <Bar dataKey="learners" fill="#3b82f6" name="Learners" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/*Pass rate area chart*/}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg text-gray-800 mb-1">Overall Pass Rate</h2>
          <p className="text-sm text-gray-500 mb-4">Current academic year</p>
          {trendData.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="passGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} formatter={(v: number) => `${v}%`} />
                <Legend />
                <Area type="monotone" dataKey="passRate" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#passGrad)" name="Pass Rate (%)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/*Staff Table*/}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg text-gray-800 mb-4">Staff Overview</h2>
        {(data?.staffList ?? []).length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No staff records yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-teal-600 text-white">
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-center">Assessments</th>
                </tr>
              </thead>
              <tbody>
                {data!.staffList.map((s, i) => (
                  <tr key={s.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 text-gray-800">{s.name}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{s.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">{s.role.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">{s.assessment_count}</td>
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
