import { useEffect, useState } from "react";
import { Users, Calendar, AlertCircle, MessageSquare, Clock } from "lucide-react";
import { api } from "../../../services/api";

interface Learner {
  id: number;
  student_id: string;
  name: string;
  email: string | null;
  employer_name: string | null;
  total_modules: number;
  graded_modules: number;
  at_risk: number;
}

interface FeedbackItem {
  content: string;
  recorded_at: string;
  learner_name: string;
}

interface Session {
  id: number;
  learner_name: string;
  session_date: string;
  session_time: string | null;
  session_type: string;
  status: string;
}

interface Stats {
  totalLearners: number;
  atRiskLearners: number;
  totalFeedback: number;
  learners: Learner[];
  recentFeedback: FeedbackItem[];
}

export default function ApprenticeshipCoachDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Stats>('/dashboard/stats'),
      api.get<Session[]>('/sessions'),
    ]).then(([s, ss]) => {
      setStats(s);
      setSessions(ss);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const progress = (l: Learner) =>
    l.total_modules > 0 ? Math.round((l.graded_modules / l.total_modules) * 100) : 0;

  const statusOf = (l: Learner) => {
    if (l.at_risk) return { label: "At Risk", color: "text-amber-600" };
    const p = progress(l);
    if (p >= 80) return { label: "Excellent", color: "text-green-600" };
    if (p >= 40) return { label: "On Track", color: "text-green-600" };
    return { label: "Needs Attention", color: "text-red-600" };
  };

  const upcomingSessions = sessions
    .filter(s => s.status === "Scheduled")
    .sort((a, b) => a.session_date.localeCompare(b.session_date))
    .slice(0, 5);

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading dashboard…</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl text-gray-800">Apprenticeship Coach Dashboard</h1>
        <p className="text-gray-600 mt-1">Learner support and progress tracking</p>
      </div>

      {/*Quick Stats*/}
      <div className="grid grid-cols-4 gap-6 mb-6">
        {[
          { label: "Total Learners",    value: stats?.totalLearners ?? "—",  icon: Users,         color: "text-blue-600",   bg: "bg-blue-50"   },
          { label: "At Risk",           value: stats?.atRiskLearners ?? "—", icon: AlertCircle,   color: "text-amber-600",  bg: "bg-amber-50"  },
          { label: "Feedback Logged",   value: stats?.totalFeedback ?? "—",  icon: MessageSquare, color: "text-green-600",  bg: "bg-green-50"  },
          { label: "Sessions Scheduled",value: sessions.filter(s => s.status === "Scheduled").length, icon: Calendar, color: "text-purple-600", bg: "bg-purple-50" },
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
        {/*Learner Table*/}
        <div className="col-span-2 bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg text-gray-800 mb-4">My Learners</h2>
          {(stats?.learners?.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No learners in database yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-teal-600 text-white">
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Employer</th>
                    <th className="px-4 py-3 text-left">Progress</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats!.learners.map((l, i) => {
                    const st = statusOf(l);
                    const prog = progress(l);
                    return (
                      <tr key={l.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-3 text-gray-800">{l.name}</td>
                        <td className="px-4 py-3 text-gray-600 text-sm">{l.employer_name ?? "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[80px]">
                              <div
                                className={`h-full ${prog >= 70 ? "bg-green-500" : prog >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                                style={{ width: `${prog}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">{prog}%</span>
                          </div>
                        </td>
                        <td className={`px-4 py-3 text-sm font-medium ${st.color}`}>{st.label}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/*Recent Feedback*/}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg text-gray-800 mb-4">Recent Feedback</h2>
          {(stats?.recentFeedback?.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-500">No feedback recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {stats!.recentFeedback.map((f, i) => (
                <div key={i} className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800 font-medium">{f.learner_name}</span>
                  </div>
                  <p className="text-xs text-blue-700 line-clamp-2">{f.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{f.recorded_at?.split('T')[0]}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/*Upcoming Sessions*/}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg text-gray-800 mb-4">Upcoming Sessions</h2>
        {upcomingSessions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No scheduled sessions. Use the Sessions page to schedule one.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {upcomingSessions.map(s => (
              <div key={s.id} className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg hover:border-teal-400 transition-colors">
                <div className="bg-teal-50 p-2 rounded-lg">
                  <Calendar className="w-4 h-4 text-teal-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{s.learner_name}</p>
                  <p className="text-xs text-gray-500">{s.session_type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-700">{s.session_date}</p>
                  {s.session_time && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />{s.session_time}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
