import { useEffect, useState } from "react";
import { usersApi } from "../api/users.api";
import { useAuth } from "../context/AuthContext";

const ASSIGNABLE_ROLES = ["STAFF", "TRAINER", "MANAGER"];

function Users() {
  const { can } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "STAFF",
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await usersApi.getAll();
      setUsers(data);
    } catch (err) {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (!can("users.read")) {
    return (
      <div className="bg-card-bg border border-card-border rounded-lg p-8 text-center">
        <p className="text-text-secondary">You don't have access to this section.</p>
      </div>
    );
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const { data } = await usersApi.create(form);
      setUsers((prev) => [data, ...prev]);
      setShowForm(false);
      setForm({ full_name: "", email: "", phone: "", role: "STAFF", password: "" });
    } catch (err) {
      const detail = err.response?.data;
      setFormError(
        (detail && (detail.detail || Object.values(detail)?.[0]?.[0])) ||
          "Failed to create account"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (user, newRole) => {
    if (!window.confirm(`Change ${user.full_name}'s role to ${newRole}?`)) return;
    setUpdatingId(user.id);
    try {
      const { data } = await usersApi.updateRole(user.id, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: data.role } : u)));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update role");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleActive = async (user) => {
    const confirmMsg = user.is_active
      ? `Deactivate ${user.full_name}'s account? They will not be able to log in.`
      : `Reactivate ${user.full_name}'s account?`;
    if (!window.confirm(confirmMsg)) return;

    setUpdatingId(user.id);
    try {
      const { data } = await usersApi.updateRole(user.id, { is_active: !user.is_active });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: data.is_active } : u))
      );
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card-bg border border-danger/20 rounded-lg p-8 text-center">
        <p className="text-danger mb-4">{error}</p>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-hover-bg border border-card-border rounded-lg text-text-primary text-sm hover:border-accent transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-text-primary text-xl font-semibold border-l-4 border-accent pl-3">
          Users & Roles
        </h3>
        {can("users.create") && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="bg-accent text-[#0a0a0a] px-4 py-2 rounded-lg font-semibold shadow-sm shadow-accent/30 hover:bg-accent-hover transition"
          >
            {showForm ? "Cancel" : "+ Add User"}
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleCreateSubmit}
          className="bg-card-bg border border-card-border rounded-lg p-6 mb-6 space-y-4 max-w-xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-text-secondary text-xs uppercase mb-1 block">
                Full Name
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                className="w-full bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                required
              />
            </div>
            <div>
              <label className="text-text-secondary text-xs uppercase mb-1 block">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                required
              />
            </div>
            <div>
              <label className="text-text-secondary text-xs uppercase mb-1 block">Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="text-text-secondary text-xs uppercase mb-1 block">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
              >
                {ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0) + r.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-text-secondary text-xs uppercase mb-1 block">
              Temporary Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              minLength={8}
              className="w-full bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
              required
            />
            <p className="text-xs text-text-secondary mt-1">Minimum 8 characters.</p>
          </div>

          {formError && <p className="text-sm text-danger">{formError}</p>}

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-accent text-[#0a0a0a] rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-accent-hover transition"
          >
            {saving ? "Creating..." : "Create Account"}
          </button>
        </form>
      )}

      <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-hover-bg border-b border-card-border">
            <tr>
              <th className="px-6 py-4 text-sm font-medium text-text-secondary">Name</th>
              <th className="px-6 py-4 text-sm font-medium text-text-secondary">Email</th>
              <th className="px-6 py-4 text-sm font-medium text-text-secondary">Role</th>
              <th className="px-6 py-4 text-sm font-medium text-text-secondary">Status</th>
              <th className="px-6 py-4 text-sm font-medium text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-text-secondary text-sm">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-card-border hover:bg-hover-bg/50 transition">
                  <td className="px-6 py-4 text-sm font-medium text-text-primary">{u.full_name}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{u.email}</td>
                  <td className="px-6 py-4">
                    {can("users.update_role") && ASSIGNABLE_ROLES.includes(u.role) ? (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                        disabled={updatingId === u.id}
                        className="bg-hover-bg border border-card-border rounded px-2 py-1 text-xs text-text-primary"
                      >
                        {ASSIGNABLE_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs bg-hover-bg text-text-secondary px-2 py-1 rounded-full">
                        {u.role}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                        u.is_active
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-600"
                      }`}
                    >
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {can("users.update_role") && (
                      <button
                        onClick={() => handleToggleActive(u)}
                        disabled={updatingId === u.id}
                        className={`text-xs transition disabled:opacity-50 ${
                          u.is_active
                            ? "text-danger hover:text-red-500"
                            : "text-green-700 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                        }`}
                      >
                        {updatingId === u.id
                          ? "..."
                          : u.is_active
                          ? "Deactivate"
                          : "Activate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Users;