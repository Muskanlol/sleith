import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { appointmentsApi } from "../api/appointments.api";
import { ROLES } from "../utils/constants";
import PageHeader from "../components/common/PageHeader";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import ErrorState from "../components/common/ErrorState";
import Toast from "../components/common/Toast";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { useMemo } from "react";
const STATUS_STYLES = {
  PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  CONFIRMED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  COMPLETED: "bg-green-500/10 text-green-400 border-green-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
  RESCHEDULED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export default function Appointments() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");

  const [confirmDialog, setConfirmDialog] = useState(null);
  const [rescheduleModal, setRescheduleModal] = useState(null);
  const [rescheduleError, setRescheduleError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1); 
  const itemsPerPage = 10; 

  const isAdmin = user?.role === ROLES.ADMIN;
  const isManager = user?.role === ROLES.MANAGER;
  const isStaff = user?.role === ROLES.STAFF;
  const canManage = isAdmin || isManager;

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await appointmentsApi.getAll();
      setAppointments(res.data.results || res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleComplete = (appointment) => {
    setConfirmDialog({
      title: "Mark as Completed?",
      message: `Mark appointment #${appointment.id} for ${appointment.customer_name} as completed?`,
      onConfirm: () => updateStatus(appointment.id, "COMPLETED"),
    });
  };

  const handleReschedule = (appointment) => {
    setRescheduleError("");
    setRescheduleModal({
      appointment,
      newDate: appointment.appointment_date,
      newStartTime: appointment.start_time,
      newEndTime: appointment.end_time,
      notes: "",
    });
  };

  const validateReschedule = () => {
    if (!rescheduleModal) return "No appointment selected";

    const { newDate, newStartTime, newEndTime } = rescheduleModal;

    if (!newDate) return "Please select a date";
    if (!newStartTime) return "Please select a start time";
    if (!newEndTime) return "Please select an end time";

    const start = new Date(`2000-01-01T${newStartTime}`);
    const end = new Date(`2000-01-01T${newEndTime}`);

    if (end <= start) {
      return "End time must be after start time";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(newDate);

    if (selectedDate < today) {
      return "Cannot reschedule to a past date";
    }

    return "";
  };

  const submitReschedule = async () => {
    if (!rescheduleModal) return;

    const validationError = validateReschedule();
    if (validationError) {
      setRescheduleError(validationError);
      return;
    }

    const { appointment, newDate, newStartTime, newEndTime, notes } = rescheduleModal;

    setActionLoading(true);
    setRescheduleError("");

    try {
      await appointmentsApi.update(appointment.id, {
        status: "RESCHEDULED",
        appointment_date: newDate,
        start_time: newStartTime,
        end_time: newEndTime,
        notes: notes || `Rescheduled by ${user.full_name}`,
      });
      setToast({ type: "success", message: "Appointment rescheduled successfully" });
      setRescheduleModal(null);
      fetchAppointments();
    } catch (err) {
      const errorMsg = err.response?.data?.end_time?.[0] 
        || err.response?.data?.detail 
        || err.response?.data?.error 
        || "Failed to reschedule";
      setRescheduleError(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    setActionLoading(true);
    try {
      await appointmentsApi.update(id, { status });
      setToast({ type: "success", message: `Appointment marked as ${status}` });
      setConfirmDialog(null);
      fetchAppointments();
    } catch (err) {
      setToast({
        type: "error",
        message: err.response?.data?.detail || err.response?.data?.error || "Failed to update status",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (appointment) => {
    setConfirmDialog({
      title: "Delete Appointment?",
      message: `Are you sure you want to delete appointment made by ${appointment.customer_name}?`,
      isDanger: true,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await appointmentsApi.remove(appointment.id);
          setToast({ type: "success", message: "Appointment deleted" });
          setConfirmDialog(null);
          fetchAppointments();
        } catch (err) {
          setToast({ type: "error", message: "Failed to delete appointment" });
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const filteredAppointments = appointments.filter((app) => {
    if (statusFilter !== "ALL" && app.status !== statusFilter) return false;
    if (dateFilter && app.appointment_date !== dateFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        app.customer_name?.toLowerCase().includes(term) ||
        app.id?.toString().includes(term) ||
        app.staff_name?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / itemsPerPage));

  const paginatedAppointments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAppointments.slice(start, start + itemsPerPage);
  }, [filteredAppointments, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    const [hours, minutes] = timeStr.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  if (loading) return <LoadingState message="Loading appointments…" />;
  if (error) return <ErrorState message={error} onRetry={fetchAppointments} />;

  return (
    <div>
      <PageHeader
        title="Appointments"
        subtitle={isStaff ? "Your assigned appointments" : "Manage all appointments"}
      />

      <div className="bg-card-bg border border-card-border rounded-xl p-4 mb-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by customer or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-secondary flex-1 min-w-50 focus:outline-none focus:border-accent"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="RESCHEDULED">Rescheduled</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
        />
        {(searchTerm || statusFilter !== "ALL" || dateFilter) && (
          <button
            onClick={() => { setSearchTerm(""); setStatusFilter("ALL"); setDateFilter(""); }}
            className="text-sm text-accent hover:text-accent-hover transition"
          >
            Clear Filters
          </button>
        )}
        <span className="text-xs text-text-secondary ml-auto">
          {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? "s" : ""}
        </span>
      </div>

      {canManage && (
        <div className="mb-6">
          <button
            onClick={() => navigate("/admin/appointments/new")}
            className="px-4 py-2 bg-accent text-sidebar-text font-medium rounded-lg hover:bg-accent-hover transition"
          >
            + New Appointment
          </button>
        </div>
      )}

      {!filteredAppointments.length ? (
        <EmptyState message="No appointments match your filters" />
      ) : (
        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-hover-bg border-b border-card-border">
                <tr>
                  <th className="px-6 py-4 text-sm font-medium text-text-secondary">ID</th>
                  <th className="px-6 py-4 text-sm font-medium text-text-secondary">Customer</th>
                  <th className="px-6 py-4 text-sm font-medium text-text-secondary">Staff</th>
                  <th className="px-6 py-4 text-sm font-medium text-text-secondary">Date</th>
                  <th className="px-6 py-4 text-sm font-medium text-text-secondary">Time</th>
                  <th className="px-6 py-4 text-sm font-medium text-text-secondary">Status</th>
                  <th className="px-6 py-4 text-sm font-medium text-text-secondary">WhatsApp</th>
                  <th className="px-6 py-4 text-sm font-medium text-text-secondary text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {paginatedAppointments.map((app) => (
                  <tr key={app.id} className="hover:bg-hover-bg/50 transition">
                    <td className="px-6 py-4 text-sm text-text-primary font-mono">#{app.id}</td>
                    <td className="px-6 py-4">
                      <div className="text-text-primary text-sm font-medium">{app.customer_name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{app.staff_name}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{formatDate(app.appointment_date)}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {formatTime(app.start_time)} - {formatTime(app.end_time)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_STYLES[app.status] || STATUS_STYLES.PENDING}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-text-secondary max-w-55">
                      {app.last_whatsapp ? (
                        <div>
                          <p>{app.last_whatsapp.kind.replace('_', ' ')} · {app.last_whatsapp.status}</p>
                          {app.last_whatsapp.error && (
                            <p className="text-[10px] text-red-400/80 mt-0.5 leading-snug">{app.last_whatsapp.error}</p>
                          )}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap">1
                        {(canManage ? ["PENDING","CONFIRMED"].includes(app.status) : isStaff && app.status === "CONFIRMED") && (
                          <>
                            <button
                              onClick={() => handleComplete(app)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition disabled:opacity-50"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => handleReschedule(app)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition disabled:opacity-50"
                            >
                              Reschedule
                            </button>
                          </>
                        )}

                        {canManage && (
                          <>
                            <button
                              onClick={() => navigate(`/admin/appointments/${app.id}`)}
                              className="px-3 py-1.5 text-xs bg-accent/20 text-accent border border-accent/30 rounded-lg hover:bg-accent/30 transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(app)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 text-xs bg-danger/10 text-danger border border-danger/20 rounded-lg hover:bg-danger/20 transition disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-card-border">
              <span className="text-xs text-text-secondary">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs bg-hover-bg border border-card-border rounded-lg text-text-primary hover:border-accent transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs bg-hover-bg border border-card-border rounded-lg text-text-primary hover:border-accent transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {confirmDialog && (
        <ConfirmDialog
          isOpen={true}
          title={confirmDialog.title}
          message={confirmDialog.message}
          isDanger={confirmDialog.isDanger}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
          confirmText={actionLoading ? "Processing..." : "Confirm"}
          cancelText="Cancel"
        />
      )}

      {rescheduleModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-card-bg border border-card-border rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-text-primary text-lg font-semibold">Reschedule Appointment</h4>
                <p className="text-text-secondary text-sm mt-1">
                  #{rescheduleModal.appointment.id} - {rescheduleModal.appointment.customer_name}
                </p>
              </div>
              <button
                onClick={() => setRescheduleModal(null)}
                className="text-text-secondary hover:text-text-primary text-xl"
              >
                ×
              </button>
            </div>

            {rescheduleError && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
                {rescheduleError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">
                  New Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  value={rescheduleModal.newDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => {
                    setRescheduleError("");
                    setRescheduleModal({ ...rescheduleModal, newDate: e.target.value });
                  }}
                  className="w-full px-4 py-2.5 bg-hover-bg border border-card-border rounded-lg text-text-primary outline-none focus:border-accent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-2">
                    Start Time <span className="text-danger">*</span>
                  </label>
                  <input
                    type="time"
                    value={rescheduleModal.newStartTime}
                    onChange={(e) => {
                      setRescheduleError("");
                      setRescheduleModal({ ...rescheduleModal, newStartTime: e.target.value });
                    }}
                    className="w-full px-4 py-2.5 bg-hover-bg border border-card-border rounded-lg text-text-primary outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-2">
                    End Time <span className="text-danger">*</span>
                  </label>
                  <input
                    type="time"
                    value={rescheduleModal.newEndTime}
                    onChange={(e) => {
                      setRescheduleError("");
                      setRescheduleModal({ ...rescheduleModal, newEndTime: e.target.value });
                    }}
                    className="w-full px-4 py-2.5 bg-hover-bg border border-card-border rounded-lg text-text-primary outline-none focus:border-accent"
                  />
                </div>
              </div>

              <p className="text-xs text-text-secondary">
                End time must be after start time
              </p>

              <div>
                <label className="block text-sm text-text-secondary mb-2">Notes (Optional)</label>
                <textarea
                  value={rescheduleModal.notes}
                  onChange={(e) => setRescheduleModal({ ...rescheduleModal, notes: e.target.value })}
                  rows={2}
                  placeholder="Reason for rescheduling..."
                  className="w-full px-4 py-2.5 bg-hover-bg border border-card-border rounded-lg text-text-primary outline-none focus:border-accent resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setRescheduleModal(null)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={submitReschedule}
                disabled={actionLoading}
                className="px-4 py-2 text-sm bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition disabled:opacity-40"
              >
                {actionLoading ? "Saving..." : "Reschedule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}