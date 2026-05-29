import { FileUp, Search, Filter, X, File, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { api } from "../../services/api";

interface EvidenceItem {
  id: number;
  title: string;
  category: string | null;
  file_path: string | null;
  uploaded_at: string;
  uploaded_by_name: string | null;
}

const categories = [
  { name: "Governance",   color: "text-teal-600 bg-teal-50" },
  { name: "Quality",      color: "text-blue-600 bg-blue-50" },
  { name: "Employer",     color: "text-purple-600 bg-purple-50" },
  { name: "Feedback",     color: "text-pink-600 bg-pink-50" },
  { name: "Action Plan",  color: "text-indigo-600 bg-indigo-50" },
  { name: "Self-Assess",  color: "text-cyan-600 bg-cyan-50" },
];

export default function Evidence() {
  const [evidenceData, setEvidenceData] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formError, setFormError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchEvidence = () =>
    api.get<EvidenceItem[]>('/evidence')
      .then(setEvidenceData)
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { fetchEvidence(); }, []);

  const filteredData = evidenceData.filter(item => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleSaveEvidence = async () => {
    if (!newTitle.trim()) { setFormError("Title is required"); return; }
    setSaving(true); setFormError("");
    try {
      const formData = new FormData();
      formData.append("title", newTitle.trim());
      if (newCategory) formData.append("category", newCategory);
      if (selectedFile) formData.append("file", selectedFile);
      await api.upload('/evidence', formData);
      setNewTitle(""); setNewCategory(""); setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchEvidence();
    } catch (err: any) {
      setFormError(err.message || "Failed to save evidence");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this evidence item?")) return;
    try {
      await api.del(`/evidence/${id}`);
      setEvidenceData(prev => prev.filter(e => e.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete");
    }
  };

  const categoriesWithEvidence = new Set(evidenceData.map(e => e.category).filter(Boolean));
  const compliancePct = categories.length > 0
    ? Math.round((categoriesWithEvidence.size / categories.length) * 100)
    : 0;

  return (
    <div className="p-6">
      <h1 className="text-3xl mb-6 text-gray-800">Evidence Log</h1>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/*Log New Evidence*/}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg mb-6 text-gray-800">Log New Evidence</h2>

          <div className="space-y-4 mb-6">
            {formError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{formError}</p>
            )}
            <div>
              <label className="block text-sm text-gray-600 mb-2">Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">Category</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select category…</option>
                {categories.map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-4">
              <button
                className="flex-1 bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp className="w-5 h-5" />
                Attach File
              </button>
              <button
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                onClick={handleSaveEvidence}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
            />

            {selectedFile && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <File className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-800 flex-1">{selectedFile.name}</span>
                <span className="text-xs text-green-600">{(selectedFile.size / 1024).toFixed(2)} KB</span>
                <button
                  onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/*Evidence Library*/}
        <div className="bg-white rounded-lg p-6 shadow-sm flex flex-col">
          <h2 className="text-lg mb-6 text-gray-800">Evidence Library</h2>

          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search evidence…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Filter className="w-4 h-4" />
                Filter by Category
              </label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="text-sm text-gray-600">
              Showing {filteredData.length} of {evidenceData.length} evidence items
            </div>
          </div>

          <div className="flex-1 overflow-x-auto max-h-96 overflow-y-auto mb-6">
            <table className="w-full">
              <thead className="sticky top-0 bg-teal-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Uploaded By</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">Loading…</td></tr>
                ) : filteredData.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-sm">
                    {evidenceData.length === 0 ? "No evidence items yet. Upload the first one." : "No items match your search."}
                  </td></tr>
                ) : filteredData.map((row, index) => (
                  <tr key={row.id} className={index % 2 === 0 ? "bg-white hover:bg-gray-100" : "bg-gray-50 hover:bg-gray-100"}>
                    <td className="px-4 py-3 text-gray-700">{row.title}</td>
                    <td className="px-4 py-3">
                      {row.category ? (
                        <span className={`px-2 py-1 rounded text-xs ${categories.find(c => c.name === row.category)?.color ?? "text-gray-600 bg-gray-100"}`}>
                          {row.category}
                        </span>
                      ) : <span className="text-gray-400 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-sm">{row.uploaded_at?.split('T')[0] ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{row.uploaded_by_name ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(row.id)} className="text-red-500 hover:text-red-700" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-base mb-3 text-gray-800">Compliance Readiness</h3>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 transition-all" style={{ width: `${compliancePct}%` }} />
            </div>
            <p className="text-sm text-teal-600 mt-2">
              {compliancePct}% category coverage ({categoriesWithEvidence.size} of {categories.length} categories)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
