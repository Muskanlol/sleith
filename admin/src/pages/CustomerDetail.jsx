import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { customersApi } from "../api/customers.api";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/common/PageHeader";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";

function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [toggling, setToggling] = useState(false);

  const fetchCustomer = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await customersApi.getById(id);
      setCustomer(data);
      setEditForm({
        full_name: data.full_name || "",
        email: data.email || "",
        phone: data.phone || "",
      });
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load customer");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCustomer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <LoadingState message="Loading customer..." />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  const appointments = customer?.appointments || [];
  const packages = customer?.packages || [];
  const payments = customer?.payments || [];

  const academyApplications = customer?.academy_applications || [];
  const academyEnrollments = customer?.academy_enrollments || [];
  const isAcademyStudent = academyApplications.length > 0 || academyEnrollments.length > 0;

  const handleEditSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const { data } = await customersApi.update(id, editForm);
      setCustomer((prev) => ({ ...prev, ...data }));
      setIsEditing(false);
    } catch (err) {
      setSaveError(err.response?.data?.detail || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    const confirmMsg = customer.is_active
      ? "Deactivate this customer? They will no longer be able to log in or book."
      : "Reactivate this customer?";
    if (!window.confirm(confirmMsg)) return;

    setToggling(true);
    try {
      const { data } = await customersApi.deactivate(id);
      setCustomer((prev) => ({ ...prev, is_active: data.is_active }));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update status");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <PageHeader title={customer?.full_name || "Customer Detail"} description={`ID: ${id}`} />

        <div className="flex items-center gap-2">
          {can("customers.update") && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-hover-bg border border-card-border rounded-lg text-text-primary text-sm hover:border-accent transition-colors"
            >
              Edit
            </button>
          )}

          {can("customers.deactivate") && (
            <button
              onClick={handleToggleActive}
              disabled={toggling}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${
                customer.is_active
                  ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30 dark:hover:bg-red-500/20"
                  : "bg-green-50 text-green-600 border-green-200 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/30 dark:hover:bg-green-500/20"
              }`}
            >
              {toggling ? "Please wait..." : customer.is_active ? "Deactivate" : "Activate"}
            </button>
          )}
        </div>
      </div>

      {isEditing && (
        <form
          onSubmit={handleEditSave}
          className="bg-card-bg border border-card-border rounded-lg p-6 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 shadow-sm shadow-accent/5"
        >
          <div>
            <label className="text-text-secondary text-xs uppercase mb-1 block">Full Name</label>
            <input
              type="text"
              value={editForm.full_name}
              onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
              className="w-full bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
              required
            />
          </div>
          <div>
            <label className="text-text-secondary text-xs uppercase mb-1 block">Email</label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
              required
            />
          </div>
          <div>
            <label className="text-text-secondary text-xs uppercase mb-1 block">Phone</label>
            <input
              type="text"
              value={editForm.phone}
              onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          {saveError && (
            <p className="md:col-span-3 text-sm text-red-500 dark:text-red-400">{saveError}</p>
          )}

          <div className="md:col-span-3 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-accent text-white dark:text-sidebar-bg rounded-lg text-sm font-semibold shadow-sm shadow-accent/30 disabled:opacity-50 hover:bg-accent-hover transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setSaveError(null);
                setEditForm({
                  full_name: customer.full_name || "",
                  email: customer.email || "",
                  phone: customer.phone || "",
                });
              }}
              className="px-4 py-2 bg-hover-bg border border-card-border rounded-lg text-text-primary text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card-bg border border-card-border rounded-lg p-6 shadow-sm shadow-accent/5">
          <h3 className="text-text-primary font-semibold mb-4 border-l-4 border-accent pl-3 dark:border-l-0 dark:pl-0">Profile</h3>
          <div className="space-y-3">
            <div>
              <p className="text-text-secondary text-xs uppercase">Full Name</p>
              <p className="text-text-primary">{customer.full_name}</p>
            </div>
            <div>
              <p className="text-text-secondary text-xs uppercase">Email</p>
              <p className="text-text-primary">{customer.email}</p>
            </div>
            <div>
              <p className="text-text-secondary text-xs uppercase">Phone</p>
              <p className="text-text-primary">{customer.phone || "N/A"}</p>
            </div>
            <div>
              <p className="text-text-secondary text-xs uppercase">Status</p>
              <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                customer.is_active
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}>
                {customer.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <div>
              <p className="text-text-secondary text-xs uppercase">Joined</p>
              <p className="text-text-primary">
                {new Date(customer.date_joined).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card-bg border border-card-border rounded-lg p-6 shadow-sm shadow-accent/5">
          <h3 className="text-text-primary font-semibold mb-4 border-l-4 border-accent pl-3 dark:border-l-0 dark:pl-0">Account Info</h3>
          <div className="space-y-3">
            <div>
              <p className="text-text-secondary text-xs uppercase">Role</p>
              <p className="text-text-primary capitalize">{customer.role?.toLowerCase()}</p>
            </div>
            <div>
              <p className="text-text-secondary text-xs uppercase">Email Verified</p>
              <p className="text-text-primary">{customer.is_email_verified ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-text-secondary text-xs uppercase">Customer ID</p>
              <p className="text-text-primary text-sm font-mono">{customer.id}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card-bg border border-card-border rounded-lg p-6 mt-6 shadow-sm shadow-accent/5">
        <h3 className="text-text-primary font-semibold mb-4 border-l-4 border-accent pl-3 dark:border-l-0 dark:pl-0">Appointments</h3>
        {appointments.length === 0 ? (
          <p className="text-text-secondary text-sm">No appointments found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-card-border">
                  <th className="px-3 py-2 text-xs uppercase text-[#9A5F55] dark:text-text-secondary">Date</th>
                  <th className="px-3 py-2 text-xs uppercase text-[#9A5F55] dark:text-text-secondary">Time</th>
                  <th className="px-3 py-2 text-xs uppercase text-[#9A5F55] dark:text-text-secondary">Staff</th>
                  <th className="px-3 py-2 text-xs uppercase text-[#9A5F55] dark:text-text-secondary">Services</th>
                  <th className="px-3 py-2 text-xs uppercase text-[#9A5F55] dark:text-text-secondary">Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id} className="border-b border-[#F0DEDA] dark:border-card-border/50">
                    <td className="px-3 py-2 text-sm text-text-primary">{a.appointment_date}</td>
                    <td className="px-3 py-2 text-sm text-text-primary">{a.start_time}</td>
                    <td className="px-3 py-2 text-sm text-text-primary">{a.staff_name || "-"}</td>
                    <td className="px-3 py-2 text-sm text-text-primary">
                      {a.services?.map((s) => s.service_name).join(", ") || "-"}
                    </td>
                    <td className="px-3 py-2 text-sm text-text-primary">{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-card-bg border border-card-border rounded-lg p-6 mt-6 shadow-sm shadow-accent/5">
        <h3 className="text-text-primary font-semibold mb-4 border-l-4 border-accent pl-3 dark:border-l-0 dark:pl-0">Packages</h3>
        {packages.length === 0 ? (
          <p className="text-text-secondary text-sm">No packages found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-card-border">
                  <th className="px-3 py-2 text-xs uppercase text-[#9A5F55] dark:text-text-secondary">Package</th>
                  <th className="px-3 py-2 text-xs uppercase text-[#9A5F55] dark:text-text-secondary">Price</th>
                  <th className="px-3 py-2 text-xs uppercase text-[#9A5F55] dark:text-text-secondary">Purchased</th>
                  <th className="px-3 py-2 text-xs uppercase text-[#9A5F55] dark:text-text-secondary">Expiry</th>
                  <th className="px-3 py-2 text-xs uppercase text-[#9A5F55] dark:text-text-secondary">Status</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((p) => (
                  <tr key={p.id} className="border-b border-[#F0DEDA] dark:border-card-border/50">
                    <td className="px-3 py-2 text-sm text-text-primary">{p.package_name}</td>
                    <td className="px-3 py-2 text-sm text-text-primary">₹{p.package_price}</td>
                    <td className="px-3 py-2 text-sm text-text-primary">{p.purchase_date}</td>
                    <td className="px-3 py-2 text-sm text-text-primary">{p.expiry_date}</td>
                    <td className="px-3 py-2 text-sm text-text-primary">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-card-bg border border-card-border rounded-lg p-6 mt-6 shadow-sm shadow-accent/5">
        <h3 className="text-text-primary font-semibold mb-4 border-l-4 border-accent pl-3 dark:border-l-0 dark:pl-0">Payments</h3>
        {payments.length === 0 ? (
          <p className="text-text-secondary text-sm">No payments found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-card-border">
                  <th className="px-3 py-2 text-xs uppercase text-[#9A5F55] dark:text-text-secondary">Amount</th>
                  <th className="px-3 py-2 text-xs uppercase text-[#9A5F55] dark:text-text-secondary">For</th>
                  <th className="px-3 py-2 text-xs uppercase text-[#9A5F55] dark:text-text-secondary">Status</th>
                  <th className="px-3 py-2 text-xs uppercase text-[#9A5F55] dark:text-text-secondary">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-[#F0DEDA] dark:border-card-border/50">
                    <td className="px-3 py-2 text-sm text-text-primary">₹{p.amount}</td>
                    <td className="px-3 py-2 text-sm text-text-primary">{p.payment_for}</td>
                    <td className="px-3 py-2 text-sm text-text-primary">{p.status}</td>
                    <td className="px-3 py-2 text-sm text-text-primary">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isAcademyStudent && (
        <div className="bg-card-bg border border-card-border rounded-lg p-6 mt-6 shadow-sm shadow-accent/5">
          <h3 className="text-text-primary font-semibold mb-4 border-l-4 border-accent pl-3 dark:border-l-0 dark:pl-0">Academy</h3>

          {academyApplications.length > 0 && (
            <div className="mb-6">
              <p className="text-text-secondary text-xs uppercase mb-2">Applications</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-card-border">
                      <th className="px-3 py-2 text-xs uppercase text-[#9A5F55] dark:text-text-secondary">Course</th>
                      <th className="px-3 py-2 text-xs uppercase text-[#9A5F55] dark:text-text-secondary">Status</th>
                      <th className="px-3 py-2 text-xs uppercase text-[#9A5F55] dark:text-text-secondary">Applied</th>
                      <th className="px-3 py-2 text-xs uppercase text-[#9A5F55] dark:text-text-secondary">Reviewed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {academyApplications.map((a) => (
                      <tr key={a.id} className="border-b border-[#F0DEDA] dark:border-card-border/50">
                        <td className="px-3 py-2 text-sm text-text-primary">{a.course_name}</td>
                        <td className="px-3 py-2 text-sm text-text-primary">{a.status}</td>
                        <td className="px-3 py-2 text-sm text-text-primary">
                          {new Date(a.applied_at).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2 text-sm text-text-primary">
                          {a.reviewed_at ? new Date(a.reviewed_at).toLocaleDateString() : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {academyEnrollments.length > 0 && (
            <div>
              <p className="text-text-secondary text-xs uppercase mb-2">Batch Enrollments</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-card-border">
                      <th className="px-3 py-2 text-xs uppercase text-[#9A5F55] dark:text-text-secondary">Batch</th>
                      <th className="px-3 py-2 text-xs uppercase text-[#9A5F55] dark:text-text-secondary">Enrolled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {academyEnrollments.map((e) => (
                      <tr key={e.id} className="border-b border-[#F0DEDA] dark:border-card-border/50">
                        <td className="px-3 py-2 text-sm text-text-primary">{e.batch_name}</td>
                        <td className="px-3 py-2 text-sm text-text-primary">
                          {new Date(e.enrolled_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={() => navigate("/admin/customers")}
          className="px-4 py-2 bg-hover-bg border border-card-border rounded-lg text-text-primary text-sm hover:border-accent transition-colors"
        >
          ← Back to Customers
        </button>
      </div>
    </div>
  );
}

export default CustomerDetail;