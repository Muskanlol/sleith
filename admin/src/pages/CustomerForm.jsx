import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { customersApi } from "../api/customers.api";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/common/PageHeader";

function CustomerForm() {
  const navigate = useNavigate();
  const { can } = useAuth();

  const [form, setForm] = useState({ full_name: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!can("customers.create")) {
      navigate("/admin/customers", { replace: true });
    }
  }, [can, navigate]);

  if (!can("customers.create")) return null;

  const handleChange = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { data } = await customersApi.create(form);
      navigate(`/admin/customers/${data.id}`);
    } catch (err) {
      const detail = err.response?.data;
      const message =
        (detail && (detail.detail || Object.values(detail)?.[0]?.[0])) ||
        "Failed to create customer";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Add Customer" description="Create a new customer record" />
        <button
          onClick={() => navigate("/admin/customers")}
          className="px-4 py-2 bg-hover-bg border border-card-border rounded-lg text-text-primary text-sm hover:border-accent transition-colors"
        >
          Cancel
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-card-bg border border-card-border rounded-lg p-6 max-w-xl space-y-4 shadow-sm shadow-accent/5"
      >
        <div>
          <label className="text-text-secondary text-xs uppercase mb-1 block">
            Full Name
          </label>
          <input
            type="text"
            value={form.full_name}
            onChange={handleChange("full_name")}
            className="w-full bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
            required
          />
        </div>

        <div>
          <label className="text-text-secondary text-xs uppercase mb-1 block">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            className="w-full bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
            required
          />
        </div>

        <div>
          <label className="text-text-secondary text-xs uppercase mb-1 block">
            Phone
          </label>
          <input
            type="text"
            value={form.phone}
            onChange={handleChange("phone")}
            className="w-full bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
          />
        </div>

        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-accent text-white dark:text-sidebar-bg rounded-lg text-sm font-semibold shadow-sm shadow-accent/30 disabled:opacity-50 hover:bg-accent-hover transition-colors"
          >
            {saving ? "Creating..." : "Create Customer"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CustomerForm;