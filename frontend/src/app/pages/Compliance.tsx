import { useEffect, useState } from "react";
import { api } from "../../services/api";

interface Stats {
  totalLearners: number;
  atRiskLearners: number;
  passRate: number | null;
  totalEvidence: number;
  totalAssessments: number;
  overdueAssessments: number;
  evidenceByCategory: { category: string | null; count: number }[];
}

export default function Compliance() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Stats>('/dashboard/stats')
      .then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading compliance data…</div>;

  //Ofsted categories
  const OFSTED_CATEGORIES = ["Quality", "Safeguarding", "Performance", "Compliance", "Assessment", "Curriculum"];

  //Derive compliance scores
  const passRate = stats?.passRate ?? null;
  const retentionRate = stats && stats.totalLearners > 0
    ? Math.round(((stats.totalLearners - stats.atRiskLearners) / stats.totalLearners) * 100)
    : null;
  const coveredCategories = stats
    ? OFSTED_CATEGORIES.filter(cat => stats.evidenceByCategory.some(e => e.category === cat)).length
    : 0;
  const evidenceCoverage = stats
    ? Math.min(Math.round((coveredCategories / OFSTED_CATEGORIES.length) * 100), 100)
    : null;
  const assessmentCompletion = stats && stats.totalAssessments > 0
    ? Math.round(((stats.totalAssessments - stats.overdueAssessments) / stats.totalAssessments) * 100)
    : null;

  const grade = (score: number | null) => {
    if (score === null) return { label: "No Data", color: "text-gray-400" };
    if (score >= 90) return { label: "Outstanding", color: "text-green-700" };
    if (score >= 75) return { label: "Good", color: "text-green-600" };
    if (score >= 60) return { label: "Requires Improvement", color: "text-amber-600" };
    return { label: "Inadequate", color: "text-red-600" };
  };

  const areas = [
    {
      area: "Quality of Education",
      description: "Pass rate across all learner enrolments",
      score: passRate,
      detail: passRate != null ? `${passRate}% pass rate` : "No graded enrolments yet",
    },
    {
      area: "Behaviour & Attitudes",
      description: "Learner retention — proportion not flagged at risk",
      score: retentionRate,
      detail: retentionRate != null ? `${retentionRate}% retention (${stats!.atRiskLearners} at risk of ${stats!.totalLearners})` : "No learner data",
    },
    {
      area: "Personal Development",
      description: "Evidence coverage across Ofsted categories",
      score: evidenceCoverage,
      detail: evidenceCoverage != null ? `${coveredCategories} of ${OFSTED_CATEGORIES.length} categories covered` : "No evidence uploaded",
    },
    {
      area: "Leadership & Management",
      description: "Assessment delivery — assessments completed on time",
      score: assessmentCompletion,
      detail: assessmentCompletion != null
        ? `${assessmentCompletion}% on time (${stats!.overdueAssessments} overdue of ${stats!.totalAssessments})`
        : "No assessments configured",
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl text-gray-800">Compliance Review</h1>
        <p className="text-gray-600 mt-1">Ofsted inspection framework|live data from Clarity</p>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
        <h2 className="text-lg text-gray-800 mb-6">Compliance Areas</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-teal-600 text-white">
                <th className="px-4 py-3 text-left">Area</th>
                <th className="px-4 py-3 text-left">Source Metric</th>
                <th className="px-4 py-3 text-center">Score</th>
                <th className="px-4 py-3 text-left">Grade</th>
              </tr>
            </thead>
            <tbody>
              {areas.map((area, i) => {
                const g = grade(area.score);
                return (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3">
                      <p className="text-gray-800 font-medium">{area.area}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{area.description}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{area.detail}</td>
                    <td className="px-4 py-3 text-center text-gray-700 font-medium">
                      {area.score != null ? `${area.score}%` : "—"}
                    </td>
                    <td className={`px-4 py-3 font-medium ${g.color}`}>{g.label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/*Summary stats*/}
      <div className="grid grid-cols-4 gap-6">
        {[
          { label: "Total Learners",       value: stats?.totalLearners ?? "—",      color: "text-teal-600" },
          { label: "At Risk",              value: stats?.atRiskLearners ?? "—",     color: "text-amber-600" },
          { label: "Pass Rate",            value: passRate != null ? `${passRate}%` : "—", color: "text-green-600" },
          { label: "Evidence Items",       value: stats?.totalEvidence ?? "—",      color: "text-blue-600" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg p-5 shadow-sm text-center">
            <div className={`text-3xl mb-1 ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-600">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
