import { FileDown, Plus, X } from "lucide-react";
import ExcelJS from "exceljs";
import { useEffect, useState } from "react";
import { api } from "../../services/api";

interface PLData {
  kpis: { totalLearners: number; passRate: number | null; atRiskLearners: number; retention: number | null };
  moduleStats: { id: number; code: string; title: string; level: number | null; learner_count: number; assessment_count: number; at_risk_count: number; avg_grade: number | null }[];
  staffList: { id: number; name: string; role: string; email: string; assessment_count: number }[];
  feedbackByRole: { category: string | null; count: number }[];
  evidenceByCategory: { category: string | null; count: number }[];
  resourceCounts: { modules: number; assessments: number; ksbMappings: number; evidence: number; learners: number };
  assessmentCompletionRate: number | null;
  overdueAssessments: number;
}

const REPORT_TEMPLATES = [
  { title: "Self-Assessment Report",         type: "Quality" },
  { title: "Quality Improvement Plan",       type: "Quality" },
  { title: "Monthly Performance Report",     type: "Performance" },
  { title: "Student Achievement Data",       type: "Academic" },
  { title: "Apprenticeship Progress Report", type: "Apprenticeship" },
  { title: "KSB Coverage Analysis",          type: "Academic" },
  { title: "Staff Overview Report",          type: "HR" },
  { title: "Ofsted Readiness Report",        type: "Compliance" },
];

const reportTypes = ["Quality", "Performance", "Academic", "Apprenticeship", "HR", "Compliance", "Financial"];

async function downloadWorkbook(workbook: ExcelJS.Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function buildSheet(
  wb: ExcelJS.Workbook,
  report: { title: string; type: string },
  d: PLData | null,
  today: string
) {
  const ws = wb.addWorksheet(report.title.substring(0, 30));

  let rows: (string | number | null)[][] = [
    [report.title],
    ["Date Generated:", today],
    ["Report Type:", report.type],
    [],
  ];

  if (report.type === "Academic" || report.title.includes("KSB") || report.title.includes("Achievement")) {
    rows = rows.concat([
      ["Programme KPIs"],
      ["Total Learners", d?.kpis.totalLearners ?? "—"],
      ["Pass Rate (%)", d?.kpis.passRate ?? "—"],
      ["Retention (%)", d?.kpis.retention ?? "—"],
      ["At-Risk Learners", d?.kpis.atRiskLearners ?? "—"],
      [],
      ["Module", "Level", "Learners", "Assessments", "At Risk", "Avg Grade (%)"],
      ...(d?.moduleStats.map(m => [m.code + " – " + m.title, m.level ?? "—", m.learner_count, m.assessment_count, m.at_risk_count, m.avg_grade ?? "—"]) ?? []),
    ]);
  } else if (report.type === "HR" || report.title.includes("Staff")) {
    rows = rows.concat([
      ["Staff Overview"],
      ["Name", "Role", "Email", "Assessments"],
      ...(d?.staffList.map(s => [s.name, s.role.replace(/_/g, " "), s.email, s.assessment_count]) ?? []),
    ]);
  } else if (report.type === "Compliance" || report.type === "Quality") {
    rows = rows.concat([
      ["Quality & Compliance Metrics"],
      ["Pass Rate (%)", d?.kpis.passRate ?? "—"],
      ["Assessment Completion (%)", d?.assessmentCompletionRate ?? "—"],
      ["Overdue Assessments", d?.overdueAssessments ?? "—"],
      [],
      ["Evidence by Category"],
      ["Category", "Count"],
      ...(d?.evidenceByCategory.map(e => [e.category ?? "Uncategorised", e.count]) ?? []),
      [],
      ["Resource Counts"],
      ["Modules", d?.resourceCounts.modules ?? "—"],
      ["Assessments", d?.resourceCounts.assessments ?? "—"],
      ["KSB Mappings", d?.resourceCounts.ksbMappings ?? "—"],
      ["Evidence Items", d?.resourceCounts.evidence ?? "—"],
      ["Learners", d?.resourceCounts.learners ?? "—"],
    ]);
  } else if (report.type === "Performance" || report.type === "Apprenticeship") {
    rows = rows.concat([
      ["Performance Summary"],
      ["Total Learners", d?.kpis.totalLearners ?? "—"],
      ["Pass Rate (%)", d?.kpis.passRate ?? "—"],
      ["At-Risk Learners", d?.kpis.atRiskLearners ?? "—"],
      ["Assessment Completion (%)", d?.assessmentCompletionRate ?? "—"],
      [],
      ["Feedback by Source"],
      ["Role", "Count"],
      ...(d?.feedbackByRole.map(f => [f.category?.replace(/_/g, " ") ?? "Unknown", f.count]) ?? []),
    ]);
  } else {
    rows = rows.concat([
      ["Total Learners", d?.kpis.totalLearners ?? "—"],
      ["Pass Rate (%)", d?.kpis.passRate ?? "—"],
      ["At-Risk Learners", d?.kpis.atRiskLearners ?? "—"],
    ]);
  }

  ws.addRows(rows);
  [35, 20, 15, 15, 12, 15].forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });
}

