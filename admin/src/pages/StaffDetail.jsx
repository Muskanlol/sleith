import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { staffApi } from "../api/staff.api";
import { servicesApi } from "../api/services.api";
import { salaryApi } from "../api/salary.api";
import { useAuth } from "../context/AuthContext";

const WEEKDAYS = [
  { value: 0, label: "Monday" },
  { value: 1, label: "Tuesday" },
  { value: 2, label: "Wednesday" },
  { value: 3, label: "Thursday" },
  { value: 4, label: "Friday" },
  { value: 5, label: "Saturday" },
  { value: 6, label: "Sunday" },
];

function StaffDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();

  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [assignedServices, setAssignedServices] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [assigningService, setAssigningService] = useState(false);

  const [availability, setAvailability] = useState({});
  const [savingDay, setSavingDay] = useState(null);

  const [leaves, setLeaves] = useState([]);
  const [leaveForm, setLeaveForm] = useState({
    start_date: "",
    end_date: "",
    leave_type: "",
    reason: "",
  });
  const [savingLeave, setSavingLeave] = useState(false);
  const [approvingLeaveId, setApprovingLeaveId] = useState(null);

  const [salaries, setSalaries] = useState([]);

  const canManageServices = can("staff.manage_services");
  const canManageAvailability = can("staff.manage_availability");
  const canManageLeave = can("staff.manage_leave");

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [staffRes, servicesRes, allServicesRes, availabilityRes, leavesRes] =
        await Promise.all([
          staffApi.getById(id),
          staffApi.getServices(id),
          servicesApi.getAll(),
          staffApi.getAvailability(id),
          staffApi.getLeaves(id),
        ]);

      setStaff(staffRes.data);
      setAssignedServices(servicesRes.data);
      setAllServices(allServicesRes.data);
      setLeaves(leavesRes.data);

      const userId = typeof staffRes.data.user === "object" ? staffRes.data.user.id : staffRes.data.user;
      const salariesRes = await salaryApi.getByEmployee(userId);
      const staffSalaries = salariesRes.data.results || salariesRes.data || [];
      setSalaries(staffSalaries);

      const byDay = {};
      availabilityRes.data.forEach((entry) => {
        byDay[entry.day_of_week] = entry;
      });
      setAvailability(byDay);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load staff details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadAll();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading staff details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card-bg border border-danger/20 rounded-lg p-8 text-center">
        <p className="text-danger mb-4">{error}</p>
        <button
          onClick={loadAll}
          className="px-4 py-2 bg-hover-bg border border-card-border rounded-lg text-text-primary text-sm hover:border-accent transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const unassignedServices = allServices.filter(
    (s) => !assignedServices.some((as) => as.service === s.id)
  );

  const handleAssignService = async () => {
    if (!selectedServiceId) return;
    setAssigningService(true);
    try {
      const { data } = await staffApi.assignService(id, Number(selectedServiceId));
      setAssignedServices((prev) => [...prev, data]);
      setSelectedServiceId("");
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to assign service");
    } finally {
      setAssigningService(false);
    }
  };

  const handleRemoveService = async (staffServiceId) => {
    if (!window.confirm("Remove this service from the staff member?")) return;
    try {
      await staffApi.removeService(staffServiceId);
      setAssignedServices((prev) => prev.filter((s) => s.id !== staffServiceId));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to remove service");
    }
  };

  const handleAvailabilityChange = (day, field, value) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...(prev[day] || { day_of_week: day, start_time: "", end_time: "", is_available: true }),
        [field]: value,
      },
    }));
  };

  const handleSaveAvailability = async (day) => {
    const entry = availability[day];
    if (!entry?.start_time || !entry?.end_time) {
      alert("Please set both start and end time.");
      return;
    }
    setSavingDay(day);
    try {
      const { data } = await staffApi.setAvailability(id, {
        day_of_week: day,
        start_time: entry.start_time,
        end_time: entry.end_time,
        is_available: entry.is_available ?? true,
      });
      setAvailability((prev) => ({ ...prev, [day]: data }));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to save availability");
    } finally {
      setSavingDay(null);
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setSavingLeave(true);
    try {
      const { data } = await staffApi.requestLeave(id, leaveForm);
      setLeaves((prev) => [data, ...prev]);
      setLeaveForm({ start_date: "", end_date: "", leave_type: "", reason: "" });
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to record leave");
    } finally {
      setSavingLeave(false);
    }
  };

  const handleApproveLeave = async (leaveId) => {
    setApprovingLeaveId(leaveId);
    try {
      const { data } = await staffApi.approveLeave(leaveId);
      setLeaves((prev) =>
        prev.map((l) => (l.id === leaveId ? { ...l, is_approved: data.is_approved } : l))
      );
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to approve leave");
    } finally {
      setApprovingLeaveId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-text-primary text-xl font-semibold">{staff.user_name}</h3>
          <p className="text-text-secondary text-sm">{staff.user_email}</p>
        </div>
        <button
          onClick={() => navigate("/admin/staff")}
          className="px-4 py-2 bg-hover-bg border border-card-border rounded-lg text-text-primary text-sm hover:border-accent transition-colors"
        >
          ← Back to Staff
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-card-bg border border-card-border rounded-lg p-6">
          <h4 className="text-text-primary font-semibold mb-4">Profile</h4>
          <div className="space-y-3">
            <div>
              <p className="text-text-secondary text-xs uppercase">Role</p>
              <p className="text-text-primary capitalize">{staff.user_role?.toLowerCase()}</p>
            </div>
            <div>
              <p className="text-text-secondary text-xs uppercase">Bio</p>
              <p className="text-text-primary">{staff.bio || "No bio added."}</p>
            </div>
            <div>
              <p className="text-text-secondary text-xs uppercase">Status</p>
              <span
                className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                  staff.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {staff.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <div>
              <p className="text-text-secondary text-xs uppercase">Joined</p>
              <p className="text-text-primary">
                {staff.joined_at ? new Date(staff.joined_at).toLocaleDateString() : "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card-bg border border-card-border rounded-lg p-6">
          <h4 className="text-text-primary font-semibold mb-4">Assigned Services</h4>
          {assignedServices.length === 0 ? (
            <p className="text-text-secondary text-sm mb-4">No services assigned yet.</p>
          ) : (
            <div className="space-y-2 mb-4">
              {assignedServices.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between bg-hover-bg rounded-lg px-3 py-2"
                >
                  <span className="text-sm text-text-primary">{s.service_name}</span>
                  {canManageServices && (
                    <button
                      onClick={() => handleRemoveService(s.id)}
                      className="text-xs text-danger hover:text-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {canManageServices && (
            <div className="flex gap-2">
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="flex-1 bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
              >
                <option value="">Select a service to assign</option>
                {unassignedServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAssignService}
                disabled={!selectedServiceId || assigningService}
                className="px-4 py-2 bg-accent text-sidebar-text rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {assigningService ? "..." : "Assign"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-card-bg border border-card-border rounded-lg p-6 mb-6">
        <h4 className="text-text-primary font-semibold mb-4">Weekly Availability</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-card-border">
                <th className="px-3 py-2 text-xs uppercase text-text-secondary">Day</th>
                <th className="px-3 py-2 text-xs uppercase text-text-secondary">Start</th>
                <th className="px-3 py-2 text-xs uppercase text-text-secondary">End</th>
                <th className="px-3 py-2 text-xs uppercase text-text-secondary">Available</th>
                {canManageAvailability && (
                  <th className="px-3 py-2 text-xs uppercase text-text-secondary">Action</th>
                )}
              </tr>
            </thead>
            <tbody>
              {WEEKDAYS.map((day) => {
                const entry = availability[day.value] || {};
                return (
                  <tr key={day.value} className="border-b border-card-border/50">
                    <td className="px-3 py-2 text-sm text-text-primary">{day.label}</td>
                    <td className="px-3 py-2">
                      <input
                        type="time"
                        value={entry.start_time || ""}
                        onChange={(e) =>
                          handleAvailabilityChange(day.value, "start_time", e.target.value)
                        }
                        disabled={!canManageAvailability}
                        className="bg-hover-bg border border-card-border rounded px-2 py-1 text-sm text-text-primary disabled:opacity-60"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="time"
                        value={entry.end_time || ""}
                        onChange={(e) =>
                          handleAvailabilityChange(day.value, "end_time", e.target.value)
                        }
                        disabled={!canManageAvailability}
                        className="bg-hover-bg border border-card-border rounded px-2 py-1 text-sm text-text-primary disabled:opacity-60"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={entry.is_available ?? true}
                        onChange={(e) =>
                          handleAvailabilityChange(day.value, "is_available", e.target.checked)
                        }
                        disabled={!canManageAvailability}
                        className="w-4 h-4"
                      />
                    </td>
                    {canManageAvailability && (
                      <td className="px-3 py-2">
                        <button
                          onClick={() => handleSaveAvailability(day.value)}
                          disabled={savingDay === day.value}
                          className="text-xs text-accent hover:text-accent-hover disabled:opacity-50"
                        >
                          {savingDay === day.value ? "Saving..." : "Save"}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card-bg border border-card-border rounded-lg p-6 mb-6">
        <h4 className="text-text-primary font-semibold mb-4">Salary History</h4>
        {!salaries.length ? (
          <p className="text-text-secondary text-sm">No salary records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-card-border">
                  <th className="px-3 py-2 text-xs uppercase text-text-secondary">Month</th>
                  <th className="px-3 py-2 text-xs uppercase text-text-secondary">Amount</th>
                  <th className="px-3 py-2 text-xs uppercase text-text-secondary">Paid Date</th>
                  <th className="px-3 py-2 text-xs uppercase text-text-secondary">Status</th>
                </tr>
              </thead>
              <tbody>
                {salaries.map((sal) => (
                  <tr key={sal.id} className="border-b border-card-border/50">
                    <td className="px-3 py-2 text-sm text-text-primary">
                      {new Date(sal.month).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                    </td>
                    <td className="px-3 py-2 text-sm text-text-primary font-medium">₹{sal.amount}</td>
                    <td className="px-3 py-2 text-sm text-text-secondary">{sal.paid_date || "—"}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                          sal.status === "PAID"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {sal.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-card-bg border border-card-border rounded-lg p-6">
        <h4 className="text-text-primary font-semibold mb-4">Leave</h4>

        {leaves.length === 0 ? (
          <p className="text-text-secondary text-sm mb-4">No leave records found.</p>
        ) : (
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-card-border">
                  <th className="px-3 py-2 text-xs uppercase text-text-secondary">From</th>
                  <th className="px-3 py-2 text-xs uppercase text-text-secondary">To</th>
                  <th className="px-3 py-2 text-xs uppercase text-text-secondary">Type</th>
                  <th className="px-3 py-2 text-xs uppercase text-text-secondary">Reason</th>
                  <th className="px-3 py-2 text-xs uppercase text-text-secondary">Status</th>
                  {canManageLeave && (
                    <th className="px-3 py-2 text-xs uppercase text-text-secondary">Action</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {leaves.map((l) => (
                  <tr key={l.id} className="border-b border-card-border/50">
                    <td className="px-3 py-2 text-sm text-text-primary">{l.start_date}</td>
                    <td className="px-3 py-2 text-sm text-text-primary">{l.end_date}</td>
                    <td className="px-3 py-2 text-sm text-text-primary">{l.leave_type || "-"}</td>
                    <td className="px-3 py-2 text-sm text-text-primary">{l.reason || "-"}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                          l.is_approved
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {l.is_approved ? "Approved" : "Pending"}
                      </span>
                    </td>
                    {canManageLeave && (
                      <td className="px-3 py-2">
                        {!l.is_approved && (
                          <button
                            onClick={() => handleApproveLeave(l.id)}
                            disabled={approvingLeaveId === l.id}
                            className="text-xs text-accent hover:text-accent-hover disabled:opacity-50"
                          >
                            {approvingLeaveId === l.id ? "..." : "Approve"}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {canManageLeave && (
          <form
            onSubmit={handleLeaveSubmit}
            className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
          >
            <div>
              <label className="text-text-secondary text-xs uppercase mb-1 block">From</label>
              <input
                type="date"
                value={leaveForm.start_date}
                onChange={(e) =>
                  setLeaveForm((f) => ({ ...f, start_date: e.target.value }))
                }
                className="w-full bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                required
              />
            </div>
            <div>
              <label className="text-text-secondary text-xs uppercase mb-1 block">To</label>
              <input
                type="date"
                value={leaveForm.end_date}
                onChange={(e) => setLeaveForm((f) => ({ ...f, end_date: e.target.value }))}
                className="w-full bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                required
              />
            </div>
            <div>
              <label className="text-text-secondary text-xs uppercase mb-1 block">Type</label>
              <select
                value={leaveForm.leave_type}
                onChange={(e) =>
                  setLeaveForm((f) => ({ ...f, leave_type: e.target.value }))
                }
                className="w-full bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                required
              >
                <option value="">Select type</option>
                <option value="SICK">Sick Leave</option>
                <option value="PERSONAL">Personal Leave</option>
                <option value="VACATION">Vacation</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <button
                type="submit"
                disabled={savingLeave}
                className="w-full px-4 py-2 bg-accent text-sidebar-text rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {savingLeave ? "Saving..." : "Record Leave"}
              </button>
            </div>
            <div className="md:col-span-4">
              <label className="text-text-secondary text-xs uppercase mb-1 block">Reason</label>
              <input
                type="text"
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm((f) => ({ ...f, reason: e.target.value }))}
                className="w-full bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default StaffDetail;