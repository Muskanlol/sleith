import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { academyApi } from '../../api/academy.api';
import api from '../../api/client';
import LoadingState from '../../components/common/LoadingState';
import Toast from '../../components/common/Toast';

export default function TrainerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const fileRef = useRef(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [profile, setProfile] = useState({ bio: '', specialization: '', photo: null });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile,    setPhotoFile]    = useState(null);

  const [loading, setLoading] = useState(isEdit);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);

  useEffect(() => {
    if (isEdit) fetchTrainer();
  }, [id]);

  const fetchTrainer = async () => {
    try {
      const [userRes, profileRes] = await Promise.all([
        academyApi.getTrainerById(id),
        api.get(`/admin/academy/trainers/${id}/profile/`).catch(() => ({ data: {} })),
      ]);
      const t = userRes.data;
      setFormData({ full_name: t.full_name || '', email: t.email || '', phone: t.phone || '', password: '' });
      const p = profileRes.data;
      setProfile({ bio: p.bio || '', specialization: p.specialization || '', photo: p.photo_url || null });
      if (p.photo_url) setPhotoPreview(p.photo_url);
    } catch {
      setToast({ type: 'error', message: 'Failed to load trainer' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleProfileChange = (e) => setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let trainerId = id;

      // 1. Save user account
      if (isEdit) {
        const { password, ...updateData } = formData;
        await academyApi.updateTrainer(id, updateData);
      } else {
        const res = await academyApi.createTrainer(formData);
        trainerId = res.data?.id || res.data?.user?.id;
      }

      // 2. Save profile (bio, specialization, photo)
      if (trainerId) {
        const fd = new FormData();
        fd.append('bio', profile.bio);
        fd.append('specialization', profile.specialization);
        if (photoFile) fd.append('photo', photoFile);
        await api.patch(`/admin/academy/trainers/${trainerId}/profile/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setToast({ type: 'success', message: isEdit ? 'Trainer updated' : 'Trainer created' });
      setTimeout(() => navigate('/admin/academy/trainers'), 800);
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Failed to save trainer' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading..." />;

  const inputCls = 'w-full px-4 py-2.5 bg-hover-bg border border-card-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent transition-colors';
  const labelCls = 'block text-sm font-medium text-text-secondary mb-1.5';

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/academy/trainers')} className="text-text-secondary hover:text-text-primary transition">
          ← Back
        </button>
        <h3 className="text-text-primary text-xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
          {isEdit ? 'Edit Trainer' : 'Add Trainer'}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-6 max-w-4xl">
        {/* ── Left: photo ── */}
        <div className="md:col-span-1">
          <div className="bg-card-bg border border-card-border rounded-xl p-5 flex flex-col items-center gap-4">
            <p className="text-xs font-semibold tracking-widest uppercase text-text-secondary w-full">Trainer Photo</p>

            {/* Preview */}
            <div
              className="w-32 h-32 rounded-full overflow-hidden flex items-center justify-center cursor-pointer border-2 transition-colors hover:border-accent"
              style={{ borderColor: 'var(--card-border)', background: 'var(--hover-bg)' }}
              onClick={() => fileRef.current?.click()}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Trainer" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-accent/50">
                  {formData.full_name?.[0]?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            <button type="button" onClick={() => fileRef.current?.click()}
              className="text-xs text-accent hover:text-accent-hover transition">
              {photoPreview ? 'Change Photo' : 'Upload Photo'}
            </button>
            <p className="text-[11px] text-text-secondary text-center">Recommended: square image, JPG or PNG</p>
          </div>
        </div>

        {/* ── Right: fields ── */}
        <div className="md:col-span-2 bg-card-bg border border-card-border rounded-xl p-6 space-y-4">
          <p className="text-xs font-semibold tracking-widest uppercase text-text-secondary">Account Details</p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Full Name *</label>
              <input name="full_name" value={formData.full_name} onChange={handleChange} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <input name="email" type="email" value={formData.email} onChange={handleChange} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input name="phone" value={formData.phone} onChange={handleChange} className={inputCls} />
            </div>
            {!isEdit && (
              <div>
                <label className={labelCls}>Password *</label>
                <input name="password" type="password" value={formData.password} onChange={handleChange} required className={inputCls} />
              </div>
            )}
          </div>

          <hr style={{ borderColor: 'var(--card-border)' }} />
          <p className="text-xs font-semibold tracking-widest uppercase text-text-secondary">Profile</p>

          <div>
            <label className={labelCls}>Specialization</label>
            <input
              name="specialization"
              value={profile.specialization}
              onChange={handleProfileChange}
              placeholder="e.g. Hair Styling, Nail Art, Skin Care"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Bio</label>
            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleProfileChange}
              rows={4}
              placeholder="Brief introduction shown to students and on the public site…"
              className={inputCls}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 bg-accent text-sidebar-text font-medium rounded-lg hover:bg-accent-hover transition disabled:opacity-50 text-sm">
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Trainer'}
            </button>
            <button type="button" onClick={() => navigate('/admin/academy/trainers')}
              className="px-6 py-2.5 bg-card-bg border border-card-border text-text-primary rounded-lg hover:bg-hover-bg transition text-sm">
              Cancel
            </button>
          </div>
        </div>
      </form>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
