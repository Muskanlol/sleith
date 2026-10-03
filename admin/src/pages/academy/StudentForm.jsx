import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingState from '../../components/common/LoadingState';
import Toast from '../../components/common/Toast';
import { academyApi } from '../../api/academy.api';

export default function StudentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [batches, setBatches] = useState([]);
  const [formData, setFormData] = useState({ batch_id: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [studentRes, batchesRes] = await Promise.all([
        academyApi.getStudentById(id),
        academyApi.getBatches(),
      ]);

      setStudent(studentRes.data);

      const allBatches = batchesRes.data.results || batchesRes.data;

      const activeBatches = allBatches.filter(
        (batch) =>
          batch.status === 'ACTIVE' &&
          batch.is_active === true &&
          String(batch.course) === String(studentRes.data.course_id)
      );

      setBatches(activeBatches);
      setFormData({ batch_id: String(studentRes.data.batch) });
    } catch {
      setToast({ type: 'error', message: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await academyApi.updateStudent(id, { batch: formData.batch_id });

      setToast({
        type: 'success',
        message: 'Student updated successfully',
      });

      setTimeout(() => navigate(`/admin/academy/students/${id}`), 800);
    } catch (err) {
      setToast({
        type: 'error',
        message: err.response?.data?.error || 'Update failed',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading..." />;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(`/admin/academy/students/${id}`)}
          className="text-text-secondary hover:text-text-primary transition"
        >
          ← Back
        </button>

        <h3 className="text-text-primary text-xl font-semibold">
          Edit Student
        </h3>
      </div>

      <div className="bg-card-bg border border-card-border rounded-xl p-6 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Student
            </label>

            <div className="px-4 py-2 bg-hover-bg border border-card-border rounded-lg text-text-primary">
              {student?.student_name}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Email
            </label>

            <div className="px-4 py-2 bg-hover-bg border border-card-border rounded-lg text-text-secondary">
              {student?.student_email}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Batch
            </label>

            <select
              value={formData.batch_id}
              onChange={(e) =>
                setFormData({ batch_id: e.target.value })
              }
              className="w-full px-4 py-2 bg-hover-bg border border-card-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="">Select Batch</option>

              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.course_name})
                </option>
              ))}
            </select>

            {batches.length === 0 && (
              <p className="text-xs text-red-600 mt-2">
                No active batch available for this course.
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || !formData.batch_id}
              className="px-6 py-2 bg-accent text-sidebar-text font-medium rounded-lg hover:bg-accent-hover transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(`/admin/academy/students/${id}`)
              }
              className="px-6 py-2 bg-card-bg border border-card-border text-text-primary rounded-lg hover:bg-hover-bg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

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