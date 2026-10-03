import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { staffApi } from "../api/staff.api";
import { useAuth } from "../context/AuthContext";

function StaffForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { can } = useAuth();
  const isEditMode = Boolean(id);
  const requiredPermission = isEditMode ? "staff.update" : "staff.create";

  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [form, setForm] = useState({ user: "", bio: "", is_active: true });
  const [photoFile, setPhotoFile]   = useState(null);   // new File selected
  const [photoPreview, setPhotoPreview] = useState(null); // preview URL
  const [currentPhoto, setCurrentPhoto] = useState(null); // existing photo URL
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!can(requiredPermission)) {
      navigate("/admin/staff", { replace: true });
    }
  }, [can, navigate]);

  useEffect(() => {
    if (!isEditMode) {
      staffApi.getEligibleUsers().then(({ data }) => {
        setEligibleUsers(data.filter((u) => u.role === "STAFF" || u.role === "TRAINER"));
      });
    }
  }, [isEditMode]);

  useEffect(() => {
    if (isEditMode) {
      staffApi
        .getById(id)
        .then(({ data }) => {
          setForm({ user: data.user, bio: data.bio || "", is_active: data.is_active });
          setCurrentPhoto(data.photo || null);
        })
        .catch(() => setError("Failed to load staff member"))
        .finally(() => setLoading(false));
    }
  }, [id, isEditMode]);

  if (!can(requiredPermission)) return null;

  const handleChange = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isEditMode) {
        // Always use FormData for edit so the photo ImageField is handled correctly
        const fd = new FormData();
        fd.append("bio", form.bio);
        fd.append("is_active", form.is_active);
        if (photoFile) fd.append("photo", photoFile);
        await staffApi.updateMultipart(id, fd);
      } else {
        // Step 1: create the staff record (user ID is a UUID string — don't convert to Number)
        const res = await staffApi.create({ user: form.user, bio: form.bio });
        // Step 2: if a photo was selected, upload it immediately
        if (photoFile && res.data?.id) {
          const fd = new FormData();
          fd.append("photo", photoFile);
          fd.append("bio", form.bio);
          fd.append("is_active", true);
          await staffApi.updateMultipart(res.data.id, fd);
        }
      }
      navigate("/admin/staff");
    } catch (err) {
      const detail = err.response?.data;
      const message =
        (detail && (detail.detail || detail.user?.[0] || Object.values(detail)?.[0]?.[0])) ||
        "Failed to save staff member";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-text-primary text-xl font-semibold">
          {isEditMode ? "Edit Staff Profile" : "Add Staff"}
        </h3>
        <button
          onClick={() => navigate("/admin/staff")}
          className="px-4 py-2 bg-hover-bg border border-card-border rounded-lg text-text-primary text-sm hover:border-accent transition-colors"
        >
          Cancel
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-card-bg border border-card-border rounded-lg p-6 max-w-xl space-y-4"
      >
        {!isEditMode && (
          <div>
            <label className="text-text-secondary text-xs uppercase mb-1 block">
              User Account
            </label>
            <select
              value={form.user}
              onChange={handleChange("user")}
              className="w-full bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
              required
            >
              <option value="">Select a user with STAFF or TRAINER role</option>
              {eligibleUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.email})
                </option>
              ))}
            </select>
            <p className="text-xs text-text-secondary mt-1">
              Only users already assigned the STAFF or TRAINER role appear here. To give someone
              that role, use the Users/Roles section.
            </p>
          </div>
        )}

        {/* Photo — always visible */}
        <div>
          <label className="text-text-secondary text-xs uppercase mb-1 block">
            Photo
          </label>
          <div className="flex items-center gap-4 mb-3">
            <div className="h-20 w-20 rounded-full overflow-hidden bg-hover-bg border border-card-border flex items-center justify-center shrink-0">
              {photoPreview || currentPhoto ? (
                <img src={photoPreview || currentPhoto} alt="Staff photo" className="h-full w-full object-cover" />
              ) : (
                <svg className="h-8 w-8 text-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            <div>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-card-border bg-hover-bg text-text-primary hover:border-accent transition-colors">
                {currentPhoto || photoPreview ? "Change Photo" : "Upload Photo"}
              </button>
              {(photoPreview || currentPhoto) && (
                <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  className="ml-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-card-border text-danger hover:bg-red-500/10 transition-colors">
                  Remove
                </button>
              )}
              <p className="mt-1 text-xs text-text-secondary">JPG, PNG or WEBP · Max 5 MB</p>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
        </div>

        <div>
          <label className="text-text-secondary text-xs uppercase mb-1 block">Bio</label>
          <textarea
            value={form.bio}
            onChange={handleChange("bio")}
            rows={3}
            className="w-full bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
          />
        </div>

        {isEditMode && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={handleChange("is_active")}
              className="w-4 h-4"
            />
            <label htmlFor="is_active" className="text-sm text-text-primary">
              Active
            </label>
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-accent text-sidebar-text rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            {saving ? "Saving..." : isEditMode ? "Save Changes" : "Create Staff Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default StaffForm;