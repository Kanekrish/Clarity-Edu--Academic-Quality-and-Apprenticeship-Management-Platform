import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Award, FileText, Users, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell } from "recharts";
import { api } from "../../services/api";

interface PLData {
  kpis: { totalLearners: number; passRate: number | null; atRiskLearners: number; retention: number | null };
  moduleStats: { id: number; code: string; title: string; level: number | null; learner_count: number; assessment_count: number; at_risk_count: number; avg_grade: number | null }[];
  feedbackByRole: { category: string | null; count: number }[];
  recentFeedback: { content: string; employer_priority: string | null; recorded_at: string; learner_name: string; mentor_name: string | null; mentor_role: string | null }[];
  evidenceByCategory: { category: string | null; count: number }[];
  overdueAssessments: number;
  assessmentCompletionRate: number | null;
  totalAssessments: number;
}

const COLORS = ["#10b981", "#14b8a6", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444"];

export default function Quality() {
  const [data, setData] = useState<PLData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "feedback" | "evidence">("overview");

  useEffect(() => {
    api.get<PLData>('/dashboard/programme-leader')
      .then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading quality data…</div>;

  const radarData = [
    { dimension: "Pass Rate",   value: data?.kpis.passRate ?? 0 },
    { dimension: "Retention",  value: data?.kpis.retention ?? 0 },
    { dimension: "Assessment", value: data?.assessmentCompletionRate ?? 0 },
    { dimension: "Evidence",   value: Math.min((data?.evidenceByCategory.reduce((s, e) => s + e.count, 0) ?? 0) * 5, 100) },
    { dimension: "Feedback",   value: Math.min((data?.feedbackByRole.reduce((s, f) => s + f.count, 0) ?? 0) * 5, 100) },
  ];

  const feedbackChartData = (data?.feedbackByRole ?? []).map(f => ({
    category: f.category ? f.category.replace(/_/g, ' ') : 'Unknown',
    count: f.count,
  }));

  const evidenceChartData = (data?.evidenceByCategory ?? []).map((e, i) => ({
    name: e.category ?? 'Uncategorised',
    value: e.count,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl text-gray-800">Quality Management</h1>
        <p className="text-gray-600 mt-1">Comprehensive quality assurance and improvement tracking</p>
      </div>

      {/*Summary Cards*/}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="bg-green-50 p-3 rounded-lg inline-block mb-4"><Award className="w-5 h-5 text-green-600" /></div>
          <div className="text-3xl text-gray-800 mb-1">{data?.kpis.passRate != null ? `${data.kpis.passRate}%` : "—"}</div>
          <div className="text-sm text-gray-600">Overall Pass Rate</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="bg-blue-50 p-3 rounded-lg inline-block mb-4"><Target className="w-5 h-5 text-blue-600" /></div>
          <div className="text-3xl text-gray-800 mb-1">{data?.assessmentCompletionRate != null ? `${data.assessmentCompletionRate}%` : "—"}</div>
          <div className="text-sm text-gray-600">Assessment Completion</div>
          {(data?.overdueAssessments ?? 0) > 0 && (
            <div className="text-xs text-red-600 mt-1">{data?.overdueAssessments} overdue</div>
          )}
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="bg-amber-50 p-3 rounded-lg inline-block mb-4"><FileText className="w-5 h-5 text-amber-600" /></div>
          <div className="text-3xl text-gray-800 mb-1">{data?.feedbackByRole.reduce((s, f) => s + f.count, 0) ?? "—"}</div>
          <div className="text-sm text-gray-600">Total Feedback Records</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="bg-teal-50 p-3 rounded-lg inline-block mb-4"><Users className="w-5 h-5 text-teal-600" /></div>
          <div className="text-3xl text-gray-800 mb-1">{data?.evidenceByCategory.reduce((s, e) => s + e.count, 0) ?? "—"}</div>
          <div className="text-sm text-gray-600">Evidence Items</div>
        </div>
      </div>

      {/*Tabs*/}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <div className="flex gap-2 px-6">
            {[
              { id: "overview", label: "Quality Overview" },
              { id: "feedback", label: "Feedback" },
              { id: "evidence", label: "Evidence" },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as typeof tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id ? "border-teal-600 text-teal-600" : "border-transparent text-gray-600 hover:text-gray-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/*Overview*/}
          {tab === "overview" && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg text-gray-800 mb-4">Quality Dimensions (DB-derived)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="dimension" stroke="#6b7280" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6b7280" />
                    <Radar name="Score" dataKey="value" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.5} />
                    <Tooltip formatter={(v: number) => `${v}%`} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="text-lg text-gray-800 mb-4">Module Health</h3>
                {(data?.moduleStats ?? []).length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No modules yet.</p>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {data!.moduleStats.map(m => {
                      const grade = m.avg_grade ?? 0;
                      return (
                        <div key={m.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="text-sm font-medium text-gray-800">{m.code}</span>
                              <span className="text-xs text-gray-500 ml-2">{m.title}</span>
                            </div>
                            <div className="text-right text-sm">
                              {m.avg_grade != null ? `${m.avg_grade}%` : "—"}
                              {m.at_risk_count > 0 && (
                                <div className="flex items-center gap-1 text-xs text-amber-600 justify-end">
                                  <AlertCircle className="w-3 h-3" />{m.at_risk_count} at risk
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${grade >= 60 ? "bg-green-500" : grade >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                              style={{ width: `${grade}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>{m.learner_count} learners · {m.assessment_count} assessments</span>
                            {m.at_risk_count === 0 && <CheckCircle className="w-3 h-3 text-green-500" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Feedback */}
          {tab === "feedback" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg text-gray-800 mb-4">Feedback by Source Role</h3>
                {feedbackChartData.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No feedback records yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={feedbackChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="category" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                      <Legend />
                      <Bar dataKey="count" fill="#14b8a6" name="Feedback Count" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div>
                <h3 className="text-lg text-gray-800 mb-4">Recent Feedback</h3>
                {(data?.recentFeedback ?? []).length === 0 ? (
                  <p className="text-sm text-gray-400">No feedback yet.</p>
                ) : (
                  <div className="space-y-3">
                    {data!.recentFeedback.map((f, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-medium text-gray-800">{f.learner_name}</p>
                          <span className="text-xs text-gray-500">{f.recorded_at?.split('T')[0]}</span>
                        </div>
                        {f.mentor_name && <p className="text-xs text-gray-500 mb-1">From: {f.mentor_name} ({f.mentor_role?.replace(/_/g,' ')})</p>}
                        {f.employer_priority && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded mr-2">{f.employer_priority}</span>}
                        <p className="text-xs text-gray-700 line-clamp-2 mt-1">{f.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/*Evidence*/}
          {tab === "evidence" && (
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg text-gray-800 mb-4">Evidence by Category</h3>
                {evidenceChartData.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No evidence uploaded yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={evidenceChartData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {evidenceChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div>
                <h3 className="text-lg text-gray-800 mb-4">Coverage Summary</h3>
                <div className="space-y-3">
                  {evidenceChartData.length === 0 ? (
                    <p className="text-sm text-gray-400">No evidence yet.</p>
                  ) : evidenceChartData.map((e, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: e.color }} />
                        <span className="text-sm text-gray-700">{e.name}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-800">{e.value} items</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