export default function Reports() {
  const [dbData, setDbData] = useState<PLData | null>(null);
  const [customReports, setCustomReports] = useState<{ title: string; type: string; date: string }[]>([]);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [newReport, setNewReport] = useState({ title: "", type: "Quality" });

  useEffect(() => {
    api.get<PLData>("/dashboard/programme-leader").then(setDbData).catch(() => {});
  }, []);

  const allReports = [
    ...REPORT_TEMPLATES.map(r => ({
      ...r,
      date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      status: "Ready",
    })),
    ...customReports.map(r => ({ ...r, status: "Ready" })),
  ];

  const handleExportSingle = async (report: typeof allReports[0]) => {
    const wb = new ExcelJS.Workbook();
    buildSheet(wb, report, dbData, new Date().toLocaleDateString("en-GB"));
    await downloadWorkbook(wb, `${report.title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleExportAll = async () => {
    const wb = new ExcelJS.Workbook();
    const today = new Date().toLocaleDateString("en-GB");

    const summaryWs = wb.addWorksheet("Summary");
    summaryWs.addRows([
      ["Clarity — Reports Summary"],
      ["Generated:", today],
      [],
      ["Report Title", "Type"],
      ...allReports.map(r => [r.title, r.type]),
    ]);
    summaryWs.getColumn(1).width = 38;
    summaryWs.getColumn(2).width = 18;

    allReports.forEach(r => buildSheet(wb, r, dbData, today));

    await downloadWorkbook(wb, `Clarity_Reports_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleGenerateNewReport = () => {
    if (!newReport.title.trim()) { alert("Please enter a report title"); return; }
    setCustomReports([
      { title: newReport.title, type: newReport.type, date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) },
      ...customReports,
    ]);
    setIsGenerateModalOpen(false);
    setNewReport({ title: "", type: "Quality" });
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl mb-6 text-gray-800">Reports</h1>
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg text-gray-800">Available Reports</h2>
            <p className="text-sm text-gray-600 mt-1">{allReports.length} reports — data pulled live from database</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportAll}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              Export All (Excel)
            </button>
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Generate New Report
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {allReports.map((report, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-teal-500 transition-colors">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="text-gray-800">{report.title}</p>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">{report.type}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">Export includes live data from database</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">{report.status}</span>
                  <button
                    onClick={() => handleExportSingle(report)}
                    className="px-3 py-1.5 bg-teal-600 text-white rounded text-sm hover:bg-teal-700 transition-colors flex items-center gap-1"
                  >
                    <FileDown className="w-3 h-3" />
                    Export
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isGenerateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg text-gray-800">Generate New Report</h2>
              <button onClick={() => setIsGenerateModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Report Title</label>
                <input
                  type="text"
                  value={newReport.title}
                  onChange={e => setNewReport({ ...newReport, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Report Type</label>
                <select
                  value={newReport.type}
                  onChange={e => setNewReport({ ...newReport, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-teal-500"
                >
                  {reportTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleGenerateNewReport}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
