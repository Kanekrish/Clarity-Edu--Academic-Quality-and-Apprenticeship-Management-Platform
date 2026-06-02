import { useState, useEffect } from "react";
import { Plus, X, Calendar, Clock, MapPin } from "lucide-react";
import { api } from "../../services/api";

interface Learner {
  id: number;
  name: string;
  student_id: string;
}

interface Visit {
  id: number;
  learner_id: number;
  learner_name: string;
  visit_date: string;
  visit_time: string | null;
  location: string | null;
  purpose: string | null;
  attendees: string | null;
  status: "Scheduled" | "Completed" | "Cancelled";
  feedback_notes: string | null;
}

const visitPurposes = [
  "Monthly Review", "Progress Check", "Skills Assessment",
  "Performance Review", "Problem Discussion", "Training Session", "Project Review",
];

const statusColor = (s: Visit["status"]) =>
  s === "Completed" ? "bg-green-100 text-green-700"
  : s === "Scheduled" ? "bg-blue-100 text-blue-700"
  : "bg-gray-100 text-gray-700";

export default function Visits() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    learner_id: "",
    visit_date: "",
    visit_time: "",
    location: "",
    purpose: "Monthly Review",
    attendees: "",
  });

  const fetchVisits = () =>
    api.get<Visit[]>('/visits').then(setVisits).catch(() => {});

  useEffect(() => {
    Promise.all([
      api.get<Visit[]>('/visits'),
      api.get<Learner[]>('/learners'),
    ]).then(([v, l]) => { setVisits(v); setLearners(l); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSchedule = async () => {
    if (!form.learner_id || !form.visit_date) {
      alert("Please select an apprentice and a date.");
      return;
    }
    setSaving(true);
    try {
      await api.post('/visits', {
        learner_id: Number(form.learner_id),
        visit_date: form.visit_date,
        visit_time: form.visit_time || undefined,
        location: form.location || undefined,
        purpose: form.purpose || undefined,
        attendees: form.attendees || undefined,
      });
      setIsModalOpen(false);
      setForm({ learner_id: "", visit_date: "", visit_time: "", location: "", purpose: "Monthly Review", attendees: "" });
      await fetchVisits();
    } catch (err: any) {
      alert(err.message || "Failed to schedule visit.");
    } finally { setSaving(false); }
  };

  const markCompleted = async (id: number) => {
    const notes = prompt("Enter visit feedback/summary:");
    if (notes === null) return;
    try {
      await api.patch(`/visits/${id}`, { status: "Completed", feedback_notes: notes || undefined });
      await fetchVisits();
    } catch { alert("Failed to update visit."); }
  };

  const cancelVisit = async (id: number) => {
    if (!confirm("Cancel this visit?")) return;
    try {
      await api.patch(`/visits/${id}`, { status: "Cancelled" });
      await fetchVisits();
    } catch { alert("Failed to cancel visit."); }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl text-gray-800">Workplace Visits</h1>
        <p className="text-gray-600 mt-1">Schedule and track apprentice workplace visits</p>
      </div>

      {/*Stats*/}
      <div className="grid grid-cols-4 gap-6 mb-6">
        {[
          { label: "Total Visits",  value: visits.length,                                          color: "text-teal-600" },
          { label: "Scheduled",     value: visits.filter(v => v.status === "Scheduled").length,    color: "text-blue-600" },
          { label: "Completed",     value: visits.filter(v => v.status === "Completed").length,    color: "text-green-600" },
          { label: "Apprentices",   value: new Set(visits.map(v => v.learner_id)).size,             color: "text-purple-600" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg p-6 shadow-sm text-center">
            <div className={`text-3xl mb-2 ${s.color}`}>{loading ? "—" : s.value}</div>
            <div className="text-sm text-gray-600">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg text-gray-800">Visit History & Schedule</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Schedule Visit
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-8">Loading…</p>
        ) : visits.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No visits scheduled yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-teal-600 text-white">
                  <th className="px-4 py-3 text-left">Apprentice</th>
                  <th className="px-4 py-3 text-left">Date & Time</th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3 text-left">Purpose</th>
                  <th className="px-4 py-3 text-left">Attendees</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Notes</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((visit, index) => (
                  <tr key={visit.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 text-gray-700">{visit.learner_name}</td>
                    <td className="px-4 py-3 text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{visit.visit_date}</span>
                      </div>
                      {visit.visit_time && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>{visit.visit_time}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {visit.location ? (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{visit.location}</span>
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{visit.purpose ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{visit.attendees ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded text-sm ${statusColor(visit.status)}`}>{visit.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm max-w-xs truncate">{visit.feedback_notes ?? "—"}</td>
                    <td className="px-4 py-3">
                      {visit.status === "Scheduled" && (
                        <div className="flex gap-2">
                          <button onClick={() => markCompleted(visit.id)} className="text-green-600 hover:text-green-700 text-sm">Complete</button>
                          <button onClick={() => cancelVisit(visit.id)} className="text-red-600 hover:text-red-700 text-sm">Cancel</button>
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

      {/*Schedule Modal*/}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl text-gray-800">Schedule Workplace Visit</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Select Apprentice <span className="text-red-500">*</span></label>
                <select
                  value={form.learner_id}
                  onChange={e => setForm({ ...form, learner_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Choose an apprentice…</option>
                  {learners.map(l => <option key={l.id} value={l.id}>{l.name} ({l.student_id})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Visit Purpose</label>
                <select
                  value={form.purpose}
                  onChange={e => setForm({ ...form, purpose: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {visitPurposes.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={form.visit_date}
                    onChange={e => setForm({ ...form, visit_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    value={form.visit_time}
                    onChange={e => setForm({ ...form, visit_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g., Meeting Room A"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Attendees</label>
                <input
                  type="text"
                  value={form.attendees}
                  onChange={e => setForm({ ...form, attendees: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g., Coach, Apprentice, Manager"
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
                disabled={saving}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-60"
              >
                {saving ? "Saving…" : "Schedule Visit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
