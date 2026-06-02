import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { api } from "../../services/api";

interface Learner { id: number; name: string; student_id: string; }
interface FeedbackRecord {
  id: number;
  learner_id: number;
  learner_name: string;
  student_id: string;
  mentor_name: string | null;
  content: string;
  employer_priority: string | null;
  recorded_at: string;
}

const FEEDBACK_TYPES = ["Progress Review", "Session Notes", "Action Points", "Concern", "Praise"];

export default function Feedback() {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [records, setRecords] = useState<FeedbackRecord[]>([]);
  const [form, setForm] = useState({ learner_id: "", type: FEEDBACK_TYPES[0], content: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = () =>
    Promise.all([
      api.get<Learner[]>('/learners'),
      api.get<FeedbackRecord[]>('/feedback'),
    ]).then(([ls, fs]) => { setLearners(ls); setRecords(fs); });

  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!form.learner_id || !form.content.trim()) {
      setError("Please select a learner and enter feedback.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await api.post('/feedback', {
        learner_id: Number(form.learner_id),
        content: `[${form.type}] ${form.content.trim()}`,
        employer_priority: null,
      });
      setForm({ learner_id: "", type: FEEDBACK_TYPES[0], content: "" });
      load();
    } catch {
      setError("Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this feedback record?")) return;
    await api.del(`/feedback/${id}`);
    setRecords(r => r.filter(f => f.id !== id));
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl mb-6 text-gray-800">Learner Feedback</h1>

      <div className="grid grid-cols-2 gap-6">
        {/* Submit form */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg text-gray-800 mb-6">Submit Feedback</h2>
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Select Learner</label>
              <select
                value={form.learner_id}
                onChange={e => setForm({ ...form, learner_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select learner…</option>
                {learners.map(l => (
                  <option key={l.id} value={l.id}>{l.name} ({l.student_id})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Feedback Type</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {FEEDBACK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Comments</label>
              <textarea
                rows={6}
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Enter feedback…"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit Feedback"}
            </button>
          </div>
        </div>

        {/*Recent feedback*/}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg text-gray-800 mb-6">Recent Feedback</h2>
          {records.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No feedback records yet.</p>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {records.map(f => (
                <div key={f.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-medium text-gray-800">{f.learner_name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{f.recorded_at?.split('T')[0]}</span>
                      <button onClick={() => handleDelete(f.id)} className="text-gray-300 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {f.mentor_name && (
                    <p className="text-xs text-gray-500 mb-1">By: {f.mentor_name}</p>
                  )}
                  {f.employer_priority && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded mr-1">{f.employer_priority}</span>
                  )}
                  <p className="text-xs text-gray-700 mt-1 line-clamp-3">{f.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
