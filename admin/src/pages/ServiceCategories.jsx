import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { serviceCategoriesApi } from "../api/services.api";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/common/PageHeader";
import FilterBar from "../components/common/FilterBar";
import DataTable from "../components/common/DataTable";
import StatusBadge from "../components/common/StatusBadge";
import Toast from "../components/common/Toast";

function ServiceCategories() {
  const navigate = useNavigate();
  const { can } = useAuth();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [togglingId, setTogglingId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [toast, setToast] = useState(null);

  // image state
  const [imgBefore, setImgBefore]           = useState(null);  // File
  const [imgAfter,  setImgAfter]            = useState(null);  // File
  const [previewBefore, setPreviewBefore]   = useState(null);  // URL string
  const [previewAfter,  setPreviewAfter]    = useState(null);  // URL string

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await serviceCategoriesApi.getAll();
      setCategories(data);
    } catch (err) {
      setError("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    let result = [...categories];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name?.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query)
      );
    }

    if (statusFilter) {
      const isActive = statusFilter === "active";
      result = result.filter((c) => c.is_active === isActive);
    }

    return result;
  }, [categories, searchQuery, statusFilter]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm({ name: "", description: "" });
    setImgBefore(null); setImgAfter(null);
    setPreviewBefore(null); setPreviewAfter(null);
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (category) => {
    setEditingId(category.id);
    setForm({ name: category.name, description: category.description || "" });
    setImgBefore(null); setImgAfter(null);
    setPreviewBefore(category.image_before_url || null);
    setPreviewAfter(category.image_after_url   || null);
    setFormError(null);
    setShowForm(true);
  };

  const pickImage = (which, file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (which === "before") { setImgBefore(file); setPreviewBefore(url); }
    else                    { setImgAfter(file);  setPreviewAfter(url);  }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      let data;
      const hasImage = imgBefore || imgAfter;

      if (editingId) {
        if (hasImage) {
          const fd = new FormData();
          fd.append("name", form.name);
          fd.append("description", form.description);
          if (imgBefore) fd.append("image_before", imgBefore);
          if (imgAfter)  fd.append("image_after",  imgAfter);
          ({ data } = await serviceCategoriesApi.updateMultipart(editingId, fd));
        } else {
          ({ data } = await serviceCategoriesApi.update(editingId, form));
        }
        setCategories((prev) => prev.map((c) => (c.id === editingId ? data : c)));
        setToast({ type: "success", message: "Category updated" });
      } else {
        if (hasImage) {
          const fd = new FormData();
          fd.append("name", form.name);
          fd.append("description", form.description);
          if (imgBefore) fd.append("image_before", imgBefore);
          if (imgAfter)  fd.append("image_after",  imgAfter);
          ({ data } = await serviceCategoriesApi.createMultipart(fd));
        } else {
          ({ data } = await serviceCategoriesApi.create(form));
        }
        setCategories((prev) => [data, ...prev]);
        setToast({ type: "success", message: "Category created" });
      }
      setShowForm(false);
    } catch (err) {
      const detail = err.response?.data;
      const message =
        (detail && (detail.detail || Object.values(detail)?.[0]?.[0])) ||
        "Failed to save category";
      setFormError(message);
      setToast({ type: "error", message });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (category) => {
    const confirmMsg = category.is_active
      ? `Deactivate "${category.name}"? Its services will remain but the category will be marked inactive.`
      : `Reactivate "${category.name}"?`;
    if (!window.confirm(confirmMsg)) return;

    setTogglingId(category.id);
    try {
      const { data } = await serviceCategoriesApi.deactivate(category.id);
      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? { ...c, is_active: data.is_active } : c))
      );
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const columns = [
    { key: "name", label: "Name" },
    {
      key: "description",
      label: "Description",
      render: (value) => <span className="text-sm text-text-secondary">{value || "—"}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (_, item) => <StatusBadge status={item.is_active ? "ACTIVE" : "INACTIVE"} />,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <PageHeader
          title="Service Categories"
          description="Manage service categories and groupings"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/services")}
            className="px-4 py-2 bg-hover-bg border border-card-border rounded-lg text-text-primary text-sm hover:border-accent transition-colors"
          >
            Back to Services
          </button>
          {can("services.create") && (
            <button
              onClick={openCreateForm}
              className="px-4 py-2 bg-accent text-sidebar-text rounded-lg text-sm font-semibold shadow-sm shadow-accent/30 hover:bg-accent-hover transition-colors"
            >
              + Add Category
            </button>
          )}
        </div>
      </div>

      <FilterBar
        searchPlaceholder="Search by name or description..."
        onSearch={setSearchQuery}
        filters={[
          {
            key: "status",
            value: statusFilter,
            options: [
              { value: "", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ],
          },
        ]}
        onFilterChange={(key, value) => {
          if (key === "status") setStatusFilter(value);
        }}
      />

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-card-bg border border-card-border rounded-xl p-6 mb-6 space-y-5 max-w-2xl"
        >
          <h4 className="text-text-primary font-semibold">
            {editingId ? "Edit Category" : "New Category"}
          </h4>
          <div>
            <label className="block text-sm text-text-secondary mb-2">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-2.5 bg-hover-bg border border-card-border rounded-lg text-text-primary outline-none focus:border-accent"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full px-4 py-2.5 bg-hover-bg border border-card-border rounded-lg text-text-primary outline-none focus:border-accent resize-none"
            />
          </div>

          {/* Before / After images */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Image — Default (Before Hover)", key: "before", preview: previewBefore, setter: (f) => pickImage("before", f) },
              { label: "Image — On Hover (After)",       key: "after",  preview: previewAfter,  setter: (f) => pickImage("after",  f) },
            ].map(({ label, key, preview, setter }) => (
              <div key={key}>
                <label className="block text-sm text-text-secondary mb-2">{label}</label>
                <label className="cursor-pointer block">
                  <div className="relative w-full h-36 rounded-lg border-2 border-dashed overflow-hidden flex items-center justify-center transition-colors hover:border-accent"
                    style={{ borderColor: preview ? 'var(--accent)' : 'var(--card-border)', background: 'var(--hover-bg)' }}>
                    {preview
                      ? <img src={preview} alt={key} className="absolute inset-0 w-full h-full object-cover rounded-lg" />
                      : <div className="text-center">
                          <p className="text-2xl mb-1">🖼</p>
                          <p className="text-xs text-text-secondary">Click to upload</p>
                        </div>
                    }
                    {preview && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                        <p className="text-xs text-white font-medium">Change image</p>
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => setter(e.target.files[0])} />
                </label>
              </div>
            ))}
          </div>

          {formError && <p className="text-sm text-danger">{formError}</p>}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-accent text-sidebar-text font-medium rounded-lg hover:bg-accent-hover transition disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Save Changes" : "Create Category"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-text-secondary border border-card-border rounded-lg hover:bg-hover-bg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <DataTable
        columns={columns}
        data={filteredCategories}
        keyExtractor={(item) => item.id}
        loading={loading}
        error={error}
        onRetry={fetchCategories}
        emptyTitle="No categories found"
        emptyMessage="Try adjusting your search or filters."
        actions={(item) => (
          <div className="flex gap-3">
            {can("services.update") && (
              <button
                onClick={() => openEditForm(item)}
                className="text-xs text-text-secondary hover:text-text-primary transition"
              >
                Edit
              </button>
            )}
            {can("services.deactivate") && (
              <button
                onClick={() => handleToggleActive(item)}
                disabled={togglingId === item.id}
                className={`text-xs transition disabled:opacity-50 ${
                  item.is_active
                    ? "text-danger hover:text-red-600"
                    : "text-green-600 hover:text-green-500"
                }`}
              >
                {togglingId === item.id
                  ? "..."
                  : item.is_active
                  ? "Deactivate"
                  : "Activate"}
              </button>
            )}
          </div>
        )}
      />

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}

export default ServiceCategories;