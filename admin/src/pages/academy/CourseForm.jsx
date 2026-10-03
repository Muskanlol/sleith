import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { academyApi } from '../../api/academy.api';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import PageHeader from '../../components/common/PageHeader';
import LoadingState from '../../components/common/LoadingState';
import Toast from '../../components/common/Toast';

export default function CourseForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const isEdit = Boolean(id);
  const canWrite =
    user?.role === ROLES.ADMIN ||
    user?.role === ROLES.MANAGER;

  const [form, setForm] = useState({
    name: '',
    description: '',
    duration_months: '',
    fee: '',
    is_active: true,
  });

  const [imgBefore, setImgBefore] = useState(null);
  const [imgAfter, setImgAfter] = useState(null);
  const [previewBefore, setPreviewBefore] = useState(null);
  const [previewAfter, setPreviewAfter] = useState(null);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (isEdit) {
      fetchCourse();
    }
  }, [id]);

  const fetchCourse = async () => {
    try {
      const res = await academyApi.getCourseById(id);

      setForm({
        name: res.data.name || '',
        description: res.data.description || '',
        duration_months: res.data.duration_months || '',
        fee: res.data.fee || '',
        is_active: res.data.is_active ?? true,
      });
      setPreviewBefore(res.data.image_before_url || null);
      setPreviewAfter(res.data.image_after_url || null);
      setImgBefore(null);
      setImgAfter(null);
    } catch (err) {
      setToast({
        type: 'error',
        message:
          err.response?.data?.detail ||
          'Failed to load course',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const pickImage = (which, file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (which === 'before') {
      setImgBefore(file);
      setPreviewBefore(url);
    } else {
      setImgAfter(file);
      setPreviewAfter(url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const hasImage = imgBefore || imgAfter;
      let payload;

      if (hasImage) {
        const fd = new FormData();
        fd.append('name', form.name);
        fd.append('description', form.description);
        fd.append('duration_months', String(form.duration_months));
        fd.append('fee', String(form.fee));
        fd.append('is_active', form.is_active ? 'true' : 'false');
        if (imgBefore) fd.append('image_before', imgBefore);
        if (imgAfter) fd.append('image_after', imgAfter);
        payload = fd;
      } else {
        payload = {
          name: form.name,
          description: form.description,
          duration_months: Number(form.duration_months),
          fee: form.fee,
          is_active: form.is_active,
        };
      }

      if (isEdit) {
        await academyApi.updateCourse(id, payload);
      } else {
        await academyApi.createCourse(payload);
      }

      navigate('/admin/academy/courses');
    } catch (err) {
      const detail = err.response?.data;
      const message =
        err.response?.data?.detail ||
        (detail && Object.values(detail)?.[0]?.[0]) ||
        'Failed to save course';
      setToast({
        type: 'error',
        message,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!canWrite) {
    return (
      <div className="text-red-700">
        You do not have permission to manage courses.
      </div>
    );
  }

  if (loading) {
    return <LoadingState message="Loading course..." />;
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Course' : 'Create Course'}
        subtitle={
          isEdit
            ? 'Update academy course details'
            : 'Add a new academy course'
        }
      />

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl bg-card-bg border border-card-border rounded-xl p-6"
      >
        <div className="space-y-5">

          <div>
            <label className="block text-sm text-text-secondary mb-2">
              Course Name
            </label>

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 bg-hover-bg border border-card-border rounded-lg text-text-primary outline-none focus:border-accent"
              placeholder="Enter course name"
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">
              Description
            </label>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-2.5 bg-hover-bg border border-card-border rounded-lg text-text-primary outline-none focus:border-accent resize-none"
              placeholder="Enter course description"
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">
              Duration (Months)
            </label>

            <input
              type="number"
              name="duration_months"
              value={form.duration_months}
              onChange={handleChange}
              min="1"
              required
              className="w-full px-4 py-2.5 bg-hover-bg border border-card-border rounded-lg text-text-primary outline-none focus:border-accent"
              placeholder="e.g. 3"
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">
              Fee
            </label>

            <input
              type="number"
              name="fee"
              value={form.fee}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
              className="w-full px-4 py-2.5 bg-hover-bg border border-card-border rounded-lg text-text-primary outline-none focus:border-accent"
              placeholder="e.g. 25000"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Image — Default (Before Hover)', key: 'before', preview: previewBefore },
              { label: 'Image — On Hover (After)', key: 'after', preview: previewAfter },
            ].map(({ label, key, preview }) => (
              <div key={key}>
                <label className="block text-sm text-text-secondary mb-2">{label}</label>
                <label className="cursor-pointer block">
                  <div
                    className="relative w-full h-36 rounded-lg border-2 border-dashed overflow-hidden flex items-center justify-center transition-colors hover:border-accent"
                    style={{
                      borderColor: preview ? 'var(--accent)' : 'var(--card-border)',
                      background: 'var(--hover-bg)',
                    }}
                  >
                    {preview
                      ? <img src={preview} alt={key} className="absolute inset-0 w-full h-full object-cover rounded-lg" />
                      : (
                        <div className="text-center">
                          <p className="text-2xl mb-1">🖼</p>
                          <p className="text-xs text-text-secondary">Click to upload</p>
                        </div>
                      )}
                    {preview && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                        <p className="text-xs text-white font-medium">Change image</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => pickImage(key, e.target.files[0])}
                  />
                </label>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  is_active: e.target.checked,
                }))
              }
              className="w-4 h-4 accent-accent"
            />

            <label className="text-sm text-text-primary">
              Active Course
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-5 border-t border-card-border">
          <button
            type="button"
            onClick={() => navigate('/admin/academy/courses')}
            className="px-4 py-2 text-sm text-text-secondary border border-card-border rounded-lg hover:bg-hover-bg transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-accent text-sidebar-text font-medium rounded-lg hover:bg-accent-hover transition disabled:opacity-50"
          >
            {saving
              ? 'Saving...'
              : isEdit
              ? 'Update Course'
              : 'Create Course'}
          </button>
        </div>
      </form>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
