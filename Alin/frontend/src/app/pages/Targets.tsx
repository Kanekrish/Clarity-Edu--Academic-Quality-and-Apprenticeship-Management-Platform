import { useEffect, useState } from "react";
import { Plus, X, Target as TargetIcon, Calendar, CheckCircle2 } from "lucide-react";
import { api } from "../../services/api";

interface Learner { id: number; name: string; student_id: string; }

interface Target {
  id: number;
  learner_id: number;
  learner_name: string;
  student_id: string;
  title: string;
  description: string | null;
  category: string;
  due_date: string | null;
  progress: number;
  status: "On Track" | "At Risk" | "Complete" | "Overdue";
}

const CATEGORIES = ["KSB", "Assessment", "Project", "Development", "Feedback", "Portfolio", "Skills Development"];

const statusColor = (s: string) =>
  s === "Complete" ? "bg-green-100 text-green-700" :
  s === "On Track"  ? "bg-blue-100 text-blue-700" :
  s === "At Risk"   ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700";

const progressColor = (p: number) =>
  p === 100 ? "bg-green-500" : p >= 70 ? "bg-blue-500" : p >= 40 ? "bg-amber-500" : "bg-red-500";

export default function Targets() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newTarget, setNewTarget] = useState({
    learner_id: "", title: "", category: CATEGORIES[0], due_date: "", description: "",
  });

  const load = () =>
    Promise.all([
      api.get<Target[]>('/targets'),
      api.get<Learner[]>('/learners'),
    ]).then(([ts, ls]) => { setTargets(ts); setLearners(ls); })
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newTarget.learner_id || !newTarget.title.trim() || !newTarget.due_date) {
      alert("Please fill in learner, title and due date.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/targets', {
        learner_id: Number(newTarget.learner_id),
        title: newTarget.title.trim(),
        description: newTarget.description.trim() || null,
        category: newTarget.category,
        due_date: newTarget.due_date,
      });
      setIsModalOpen(false);
      setNewTarget({ learner_id: "", title: "", category: CATEGORIES[0], due_date: "", description: "" });
      load();
    } finally {
      setSubmitting(false);
    }
  };

  const updateProgress = async (id: number, progress: number) => {
    const result = await api.patch<{ progress: number; status: string }>(`/targets/${id}`, { progress });
    setTargets(ts => ts.map(t => t.id === id ? { ...t, progress: result.progress, status: result.status as Target["status"] } : t));
  };

  const deleteTarget = async (id: number) => {
    if (!confirm("Delete this target?")) return;
    await api.del(`/targets/${id}`);
    setTargets(ts => ts.filter(t => t.id !== id));
  };

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading targets…</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl text-gray-800">Learner Targets</h1>
        <p className="text-gray-600 mt-1">Set and track learner goals and milestones</p>
      </div>

      {/*Summary Cards*/}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
          <div className="text-3xl text-teal-600 mb-2">{targets.length}</div>
          <div className="text-sm text-gray-600">Total Targets</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
          <div className="text-3xl text-green-600 mb-2">{targets.filter(t => t.status === "Complete").length}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
          <div className="text-3xl text-blue-600 mb-2">{targets.filter(t => t.status === "On Track").length}</div>
          <div className="text-sm text-gray-600">On Track</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
          <div className="text-3xl text-amber-600 mb-2">{targets.filter(t => t.status === "At Risk").length}</div>
          <div className="text-sm text-gray-600">At Risk</div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg text-gray-800">Target Achievement Tracking</h2>
            <p className="text-sm text-gray-600 mt-1">Monitor progress towards learner goals</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Target
          </button>
        </div>

        {targets.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No targets yet. Add your first target above.</p>
        ) : (
          <div className="space-y-4">
            {targets.map(target => (
              <div key={target.id} className="p-4 border border-gray-200 rounded-lg hover:border-teal-500 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <TargetIcon className="w-4 h-4 text-teal-600" />
                      <p className="text-gray-800 font-medium">{target.title}</p>
                      <span className={`text-xs px-2 py-1 rounded ${statusColor(target.status)}`}>{target.status}</span>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">{target.category}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        {target.learner_name}
                      </span>
                      {target.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Due: {target.due_date}
                        </span>
                      )}
                    </div>
                    {target.description && (
                      <p className="text-sm text-gray-600">{target.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteTarget(target.id)}
                    className="text-red-600 hover:text-red-700 text-sm px-2"
                  >
                    Delete
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${progressColor(target.progress)} transition-all duration-300`}
                      style={{ width: `${target.progress}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 min-w-[45px]">{target.progress}%</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={target.progress}
                    onChange={e => updateProgress(target.id, Number(e.target.value))}
                    className="w-24 h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${target.progress}%, #e5e7eb ${target.progress}%, #e5e7eb 100%)`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/*Add Target*/}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl text-gray-800">Add New Target</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Target Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newTarget.title}
                  onChange={e => setNewTarget({ ...newTarget, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g. Complete Module 3 Assessment"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Assign to Learner <span className="text-red-500">*</span></label>
                <select
                  value={newTarget.learner_id}
                  onChange={e => setNewTarget({ ...newTarget, learner_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Choose a learner…</option>
                  {learners.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.student_id})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Category</label>
                  <select
                    value={newTarget.category}
                    onChange={e => setNewTarget({ ...newTarget, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Due Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={newTarget.due_date}
                    onChange={e => setNewTarget({ ...newTarget, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTarget.description}
                  onChange={e => setNewTarget({ ...newTarget, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  rows={3}
                  placeholder="Add details about this target…"
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
                onClick={handleAdd}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Add Target"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
