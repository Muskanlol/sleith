import { useEffect, useState, useRef } from "react";
import { galleryApi } from "../api/gallery.api";
import PageHeader from "../components/common/PageHeader";
import Toast from "../components/common/Toast";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import ConfirmDialog from "../components/common/ConfirmDialog";

/* ── helpers ─────────────────────────────────────────────────────────────── */
const CATEGORIES = ["salon", "academy"];

const emptyForm = { title: "", category: "salon", description: "", order: 0, is_active: true, image: null };

/* ── Item card in the grid ───────────────────────────────────────────────── */
function GalleryCard({ item, onEdit, onDelete, onToggle }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-card-border bg-card-bg transition-shadow hover:shadow-md dark:bg-card-bg">
      {/* Thumbnail */}
      <div className="relative h-44 w-full overflow-hidden bg-hover-bg">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg className="h-10 w-10 text-text-secondary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {/* Active badge overlay */}
        <span
          className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            item.is_active
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-red-500/15 text-red-400 border border-red-500/25"
          }`}
        >
          {item.is_active ? "Active" : "Hidden"}
        </span>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="mb-1 flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
              item.category === "academy"
                ? "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                : "bg-accent/10 text-accent border border-accent/20"
            }`}
          >
            {item.category}
          </span>
          <span className="text-xs text-text-secondary">#{item.order}</span>
        </div>
        <p className="truncate font-semibold text-text-primary">{item.title}</p>
        {item.description && (
          <p className="mt-1 line-clamp-2 text-xs text-text-secondary">{item.description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-card-border px-4 py-2.5">
        <button
          onClick={() => onToggle(item)}
          className="flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors hover:bg-hover-bg text-text-secondary hover:text-text-primary"
        >
          {item.is_active ? "Hide" : "Show"}
        </button>
        <button
          onClick={() => onEdit(item)}
          className="flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors hover:bg-hover-bg text-accent hover:text-accent"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(item)}
          className="flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors hover:bg-red-500/10 text-red-400"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

/* ── Add / Edit modal ─────────────────────────────────────────────────────── */
function GalleryModal({ item, onClose, onSaved }) {
  const [form, setForm]         = useState(item ? { ...item, image: null } : emptyForm);
  const [preview, setPreview]   = useState(item?.image_url || null);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);
  const fileRef                 = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm((f) => ({ ...f, image: file }));
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("title",       form.title);
      fd.append("category",    form.category);
      fd.append("description", form.description);
      fd.append("order",       Number(form.order));
      fd.append("is_active",   form.is_active);
      if (form.image) fd.append("image", form.image);

      if (item?.id) {
        await galleryApi.update(item.id, fd);
      } else {
        await galleryApi.create(fd);
      }
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-card-border bg-page-bg px-3 py-2 text-sm text-text-primary placeholder-text-secondary/50 focus:border-accent focus:outline-none transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-2xl border border-card-border bg-card-bg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-card-border px-6 py-4">
          <h2 className="text-lg font-semibold text-text-primary">
            {item ? "Edit Gallery Item" : "Add Gallery Item"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-hover-bg transition-colors">
            <svg className="h-4 w-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Image upload */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary uppercase tracking-wide">
              Image
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              className="flex h-36 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-card-border bg-hover-bg transition-colors hover:border-accent"
            >
              {preview ? (
                <img src={preview} alt="preview" className="h-full w-full object-cover" />
              ) : (
                <div className="text-center">
                  <svg className="mx-auto h-8 w-8 text-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M12 4v16m8-8H4" />
                  </svg>
                  <p className="mt-1 text-xs text-text-secondary">Click to upload</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>

          {/* Title */}
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wide">Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Hair Ritual"
              className={inputCls}
            />
          </div>

          {/* Category + Order */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wide">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className={inputCls}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wide">Order</label>
              <input
                type="number"
                min={0}
                value={form.order}
                onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary uppercase tracking-wide">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional caption or description"
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Active toggle */}
          <label className="flex cursor-pointer items-center gap-3">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
              <div className={`h-5 w-9 rounded-full transition-colors ${form.is_active ? "bg-accent" : "bg-card-border"}`}>
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.is_active ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
            </div>
            <span className="text-sm text-text-secondary">Visible on customer site</span>
          </label>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 border border-red-500/20">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border border-card-border py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-hover-bg">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50 hover:opacity-90">
              {saving ? "Saving…" : item ? "Save Changes" : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────────────────── */
export default function Gallery() {
  const [items,        setItems]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [modalItem,    setModalItem]    = useState(undefined); // undefined = closed, null = new
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast,        setToast]        = useState(null);
  const [filter,       setFilter]       = useState("all");

  const showToast = (message, type = "success") => setToast({ message, type });

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await galleryApi.getAll();
      setItems(data);
    } catch {
      setError("Failed to load gallery items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await galleryApi.remove(deleteTarget.id);
      showToast("Item deleted.");
      fetchItems();
    } catch {
      showToast("Failed to delete item.", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleToggle = async (item) => {
    try {
      const fd = new FormData();
      fd.append("is_active", !item.is_active);
      await galleryApi.update(item.id, fd);
      showToast(item.is_active ? "Item hidden." : "Item made visible.");
      fetchItems();
    } catch {
      showToast("Failed to update visibility.", "error");
    }
  };

  const handleSaved = () => {
    setModalItem(undefined);
    showToast(modalItem?.id ? "Item updated." : "Item added.");
    fetchItems();
  };

  const displayed = filter === "all"
    ? items
    : items.filter((i) => i.category === filter);

  return (
    <div className="p-6">
      <PageHeader
        title="Gallery"
        description="Manage images shown on the customer site gallery page."
        action={
          <button
            onClick={() => setModalItem(null)}
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Image
          </button>
        }
      />

      {/* Category filter */}
      <div className="mb-6 flex gap-2">
        {["all", "salon", "academy"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
              filter === f
                ? "bg-accent/15 text-accent border border-accent/30"
                : "border border-card-border text-text-secondary hover:bg-hover-bg"
            }`}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-text-secondary">
          {displayed.length} item{displayed.length !== 1 ? "s" : ""}
        </span>
      </div>

      {loading && <LoadingState />}
      {error   && <ErrorState message={error} onRetry={fetchItems} />}

      {!loading && !error && (
        displayed.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <svg className="h-10 w-10 text-text-secondary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-text-secondary">No gallery items yet.</p>
            <button onClick={() => setModalItem(null)}
              className="text-sm font-medium text-accent hover:underline">
              Add the first image →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {displayed.map((item) => (
              <GalleryCard
                key={item.id}
                item={item}
                onEdit={(i) => setModalItem(i)}
                onDelete={(i) => setDeleteTarget(i)}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )
      )}

      {/* Add / Edit modal */}
      {modalItem !== undefined && (
        <GalleryModal
          item={modalItem}
          onClose={() => setModalItem(undefined)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Gallery Item"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmText="Delete"
        isDanger={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
