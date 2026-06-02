import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { api } from "../../services/api";

interface Observation {
  id: number;
  category: string;
  content: string;
  recorded_at: string;
}

const CATEGORIES = [
  "Programme Structure",
  "Teaching Quality",
  "Support Services",
  "Learner Engagement",
  "Assessment Practice",
  "Workplace Integration",
  "Other",
];

const CATEGORY_COLORS: Record<string, { border: string; bg: string; text: string; sub: string }> = {
  "Programme Structure":   { border: "border-blue-500",   bg: "bg-blue-50",   text: "text-blue-800",   sub: "text-blue-700"  },
  "Teaching Quality":      { border: "border-green-500",  bg: "bg-green-50",  text: "text-green-800",  sub: "text-green-700" },
  "Support Services":      { border: "border-amber-500",  bg: "bg-amber-50",  text: "text-amber-800",  sub: "text-amber-700" },
  "Learner Engagement":    { border: "border-teal-500",   bg: "bg-teal-50",   text: "text-teal-800",   sub: "text-teal-700"  },
  "Assessment Practice":   { border: "border-purple-500", bg: "bg-purple-50", text: "text-purple-800", sub: "text-purple-700"},
  "Workplace Integration": { border: "border-rose-500",   bg: "bg-rose-50",   text: "text-rose-800",   sub: "text-rose-700"  },
  "Other":                 { border: "border-gray-400",   bg: "bg-gray-50",   text: "text-gray-800",   sub: "text-gray-700"  },
};

const color = (cat: string) => CATEGORY_COLORS[cat] ?? CATEGORY_COLORS["Other"];

export default function Observations() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ category: CATEGORIES[0], content: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = () =>
    api.get<Observation[]>('/observations')
      .then(setObservations)
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.content.trim()) { alert("Please enter observation content."); return; }
    setSubmitting(true);
    try {
      await api.post('/observations', { category: form.category, content: form.content.trim() });
      setForm({ category: CATEGORIES[0], content: "" });
      setIsModalOpen(false);
      load();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this observation?")) return;
    await api.del(`/observations/${id}`);
    setObservations(o => o.filter(x => x.id !== id));
  };

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading observations…</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl text-gray-800">Inspection Observations</h1>
          <p className="text-gray-600 mt-1">Record and manage coaching observations</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Observation
        </button>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg text-gray-800 mb-6">Observation Notes</h2>
        {observations.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No observations recorded yet.</p>
        ) : (
          <div className="space-y-4">
            {observations.map(obs => {
              const c = color(obs.category);
              return (
                <div key={obs.id} className={`p-4 border-l-4 ${c.border} ${c.bg} flex justify-between items-start gap-4`}>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${c.text} mb-1`}>{obs.category}</p>
                    <p className={`text-sm ${c.sub}`}>{obs.content}</p>
                    <p className="text-xs text-gray-400 mt-2">{obs.recorded_at?.split('T')[0]}</p>
                  </div>
                  <button onClick={() => handleDelete(obs.id)} className="text-gray-300 hover:text-red-500 mt-0.5">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/*Add Observation*/}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl text-gray-800">Add Observation</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Observation Notes</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Describe your observation…"
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
                {submitting ? "Saving…" : "Save Observation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
