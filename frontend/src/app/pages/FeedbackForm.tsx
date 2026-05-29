import { useState, useEffect } from "react";
import { CheckCircle2, Star } from "lucide-react";
import { api } from "../../services/api";

interface Learner {
  id: number;
  name: string;
  student_id: string;
}

interface FeedbackItem {
  id: number;
  learner_name: string;
  content: string;
  employer_priority: string | null;
  recorded_at: string;
}

export default function FeedbackForm() {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<FeedbackItem[]>([]);

  const [selectedLearner, setSelectedLearner] = useState("");
  const [priority, setPriority] = useState("");
  const [punctuality, setPunctuality] = useState(0);
  const [workQuality, setWorkQuality] = useState(0);
  const [teamwork, setTeamwork] = useState(0);
  const [initiative, setInitiative] = useState(0);
  const [technicalSkills, setTechnicalSkills] = useState(0);
  const [comments, setComments] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchData = () => {
    api.get<Learner[]>('/learners').then(setLearners).catch(() => {});
    api.get<FeedbackItem[]>('/feedback').then(setRecentFeedback).catch(() => {});
  };

  useEffect(() => { fetchData(); }, []);

  const ratingLabel = (stars: number) => {
    if (stars === 0) return "";
    const avg = (punctuality + workQuality + teamwork + initiative + technicalSkills) / 5;
    if (avg >= 4.5) return "Excellent";
    if (avg >= 3.5) return "Good";
    if (avg >= 2.5) return "Satisfactory";
    return "Needs Improvement";
  };

  const handleSubmit = async () => {
    if (!selectedLearner || !comments) {
      setFormError("Please select a learner and add feedback comments.");
      return;
    }
    setSubmitting(true); setFormError("");
    try {
      const stars = [punctuality, workQuality, teamwork, initiative, technicalSkills];
      const avgStars = stars.reduce((a, b) => a + b, 0) / stars.length;
      const overallRating = ratingLabel(avgStars);
      const fullContent = [
        comments,
        avgStars > 0 ? `Overall: ${overallRating} (${avgStars.toFixed(1)}/5)` : "",
        punctuality > 0 ? `Punctuality: ${punctuality}/5` : "",
        workQuality > 0 ? `Work Quality: ${workQuality}/5` : "",
        teamwork > 0 ? `Teamwork: ${teamwork}/5` : "",
        initiative > 0 ? `Initiative: ${initiative}/5` : "",
        technicalSkills > 0 ? `Technical Skills: ${technicalSkills}/5` : "",
      ].filter(Boolean).join(" | ");

      await api.post('/feedback', {
        learner_id: Number(selectedLearner),
        content: fullContent,
        employer_priority: priority || undefined,
      });

      setSelectedLearner(""); setPriority(""); setComments("");
      setPunctuality(0); setWorkQuality(0); setTeamwork(0); setInitiative(0); setTechnicalSkills(0);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || "Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
    <div>
      <label className="block text-sm text-gray-700 mb-2">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button key={star} type="button" onClick={() => onChange(star)} className="focus:outline-none">
            <Star className={`w-6 h-6 ${star <= value ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">{value}/5</span>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl text-gray-800">Submit Feedback</h1>
        <p className="text-gray-600 mt-1">Provide workplace performance feedback for your apprentices</p>
      </div>

      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-green-800 font-medium">Feedback submitted successfully!</p>
            <p className="text-green-700 text-sm">Your feedback has been recorded and shared with the apprentice's coach.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Feedback Form */}
        <div className="col-span-2 bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg text-gray-800 mb-6">Workplace Performance Feedback</h2>

          {formError && (
            <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{formError}</p>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Select Apprentice <span className="text-red-500">*</span></label>
              <select
                value={selectedLearner}
                onChange={e => setSelectedLearner(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select apprentice…</option>
                {learners.map(l => <option key={l.id} value={l.id}>{l.name} ({l.student_id})</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Priority Area</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select priority…</option>
                <option>Technical Skills</option>
                <option>Communication</option>
                <option>Project Management</option>
                <option>Problem Solving</option>
              </select>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-base text-gray-800 mb-4">Detailed Performance Assessment</h3>
              <div className="space-y-4">
                <StarRating value={punctuality}     onChange={setPunctuality}     label="Punctuality & Attendance" />
                <StarRating value={workQuality}     onChange={setWorkQuality}     label="Quality of Work" />
                <StarRating value={teamwork}        onChange={setTeamwork}        label="Teamwork & Collaboration" />
                <StarRating value={initiative}      onChange={setInitiative}      label="Initiative & Problem Solving" />
                <StarRating value={technicalSkills} onChange={setTechnicalSkills} label="Technical Skills Development" />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Feedback Comments <span className="text-red-500">*</span></label>
              <textarea
                rows={6}
                value={comments}
                onChange={e => setComments(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Share your observations on workplace performance, strengths, areas for development, and any notable achievements…"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedLearner || !comments}
              className="w-full bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit Feedback"}
            </button>
          </div>
        </div>

        {/*Recent Submissions*/}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg text-gray-800 mb-6">Recent Submissions</h2>
          {recentFeedback.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No feedback submitted yet.</p>
          ) : (
            <div className="space-y-4">
              {recentFeedback.slice(0, 8).map(f => (
                <div key={f.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-medium text-gray-800">{f.learner_name}</p>
                    {f.employer_priority && (
                      <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">{f.employer_priority}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{f.recorded_at?.split('T')[0]}</p>
                  <p className="text-xs text-gray-700 line-clamp-3">{f.content}</p>
                </div>
              ))}
            </div>
          )}
          {recentFeedback.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">{recentFeedback.length} feedback record{recentFeedback.length !== 1 ? "s" : ""} total</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
