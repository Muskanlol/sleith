import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { staffApi } from "../api/staff.api";
import { useAuth } from "../context/AuthContext";

function Staff() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const navigate = useNavigate();
  const { can } = useAuth();

  const fetchStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await staffApi.getAll();
      setStaffList(data);
    } catch (err) {
      setError("Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleToggleActive = async (member) => {
    const confirmMsg = member.is_active
      ? `Deactivate "${member.user_name}"? They will no longer be assignable to appointments.`
      : `Reactivate "${member.user_name}"?`;
    if (!window.confirm(confirmMsg)) return;

    setTogglingId(member.id);
    try {
      const { data } = await staffApi.deactivate(member.id);
      setStaffList((prev) =>
        prev.map((s) => (s.id === member.id ? { ...s, is_active: data.is_active } : s))
      );
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading staff...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card-bg border border-danger/20 rounded-lg p-8 text-center">
        <p className="text-danger mb-4">{error}</p>
        <button
          onClick={fetchStaff}
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
        <h3 className="text-text-primary text-xl font-semibold">Staff Directory</h3>
        {can("staff.create") && (
          <button
            onClick={() => navigate("/admin/staff/new")}
            className="bg-accent text-sidebar-text px-4 py-2 rounded-lg font-semibold hover:bg-accent-hover transition"
          >
            + Add Staff
          </button>
        )}
      </div>

      <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-hover-bg border-b border-card-border">
            <tr>
              <th className="px-6 py-4 text-sm font-medium text-text-secondary">Name</th>
              <th className="px-6 py-4 text-sm font-medium text-text-secondary">Email</th>
              <th className="px-6 py-4 text-sm font-medium text-text-secondary">Role</th>
              <th className="px-6 py-4 text-sm font-medium text-text-secondary">Joined</th>
              <th className="px-6 py-4 text-sm font-medium text-text-secondary">Status</th>
              <th className="px-6 py-4 text-sm font-medium text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staffList.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-text-secondary text-sm">
                  No staff members found.
                </td>
              </tr>
            ) : (
              staffList.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-card-border hover:bg-hover-bg/50 transition"
                >
                  <td className="px-6 py-4 text-sm font-medium text-text-primary">
                    {member.user_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{member.user_email}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-hover-bg text-text-secondary px-2 py-1 rounded-full capitalize">
                      {member.user_role?.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        member.is_active
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}
                    >
                      {member.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => navigate(`/admin/staff/${member.id}`)}
                        className="text-xs text-accent hover:text-accent-hover transition"
                      >
                        View
                      </button>
                      {can("staff.update") && (
                        <button
                          onClick={() => navigate(`/admin/staff/${member.id}/edit`)}
                          className="text-xs text-text-secondary hover:text-text-primary transition"
                        >
                          Edit
                        </button>
                      )}
                      {can("staff.deactivate") && (
                        <button
                          onClick={() => handleToggleActive(member)}
                          disabled={togglingId === member.id}
                          className={`text-xs transition disabled:opacity-50 ${
                            member.is_active
                              ? "text-danger hover:text-red-600"
                              : "text-green-600 hover:text-green-500"
                          }`}
                        >
                          {togglingId === member.id
                            ? "..."
                            : member.is_active
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                      )}
                    </div>
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

export default Staff;