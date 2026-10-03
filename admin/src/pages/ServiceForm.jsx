import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { servicesApi, serviceCategoriesApi } from "../api/services.api";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/common/PageHeader";
import LoadingState from "../components/common/LoadingState";
import Toast from "../components/common/Toast";

function ServiceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { can } = useAuth();
  const isEditMode = Boolean(id);

  const requiredPermission = isEditMode ? "services.update" : "services.create";

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    duration_minutes: "",
    category: "",
    is_active: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!can(requiredPermission)) {
      navigate("/admin/services", { replace: true });
    }
  }, [can, navigate, requiredPermission]);

  useEffect(() => {
    serviceCategoriesApi.getAll().then(({ data }) => setCategories(data));
  }, []);

  useEffect(() => {
    if (isEditMode) {
      servicesApi
        .getById(id)
        .then(({ data }) => {
          setForm({
            name: data.name || "",
            description: data.description || "",
            price: data.price || "",
            duration_minutes: data.duration_minutes || "",
            category: data.category || "",
            is_active: data.is_active,
          });
          setImagePreview(data.image_url || null);
          setImageFile(null);
        })
        .catch(() => setError("Failed to load service"))
        .finally(() => setLoading(false));
    }
  }, [id, isEditMode]);

  if (!can(requiredPermission)) return null;

  const handleChange = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleImage = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setToast({ type: "error", message: "Please choose a JPG, PNG, or WEBP image." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast({ type: "error", message: "Image must be under 5 MB." });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let payload;
      if (imageFile) {
        const fd = new FormData();
        fd.append("name", form.name);
        fd.append("description", form.description);
        fd.append("price", String(form.price));
        fd.append("duration_minutes", String(form.duration_minutes));
        fd.append("category", String(form.category));
        fd.append("is_active", form.is_active ? "true" : "false");
        fd.append("image", imageFile);
        payload = fd;
      } else {
        payload = {
          ...form,
          price: Number(form.price),
          duration_minutes: Number(form.duration_minutes),
          category: Number(form.category),
        };
      }

      if (isEditMode) {
        await servicesApi.update(id, payload);
      } else {
        await servicesApi.create(payload);
      }
      setToast({ type: "success", message: isEditMode ? "Service updated" : "Service created" });
      setTimeout(() => navigate("/admin/services"), 800);
    } catch (err) {
      const detail = err.response?.data;
      const message =
        (detail && (detail.detail || Object.values(detail)?.[0]?.[0])) ||
        "Failed to save service";
      setError(message);
      setToast({ type: "error", message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading service..." />;
  }

  const inputBase =
    "w-full px-4 py-2.5 bg-hover-bg border border-card-border rounded-lg text-text-primary text-sm placeholder-text-secondary outline-none transition-all duration-200 focus:border-accent";
  const labelBase = "block text-sm font-medium text-text-secondary mb-1.5";

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={isEditMode ? "Edit Service" : "Add Service"}
        description={isEditMode ? "Update service details" : "Create a new salon service"}
      />

      <form
        onSubmit={handleSubmit}
        className="bg-card-bg border border-card-border rounded-xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-card-border">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
            Service Details
          </h3>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className={labelBase}>Service Name</label>
              <input
                type="text"
                value={form.name}
                onChange={handleChange("name")}
                placeholder="e.g. Bridal Makeup"
                className={inputBase}
                required
              />
            </div>

            <div>
              <label className={labelBase}>Category</label>
              <select
                value={form.category}
                onChange={handleChange("category")}
                className={inputBase}
                required
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={handleChange("is_active")}
                    className="peer sr-only"
                  />
                  <div className="w-10 h-5 bg-card-border rounded-full peer-checked:bg-accent transition-colors duration-200" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-text-primary rounded-full shadow-sm transition-transform duration-200 peer-checked:translate-x-5 peer-checked:bg-[#0a0a0a]" />
                </div>
                <span className="text-sm text-text-primary font-medium">Active Service</span>
              </label>
            </div>

            <div className="md:col-span-2">
              <label className={labelBase}>Description</label>
              <textarea
                value={form.description}
                onChange={handleChange("description")}
                placeholder="Brief description of the service..."
                rows={3}
                className={`${inputBase} resize-none`}
              />
            </div>

            <div>
              <label className={labelBase}>Price (₹)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary text-sm font-medium">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange("price")}
                  placeholder="0.00"
                  className={`${inputBase} pl-8`}
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelBase}>Duration (minutes)</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={form.duration_minutes}
                  onChange={handleChange("duration_minutes")}
                  placeholder="e.g. 60"
                  className={`${inputBase} pr-14`}
                  required
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary text-xs font-medium">
                  min
                </span>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={labelBase}>Service Image</label>
              <div className="flex items-start gap-4">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="relative w-40 h-28 rounded-lg border-2 border-dashed overflow-hidden flex items-center justify-center transition-colors hover:border-accent"
                  style={{
                    borderColor: imagePreview ? "var(--accent)" : "var(--card-border)",
                    background: "var(--hover-bg)",
                  }}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Service" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="text-center px-2">
                      <p className="text-xl mb-1">🖼</p>
                      <p className="text-xs text-text-secondary">Click to upload</p>
                    </div>
                  )}
                  {imagePreview && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                      <p className="text-xs text-white font-medium">Change</p>
                    </div>
                  )}
                </button>
                <div className="pt-1">
                  <p className="text-sm text-text-primary">Shown on the customer site</p>
                  <p className="mt-1 text-xs text-text-secondary">JPG, PNG or WEBP · Max 5 MB</p>
                  {imageFile && (
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="mt-3 text-xs text-danger hover:underline"
                    >
                      Undo selection
                    </button>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleImage(e.target.files?.[0])}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-card-border flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/services")}
            className="px-5 py-2 text-sm font-medium text-text-secondary border border-card-border rounded-lg hover:bg-hover-bg hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 text-sm font-semibold rounded-lg bg-accent text-[#0a0a0a] hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : isEditMode ? "Save Changes" : "Create Service"}
          </button>
        </div>
      </form>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}

export default ServiceForm;
