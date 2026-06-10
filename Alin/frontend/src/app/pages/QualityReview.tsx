import { useEffect, useState } from "react";
import { CheckCircle, AlertTriangle, TrendingUp } from "lucide-react";
import { api } from "../../services/api";

interface Stats {
  totalLearners: number;
  atRiskLearners: number;
  passRate: number | null;
  totalEvidence: number;
  totalFeedback: number;
  totalAssessments: number;
  overdueAssessments: number;
  evidenceByCategory: { category: string | null; count: number }[];
}

interface Finding {
  text: string;
  metric: string;
}

export default function QualityReview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Stats>('/dashboard/stats')
      .then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading quality review…</div>;

  const passRate = stats?.passRate ?? null;
  const atRisk = stats?.atRiskLearners ?? 0;
  const total = stats?.totalLearners ?? 0;
  const retentionPct = total > 0 ? Math.round(((total - atRisk) / total) * 100) : null;
  const evidenceCount = stats?.totalEvidence ?? 0;
  const feedbackCount = stats?.totalFeedback ?? 0;
  const overdueCount = stats?.overdueAssessments ?? 0;
  const totalAssessments = stats?.totalAssessments ?? 0;
  const categoriesCount = stats?.evidenceByCategory.length ?? 0;

  // Derive strengths and improvements
  const strengths: Finding[] = [];
  const improvements: Finding[] = [];

  if (passRate != null) {
    if (passRate >= 75) strengths.push({ text: `Strong learner achievement with a ${passRate}% pass rate`, metric: `Pass rate: ${passRate}%` });
    else improvements.push({ text: `Pass rate of ${passRate}% is below the 75% threshold and requires attention`, metric: `Pass rate: ${passRate}%` });
  }

  if (retentionPct != null) {
    if (retentionPct >= 85) strengths.push({ text: `High learner retention at ${retentionPct}% — only ${atRisk} learner${atRisk !== 1 ? "s" : ""} flagged at risk`, metric: `Retention: ${retentionPct}%` });
    else improvements.push({ text: `${atRisk} of ${total} learners are at risk — targeted intervention is needed`, metric: `At-risk: ${atRisk} learners` });
  }

  if (evidenceCount > 0) {
    if (categoriesCount >= 4) strengths.push({ text: `Good evidence base with ${evidenceCount} item${evidenceCount !== 1 ? "s" : ""} across ${categoriesCount} categories`, metric: `${evidenceCount} evidence items` });
    else improvements.push({ text: `Evidence coverage is limited to ${categoriesCount} categor${categoriesCount !== 1 ? "ies" : "y"} — broader documentation recommended`, metric: `${categoriesCount} categories covered` });
  } else {
    improvements.push({ text: "No evidence items have been uploaded — this is a key inspection requirement", metric: "0 evidence items" });
  }

  if (feedbackCount > 0) {
    strengths.push({ text: `Employer and mentor feedback is being collected (${feedbackCount} record${feedbackCount !== 1 ? "s" : ""})`, metric: `${feedbackCount} feedback records` });
  } else {
    improvements.push({ text: "No employer or mentor feedback recorded — this is important for Ofsted inspection", metric: "0 feedback records" });
  }

  if (totalAssessments > 0) {
    if (overdueCount === 0) strengths.push({ text: "All assessments are being managed with no overdue items", metric: `${totalAssessments} assessments, 0 overdue` });
    else improvements.push({ text: `${overdueCount} overdue assessment${overdueCount !== 1 ? "s" : ""} require immediate attention`, metric: `${overdueCount} overdue of ${totalAssessments}` });
  }

  // Fallback if no data at all
  if (strengths.length === 0 && improvements.length === 0) {
    improvements.push({ text: "Insufficient data to generate a quality review — please add learners, evidence and assessments", metric: "No data" });
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl text-gray-800">Quality Review</h1>
        <p className="text-gray-600 mt-1">Strengths and improvement areas derived from live Clarity data</p>
      </div>

      {/*KPI summary*/}
      <div className="grid grid-cols-4 gap-6 mb-6">
        {[
          { label: "Pass Rate",         value: passRate != null ? `${passRate}%` : "—",     color: "text-teal-600" },
          { label: "Retention",         value: retentionPct != null ? `${retentionPct}%` : "—", color: "text-green-600" },
          { label: "Evidence Items",    value: evidenceCount,                                color: "text-blue-600" },
          { label: "Feedback Records",  value: feedbackCount,                                color: "text-purple-600" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg p-5 shadow-sm text-center">
            <div className={`text-3xl mb-1 ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-600">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/*Strengths*/}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h2 className="text-lg text-gray-800">Strengths Identified</h2>
          </div>
          {strengths.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No strengths identified yet — add more data to the system.</p>
          ) : (
            <div className="space-y-3">
              {strengths.map((s, i) => (
                <div key={i} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">{s.text}</p>
                  <p className="text-xs text-green-600 mt-1 font-medium">{s.metric}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/*Areas for improvement*/}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg text-gray-800">Areas for Improvement</h2>
          </div>
          {improvements.length === 0 ? (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <p className="text-sm text-green-800">No significant improvement areas identified — all metrics are within acceptable ranges.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {improvements.map((s, i) => (
                <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">{s.text}</p>
                  <p className="text-xs text-amber-600 mt-1 font-medium">{s.metric}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
