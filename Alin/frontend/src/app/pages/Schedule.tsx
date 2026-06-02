import { useState, useEffect, useMemo } from "react";
import { FileDown, AlertCircle, Trash2 } from "lucide-react";
import { api } from "../../services/api";

interface Module {
  id: number;
  code: string;
  title: string;
  credits: number | null;
  level: number | null;
}

interface ScheduleRow {
  id: number;
  module_id: number;
  week_number: number;
  session_date: string;
  topic: string;
  academic_year: string;
}

const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function inPeriod(date: Date, start: string, end: string): boolean {
  if (!start || !end) return false;
  return date >= new Date(start) && date <= new Date(end);
}

export default function Schedule() {
  const [modules, setModules] = useState<Module[]>([]);
  const [allSchedules, setAllSchedules] = useState<ScheduleRow[]>([]);
  const [generating, setGenerating] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isFromDb, setIsFromDb] = useState(false);

  const [config, setConfig] = useState({
    academicYear: "",
    semesterStart: "",
    semesterEnd: "",
    christmasStart: "",
    christmasEnd: "",
    easterStart: "",
    easterEnd: "",
    readingWeek1Start: "",
    readingWeek1End: "",
    readingWeek2Start: "",
    readingWeek2End: "",
  });

  const [selectedModuleId, setSelectedModuleId] = useState("all");

  const fetchAllSchedules = (year: string, markAsDb = false) =>
    api.get<ScheduleRow[]>(`/schedules?academicYear=${encodeURIComponent(year)}`)
      .then(rows => { setAllSchedules(rows); if (markAsDb) setIsFromDb(rows.length > 0); })
      .catch(() => {});

  useEffect(() => {
    api.get<Module[]>('/modules').then(setModules).catch(() => {});
  }, []);

  useEffect(() => {
    fetchAllSchedules(config.academicYear, true); 
  }, [config.academicYear]);

  const handleInputChange = (field: string, value: string) =>
    setConfig(prev => ({ ...prev, [field]: value }));

  const handleGenerate = async () => {
    if (!config.semesterStart || !config.semesterEnd) { setError("Semester start and end dates are required"); return; }
    setGenerating(true); setError(""); setSuccess("");
    try {
      const result = await api.post<{ message: string; count: number; moduleCount?: number }>('/schedules/generate', {
        moduleId: selectedModuleId,
        academicYear: config.academicYear,
        semesterStart: config.semesterStart,
        semesterEnd: config.semesterEnd,
        christmasStart:    config.christmasStart    || undefined,
        christmasEnd:      config.christmasEnd      || undefined,
        easterStart:       config.easterStart       || undefined,
        easterEnd:         config.easterEnd         || undefined,
        readingWeek1Start: config.readingWeek1Start || undefined,
        readingWeek1End:   config.readingWeek1End   || undefined,
        readingWeek2Start: config.readingWeek2Start || undefined,
        readingWeek2End:   config.readingWeek2End   || undefined,
      });
      setSuccess(`${result.message} — ${result.count} sessions created`);
      setIsFromDb(false);
      await fetchAllSchedules(config.academicYear);
    } catch (err: any) {
      setError(err.message || "Generation failed");
    } finally { setGenerating(false); }
  };

  const handleClear = async () => {
    if (!confirm(`Clear all saved schedules for academic year "${config.academicYear}"${selectedModuleId !== "all" ? " for the selected module" : ""}? This cannot be undone.`)) return;
    setClearing(true); setError(""); setSuccess("");
    try {
      const params = new URLSearchParams({ academicYear: config.academicYear });
      if (selectedModuleId !== "all") params.set("moduleId", selectedModuleId);
      await api.del(`/schedules/clear?${params}`);
      setSuccess("Schedule cleared.");
      setIsFromDb(false);
      setAllSchedules([]);
    } catch (err: any) {
      setError(err.message || "Clear failed");
    } finally { setClearing(false); }
  };

  const handleExport = async () => {
    if (!config.semesterStart || !config.semesterEnd) {
      setError("Semester start and end dates are required for export");
      return;
    }
    setError("");
    try {
      const params = new URLSearchParams({
        academicYear:  config.academicYear,
        semesterStart: config.semesterStart,
        semesterEnd:   config.semesterEnd,
        ...(config.christmasStart    ? { christmasStart:    config.christmasStart    } : {}),
        ...(config.christmasEnd      ? { christmasEnd:      config.christmasEnd      } : {}),
        ...(config.easterStart       ? { easterStart:       config.easterStart       } : {}),
        ...(config.easterEnd         ? { easterEnd:         config.easterEnd         } : {}),
        ...(config.readingWeek1Start ? { readingWeek1Start: config.readingWeek1Start } : {}),
        ...(config.readingWeek1End   ? { readingWeek1End:   config.readingWeek1End   } : {}),
        ...(config.readingWeek2Start ? { readingWeek2Start: config.readingWeek2Start } : {}),
        ...(config.readingWeek2End   ? { readingWeek2End:   config.readingWeek2End   } : {}),
      });
      const token = localStorage.getItem("authToken");
      const resp = await fetch(`/api/schedules/export-gantt?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: resp.statusText }));
        throw new Error(err.error || "Export failed");
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Schedule_${config.academicYear.replace(/\//g, "-")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Export failed");
    }
  };

  // Gantt computed values
  const ganttWeeks = useMemo<Date[]>(() => {
    if (!config.semesterStart || !config.semesterEnd) return [];
    const weeks: Date[] = [];
    const cur = new Date(config.semesterStart);
    // Snap to nearest Monday
    const day = cur.getDay();
    if (day !== 1) cur.setDate(cur.getDate() + ((1 - day + 7) % 7));
    const end = new Date(config.semesterEnd);
    while (cur <= end) {
      weeks.push(new Date(cur));
      cur.setDate(cur.getDate() + 7);
    }
    return weeks;
  }, [config.semesterStart, config.semesterEnd]);

  const weekType = (d: Date): "christmas" | "easter" | "reading" | null => {
    if (inPeriod(d, config.christmasStart, config.christmasEnd)) return "christmas";
    if (inPeriod(d, config.easterStart,    config.easterEnd))    return "easter";
    if (inPeriod(d, config.readingWeek1Start, config.readingWeek1End)) return "reading";
    if (inPeriod(d, config.readingWeek2Start, config.readingWeek2End)) return "reading";
    return null;
  };

  // moduleId
  const sessionMap = useMemo<Record<number, Set<string>>>(() => {
    const map: Record<number, Set<string>> = {};
    for (const s of allSchedules) {
      if (!map[s.module_id]) map[s.module_id] = new Set();
      map[s.module_id].add(s.session_date);
    }
    return map;
  }, [allSchedules]);

  // Month groups for header
  const monthGroups = useMemo<{ label: string; count: number }[]>(() => {
    const groups: { label: string; count: number }[] = [];
    for (const w of ganttWeeks) {
      const label = `${MONTHS_FULL[w.getMonth()]} ${w.getFullYear()}`;
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.count++;
      else groups.push({ label, count: 1 });
    }
    return groups;
  }, [ganttWeeks]);

  // Group modules by level
  const levelGroups = useMemo<[string, Module[]][]>(() => {
    const map: Record<string, Module[]> = {};
    for (const m of modules) {
      const k = m.level != null ? String(m.level) : "Other";
      if (!map[k]) map[k] = [];
      map[k].push(m);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
  }, [modules]);

  const startMs = config.semesterStart ? new Date(config.semesterStart).getTime() : 0;

  const cellBg = (d: Date, hasSession: boolean, isAlt: boolean) => {
    const t = weekType(d);
    if (t === "christmas") return "bg-green-200";
    if (t === "easter")    return "bg-yellow-200";
    if (t === "reading")   return "bg-purple-100";
    if (hasSession)        return "bg-orange-400";
    return isAlt ? "bg-gray-50" : "bg-white";
  };

  const breakLabel = (d: Date) => {
    const t = weekType(d);
    if (t === "christmas") return "Xmas";
    if (t === "easter")    return "Easter";
    if (t === "reading")   return "RW";
    return null;
  };

  const showGantt = ganttWeeks.length > 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl text-gray-800">Module Delivery Schedule Generator</h1>
        <p className="text-gray-600 mt-1">Generate and view teaching schedules </p>
      </div>

      {/*Config Panel*/}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg mb-6 text-gray-800">Schedule Configuration</h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/*Module + Academic Year*/}
          <div>
            <label className="block text-sm text-gray-600 mb-2">Module to Generate</label>
            <select
              value={selectedModuleId}
              onChange={e => setSelectedModuleId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            >
              <option value="all"> All Modules</option>
              {modules.map(m => <option key={m.id} value={m.id}>{m.code} — {m.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Academic Year</label>
            <input
              type="text"
              value={config.academicYear}
              onChange={e => handleInputChange("academicYear", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              placeholder="2025/26"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Semester Start <span className="text-red-500">*</span></label>
            <input type="date" value={config.semesterStart} onChange={e => handleInputChange("semesterStart", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Semester End <span className="text-red-500">*</span></label>
            <input type="date" value={config.semesterEnd} onChange={e => handleInputChange("semesterEnd", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
          </div>

          {/*Christmas*/}
          <div>
            <label className="block text-sm text-gray-600 mb-2">Christmas Start</label>
            <input type="date" value={config.christmasStart} onChange={e => handleInputChange("christmasStart", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Christmas End</label>
            <input type="date" value={config.christmasEnd} onChange={e => handleInputChange("christmasEnd", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
          </div>

          {/*Easter*/}
          <div>
            <label className="block text-sm text-gray-600 mb-2">Easter Start</label>
            <input type="date" value={config.easterStart} onChange={e => handleInputChange("easterStart", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Easter End</label>
            <input type="date" value={config.easterEnd} onChange={e => handleInputChange("easterEnd", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
          </div>

          {/*Reading Week 1*/}
          <div>
            <label className="block text-sm text-gray-600 mb-2">Reading Week 1 Start</label>
            <input type="date" value={config.readingWeek1Start} onChange={e => handleInputChange("readingWeek1Start", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Reading Week 1 End</label>
            <input type="date" value={config.readingWeek1End} onChange={e => handleInputChange("readingWeek1End", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
          </div>

          {/*Reading Week 2*/}
          <div>
            <label className="block text-sm text-gray-600 mb-2">Reading Week 2 Start</label>
            <input type="date" value={config.readingWeek2Start} onChange={e => handleInputChange("readingWeek2Start", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-2">Reading Week 2 End</label>
            <input type="date" value={config.readingWeek2End} onChange={e => handleInputChange("readingWeek2End", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
          </div>
        </div>
      
      
        {error && (
          <div className="mt-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}
        {success && (
          <div className="mt-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">{success}</div>
        )}

        <div className="flex gap-4 mt-6 pt-4 border-t">
          <button
            onClick={handleGenerate}
            disabled={generating || clearing}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {generating ? "Generating…" : "Generate Schedule"}
          </button>
          <button
            onClick={handleClear}
            disabled={clearing || generating || allSchedules.length === 0}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {clearing ? "Clearing…" : "Clear Schedule"}
          </button>
          <button
            onClick={handleExport}
            disabled={!config.semesterStart || !config.semesterEnd}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            Export to Excel
          </button>
        </div>
      </div>

      {/* Gantt Preview*/}
      {!showGantt ? (
        <div className="bg-white rounded-lg p-8 shadow-sm text-center text-sm text-gray-400">
          Set semester start and end dates above to see the Gantt preview.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/*Title bar*/}
          <div className="bg-teal-700 text-white text-center font-bold text-base py-3 flex items-center justify-center gap-3">
            Cohort Academic Year {config.academicYear}
            {isFromDb && allSchedules.length > 0 && (
              <span className="text-xs font-normal bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full">
                Loaded from database
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="border-collapse text-xs" style={{ minWidth: `${(ganttWeeks.length * 28) + 400}px` }}>
              {/* Month header*/}
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 bg-teal-700 text-white border border-teal-600 px-2 py-1 text-left whitespace-nowrap" style={{ minWidth: 100 }}>Module Code</th>
                  <th className="sticky bg-teal-700 text-white border border-teal-600 px-2 py-1 text-left whitespace-nowrap" style={{ left: 100, minWidth: 220, zIndex: 20 }}>Module Name</th>
                  <th className="bg-teal-700 text-white border border-teal-600 px-2 py-1 text-center" style={{ minWidth: 36 }}>CATs</th>
                  {monthGroups.map((mg, i) => (
                    <th
                      key={i}
                      colSpan={mg.count}
                      className="bg-teal-700 text-white border border-teal-600 px-1 py-1 text-center font-bold"
                    >
                      {mg.label}
                    </th>
                  ))}
                </tr>

                {/*Date row*/}
                <tr>
                  <th className="sticky left-0 z-20 bg-teal-700 border border-teal-600" style={{ minWidth: 100 }} />
                  <th className="sticky bg-teal-700 border border-teal-600" style={{ left: 100, minWidth: 220, zIndex: 20 }} />
                  <th className="bg-teal-700 border border-teal-600" style={{ minWidth: 36 }} />
                  {ganttWeeks.map((w, i) => {
                    const t = weekType(w);
                    const bg = t === "christmas" ? "bg-green-200" : t === "easter" ? "bg-yellow-200" : t === "reading" ? "bg-purple-100" : "bg-teal-700";
                    const textCol = t ? "text-gray-700" : "text-white";
                    const dd = String(w.getDate()).padStart(2,"0");
                    const mm = String(w.getMonth()+1).padStart(2,"0");
                    const yy = String(w.getFullYear()).slice(2);
                    return (
                      <th key={i} className={`${bg} ${textCol} border border-teal-600`} style={{ minWidth: 28, width: 28, height: 72 }}>
                        <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: 9, lineHeight: 1, padding: "2px 0" }}>
                          {`${dd}/${mm}/${yy}`}
                        </div>
                      </th>
                    );
                  })}
                </tr>

                {/*Week number row*/}
                <tr>
                  <th className="sticky left-0 z-20 bg-teal-700 border border-teal-600 text-white px-1 py-1 text-center text-xs" style={{ minWidth: 100 }}>Occ</th>
                  <th className="sticky bg-teal-700 border border-teal-600 text-white px-1 py-1 text-left text-xs" style={{ left: 100, minWidth: 220, zIndex: 20 }}>CATs</th>
                  <th className="bg-teal-700 border border-teal-600 text-white px-1 py-1 text-center text-xs" style={{ minWidth: 36 }}>Board</th>
                  {ganttWeeks.map((w, i) => {
                    const t = weekType(w);
                    const bg = t === "christmas" ? "bg-green-200" : t === "easter" ? "bg-yellow-200" : t === "reading" ? "bg-purple-100" : "bg-teal-700";
                    const label = breakLabel(w);
                    const wkNum = label ? null : Math.floor((w.getTime() - startMs) / (7*24*60*60*1000)) + 1;
                    return (
                      <th key={i} className={`${bg} border border-teal-600 text-center`} style={{ minWidth: 28, width: 28 }}>
                        {label
                          ? <span className="text-gray-700 font-bold" style={{ fontSize: 8 }}>{label}</span>
                          : <span className="text-white" style={{ fontSize: 8 }}>{wkNum}</span>
                        }
                      </th>
                    );
                  })}
                </tr>

                {/*Banner*/}
                <tr>
                  <td
                    colSpan={3 + ganttWeeks.length}
                    className="bg-gray-900 text-white font-bold px-3 py-1"
                    style={{ fontSize: 11 }}
                  >
                    Cohorts &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; DAB and Progression Boards
                  </td>
                </tr>
              </thead>

              {/*Module rows*/}
              <tbody>
                {levelGroups.map(([level, mods]) => (
                  <>
                    {/*Level group header*/}
                    <tr key={`grp-${level}`}>
                      <td
                        colSpan={3 + ganttWeeks.length}
                        className="bg-gray-800 text-white font-bold px-3 py-1"
                        style={{ fontSize: 10 }}
                      >
                        {level === "Other" ? "Modules" : `Level ${level} Modules`}
                      </td>
                    </tr>

                    {mods.map((m, mi) => {
                      const sessions = sessionMap[m.id] || new Set<string>();
                      const isAlt = mi % 2 === 1;
                      return (
                        <tr key={m.id} className={isAlt ? "bg-gray-50" : "bg-white"}>
                          <td
                            className="sticky left-0 z-10 border border-gray-200 px-2 py-1 font-mono font-bold whitespace-nowrap"
                            style={{ minWidth: 100, fontSize: 10, background: isAlt ? "#f9fafb" : "#fff" }}
                          >
                            {m.code}
                          </td>
                          <td
                            className="sticky border border-gray-200 px-2 py-1"
                            style={{ left: 100, minWidth: 220, zIndex: 10, fontSize: 10, background: isAlt ? "#f9fafb" : "#fff", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          >
                            {m.title}
                          </td>
                          <td className="border border-gray-200 px-1 py-1 text-center" style={{ fontSize: 10, minWidth: 36 }}>
                            {m.credits ?? ""}
                          </td>
                          {ganttWeeks.map((w, i) => {
                            const dateStr = w.toISOString().split("T")[0];
                            const bg = cellBg(w, sessions.has(dateStr), isAlt);
                            return (
                              <td
                                key={i}
                                className={`${bg} border border-gray-200`}
                                style={{ minWidth: 28, width: 28, height: 18 }}
                                title={sessions.has(dateStr) ? `${m.code} — week of ${dateStr}` : ""}
                              />
                            );
                          })}
                        </tr>
                      );
                    })}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/*Keys*/}
          <div className="p-4 border-t border-gray-200">
            <p className="text-xs font-bold text-center mb-3">Keys</p>
            <div className="flex flex-wrap gap-4 text-xs">
              {[
                { label: "Teaching Session",  cls: "bg-orange-400" },
                { label: "Christmas Break",   cls: "bg-green-200 border border-green-300" },
                { label: "Easter Break",      cls: "bg-yellow-200 border border-yellow-300" },
                { label: "Reading Week",      cls: "bg-purple-100 border border-purple-300" },
              ].map(k => (
                <div key={k.label} className="flex items-center gap-2">
                  <div className={`w-5 h-4 rounded-sm ${k.cls}`} />
                  <span className="text-gray-700">{k.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
