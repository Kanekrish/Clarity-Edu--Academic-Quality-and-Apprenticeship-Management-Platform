import { useEffect, useState } from "react";
import { TrendingUp, Calendar } from "lucide-react";
import { api } from "../../services/api";

interface Learner {
  id: number;
  name: string;
  student_id: string;
  email: string | null;
  enrolled_at: string | null;
  employer_name: string | null;
  total_modules: number;
  graded_modules: number;
  at_risk: number;
}

export default function Apprentices() {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Learner[]>('/learners')
      .then(setLearners)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const progress = (l: Learner) =>
    l.total_modules > 0 ? Math.round((l.graded_modules / l.total_modules) * 100) : 0;

  const avgProgress = learners.length > 0
    ? Math.round(learners.reduce((sum, l) => sum + progress(l), 0) / learners.length)
    : 0;

  const onTrack = learners.filter(l => !l.at_risk).length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl text-gray-800">My Apprentices</h1>
        <p className="text-gray-600 mt-1">Monitor your workplace apprentices</p>
      </div>

      {/*Summary Cards*/}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
          <div className="text-3xl text-teal-600 mb-2">{loading ? "—" : learners.length}</div>
          <div className="text-sm text-gray-600">Total Apprentices</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
          <div className="text-3xl text-green-600 mb-2">{loading ? "—" : onTrack}</div>
          <div className="text-sm text-gray-600">On Track</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
          <div className="text-3xl text-blue-600 mb-2">{loading ? "—" : `${avgProgress}%`}</div>
          <div className="text-sm text-gray-600">Avg Progress</div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg text-gray-800">Apprentice Overview</h2>
          <span className="text-sm text-gray-500">{learners.length} apprentice{learners.length !== 1 ? "s" : ""}</span>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-8">Loading…</p>
        ) : learners.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No learners in the database yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {learners.map((learner) => {
              const prog = progress(learner);
              const isAtRisk = !!learner.at_risk;
              return (
                <div key={learner.id} className="p-4 border border-gray-200 rounded-lg hover:border-teal-500 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-gray-800 font-medium">{learner.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${isAtRisk ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                          {isAtRisk ? "At Risk" : "On Track"}
                        </span>
                        <span className="text-xs font-mono px-2 py-1 bg-gray-100 text-gray-600 rounded">{learner.student_id}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3 text-sm text-gray-600">
                        {learner.enrolled_at && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>Enrolled: {learner.enrolled_at}</span>
                          </div>
                        )}
                        {learner.employer_name && (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-gray-400" />
                            <span>{learner.employer_name}</span>
                          </div>
                        )}
                        {learner.email && (
                          <div className="text-xs text-gray-500">{learner.email}</div>
                        )}
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Programme Progress</span>
                          <span>{prog}% ({learner.graded_modules}/{learner.total_modules} modules)</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${prog >= 70 ? "bg-green-500" : prog >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                            style={{ width: `${prog}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
