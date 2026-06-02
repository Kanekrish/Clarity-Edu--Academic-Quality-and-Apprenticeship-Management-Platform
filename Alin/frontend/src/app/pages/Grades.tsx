import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { api } from "../../services/api";

interface Module {
  id: number;
  code: string;
  title: string;
}

interface StudentRecord {
  student_id: string;
  name: string;
  grade: string | null;
  grade_status: string;
  at_risk: number;
}

interface ImportResult {
  message: string;
  imported: number;
  errors: { row: any; reason: string }[];
}

export default function Grades() {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [studentData, setStudentData] = useState<StudentRecord[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load modules on mount
  useEffect(() => {
    api.get<Module[]>('/modules').then(setModules).catch(() => {});
  }, []);

  // Load grade overview when module changes
  useEffect(() => {
    if (!selectedModuleId) { setStudentData([]); return; }
    setLoadingOverview(true);
    api.get<StudentRecord[]>(`/grades/overview/${selectedModuleId}`)
      .then(setStudentData)
      .catch(() => setStudentData([]))
      .finally(() => setLoadingOverview(false));
  }, [selectedModuleId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setImporting(true);
    setImportResult(null);
    setError("");
    try {
      const formData = new FormData();
      formData.append('gradeFile', selectedFile);
      const result = await api.upload<ImportResult>('/grades/import', formData);
      setImportResult(result);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      // Refresh overview for selected module
      if (selectedModuleId) {
        const overview = await api.get<StudentRecord[]>(`/grades/overview/${selectedModuleId}`);
        setStudentData(overview);
      }
    } catch (err: any) {
      setError(err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const statusLabel = (record: StudentRecord) => {
    if (record.at_risk) return { label: "At Risk", color: "text-amber-600" };
    if (!record.grade) return { label: "Pending", color: "text-gray-500" };
    const g = parseFloat(record.grade);
    if (g < 40) return { label: "Failed", color: "text-red-600" };
    return { label: "On Track", color: "text-green-600" };
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl mb-6 text-gray-800">Grade Import & Student Overview</h1>

      <div className="grid grid-cols-2 gap-6">
        {/*Upload Grades*/}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg mb-6 text-gray-800">Upload Grades</h2>

          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center mb-6 cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-colors"
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Drop CSV/Excel file here</p>
            <p className="text-sm text-gray-400">or click to browse</p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".csv,.xlsx,.xls"
          />

          {selectedFile && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <File className="w-6 h-6 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm text-blue-800 font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-blue-600">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={!selectedFile || importing}
            className={`w-full px-6 py-3 rounded-lg transition-colors mb-6 ${
              selectedFile && !importing
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {importing ? "Importing..." : "Import Grades"}
          </button>

          {importResult && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-800 font-medium">{importResult.message}</span>
              </div>
              <p className="text-sm text-green-700">✓ {importResult.imported} records imported</p>
              {importResult.errors.map((e, i) => (
                <p key={i} className="text-sm text-red-600">✗ {e.reason} — {JSON.stringify(e.row)}</p>
              ))}
            </div>
          )}
        </div>

        {/*Student Overview*/}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg mb-4 text-gray-800">Student Overview</h2>

          <div className="mb-6">
            <label className="block text-sm text-gray-600 mb-2">Select Module</label>
            <select
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Select module to view grades…</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>{m.code} — {m.title}</option>
              ))}
            </select>
          </div>

          {loadingOverview ? (
            <p className="text-sm text-gray-500 text-center py-8">Loading…</p>
          ) : studentData.length === 0 && selectedModuleId ? (
            <p className="text-sm text-gray-500 text-center py-8">No grades recorded for this module yet.</p>
          ) : studentData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Select a module above to view student grades.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-teal-600 text-white">
                    <th className="px-4 py-3 text-left">Student ID</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Grade</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {studentData.map((s, i) => {
                    const st = statusLabel(s);
                    return (
                      <tr key={s.student_id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-3 text-gray-700">{s.student_id}</td>
                        <td className="px-4 py-3 text-gray-700">{s.name}</td>
                        <td className="px-4 py-3 text-gray-700">{s.grade ?? "—"}</td>
                        <td className={`px-4 py-3 ${st.color}`}>{st.label}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-2 mt-4 text-sm">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-600"></div><span className="text-gray-600">On Track</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-600"></div><span className="text-gray-600">At Risk</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-600"></div><span className="text-gray-600">Failed</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
