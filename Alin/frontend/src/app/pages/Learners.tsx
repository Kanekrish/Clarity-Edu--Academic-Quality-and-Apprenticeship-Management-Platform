import { useState, useEffect } from "react";
import { Plus, X, AlertCircle } from "lucide-react";
import { api } from "../../services/api";

interface Learner {
  id: number;
  student_id: string;
  name: string;
  email: string | null;
  employer_name: string | null;
  enrolled_at: string | null;
  total_modules: number;
  graded_modules: number;
  at_risk: number;
}

interface Employer {
  id: number;
  name: string;
}

export default function Learners() {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [newLearner, setNewLearner] = useState({
    student_id: "",
    name: "",
    email: "",
    employer_id: "",
    enrolled_at: "",
  });

  const fetchLearners = () =>
    api.get<Learner[]>('/learners').then(setLearners).catch(() => {});

  useEffect(() => {
    Promise.all([
      api.get<Learner[]>('/learners'),
      api.get<Employer[]>('/employers'),
    ]).then(([l, e]) => {
      setLearners(l);
      setEmployers(e);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleAddLearner = async () => {
    if (!newLearner.student_id.trim() || !newLearner.name.trim()) {
      setFormError("Student ID and Name are required");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await api.post('/learners', {
        student_id: newLearner.student_id,
        name: newLearner.name,
        email: newLearner.email || undefined,
        employer_id: newLearner.employer_id ? Number(newLearner.employer_id) : undefined,
        enrolled_at: newLearner.enrolled_at || undefined,
      });
      await fetchLearners();
      setIsAddModalOpen(false);
      setNewLearner({ student_id: "", name: "", email: "", employer_id: "", enrolled_at: "" });
    } catch (err: any) {
      setFormError(err.message || "Failed to add learner");
    } finally {
      setSaving(false);
    }
  };

  const progress = (l: Learner) =>
    l.total_modules > 0 ? Math.round((l.graded_modules / l.total_modules) * 100) : 0;

  const statusLabel = (l: Learner) => {
    if (l.at_risk) return { label: "At Risk", color: "text-amber-600" };
    const p = progress(l);
    if (p >= 80) return { label: "Excellent", color: "text-green-600" };
    if (p >= 50) return { label: "On Track", color: "text-green-600" };
    if (p > 0)   return { label: "Behind", color: "text-red-600" };
    return { label: "Enrolled", color: "text-gray-500" };
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl mb-6 text-gray-800">My Learners</h1>

      <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg text-gray-800">Learner Caseload</h2>
            <p className="text-sm text-gray-600 mt-1">{learners.length} learner{learners.length !== 1 ? "s" : ""} in database</p>
          </div>
          <button
            onClick={() => { setIsAddModalOpen(true); setFormError(""); }}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Learner
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500 text-center py-8">Loading learners…</p>
        ) : learners.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No learners in the database yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-teal-600 text-white">
                  <th className="px-4 py-3 text-left">Student ID</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Employer</th>
                  <th className="px-4 py-3 text-left">Enrolled</th>
                  <th className="px-4 py-3 text-left">Progress</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {learners.map((learner, index) => {
                  const st = statusLabel(learner);
                  const prog = progress(learner);
                  return (
                    <tr key={learner.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-3 text-gray-700 font-mono text-sm">{learner.student_id}</td>
                      <td className="px-4 py-3 text-gray-700">{learner.name}</td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{learner.email ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{learner.employer_name ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{learner.enrolled_at ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[100px]">
                            <div
                              className={`h-full ${prog >= 70 ? "bg-green-500" : prog >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                              style={{ width: `${prog}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{prog}%</span>
                        </div>
                      </td>
                      <td className={`px-4 py-3 ${st.color}`}>{st.label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/*Add Learner*/}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl text-gray-800">Add New Learner</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {formError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Student ID <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newLearner.student_id}
                  onChange={(e) => setNewLearner({ ...newLearner, student_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g. STU001"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newLearner.name}
                  onChange={(e) => setNewLearner({ ...newLearner, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newLearner.email}
                  onChange={(e) => setNewLearner({ ...newLearner, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="learner@email.com"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Employer</label>
                <select
                  value={newLearner.employer_id}
                  onChange={(e) => setNewLearner({ ...newLearner, employer_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select employer…</option>
                  {employers.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">Enrolment Date</label>
                <input
                  type="date"
                  value={newLearner.enrolled_at}
                  onChange={(e) => setNewLearner({ ...newLearner, enrolled_at: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLearner}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-60"
              >
                {saving ? "Saving…" : "Add Learner"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
