import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { academyApi } from '../../api/academy.api';
import LoadingState from '../../components/common/LoadingState';
import Toast from '../../components/common/Toast';

export default function BatchForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [courses, setCourses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    course: '',
    trainer: '',
    start_date: '',
    end_date: '',
    capacity: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    init();
  }, [id]);

  const init = async () => {
    setLoading(true);
    try {
      await fetchOptions();
      if (isEdit) await fetchBatch();
    } catch {
      setToast({ type: 'error', message: 'Failed to initialize form' });
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    const [coursesRes, trainersRes] = await Promise.all([
      academyApi.getCourses(),
      academyApi.getTrainers(),
    ]);
    setCourses(coursesRes.data.results || coursesRes.data);
    setTrainers(trainersRes.data.results || trainersRes.data);
  };

  const fetchBatch = async () => {
    const res = await academyApi.getBatchById(id);
    const b = res.data;
    setFormData({
      name: b.name || '',
      course: String(b.course || ''),
      trainer: b.trainer ? String(b.trainer) : '',
      start_date: b.start_date || '',
      end_date: b.end_date || '',
      capacity: String(b.capacity || ''),
    });
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setSaving(true);

  const payload = {
    name: formData.name,
    course: parseInt(formData.course) || null,
    trainer: formData.trainer || null,  
    start_date: formData.start_date,
    end_date: formData.end_date,
    capacity: parseInt(formData.capacity),
  };

  console.log('Sending payload:', payload);

  try {
    if (isEdit) {
      await academyApi.updateBatch(id, payload);
      setToast({ type: 'success', message: 'Batch updated' });
    } else {
      await academyApi.createBatch(payload);
      setToast({ type: 'success', message: 'Batch created' });
    }
    setTimeout(() => navigate('/admin/academy/batches'), 800);
  } catch (err) {
    console.log('Error response:', err.response?.data);
    setToast({ type: 'error', message: err.response?.data?.error || JSON.stringify(err.response?.data) || 'Failed' });
  } finally {
    setSaving(false);
  }
};

  if (loading) return <LoadingState message="Loading..." />;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/academy/batches')} className="text-text-secondary hover:text-text-primary transition">
          ← Back
        </button>
        <h3 className="text-text-primary text-xl font-semibold">{isEdit ? 'Edit Batch' : 'Create Batch'}</h3>
      </div>

      <div className="bg-card-bg border border-card-border rounded-xl p-6 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Batch Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-hover-bg border border-card-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Course</label>
            <select
              name="course"
              value={formData.course}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-hover-bg border border-card-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="">Select Course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Trainer</label>
            <select
              name="trainer"
              value={formData.trainer}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-hover-bg border border-card-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="">Select Trainer</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>{t.full_name || t.email}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Start Date</label>
              <input
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-hover-bg border border-card-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">End Date</label>
              <input
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-hover-bg border border-card-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Capacity</label>
            <input
              name="capacity"
              type="number"
              value={formData.capacity}
              onChange={handleChange}
              required
              min="1"
              className="w-full px-4 py-2 bg-hover-bg border border-card-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-accent text-sidebar-text font-medium rounded-lg hover:bg-accent-hover transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Batch'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/academy/batches')}
              className="px-6 py-2 bg-card-bg border border-card-border text-text-primary rounded-lg hover:bg-hover-bg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}