import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { academyApi } from '../../api/academy.api';
import { ROLES, isFutureCalendarDate } from '../../utils/constants';
import PageHeader from '../../components/common/PageHeader';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import Toast from '../../components/common/Toast';

const TYPE_STYLES = {
  THEORY: 'bg-blue-100 text-blue-700 border-blue-200',
  PRACTICAL: 'bg-purple-100 text-purple-700 border-purple-200',
  FINAL: 'bg-orange-100 text-orange-700 border-orange-200',
};

export default function Assessments() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [assessments, setAssessments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const isTrainer = user?.role === ROLES.TRAINER;
  const canWrite = [ROLES.TRAINER, ROLES.ADMIN, ROLES.MANAGER].includes(user?.role);

  useEffect(() => {
    fetchBatches();
    fetchAssessments();
  }, [selectedBatch]);

  const fetchBatches = async () => {
    try {
      const res = isTrainer
        ? await academyApi.getMyBatches()
        : await academyApi.getBatches();
      setBatches(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to load batches');
    }
  };

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const params = selectedBatch ? { batch_id: selectedBatch } : {};
      const res = await academyApi.getAssessments(params);
      setAssessments(res.data.results || res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assessment?')) return;

    try {
      await academyApi.deleteAssessment(id);
      setAssessments((prev) => prev.filter((a) => a.id !== id));
      setToast({ type: 'success', message: 'Assessment deleted successfully' });
    } catch (err) {
      setToast({
        type: 'error',
        message: err.response?.data?.error || 'Failed to delete assessment',
      });
    }
  };

  if (loading) return <LoadingState message="Loading assessments..." />;
  if (error) return <EmptyState message={error} type="error" />;

  return (
    <div>
      <PageHeader
        title="Assessments"
        subtitle={canWrite ? 'Manage academy assessments' : 'View assessments'}
      />

      <div className="flex items-center gap-4 mb-6">
        <select
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          className="px-4 py-2.5 bg-card-bg border border-card-border rounded-lg text-text-primary outline-none focus:border-accent"
        >
          <option value="">All Batches</option>
          {batches.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.name} ({batch.course_name})
            </option>
          ))}
        </select>

        {canWrite && (
          <button
            onClick={() => navigate('/admin/academy/assessments/new')}
            className="px-4 py-2 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover transition"
          >
            + Create Assessment
          </button>
        )}
      </div>

      {!assessments.length ? (
        <EmptyState message="No assessments found" />
      ) : (
        <div className="space-y-4">
          {assessments.map((assessment) => (
            <div
              key={assessment.id}
              className="bg-card-bg border border-card-border rounded-xl p-5 hover:border-accent/30 transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-text-primary font-semibold text-lg">
                    {assessment.title}
                  </h4>
                  <p className="text-text-secondary text-sm mt-1">
                    {assessment.batch_name}
                  </p>
                </div>

                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${
                    TYPE_STYLES[assessment.assessment_type]
                  }`}
                >
                  {assessment.assessment_type}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                <div>
                  <span className="text-text-secondary block">Max Marks</span>
                  <span className="text-text-primary font-medium">{assessment.max_marks}</span>
                </div>
                <div>
                  <span className="text-text-secondary block">Date</span>
                  <span className="text-text-primary font-medium">{assessment.date}</span>
                </div>
                <div>
                  <span className="text-text-secondary block">Results</span>
                  <button
                    onClick={() => navigate(`/admin/academy/assessments/${assessment.id}/results`)}
                    className="text-accent hover:text-accent-hover transition"
                  >
                    {canWrite && !isFutureCalendarDate(assessment.date)
                      ? 'Enter Marks →'
                      : 'View Results →'}
                  </button>
                </div>
              </div>

              {canWrite && (
                <div className="flex gap-2 pt-4 border-t border-card-border">
                  <button
                    onClick={() => navigate(`/admin/academy/assessments/${assessment.id}/edit`)}
                    className="px-3 py-1.5 text-sm bg-accent/20 text-accent border border-accent/30 rounded-lg hover:bg-accent/30 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(assessment.id)}
                    className="px-3 py-1.5 text-sm bg-red-100 text-red-700 border border-red-200 rounded-lg hover:bg-red-200 transition"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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