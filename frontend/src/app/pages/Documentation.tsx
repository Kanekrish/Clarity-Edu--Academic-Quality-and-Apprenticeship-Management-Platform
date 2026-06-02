import { useEffect, useState } from "react";
import { FileText, Download } from "lucide-react";
import { api } from "../../services/api";

interface EvidenceDoc {
  id: number;
  title: string;
  category: string | null;
  file_path: string | null;
  uploaded_at: string;
  uploaded_by_name: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Quality":      "bg-teal-100 text-teal-700",
  "Safeguarding": "bg-red-100 text-red-700",
  "Performance":  "bg-blue-100 text-blue-700",
  "Compliance":   "bg-purple-100 text-purple-700",
  "Assessment":   "bg-amber-100 text-amber-700",
  "Curriculum":   "bg-green-100 text-green-700",
};

export default function Documentation() {
  const [docs, setDocs] = useState<EvidenceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    api.get<EvidenceDoc[]>('/evidence')
      .then(setDocs).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleDownload = async (doc: EvidenceDoc) => {
    const BASE = import.meta.env.VITE_API_BASE_URL || '/api';
    const token = localStorage.getItem('authToken');
    try {
      const res = await fetch(`${BASE}/evidence/file/${doc.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.title;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  const categories = ["All", ...Array.from(new Set(docs.map(d => d.category ?? "Uncategorised")))];
  const filtered = filter === "All" ? docs : docs.filter(d => (d.category ?? "Uncategorised") === filter);

  const badgeClass = (cat: string | null) =>
    CATEGORY_COLORS[cat ?? ""] ?? "bg-gray-100 text-gray-700";

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading documents…</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl text-gray-800">Documentation Library</h1>
        <p className="text-gray-600 mt-1">Read-only view of all uploaded evidence and documents</p>
      </div>

      {/*Summary*/}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg p-5 shadow-sm text-center">
          <div className="text-3xl text-teal-600 mb-1">{docs.length}</div>
          <div className="text-sm text-gray-600">Total Documents</div>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm text-center">
          <div className="text-3xl text-blue-600 mb-1">{categories.length - 1}</div>
          <div className="text-sm text-gray-600">Categories</div>
        </div>
        <div className="bg-white rounded-lg p-5 shadow-sm text-center">
          <div className="text-3xl text-green-600 mb-1">{docs.length > 0 ? docs[0].uploaded_at?.split('T')[0] : "—"}</div>
          <div className="text-sm text-gray-600">Most Recent Upload</div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg text-gray-800">Available Documents (Read-Only)</h2>
            <p className="text-sm text-gray-500 mt-1">{filtered.length} document{filtered.length !== 1 ? "s" : ""} shown</p>
          </div>
          {/*Category filter*/}
          <div className="flex gap-2 flex-wrap justify-end">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filter === c ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            {docs.length === 0 ? "No documents uploaded yet." : "No documents in this category."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map(doc => (
              <div key={doc.id} className="p-4 border border-gray-200 rounded-lg hover:border-teal-400 transition-colors">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="bg-gray-50 p-2 rounded-lg flex-shrink-0">
                      <FileText className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 font-medium truncate">{doc.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {doc.uploaded_at?.split('T')[0]}
                        {doc.uploaded_by_name ? ` · ${doc.uploaded_by_name}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-1 rounded ${badgeClass(doc.category)}`}>
                      {doc.category ?? "Uncategorised"}
                    </span>
                    {doc.file_path && (
                      <button
                        onClick={() => handleDownload(doc)}
                        className="text-teal-600 hover:text-teal-700"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This is a read-only view. Documents are uploaded via the Evidence section by authorised staff.
        </p>
      </div>
    </div>
  );
}
