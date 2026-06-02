import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { loginUser, registerUser } from "../../services/userService";

const roleOptions: { label: string; value: string }[] = [
  { label: "Academic Staff",       value: "academic_staff" },
  { label: "Programme Leader",     value: "programme_lead" },
  { label: "Apprenticeship Coach", value: "coach" },
  { label: "Employer / Mentor",    value: "employer" },
  { label: "Ofsted Inspector",     value: "ofsted_inspector" },
  { label: "System Administrator", value: "system_admin" },
];

const roleDisplayNames: Record<string, string> = {
  academic_staff:   "Academic Staff",
  programme_lead:   "Programme Leader",
  coach:            "Apprenticeship Coach",
  employer:         "Employer/Mentor",
  ofsted_inspector: "Ofsted Inspector",
  system_admin:     "System Administrator",
};

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("academic_staff");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await registerUser(name, email, password, role);
      // Auto-login after registration
      const data = await loginUser(email, password);
      const displayRole = roleDisplayNames[data.role] || data.role;
      localStorage.setItem("userRole", displayRole);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl text-teal-600">Clarity</Link>
          <h2 className="text-2xl mt-6 text-gray-900">Create Your Account</h2>
          <p className="text-gray-600 mt-2">Join the platform for quality assurance excellence</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleRegister} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="John Smith"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Institution Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="john.smith@institution.ac.uk"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                >
                  {roleOptions.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Organisation / Department</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Computing Dept."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-teal-600 hover:text-teal-700">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
