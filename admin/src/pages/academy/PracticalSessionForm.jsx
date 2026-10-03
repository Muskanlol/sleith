import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { academyApi } from '../../api/academy.api';
import { ROLES } from '../../utils/constants';
import PageHeader from '../../components/common/PageHeader';
import Toast from '../../components/common/Toast';

export default function PracticalSessionForm() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isTrainer = user?.role === ROLES.TRAINER;

  const [form, setForm] = useState({
    batch: '',
    student: '',
    trainer: isTrainer ? user.id : '',
    title: '',
    date: '',
    notes: '',
  });

  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = isTrainer
        ? await academyApi.getMyBatches()
        : await academyApi.getBatches();
      const data = res.data.results || res.data;
      const activeBatches = Array.isArray(data)
        ? data.filter((b) => (!b.status || b.status === 'ACTIVE') && b.is_active !== false)
        : [];
      setBatches(activeBatches);
    } catch {
      setBatches([]);
      setToast({ type: 'error', message: 'Failed to load your batches' });
    }
  };

  const fetchStudents = async (batchId) => {
    try {
      const res = await academyApi.getBatchStudents(batchId);
      const studentsData = res.data.results || res.data;
      setStudents(Array.isArray(studentsData) ? studentsData : []);
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to load students' });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'batch') {
      setForm((prev) => ({ ...prev, batch: value, student: '' }));
      if (value) fetchStudents(value);
      else setStudents([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await academyApi.createPracticalSession(form);
      navigate('/admin/academy/practical');
    } catch (err) {
      setToast({
        type: 'error',
        message:
          err.response?.data?.error ||
          err.response?.data?.date?.[0] ||
          err.response?.data?.batch?.[0] ||
          err.response?.data?.detail ||
          'Failed to create session',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="New Practical Session" subtitle="Schedule hands-on training" />

      <form onSubmit={handleSubmit} className="max-w-2xl bg-card-bg border border-card-border rounded-xl p-6">
        <div className="space-y-5">
          <div>
            <label className="block text-sm text-text-secondary mb-2">Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="e.g. Bridal Makeup Practical"
              className="w-full px-4 py-2.5 bg-page-bg border border-card-border rounded-lg text-text-primary outline-none focus:border-accent placeholder-text-secondary"
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Batch</label>
            <select
              name="batch"
              value={form.batch}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 bg-page-bg border border-card-border rounded-lg text-text-primary outline-none focus:border-accent"
            >
              <option value="">Select Batch</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Student</label>
            <select
              name="student"
              value={form.student}
              onChange={handleChange}
              required
              disabled={!form.batch}
              className="w-full px-4 py-2.5 bg-page-bg border border-card-border rounded-lg text-text-primary outline-none focus:border-accent disabled:opacity-50"
            >
              <option value="">Select Student</option>
              {students.map((s) => (
                <option key={s.student_id || s.student} value={s.student_id || s.student}>
                  {s.student_name || s.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Trainer</label>
            <input
              type="text"
              value={user.full_name || 'You'}
              disabled
              className="w-full px-4 py-2.5 bg-page-bg border border-card-border rounded-lg text-text-primary opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              min={batches.find((b) => String(b.id) === String(form.batch))?.start_date}
              max={batches.find((b) => String(b.id) === String(form.batch))?.end_date}
              className="w-full px-4 py-2.5 bg-page-bg border border-card-border rounded-lg text-text-primary outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Session notes..."
              className="w-full px-4 py-2.5 bg-page-bg border border-card-border rounded-lg text-text-primary outline-none focus:border-accent resize-none placeholder-text-secondary"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-5 border-t border-card-border">
          <button
            type="button"
            onClick={() => navigate('/admin/academy/practical')}
            className="px-4 py-2 text-sm text-text-secondary border border-card-border rounded-lg hover:bg-hover-bg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Create Session'}
          </button>
        </div>
      </form>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
