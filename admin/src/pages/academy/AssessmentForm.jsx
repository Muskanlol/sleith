import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { academyApi } from '../../api/academy.api';
import { ROLES } from '../../utils/constants';
import PageHeader from '../../components/common/PageHeader';
import LoadingState from '../../components/common/LoadingState';
import Toast from '../../components/common/Toast';

export default function AssessmentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const isEdit = Boolean(id);
  const isTrainer = user?.role === ROLES.TRAINER;

  const [form, setForm] = useState({
    batch: '',
    title: '',
    assessment_type: 'THEORY',
    max_marks: '',
    date: '',
  });

  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchBatches();
    if (isEdit) fetchAssessment();
  }, [id]);

  const fetchBatches = async () => {
    try {
      const res = isTrainer
        ? await academyApi.getMyBatches()
        : await academyApi.getBatches();
      setBatches(res.data.results || res.data);
    } catch (err) {
      setToast({
        type: 'error',
        message: 'Failed to load batches',
      });
    }
  };

  const fetchAssessment = async () => {
    try {
      const res = await academyApi.getAssessmentById(id);
      setForm({
        batch: res.data.batch,
        title: res.data.title,
        assessment_type: res.data.assessment_type,
        max_marks: res.data.max_marks,
        date: res.data.date,
      });
    } catch (err) {
      setToast({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to load assessment',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      const data = {
        ...form,
        max_marks: Number(form.max_marks),
      };

      if (isEdit) {
        await academyApi.updateAssessment(id, data);
      } else {
        await academyApi.createAssessment(data);
      }

      navigate('/admin/academy/assessments');
    } catch (err) {
      setToast({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to save assessment',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading assessment..." />;

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit Assessment' : 'Create Assessment'}
        subtitle={isEdit ? 'Update assessment details' : 'Add a new assessment'}
      />

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl bg-card-bg border border-card-border rounded-xl p-6"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm text-text-secondary mb-2">Batch</label>
            <select
              name="batch"
              value={form.batch}
              onChange={handleChange}
              required
              disabled={isEdit}
              className="w-full px-4 py-2.5 bg-page-bg border border-card-border rounded-lg text-text-primary outline-none focus:border-accent disabled:opacity-50"
            >
              <option value="">Select Batch</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name} ({batch.course_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="e.g. Mid-Term Theory Exam"
              className="w-full px-4 py-2.5 bg-page-bg border border-card-border rounded-lg text-text-primary outline-none focus:border-accent placeholder-text-secondary"
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Assessment Type</label>
            <select
              name="assessment_type"
              value={form.assessment_type}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 bg-page-bg border border-card-border rounded-lg text-text-primary outline-none focus:border-accent"
            >
              <option value="THEORY">Theory</option>
              <option value="PRACTICAL">Practical</option>
              <option value="FINAL">Final</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Max Marks</label>
            <input
              type="number"
              name="max_marks"
              value={form.max_marks}
              onChange={handleChange}
              min="1"
              required
              placeholder="e.g. 100"
              className="w-full px-4 py-2.5 bg-page-bg border border-card-border rounded-lg text-text-primary outline-none focus:border-accent placeholder-text-secondary"
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
              className="w-full px-4 py-2.5 bg-page-bg border border-card-border rounded-lg text-text-primary outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-5 border-t border-card-border">
          <button
            type="button"
            onClick={() => navigate('/admin/academy/assessments')}
            className="px-4 py-2 text-sm text-text-secondary border border-card-border rounded-lg hover:bg-hover-bg transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEdit ? 'Update Assessment' : 'Create Assessment'}
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