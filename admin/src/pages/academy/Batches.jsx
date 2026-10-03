import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { academyApi } from '../../api/academy.api';
import { ROLES } from '../../utils/constants';
import PageHeader from '../../components/common/PageHeader';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import Toast from '../../components/common/Toast';

const STATUS_STYLES = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  COMPLETED: 'bg-blue-100 text-blue-700 border-blue-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
};

export default function Batches() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const isAdmin = user?.role === ROLES.ADMIN;
  const isManager = user?.role === ROLES.MANAGER;
  const isTrainer = user?.role === ROLES.TRAINER;
  const canManage = isAdmin || isManager;
  const canOpen = canManage || isTrainer;

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const apiCall = isTrainer ? academyApi.getMyBatches : academyApi.getBatches;
      const res = await apiCall();
      setBatches(res.data.results || res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, action) => {
    try {
      const api = action === 'cancel' ? academyApi.cancelBatch : academyApi.completeBatch;
      const res = await api(id);
      setBatches((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: res.data.status, is_active: res.data.is_active } : b))
      );
      setToast({ type: 'success', message: res.data.message || `Batch ${action}d` });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Failed' });
    }
  };

  const handleReactivate = async (id) => {
    try {
      const res = await academyApi.reactivateBatch(id);
      setBatches((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: res.data.status, is_active: res.data.is_active } : b))
      );
      setToast({ type: 'success', message: 'Batch reactivated' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Failed to reactivate' });
    }
  };

  if (loading) return <LoadingState message="Loading batches..." />;
  if (error) return <EmptyState message={error} type="error" />;

  return (
    <div>
      <PageHeader
        title="Batches"
        subtitle={isTrainer ? 'Your assigned batches' : 'All academy batches'}
      />

      {canManage && (
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/academy/batches/new')}
            className="px-4 py-2 bg-accent text-sidebar-text font-medium rounded-lg hover:bg-accent-hover transition"
          >
            + Create Batch
          </button>
        </div>
      )}

      {!batches.length ? (
        <EmptyState message="No batches found" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map((batch) => (
            <div
              key={batch.id}
              className={`bg-card-bg border border-card-border rounded-xl p-5 transition ${
                canOpen ? 'hover:border-accent/30 cursor-pointer' : ''
              }`}
              onClick={canOpen ? () => navigate(`/admin/academy/batches/${batch.id}`) : undefined}
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-text-primary font-semibold">{batch.name}</h4>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${
                    STATUS_STYLES[batch.status] || STATUS_STYLES.ACTIVE
                  }`}
                >
                  {batch.status}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Course</span>
                  <span className="text-text-primary">{batch.course_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Trainer</span>
                  <span className="text-text-primary">{batch.trainer_name || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Dates</span>
                  <span className="text-text-primary">
                    {batch.start_date} → {batch.end_date}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Capacity</span>
                  <span className="text-text-primary">{batch.capacity}</span>
                </div>
              </div>
              {isTrainer && (
                <p className="mt-4 pt-4 border-t border-card-border text-xs text-accent">
                  Open batch to add sessions →
                </p>
              )}

              {canManage && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-card-border">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/academy/batches/${batch.id}/edit`);
                    }}
                    className="flex-1 px-3 py-1.5 text-sm bg-accent/20 text-accent border border-accent/30 rounded-lg hover:bg-accent/30 transition"
                  >
                    Edit
                  </button>

                  {batch.status === 'ACTIVE' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(batch.id, 'complete');
                        }}
                        className="flex-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 border border-green-200 rounded-lg hover:bg-green-200 transition"
                      >
                        Complete
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(batch.id, 'cancel');
                        }}
                        className="flex-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 border border-red-200 rounded-lg hover:bg-red-200 transition"
                      >
                        Cancel
                      </button>
                    </>
                  )}


                  {batch.status === 'CANCELLED' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReactivate(batch.id);
                      }}
                      className="flex-1 px-3 py-1.5 text-sm bg-accent/20 text-accent border border-accent/30 rounded-lg hover:bg-accent/30 transition"
                    >
                      Reactivate
                    </button>
                  )}

                  {batch.status === 'COMPLETED' && (
                    <span className="flex-1 px-3 py-1.5 text-sm text-text-secondary text-center">
                      Completed
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}