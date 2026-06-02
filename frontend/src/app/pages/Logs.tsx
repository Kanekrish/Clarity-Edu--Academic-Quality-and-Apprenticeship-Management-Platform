import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { api } from "../../services/api";

interface LogEntry {
  id: number;
  actor_name: string;
  action: string;
  type: "info" | "warning" | "success";
  detail: string | null;
  created_at: string;
}

const TYPE_STYLES: Record<string, string> = {
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  info:    "bg-blue-100 text-blue-700",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" });
}

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "info" | "warning" | "success">("all");

  const load = () => {
    setLoading(true);
    api.get<LogEntry[]>('/logs?limit=200')
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? logs : logs.filter(l => l.type === filter);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl text-gray-800">System Logs</h1>
          <p className="text-gray-600 mt-1">Live audit trail of all system activity</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg text-gray-800">
            Recent Activity {!loading && <span className="text-sm text-gray-500 ml-2">({filtered.length} entries)</span>}
          </h2>
          <div className="flex gap-2">
            {(["all", "success", "warning", "info"] as const).map(t => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                  filter === t ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400 py-8 text-center">Loading logs…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">
            {logs.length === 0 ? "No activity recorded yet." : "No entries match this filter."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-teal-600 text-white">
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-left">Detail</th>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">Type</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => (
                  <tr key={log.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 text-gray-700 text-sm whitespace-nowrap">{log.actor_name}</td>
                    <td className="px-4 py-3 text-gray-700 text-sm">{log.action}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{log.detail ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(log.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs capitalize ${TYPE_STYLES[log.type] ?? TYPE_STYLES.info}`}>
                        {log.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
