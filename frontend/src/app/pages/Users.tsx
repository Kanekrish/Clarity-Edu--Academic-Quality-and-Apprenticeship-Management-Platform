import { useState, useEffect } from "react";
import { Search, Edit2, Trash2, X, AlertCircle } from "lucide-react";
import { api } from "../../services/api";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

const roleOptions = [
  { label: "Academic Staff",       value: "academic_staff" },
  { label: "Programme Leader",     value: "programme_lead" },
  { label: "Apprenticeship Coach", value: "coach" },
  { label: "Employer / Mentor",    value: "employer" },
  { label: "Ofsted Inspector",     value: "ofsted_inspector" },
  { label: "System Administrator", value: "system_admin" },
];

const roleLabel = (role: string) =>
  roleOptions.find(r => r.value === role)?.label ?? role;

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("academic_staff");
  const [formPassword, setFormPassword] = useState("");

  const fetchUsers = () =>
    api.get<User[]>('/users').then(setUsers).catch(() => {});

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.includes(q);
  });

  const openAdd = () => {
    setFormName(""); setFormEmail(""); setFormRole("academic_staff"); setFormPassword(""); setFormError("");
    setIsAddModalOpen(true);
  };

  const openEdit = (user: User) => {
    setCurrentUser(user);
    setFormName(user.name); setFormEmail(user.email); setFormRole(user.role); setFormPassword(""); setFormError("");
    setIsEditModalOpen(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPassword) { setFormError("Password is required for new users"); return; }
    setSaving(true); setFormError("");
    try {
      await api.post('/users', { name: formName, email: formEmail, role: formRole, password: formPassword });
      await fetchUsers();
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to create user");
    } finally { setSaving(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSaving(true); setFormError("");
    try {
      await api.put(`/users/${currentUser.id}`, {
        name: formName, email: formEmail, role: formRole,
        ...(formPassword ? { password: formPassword } : {}),
      });
      await fetchUsers();
      setIsEditModalOpen(false);
      setCurrentUser(null);
    } catch (err: any) {
      setFormError(err.message || "Failed to update user");
    } finally { setSaving(false); }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Delete user "${user.name}" (${user.email})?`)) return;
    try {
      await api.del(`/users/${user.id}`);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || "Failed to delete user");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl mb-6 text-gray-800">User Management</h1>

      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <h2 className="text-lg text-gray-800">All Users ({filtered.length})</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 w-full sm:w-64"
              />
            </div>
            <button onClick={openAdd} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap">
              Add New User
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-teal-600 text-white">
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Joined</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  {searchQuery ? "No users match your search" : "No users in the database yet"}
                </td></tr>
              ) : filtered.map((user, i) => (
                <tr key={user.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-3 text-gray-700">{user.name}</td>
                  <td className="px-4 py-3 text-gray-700">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                      {roleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm">{user.created_at?.split('T')[0] ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => openEdit(user)} className="text-teal-600 hover:text-teal-700" title="Edit"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(user)} className="text-red-600 hover:text-red-700" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/*Add*/}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl text-gray-800">Add New User</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            {formError && <div className="mb-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3"><AlertCircle className="w-4 h-4" />{formError}</div>}
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Full Name</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Email</label>
                <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Role</label>
                <select value={formRole} onChange={e => setFormRole(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                  {roleOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Password</label>
                <input type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-60">{saving ? "Saving…" : "Add User"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/*Edit*/}
      {isEditModalOpen && currentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl text-gray-800">Edit User</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            {formError && <div className="mb-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3"><AlertCircle className="w-4 h-4" />{formError}</div>}
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Full Name</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Email</label>
                <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Role</label>
                <select value={formRole} onChange={e => setFormRole(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500">
                  {roleOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">New Password</label>
                <input type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Leave blank to keep current" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-60">{saving ? "Saving…" : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
