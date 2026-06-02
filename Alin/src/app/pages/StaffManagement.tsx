import { useEffect, useState } from "react";
import { api } from "../../services/api";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

const roleLabel: Record<string, string> = {
  academic_staff:   "Academic Staff",
  programme_lead:   "Programme Leader",
  coach:            "Apprenticeship Coach",
  employer:         "Employer/Mentor",
  ofsted_inspector: "Ofsted Inspector",
  system_admin:     "System Administrator",
};

const STAFF_ROLES = ["academic_staff", "programme_lead", "coach"];

export default function StaffManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<User[]>('/users')
      .then(all => setUsers(all.filter(u => STAFF_ROLES.includes(u.role))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl mb-6 text-gray-800">Staff Management</h1>
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg text-gray-800">Staff Overview</h2>
          <span className="text-sm text-gray-500">{users.length} staff members</span>
        </div>
        {loading ? (
          <p className="text-sm text-gray-500 text-center py-8">Loading…</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No staff members in database yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-teal-600 text-white">
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((member, index) => (
                  <tr key={member.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 text-gray-700">{member.name}</td>
                    <td className="px-4 py-3 text-gray-600 text-sm">{member.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {roleLabel[member.role] ?? member.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{member.created_at?.split('T')[0]}</td>
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
