import { useEffect, useState } from "react";
import { Shield, Users as UsersIcon, X, AlertCircle, Plus } from "lucide-react";
import { api } from "../../services/api";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

const ROLES = [
  {
    value: "academic_staff",
    label: "Academic Staff",
    description: "Full access to teaching modules, schedules, and assessments",
  },
  {
    value: "programme_lead",
    label: "Programme Leader",
    description: "Strategic oversight, reporting, and module management",
  },
  {
    value: "coach",
    label: "Apprenticeship Coach",
    description: "Learner support, progress tracking, and coaching sessions",
  },
  {
    value: "employer",
    label: "Employer / Mentor",
    description: "Limited access — feedback submission and learner progress view",
  },
  {
    value: "ofsted_inspector",
    label: "Ofsted Inspector",
    description: "Read-only inspection access to evidence and compliance data",
  },
  {
    value: "system_admin",
    label: "System Administrator",
    description: "Full system access including user and role management",
  },
];

const roleLabel = (value: string) => ROLES.find(r => r.value === value)?.label ?? value;

export default function Roles() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Role-change
  const [editUser, setEditUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Add user
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", password: "", role: "academic_staff" });
  const [addError, setAddError] = useState("");
  const [addSaving, setAddSaving] = useState(false);

  const fetchUsers = () =>
    api.get<User[]>('/users')
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { fetchUsers(); }, []);

  const openEdit = (user: User) => {
    setEditUser(user);
    setNewRole(user.role);
    setError("");
  };

  const handleSaveRole = async () => {
    if (!editUser || newRole === editUser.role) { setEditUser(null); return; }
    setSaving(true);
    setError("");
    try {
      await api.put(`/users/${editUser.id}`, {
        name: editUser.name,
        email: editUser.email,
        role: newRole,
      });
      await fetchUsers();
      setEditUser(null);
    } catch (err: any) {
      setError(err.message || "Failed to update role");
    } finally {
      setSaving(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.password) { setAddError("Password is required"); return; }
    setAddSaving(true);
    setAddError("");
    try {
      await api.post('/users', addForm);
      await fetchUsers();
      setShowAdd(false);
      setAddForm({ name: "", email: "", password: "", role: "academic_staff" });
    } catch (err: any) {
      setAddError(err.message || "Failed to create user");
    } finally {
      setAddSaving(false);
    }
  };

  const usersForRole = (roleValue: string) =>
    users.filter(u => u.role === roleValue);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl text-gray-800">Role Management</h1>
          <p className="text-gray-600 mt-1">View all system roles and reassign user permissions</p>
        </div>
        <button
          onClick={() => { setAddForm({ name: "", email: "", password: "", role: "academic_staff" }); setAddError(""); setShowAdd(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New User
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <div className="space-y-4">
          {ROLES.map(role => {
            const assigned = usersForRole(role.value);
            return (
              <div key={role.value} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-teal-50 p-2 rounded-lg mt-0.5">
                      <Shield className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-gray-800 font-medium">{role.label}</p>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded">
                          System Role
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{role.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg">
                    <UsersIcon className="w-4 h-4" />
                    <span>{assigned.length} user{assigned.length !== 1 ? "s" : ""}</span>
                  </div>
                </div>

                {assigned.length === 0 ? (
                  <p className="text-xs text-gray-400 pl-11">No users assigned to this role.</p>
                ) : (
                  <div className="pl-11 space-y-2">
                    {assigned.map(user => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="text-sm text-gray-800">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <button
                          onClick={() => openEdit(user)}
                          className="text-xs px-3 py-1.5 border border-teal-300 text-teal-700 rounded-lg hover:bg-teal-50 transition-colors"
                        >
                          Change Role
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/*Add New User*/}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl text-gray-800">Add New User</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            {addError && (
              <div className="mb-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {addError}
              </div>
            )}
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Role</label>
                <select
                  value={addForm.role}
                  onChange={e => setAddForm({ ...addForm, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={addForm.password}
                  onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSaving}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                >
                  {addSaving ? "Creating…" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*Change Role*/}
      {editUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl text-gray-800">Change Role</h2>
              <button onClick={() => setEditUser(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-800 font-medium">{editUser.name}</p>
              <p className="text-xs text-gray-500">{editUser.email}</p>
              <p className="text-xs text-gray-500 mt-1">
                Current role: <span className="text-teal-700 font-medium">{roleLabel(editUser.role)}</span>
              </p>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm text-gray-700 mb-1">Assign New Role</label>
              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              {newRole !== editUser.role && (
                <p className="text-xs text-amber-600 mt-1">
                  This will change the user's access level immediately.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEditUser(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRole}
                disabled={saving || newRole === editUser.role}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
