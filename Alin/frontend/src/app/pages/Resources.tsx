import { useEffect, useState } from "react";
import { BookOpen, ClipboardList, Map, FileText, Users } from "lucide-react";
import { api } from "../../services/api";

interface ResourceCounts {
  modules: number;
  assessments: number;
  ksbMappings: number;
  evidence: number;
  learners: number;
}

export default function Resources() {
  const [counts, setCounts] = useState<ResourceCounts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ resourceCounts: ResourceCounts }>('/dashboard/programme-leader')
      .then(d => setCounts(d.resourceCounts))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const teaching = [
    { label: "Modules", value: counts?.modules, icon: BookOpen, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Assessments", value: counts?.assessments, icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "KSB Mappings", value: counts?.ksbMappings, icon: Map, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  const learnerResources = [
    { label: "Evidence Items", value: counts?.evidence, icon: FileText, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Enrolled Learners", value: counts?.learners, icon: Users, color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl text-gray-800">Programme Resources</h1>
        <p className="text-gray-600 mt-1">Live resource counts from the database</p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading resources…</p>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg text-gray-700 mb-3">Teaching &amp; Assessment</h2>
            <div className="grid grid-cols-3 gap-6">
              {teaching.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="bg-white rounded-lg p-6 shadow-sm flex items-start gap-4">
                    <div className={`${item.bg} p-3 rounded-lg`}>
                      <Icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div>
                      <div className="text-3xl text-gray-800">{item.value ?? "—"}</div>
                      <div className="text-sm text-gray-600 mt-1">{item.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-lg text-gray-700 mb-3">Learner Resources</h2>
            <div className="grid grid-cols-3 gap-6">
              {learnerResources.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="bg-white rounded-lg p-6 shadow-sm flex items-start gap-4">
                    <div className={`${item.bg} p-3 rounded-lg`}>
                      <Icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div>
                      <div className="text-3xl text-gray-800">{item.value ?? "—"}</div>
                      <div className="text-sm text-gray-600 mt-1">{item.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
