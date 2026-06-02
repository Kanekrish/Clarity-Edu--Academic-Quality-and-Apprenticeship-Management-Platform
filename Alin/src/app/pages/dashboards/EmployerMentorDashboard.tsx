import { useEffect, useState } from "react";
import { Users, MessageSquare, AlertCircle } from "lucide-react";
import { api } from "../../../services/api";

interface Learner {
  id: number;
  name: string;
  student_id: string;
  total_modules: number;
  graded_modules: number;
}

interface FeedbackItem {
  content: string;
  employer_priority: string | null;
  recorded_at: string;
  learner_name: string;
}

interface Stats {
  totalLearners: number;
  totalFeedback: number;
  atRiskLearners: number;
  learners: Learner[];
  recentFeedback: FeedbackItem[];
}

export default function EmployerMentorDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedLearner, setSelectedLearner] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [priority, setPriority] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");

  const fetchStats = () =>
    api.get<Stats>('/dashboard/stats').then(setStats).catch(() => {});

  useEffect(() => { fetchStats(); }, []);

  const s = stats;

  const progress = (l: Learner) =>
    l.total_modules > 0 ? Math.round((l.graded_modules / l.total_modules) * 100) : 0;

  const handleFeedbackSubmit = async () => {
    if (!selectedLearner || !feedbackText) return;
    setSubmitting(true);
    setSubmitMsg("");
    try {
      await api.post('/feedback', {
        learner_id: Number(selectedLearner),
        content: feedbackText,
        employer_priority: priority || undefined,
      });
      setFeedbackText("");
      setSelectedLearner("");
      setPriority("");
      setSubmitMsg("Feedback submitted successfully.");
      fetchStats();
    } catch {
      setSubmitMsg("Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl text-gray-800">Employer/Mentor Dashboard</h1>
        <p className="text-gray-600 mt-1">Track your apprentices' workplace performance</p>
      </div>

      {/*Quick Stats*/}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {[
          { label: "Learners",          value: s?.totalLearners ?? "—",  icon: Users,         color: "text-blue-600",  bg: "bg-blue-50" },
          { label: "Feedback Submitted",value: s?.totalFeedback ?? "—",  icon: MessageSquare, color: "text-teal-600",  bg: "bg-teal-50" },
          { label: "At-Risk",           value: s?.atRiskLearners ?? "—", icon: AlertCircle,   color: "text-amber-600", bg: "bg-amber-50" },
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

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/*Learners*/}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg text-gray-800 mb-4">Learner Progress</h2>
          {!s ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : s.learners?.length === 0 ? (
            <p className="text-sm text-gray-500">No learners linked yet.</p>
          ) : (
            <div className="space-y-4">
              {s.learners?.map((l) => {
                const prog = progress(l);
                return (
                  <div key={l.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <p className="text-gray-800 font-medium">{l.name}</p>
                      <span className="text-xs font-mono text-gray-500">{l.student_id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full ${prog >= 70 ? "bg-teal-500" : prog >= 40 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${prog}%` }} />
                      </div>
                      <span className="text-sm text-gray-600">{prog}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/*Submit Feedback*/}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg text-gray-800 mb-4">Submit Workplace Feedback</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Select Learner</label>
              <select value={selectedLearner} onChange={e => setSelectedLearner(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Select learner…</option>
                {s?.learners?.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Priority Area</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Select priority…</option>
                <option>Technical Skills</option>
                <option>Communication</option>
                <option>Project Management</option>
                <option>Problem Solving</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Feedback</label>
              <textarea rows={4} value={feedbackText} onChange={e => setFeedbackText(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Share your observations…" />
            </div>
            {submitMsg && <p className="text-sm text-green-600">{submitMsg}</p>}
            <button onClick={handleFeedbackSubmit} disabled={submitting || !selectedLearner || !feedbackText} className="w-full bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-60">
              {submitting ? "Submitting…" : "Submit Feedback"}
            </button>
          </div>
        </div>
      </div>

      {/*Recent Feedback*/}
      {s?.recentFeedback && s.recentFeedback.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg text-gray-800 mb-4">Recent Feedback You Submitted</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-teal-600 text-white">
                  <th className="px-4 py-3 text-left">Learner</th>
                  <th className="px-4 py-3 text-left">Priority</th>
                  <th className="px-4 py-3 text-left">Feedback</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {s.recentFeedback.map((f, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 text-gray-700">{f.learner_name}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{f.employer_priority ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-700 text-sm max-w-xs truncate">{f.content}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{f.recorded_at?.split('T')[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
