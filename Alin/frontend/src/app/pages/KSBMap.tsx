import { useState, useEffect } from "react";
import { Check, X, Plus, Trash2 } from "lucide-react";
import { api } from "../../services/api";

interface Module {
  id: number;
  code: string;
  title: string;
}

interface KSBEntry {
  id: number;
  module_id: number;
  ksb_code: string;
  description: string | null;
  workplace_relevance: string | null;
}

interface KSBMapping {
  moduleId: number;
  module: string;
  title: string;
  knowledge: boolean;
  skills: boolean;
  behaviours: boolean;
  coverage: number;
}

// Map field name
const PREFIX: Record<'knowledge' | 'skills' | 'behaviours', string> = {
  knowledge: 'K',
  skills: 'S',
  behaviours: 'B',
};

function calcCoverage(k: boolean, s: boolean, b: boolean) {
  return Math.round(((k ? 1 : 0) + (s ? 1 : 0) + (b ? 1 : 0)) / 3 * 100);
}

const EMPTY_FORM = { module_id: "", ksb_code: "", description: "", workplace_relevance: "" };

export default function KSBMap() {
  const [modules, setModules] = useState<Module[]>([]);
  const [mappings, setMappings] = useState<KSBMapping[]>([]);
  const [ksbEntries, setKsbEntries] = useState<KSBEntry[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Add modal state
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState("");

  const load = () => {
    setLoading(true);
    return Promise.all([
      api.get<Module[]>('/modules'),
      api.get<KSBEntry[]>('/ksb-mappings'),
    ]).then(([mods, entries]) => {
      setModules(mods);
      setKsbEntries(entries);
      const built: KSBMapping[] = mods.map(m => {
        const modEntries = entries.filter(e => e.module_id === m.id);
        const k = modEntries.some(e => e.ksb_code.toUpperCase().startsWith('K'));
        const s = modEntries.some(e => e.ksb_code.toUpperCase().startsWith('S'));
        const b = modEntries.some(e => e.ksb_code.toUpperCase().startsWith('B'));
        return { moduleId: m.id, module: m.code, title: m.title, knowledge: k, skills: s, behaviours: b, coverage: calcCoverage(k, s, b) };
      });
      setMappings(built);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Opens the Add modal
  const openAdd = (moduleId?: number, prefix?: string) => {
    let defaultCode = prefix ?? "";
    if (prefix && moduleId) {
      const existing = ksbEntries
        .filter(e => e.module_id === moduleId && e.ksb_code.toUpperCase().startsWith(prefix))
        .map(e => parseInt(e.ksb_code.slice(1)) || 0);
      const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
      defaultCode = `${prefix}${next}`;
    }
    setForm({ ...EMPTY_FORM, module_id: moduleId ? String(moduleId) : "", ksb_code: defaultCode });
    setAddError("");
    setShowAdd(true);
  };

  // Called when a checkbox cell is clicked in the matrix
  const handleCellToggle = async (
    e: React.MouseEvent,
    mapping: KSBMapping,
    field: 'knowledge' | 'skills' | 'behaviours'
  ) => {
    e.stopPropagation();
    const prefix = PREFIX[field];
    const hasEntries = mapping[field];

    if (!hasEntries) {
      openAdd(mapping.moduleId, prefix);
    } else {
      const entries = ksbEntries.filter(
        e => e.module_id === mapping.moduleId && e.ksb_code.toUpperCase().startsWith(prefix)
      );
      if (!confirm(
        `Remove all ${field} entries (${entries.map(e => e.ksb_code).join(', ')}) from ${mapping.module}?`
      )) return;
      try {
        await Promise.all(entries.map(e => api.del(`/ksb-mappings/${e.id}`)));
        await load();
      } catch { }
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.module_id || !form.ksb_code.trim()) { setAddError("Module and KSB Code are required"); return; }
    setSaving(true);
    setAddError("");
    try {
      await api.post('/ksb-mappings', {
        module_id: Number(form.module_id),
        ksb_code: form.ksb_code.trim().toUpperCase(),
        description: form.description.trim() || null,
        workplace_relevance: form.workplace_relevance.trim() || null,
      });
      setShowAdd(false);
      await load();
    } catch (err: any) {
      setAddError(err.message || "Failed to add KSB entry");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this KSB entry?")) return;
    try {
      await api.del(`/ksb-mappings/${id}`);
      await load();
    } catch { }
  };

  const overallCoverage = mappings.length > 0
    ? Math.round(mappings.reduce((sum, m) => sum + m.coverage, 0) / mappings.length)
    : 0;

  const selectedMapping = mappings.find(m => m.moduleId === selectedModuleId) ?? null;
  const selectedEntries = ksbEntries.filter(e => e.module_id === selectedModuleId);
  const knowledgeEntries = selectedEntries.filter(e => e.ksb_code.toUpperCase().startsWith('K'));
  const skillsEntries    = selectedEntries.filter(e => e.ksb_code.toUpperCase().startsWith('S'));
  const behaviourEntries = selectedEntries.filter(e => e.ksb_code.toUpperCase().startsWith('B'));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl text-gray-800">KSB Mapping</h1>
        <button
          onClick={() => openAdd(selectedModuleId ?? undefined)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add KSB Entry
        </button>
      </div>

      {/*Summary cards*/}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-sm text-gray-600 mb-2">Overall Coverage</h3>
          <p className="text-3xl text-teal-600">{loading ? "—" : `${overallCoverage}%`}</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-sm text-gray-600 mb-2">Modules Mapped</h3>
          <p className="text-3xl text-gray-800">{loading ? "—" : mappings.length}</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-sm text-gray-600 mb-2">Gap Analysis</h3>
          <p className="text-3xl text-amber-600">
            {loading ? "—" : `${mappings.filter(m => m.coverage < 100).length} gaps`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/*KSB Matrix*/}
        <div className="col-span-2 bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg mb-2 text-gray-800">KSB Mapping Matrix</h2>
          <p className="text-xs text-gray-400 mb-4">
            Click a ✗ to add entries for that type. Click a ✓ to remove all entries of that type. Click a row to view its entries.
          </p>

          {loading ? (
            <p className="text-sm text-gray-400 py-8 text-center">Loading modules…</p>
          ) : mappings.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">No modules in the database yet. Add modules first.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-teal-600 text-white">
                    <th className="px-4 py-3 text-left">Module</th>
                    <th className="px-4 py-3 text-center">Knowledge</th>
                    <th className="px-4 py-3 text-center">Skills</th>
                    <th className="px-4 py-3 text-center">Behaviours</th>
                    <th className="px-4 py-3 text-center">Coverage</th>
                  </tr>
                </thead>
                <tbody>
                  {mappings.map((mapping, index) => (
                    <tr
                      key={mapping.moduleId}
                      className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} ${selectedModuleId === mapping.moduleId ? "ring-2 ring-inset ring-teal-400" : ""} hover:bg-teal-50 cursor-pointer transition-colors`}
                      onClick={() => setSelectedModuleId(prev => prev === mapping.moduleId ? null : mapping.moduleId)}
                    >
                      <td className="px-4 py-3">
                        <p className="text-gray-800 font-medium">{mapping.module}</p>
                        <p className="text-xs text-gray-500">{mapping.title}</p>
                      </td>
                      {(['knowledge', 'skills', 'behaviours'] as const).map(field => (
                        <td key={field} className="px-4 py-3 text-center">
                          <button
                            onClick={e => handleCellToggle(e, mapping, field)}
                            title={mapping[field]
                              ? `Click to remove all ${field} entries from ${mapping.module}`
                              : `Click to add a ${field} entry to ${mapping.module}`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-white/70 transition-colors"
                          >
                            {mapping[field]
                              ? <Check className="w-5 h-5 text-green-600" />
                              : <X className="w-5 h-5 text-red-400" />}
                          </button>
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center">
                        <span className={`px-3 py-1 rounded text-sm ${
                          mapping.coverage === 100 ? "bg-green-100 text-green-700"
                          : mapping.coverage >= 50  ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                        }`}>
                          {mapping.coverage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/*Right panel*/}
        <div className="space-y-6">
          {/*Gap Analysis*/}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg mb-4 text-gray-800">Gap Analysis</h2>
            {mappings.filter(m => m.coverage < 100).length === 0 ? (
              <p className="text-sm text-green-600">No gaps — full coverage!</p>
            ) : (
              <div className="space-y-3">
                {mappings.filter(m => m.coverage < 100).map(mapping => (
                  <div key={mapping.moduleId} className="border-l-4 border-amber-500 pl-3">
                    <p className="text-sm text-gray-800 font-medium">{mapping.module}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {!mapping.knowledge && (
                        <button
                          onClick={() => openAdd(mapping.moduleId, 'K')}
                          className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors"
                        >
                          + Knowledge
                        </button>
                      )}
                      {!mapping.skills && (
                        <button
                          onClick={() => openAdd(mapping.moduleId, 'S')}
                          className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors"
                        >
                          + Skills
                        </button>
                      )}
                      {!mapping.behaviours && (
                        <button
                          onClick={() => openAdd(mapping.moduleId, 'B')}
                          className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors"
                        >
                          + Behaviours
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/*Module Details*/}
          {selectedMapping && (
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-lg text-gray-800">{selectedMapping.module} Details</h2>
                <button
                  onClick={() => openAdd(selectedMapping.moduleId)}
                  className="text-xs px-2 py-1 text-teal-600 border border-teal-300 rounded hover:bg-teal-50 transition-colors"
                >
                  + Add
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-4">{selectedMapping.title}</p>

              {selectedEntries.length === 0 ? (
                <p className="text-sm text-gray-400">No KSB entries for this module yet. Click "+ Add" to add one.</p>
              ) : (
                <div className="space-y-4 text-sm">
                  {[
                    { label: "Knowledge",  entries: knowledgeEntries, border: "border-blue-300",   code: "text-blue-700"   },
                    { label: "Skills",     entries: skillsEntries,    border: "border-green-300",  code: "text-green-700"  },
                    { label: "Behaviours", entries: behaviourEntries, border: "border-purple-300", code: "text-purple-700" },
                  ].map(({ label, entries, border, code }) => entries.length > 0 && (
                    <div key={label}>
                      <p className="text-gray-600 mb-1 font-medium">{label}</p>
                      <div className="space-y-1">
                        {entries.map(e => (
                          <div key={e.id} className={`pl-2 border-l-2 ${border} flex items-start justify-between gap-2`}>
                            <div className="min-w-0">
                              <span className={`font-mono text-xs ${code}`}>{e.ksb_code}</span>
                              {e.description && <span className="text-gray-700 ml-2">{e.description}</span>}
                              {e.workplace_relevance && (
                                <p className="text-xs text-gray-400 mt-0.5 italic">{e.workplace_relevance}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleDelete(e.id)}
                              className="text-gray-300 hover:text-red-500 flex-shrink-0 mt-0.5"
                              title="Delete entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/*Add KSB Entry*/}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl text-gray-800">Add KSB Entry</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                {addError}
              </div>
            )}

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Module</label>
                <select
                  value={form.module_id}
                  onChange={e => setForm({ ...form, module_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select a module…</option>
                  {modules.map(m => (
                    <option key={m.id} value={m.id}>{m.code} — {m.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">KSB Code</label>
                <input
                  type="text"
                  value={form.ksb_code}
                  onChange={e => setForm({ ...form, ksb_code: e.target.value })}
                  placeholder="e.g. K1, S3, B2"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <p className="text-xs text-gray-400 mt-1">Prefix with K (Knowledge), S (Skills), or B (Behaviours)</p>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Brief description of this KSB…"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Workplace Relevance</label>
                <textarea
                  value={form.workplace_relevance}
                  onChange={e => setForm({ ...form, workplace_relevance: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="How this applies in the workplace…"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Add Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
