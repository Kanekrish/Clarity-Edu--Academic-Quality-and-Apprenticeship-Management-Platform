import { useEffect, useState } from "react";
import { Plus, X, Calendar, Clock } from "lucide-react";
import { api } from "../../services/api";

interface Learner { id: number; name: string; student_id: string; }

interface Session {
  id: number;
  learner_id: number;
  learner_name: string;
  student_id: string;
  session_date: string;
  session_time: string | null;
  session_type: string;
  status: string;
  notes: string | null;
}

const SESSION_TYPES = [
  "Progress Review", "Monthly Review", "Target Setting",
  "Intervention", "KSB Assessment", "Workplace Visit", "Catch-up Session",
];

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSession, setNewSession] = useState({
    learner_id: "", session_date: "", session_time: "",
    session_type: SESSION_TYPES[0], notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const load = () =>
    Promise.all([
      api.get<Session[]>('/sessions'),
      api.get<Learner[]>('/learners'),
    ]).then(([ss, ls]) => { setSessions(ss); setLearners(ls); })
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleSchedule = async () => {
    if (!newSession.learner_id || !newSession.session_date || !newSession.session_time) {
      alert("Please fill in learner, date and time.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/sessions', {
        learner_id: Number(newSession.learner_id),
        session_date: newSession.session_date,
        session_time: newSession.session_time,
        session_type: newSession.session_type,
        notes: newSession.notes || null,
      });
      setIsModalOpen(false);
      setNewSession({ learner_id: "", session_date: "", session_time: "", session_type: SESSION_TYPES[0], notes: "" });
      load();
    } finally {
      setSubmitting(false);
    }
  };

  const markCompleted = async (id: number) => {
    await api.patch(`/sessions/${id}`, { status: "Completed" });
    setSessions(ss => ss.map(s => s.id === id ? { ...s, status: "Completed" } : s));
  };

  const cancelSession = async (id: number) => {
    if (!confirm("Cancel this session?")) return;
    await api.del(`/sessions/${id}`);
    setSessions(ss => ss.filter(s => s.id !== id));
  };

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading sessions…</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl text-gray-800">Coaching Sessions</h1>
        <p className="text-gray-600 mt-1">Manage and schedule learner coaching sessions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
          <div className="text-3xl text-teal-600 mb-2">{sessions.length}</div>
          <div className="text-sm text-gray-600">Total Sessions</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
          <div className="text-3xl text-blue-600 mb-2">{sessions.filter(s => s.status === "Scheduled").length}</div>
          <div className="text-sm text-gray-600">Scheduled</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
          <div className="text-3xl text-green-600 mb-2">{sessions.filter(s => s.status === "Completed").length}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
          <div className="text-3xl text-amber-600 mb-2">{sessions.filter(s => s.session_type === "Intervention").length}</div>
          <div className="text-sm text-gray-600">Interventions</div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg text-gray-800">All Sessions</h2>
            <p className="text-sm text-gray-600 mt-1">View and manage your coaching schedule</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Schedule Session
          </button>
        </div>

        {sessions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No sessions yet. Schedule your first session.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-teal-600 text-white">
                  <th className="px-4 py-3 text-left">Learner</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Notes</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => (
                  <tr key={s.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 text-gray-700">{s.learner_name}</td>
                    <td className="px-4 py-3 text-gray-700">{s.session_date}</td>
                    <td className="px-4 py-3 text-gray-700">{s.session_time ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{s.session_type}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm max-w-xs truncate">{s.notes ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded text-sm ${
                        s.status === "Completed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                      }`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {s.status === "Scheduled" && (
                        <div className="flex gap-2">
                          <button onClick={() => markCompleted(s.id)} className="text-green-600 hover:text-green-700 text-sm">Complete</button>
                          <button onClick={() => cancelSession(s.id)} className="text-red-600 hover:text-red-700 text-sm">Cancel</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/*Modal*/}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl text-gray-800">Schedule New Session</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Select Learner <span className="text-red-500">*</span></label>
                <select
                  value={newSession.learner_id}
                  onChange={e => setNewSession({ ...newSession, learner_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Choose a learner…</option>
                  {learners.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.student_id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Session Type</label>
                <select
                  value={newSession.session_type}
                  onChange={e => setNewSession({ ...newSession, session_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {SESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="date"
                      value={newSession.session_date}
                      onChange={e => setNewSession({ ...newSession, session_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <Calendar className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Time <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="time"
                      value={newSession.session_time}
                      onChange={e => setNewSession({ ...newSession, session_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <Clock className="w-4 h-4 absolute right-3 top-3 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Session Notes</label>
                <textarea
                  value={newSession.notes}
                  onChange={e => setNewSession({ ...newSession, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  rows={3}
                  placeholder="Add notes or agenda items…"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSchedule}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "Scheduling…" : "Schedule Session"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
