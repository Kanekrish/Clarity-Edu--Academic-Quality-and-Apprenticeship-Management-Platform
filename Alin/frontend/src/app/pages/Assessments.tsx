import { useState, useEffect } from "react";
import { Plus, X, AlertCircle } from "lucide-react";
import { api } from "../../services/api";

interface Assessment {
  id: number;
  module_id: number;
  module_code: string;
  module_title: string;
  title: string;
  release_date: string | null;
  deadline: string | null;
  marking_status: string;
  review_date: string | null;
  external_examiner_required: number;
}

interface Module {
  id: number;
  code: string;
  title: string;
}

const statusColour: Record<string, string> = {
  complete:     "text-green-600",
  in_progress:  "text-blue-600",
  not_started:  "text-gray-500",
  overdue:      "text-red-600",
};

const statusLabel: Record<string, string> = {
  complete:    "Complete",
  in_progress: "In Progress",
  not_started: "Not Started",
  overdue:     "Overdue",
};

const emptyForm = {
  module_id: "",
  title: "",
  release_date: "",
  deadline: "",
  marking_status: "not_started",
  review_date: "",
  external_examiner_required: false,
};

export default function Assessments() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({ ...emptyForm });

  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const fetchAll = () =>
    Promise.all([
      api.get<Assessment[]>('/assessments'),
      api.get<Module[]>('/modules'),
    ]).then(([a, m]) => {
      setAssessments(a);
      setModules(m);
    }).catch(() => {}).finally(() => setLoading(false));

  useEffect(() => { fetchAll(); }, []);

  const openEdit = (a: Assessment) => {
    setEditId(a.id);
    setEditForm({
      module_id: String(a.module_id),
      title: a.title,
      release_date: a.release_date ?? "",
      deadline: a.deadline ?? "",
      marking_status: a.marking_status,
      review_date: a.review_date ?? "",
      external_examiner_required: a.external_examiner_required === 1,
    });
    setEditError("");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.title) { setEditError("Title is required"); return; }
    setEditSaving(true); setEditError("");
    try {
      await api.put(`/assessments/${editId}`, {
        title: editForm.title,
        release_date: editForm.release_date || null,
        deadline: editForm.deadline || null,
        marking_status: editForm.marking_status,
        review_date: editForm.review_date || null,
        external_examiner_required: editForm.external_examiner_required,
      });
      await fetchAll();
      setEditId(null);
    } catch (err: any) {
      setEditError(err.message || "Failed to save");
    } finally { setEditSaving(false); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.module_id || !form.title) { setFormError("Module and title are required"); return; }
    setSaving(true); setFormError("");
    try {
      await api.post('/assessments', {
        module_id: Number(form.module_id),
        title: form.title,
        release_date: form.release_date || undefined,
        deadline: form.deadline || undefined,
        marking_status: form.marking_status,
        review_date: form.review_date || undefined,
        external_examiner_required: form.external_examiner_required,
      });
      await fetchAll();
      setIsAddOpen(false);
      setForm({ ...emptyForm });
    } catch (err: any) {
      setFormError(err.message || "Failed to add assessment");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this assessment?")) return;
    try {
      await api.del(`/assessments/${id}`);
      setAssessments(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      const assessment = assessments.find(a => a.id === id)!;
      await api.put(`/assessments/${id}`, { ...assessment, marking_status: status });
      setAssessments(prev => prev.map(a => a.id === id ? { ...a, marking_status: status } : a));
    } catch {}
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-3xl text-gray-800">Assessment Register</h1>
        <button onClick={() => { setIsAddOpen(true); setFormError(""); }} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Assessment
        </button>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-gray-500 text-center py-8">Loading…</p>
        ) : assessments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No assessments in database yet. Add one above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-teal-600 text-white">
                  <th className="px-4 py-3 text-left">Module</th>
                  <th className="px-4 py-3 text-left">Assessment</th>
                  <th className="px-4 py-3 text-left">Released</th>
                  <th className="px-4 py-3 text-left">Deadline</th>
                  <th className="px-4 py-3 text-left">Marking Status</th>
                  <th className="px-4 py-3 text-left">Review Date</th>
                  <th className="px-4 py-3 text-center">Ext. Examiner</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((a, i) => (
                  <tr key={a.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 text-gray-700 font-mono text-sm">{a.module_code}</td>
                    <td className="px-4 py-3 text-gray-800">{a.title}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{a.release_date ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{a.deadline ?? "—"}</td>
                    <td className="px-4 py-3">
                      <select
                        value={a.marking_status}
                        onChange={e => updateStatus(a.id, e.target.value)}
                        className={`text-sm border border-gray-200 rounded px-2 py-1 ${statusColour[a.marking_status] ?? "text-gray-600"}`}
                      >
                        {Object.entries(statusLabel).map(([val, lab]) => (
                          <option key={val} value={val}>{lab}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{a.review_date ?? "—"}</td>
                    <td className="px-4 py-3 text-center">
                      {a.external_examiner_required ? (
                        <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded">Required</span>
                      ) : (
                        <span className="text-xs text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 flex gap-3">
                      <button onClick={() => openEdit(a)} className="text-teal-600 hover:text-teal-800 text-sm font-medium">Edit</button>
                      <button onClick={() => handleDelete(a.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl text-gray-800">Edit Assessment</h2>
              <button onClick={() => setEditId(null)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            {editError && (
              <div className="mb-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4" />{editError}
              </div>
            )}
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Module</label>
                <select
                  value={editForm.module_id}
                  onChange={e => setEditForm({ ...editForm, module_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select module…</option>
                  {modules.map(m => <option key={m.id} value={m.id}>{m.code} — {m.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                <input type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Release Date</label>
                  <input type="date" value={editForm.release_date} onChange={e => setEditForm({ ...editForm, release_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Deadline</label>
                  <input type="date" value={editForm.deadline} onChange={e => setEditForm({ ...editForm, deadline: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Marking Status</label>
                  <select value={editForm.marking_status} onChange={e => setEditForm({ ...editForm, marking_status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                    {Object.entries(statusLabel).map(([val, lab]) => <option key={val} value={val}>{lab}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Review Date</label>
                  <input type="date" value={editForm.review_date} onChange={e => setEditForm({ ...editForm, review_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="edit-ext" checked={editForm.external_examiner_required as boolean} onChange={e => setEditForm({ ...editForm, external_examiner_required: e.target.checked })} className="w-4 h-4" />
                <label htmlFor="edit-ext" className="text-sm text-gray-700">External Examiner Required</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditId(null)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={editSaving} className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-60">{editSaving ? "Saving…" : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*Add Modal*/}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl text-gray-800">Add Assessment</h2>
              <button onClick={() => setIsAddOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            {formError && (
              <div className="mb-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4" />{formError}
              </div>
            )}
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Module <span className="text-red-500">*</span></label>
                <select value={form.module_id} onChange={e => setForm({ ...form, module_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Select module…</option>
                  {modules.map(m => <option key={m.id} value={m.id}>{m.code} — {m.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g. Portfolio 1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Release Date</label>
                  <input type="date" value={form.release_date} onChange={e => setForm({ ...form, release_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Deadline</label>
                  <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Marking Status</label>
                  <select value={form.marking_status} onChange={e => setForm({ ...form, marking_status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                    {Object.entries(statusLabel).map(([val, lab]) => <option key={val} value={val}>{lab}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Review Date</label>
                  <input type="date" value={form.review_date} onChange={e => setForm({ ...form, review_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="ext" checked={form.external_examiner_required} onChange={e => setForm({ ...form, external_examiner_required: e.target.checked })} className="w-4 h-4" />
                <label htmlFor="ext" className="text-sm text-gray-700">External Examiner Required</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsAddOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-60">{saving ? "Saving…" : "Add Assessment"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
