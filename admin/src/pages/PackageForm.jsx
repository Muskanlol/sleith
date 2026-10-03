import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { packagesApi } from "../api/packages.api";
import { servicesApi } from "../api/services.api";

const PACKAGE_TYPES = ["CLASSIC", "PREMIUM", "EXCLUSIVE"];

function emptyBenefit() {
  return { service: "", quantity: 1 };
}

function PackageForm({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = mode === "edit";

  const [services, setServices] = useState([]);
  const [form, setForm] = useState({
    name: "",
    package_type: "CLASSIC",
    description: "",
    price: "",
    validity_days: "",
  });
  const [benefits, setBenefits] = useState([emptyBenefit()]);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    servicesApi.getAll()
      .then(({ data }) => setServices(data))
      .catch(() => setServices([]));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    packagesApi.getById(id)
      .then(({ data }) => {
        setForm({
          name: data.name,
          package_type: data.package_type,
          description: data.description || "",
          price: data.price,
          validity_days: data.validity_days,
        });
        setBenefits(
          data.benefits && data.benefits.length > 0
            ? data.benefits.map((b) => ({ service: b.service, quantity: b.quantity }))
            : [emptyBenefit()]
        );
      })
      .catch(() => setError("Failed to load package"))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleBenefitChange = (index, field, value) => {
    setBenefits((prev) =>
      prev.map((b, i) => (i === index ? { ...b, [field]: value } : b))
    );
  };

  const addBenefitRow = () => setBenefits((prev) => [...prev, emptyBenefit()]);

  const removeBenefitRow = (index) =>
    setBenefits((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});

    const cleanBenefits = benefits
      .filter((b) => b.service)
      .map((b) => ({ service: Number(b.service), quantity: Number(b.quantity) || 1 }));

    const payload = {
      ...form,
      price: Number(form.price),
      validity_days: Number(form.validity_days),
      benefits: cleanBenefits,
    };

    try {
      if (isEdit) {
        await packagesApi.update(id, payload);
      } else {
        await packagesApi.create(payload);
      }
      navigate("/admin/packages");
    } catch (err) {
      if (err.response?.data && typeof err.response.data === "object") {
        setFieldErrors(err.response.data);
      } else {
        setError("Failed to save package");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading package...</div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-text-primary text-xl font-semibold mb-6">
        {isEdit ? "Edit Package" : "Add Package"}
      </h3>

      <form
        onSubmit={handleSubmit}
        className="bg-card-bg border border-card-border rounded-xl p-6 space-y-5 max-w-2xl"
      >
        {error && (
          <div className="bg-danger/10 border border-danger/20 rounded-lg p-3 text-danger text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm text-text-secondary mb-1">Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent"
          />
          {fieldErrors.name && (
            <p className="text-danger text-xs mt-1">{fieldErrors.name[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">Package Type</label>
          <select
            name="package_type"
            value={form.package_type}
            onChange={handleChange}
            className="w-full bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent"
          >
            {PACKAGE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-text-secondary mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className="w-full bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">Price (₹)</label>
            <input
              name="price"
              type="number"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              required
              className="w-full bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent"
            />
            {fieldErrors.price && (
              <p className="text-danger text-xs mt-1">{fieldErrors.price[0]}</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">Validity (days)</label>
            <input
              name="validity_days"
              type="number"
              value={form.validity_days}
              onChange={handleChange}
              required
              className="w-full bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm text-text-secondary">Included Services</label>
            <button
              type="button"
              onClick={addBenefitRow}
              className="text-xs text-accent hover:text-accent-hover transition"
            >
              + Add Service
            </button>
          </div>

          <div className="space-y-2">
            {benefits.map((b, index) => (
              <div key={index} className="flex gap-2 items-center">
                <select
                  value={b.service}
                  onChange={(e) => handleBenefitChange(index, "service", e.target.value)}
                  className="flex-1 bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent"
                >
                  <option value="">Select service…</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={b.quantity}
                  onChange={(e) => handleBenefitChange(index, "quantity", e.target.value)}
                  className="w-24 bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-accent"
                  placeholder="Qty"
                />
                {benefits.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBenefitRow(index)}
                    className="text-danger hover:text-red-600 text-xs px-2"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-accent text-sidebar-text px-4 py-2 rounded-lg font-semibold hover:bg-accent-hover transition disabled:opacity-50"
          >
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Package"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/packages")}
            className="px-4 py-2 bg-hover-bg border border-card-border rounded-lg text-text-primary text-sm hover:border-accent transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default PackageForm;