import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Award } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { api } from "../../services/api";

interface LearnerItem {
  code: string;
  description: string;
  status: "Complete" | "In Progress" | "Not Started";
  module: string;
}

interface LearnerProgress {
  id: number;
  name: string;
  student_id: string;
  employer_name: string | null;
  at_risk: number;
  overallProgress: number;
  knowledge: number | null;
  skills: number | null;
  behaviours: number | null;
  items: LearnerItem[];
  total_modules: number;
  graded_modules: number;
}

interface Summary {
  totalLearners: number;
  onTrack: number;
  needSupport: number;
  avgProgress: number;
  avgKnowledge: number | null;
  avgSkills: number | null;
  avgBehaviours: number | null;
}

interface CoachProgressData {
  learners: LearnerProgress[];
  summary: Summary;
}

const statusBadge = (s: string) =>
  s === "Complete" ? "bg-green-100 text-green-700" :
  s === "In Progress" ? "bg-blue-100 text-blue-700" :
  "bg-gray-100 text-gray-700";

export default function Progress() {
  const [data, setData] = useState<CoachProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedLearner, setExpandedLearner] = useState<number | null>(null);

  useEffect(() => {
    api.get<CoachProgressData>('/dashboard/coach-progress')
      .then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading progress data…</div>;

  const summary = data?.summary;
  const learners = data?.learners ?? [];

  const overallKSBData = [
    { component: "Knowledge",  avgProgress: summary?.avgKnowledge  ?? 0, target: 85 },
    { component: "Skills",     avgProgress: summary?.avgSkills     ?? 0, target: 85 },
    { component: "Behaviours", avgProgress: summary?.avgBehaviours ?? 0, target: 85 },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl text-gray-800">Learner Progress Tracking</h1>
        <p className="text-gray-600 mt-1">KSB component tracking for all learners</p>
      </div>

      {/*Summary Cards*/}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="bg-teal-50 p-3 rounded-lg inline-block mb-3"><TrendingUp className="w-5 h-5 text-teal-600" /></div>
          <div className="text-3xl text-gray-800 mb-1">{summary?.avgProgress ?? "—"}%</div>
          <div className="text-sm text-gray-600">Overall Progress</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="bg-green-50 p-3 rounded-lg inline-block mb-3"><Award className="w-5 h-5 text-green-600" /></div>
          <div className="text-3xl text-gray-800 mb-1">{summary?.onTrack ?? "—"}</div>
          <div className="text-sm text-gray-600">On Track Learners</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="bg-amber-50 p-3 rounded-lg inline-block mb-3"><TrendingDown className="w-5 h-5 text-amber-600" /></div>
          <div className="text-3xl text-gray-800 mb-1">{summary?.needSupport ?? "—"}</div>
          <div className="text-sm text-gray-600">Need Support</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="bg-blue-50 p-3 rounded-lg inline-block mb-3"><Award className="w-5 h-5 text-blue-600" /></div>
          <div className="text-3xl text-gray-800 mb-1">
            {summary ? `${Math.round(((summary.avgKnowledge ?? 0) + (summary.avgSkills ?? 0) + (summary.avgBehaviours ?? 0)) / 3)}%` : "—"}
          </div>
          <div className="text-sm text-gray-600">Avg KSB Completion</div>
        </div>
      </div>

      {/*Overall KSB Chart*/}
      <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
        <h2 className="text-lg text-gray-800 mb-4">Overall Progress by KSB Component</h2>
        {overallKSBData.every(d => d.avgProgress === 0) ? (
          <p className="text-sm text-gray-400 text-center py-8">No KSB mapping data yet. Add KSB mappings to modules to see this chart.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={overallKSBData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="component" stroke="#6b7280" />
              <YAxis stroke="#6b7280" domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} formatter={(v: number) => `${v}%`} />
              <Legend />
              <Bar dataKey="avgProgress" fill="#14b8a6" name="Average Progress (%)" />
              <Bar dataKey="target" fill="#e5e7eb" name="Target (%)" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/*Individual Learner Progress*/}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg text-gray-800 mb-4">Individual Learner KSB Progress</h2>
        {learners.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No learners enrolled yet.</p>
        ) : (
          <div className="space-y-4">
            {learners.map(learner => {
              const status = learner.at_risk ? "At Risk" : learner.overallProgress >= 80 ? "Excellent" : "On Track";
              return (
                <div key={learner.id} className="border border-gray-200 rounded-lg">
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedLearner(expandedLearner === learner.id ? null : learner.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-gray-800 font-medium">{learner.name}</h3>
                          <span className="text-xs text-gray-400">{learner.student_id}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            status === "Excellent" ? "bg-green-100 text-green-700" :
                            status === "At Risk"   ? "bg-amber-100 text-amber-700" :
                                                    "bg-blue-100 text-blue-700"
                          }`}>{status}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-md">
                            <div
                              className={`h-full ${learner.overallProgress >= 70 ? "bg-green-500" : learner.overallProgress >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                              style={{ width: `${learner.overallProgress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 min-w-[45px]">{learner.overallProgress}%</span>
                        </div>
                        <div className="flex gap-6 text-xs text-gray-500">
                          {learner.knowledge  != null && <span>K: {learner.knowledge}%</span>}
                          {learner.skills     != null && <span>S: {learner.skills}%</span>}
                          {learner.behaviours != null && <span>B: {learner.behaviours}%</span>}
                          <span>{learner.graded_modules}/{learner.total_modules} modules graded</span>
                        </div>
                      </div>
                      {expandedLearner === learner.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                  </div>

                  {expandedLearner === learner.id && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50">
                      <div className="grid grid-cols-2 gap-6 mb-4">
                        {/* Radar */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-3">KSB Component Analysis</h4>
                          {(learner.knowledge == null && learner.skills == null && learner.behaviours == null) ? (
                            <p className="text-xs text-gray-400">No KSB breakdown available — add KSB mappings to modules.</p>
                          ) : (
                            <ResponsiveContainer width="100%" height={220}>
                              <RadarChart data={[
                                { component: "Knowledge",  value: learner.knowledge  ?? 0 },
                                { component: "Skills",     value: learner.skills     ?? 0 },
                                { component: "Behaviours", value: learner.behaviours ?? 0 },
                              ]}>
                                <PolarGrid stroke="#e5e7eb" />
                                <PolarAngleAxis dataKey="component" stroke="#6b7280" />
                                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6b7280" />
                                <Radar name="Progress" dataKey="value" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.5} />
                                <Tooltip formatter={(v: number) => `${v}%`} />
                              </RadarChart>
                            </ResponsiveContainer>
                          )}
                        </div>

                        {/*Employer + module info*/}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Learner Details</h4>
                          <div className="space-y-2 text-sm text-gray-700">
                            <div><span className="text-gray-500">Employer:</span> {learner.employer_name ?? "—"}</div>
                            <div><span className="text-gray-500">Modules:</span> {learner.total_modules} enrolled, {learner.graded_modules} graded</div>
                            <div><span className="text-gray-500">Progress:</span> {learner.overallProgress}%</div>
                          </div>
                        </div>
                      </div>

                      {/*KSB / module items*/}
                      {learner.items.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">KSB Items</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {learner.items.map((item, i) => (
                              <div key={i} className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded text-xs">
                                <span className="text-gray-700 truncate mr-2">
                                  <span className="font-medium">{item.code}</span>
                                  {item.description ? ` — ${item.description}` : ""}
                                </span>
                                <span className={`px-2 py-0.5 rounded whitespace-nowrap ${statusBadge(item.status)}`}>{item.status}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
