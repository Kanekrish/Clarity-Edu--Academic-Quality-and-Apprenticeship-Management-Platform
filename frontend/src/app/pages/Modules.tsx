import { useState, useEffect } from "react";
import { Plus, X, AlertCircle, Pencil, Trash2 } from "lucide-react";
import { api } from "../../services/api";

interface Module {
  id: number;
  code: string;
  title: string;
  credits: number | null;
  level: number | null;
  created_by_name: string | null;
}

const emptyForm = { code: "", title: "", credits: "", level: "" };

export default function Modules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState<Module | null>(null);

  const fetchModules = () =>
    api.get<Module[]>("/modules").then(setModules).catch(() => {});

  useEffect(() => {
    fetchModules().finally(() => setLoading(false));
  }, []);

  const openAdd = () => {
    setForm(emptyForm);
    setFormError("");
    setIsAddOpen(true);
  };

  const openEdit = (mod: Module) => {
    setSelected(mod);
    setForm({
      code: mod.code,
      title: mod.title,
      credits: mod.credits !== null ? String(mod.credits) : "",
      level: mod.level !== null ? String(mod.level) : "",
    });
    setFormError("");
    setIsEditOpen(true);
  };

  const openDelete = (mod: Module) => {
    setSelected(mod);
    setIsDeleteOpen(true);
  };

  const handleAdd = async () => {
    if (!form.code.trim() || !form.title.trim()) {
      setFormError("Module code and title are required.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await api.post("/modules", {
        code: form.code.trim(),
        title: form.title.trim(),
        credits: form.credits ? Number(form.credits) : null,
        level: form.level ? Number(form.level) : null,
      });
      await fetchModules();
      setIsAddOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to create module.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!form.code.trim() || !form.title.trim()) {
      setFormError("Module code and title are required.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await api.put(`/modules/${selected!.id}`, {
        code: form.code.trim(),
        title: form.title.trim(),
        credits: form.credits ? Number(form.credits) : null,
        level: form.level ? Number(form.level) : null,
      });
      await fetchModules();
      setIsEditOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to update module.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.del(`/modules/${selected!.id}`);
      await fetchModules();
      setIsDeleteOpen(false);
    } catch (err: any) {
      setIsDeleteOpen(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl mb-6 text-gray-800">Module Management</h1>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg text-gray-800">Modules</h2>
            <p className="text-sm text-gray-600 mt-1">
              {modules.length} module{modules.length !== 1 ? "s" : ""} in the database
            </p>
          </div>
          <button
            onClick={openAdd}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Module
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500 text-center py-8">Loading modules…</p>
        ) : modules.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No modules yet. Add one to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-teal-600 text-white">
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Credits</th>
                  <th className="px-4 py-3 text-left">Level</th>
                  <th className="px-4 py-3 text-left">Created By</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((mod, index) => (
                  <tr key={mod.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 text-gray-700 font-mono text-sm">{mod.code}</td>
                    <td className="px-4 py-3 text-gray-800">{mod.title}</td>
                    <td className="px-4 py-3 text-gray-600">{mod.credits ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{mod.level ? `Level ${mod.level}` : "—"}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{mod.created_by_name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(mod)}
                          className="p-1.5 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDelete(mod)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <Modal
          title="Add Module"
          onClose={() => setIsAddOpen(false)}
          onConfirm={handleAdd}
          confirmLabel={saving ? "Saving…" : "Add Module"}
          saving={saving}
          error={formError}
        >
          <ModuleForm form={form} onChange={setForm} />
        </Modal>
      )}

      {/* Edit Modal */}
      {isEditOpen && (
        <Modal
          title="Edit Module"
          onClose={() => setIsEditOpen(false)}
          onConfirm={handleEdit}
          confirmLabel={saving ? "Saving…" : "Save Changes"}
          saving={saving}
          error={formError}
        >
          <ModuleForm form={form} onChange={setForm} />
        </Modal>
      )}

      {/* Delete Confirmation */}
      {isDeleteOpen && selected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg text-gray-800 mb-2">Delete Module</h2>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-semibold">{selected.code} — {selected.title}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModuleForm({
  form,
  onChange,
}: {
  form: { code: string; title: string; credits: string; level: string };
  onChange: (f: { code: string; title: string; credits: string; level: string }) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-700 mb-1">
          Module Code <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.code}
          onChange={e => onChange({ ...form, code: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="e.g. CS301"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.title}
          onChange={e => onChange({ ...form, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="e.g. Software Engineering"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Credits</label>
          <input
            type="number"
            value={form.credits}
            onChange={e => onChange({ ...form, credits: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="e.g. 20"
            min={0}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Level</label>
          <input
            type="number"
            value={form.level}
            onChange={e => onChange({ ...form, level: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="e.g. 6"
            min={1}
            max={8}
          />
        </div>
      </div>
    </div>
  );
}

function Modal({
  title,
  onClose,
  onConfirm,
  confirmLabel,
  saving,
  error,
  children,
}: {
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  saving: boolean;
  error: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {children}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-60"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
