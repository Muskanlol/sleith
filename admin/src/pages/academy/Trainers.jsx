import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { academyApi } from '../../api/academy.api';
import { ROLES } from '../../utils/constants';
import PageHeader from '../../components/common/PageHeader';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import Toast from '../../components/common/Toast';

export default function Trainers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  const isAdmin = user?.role === ROLES.ADMIN;
  const isManager = user?.role === ROLES.MANAGER;
  const canWrite = isAdmin || isManager;

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      const res = await academyApi.getTrainers(params);
      setTrainers(res.data.results || res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load trainers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTrainers();
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Toggle trainer status?')) return;
    try {
      const res = await academyApi.deactivateTrainer(id);
      setTrainers((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_active: res.data.is_active } : t))
      );
      setToast({ type: 'success', message: res.data.message });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Failed' });
    }
  };

  if (loading) return <LoadingState message="Loading trainers..." />;
  if (error) return <EmptyState message={error} type="error" />;

  return (
    <div>
      <PageHeader title="Trainers" subtitle="Academy trainers" />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="Search trainers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 bg-card-bg border border-card-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-accent text-sidebar-text font-medium rounded-lg hover:bg-accent-hover transition"
          >
            Search
          </button>
        </form>

        {canWrite && (
          <button
            onClick={() => navigate('/admin/academy/trainers/new')}
            className="px-4 py-2 bg-accent text-sidebar-text font-medium rounded-lg hover:bg-accent-hover transition"
          >
            + Add Trainer
          </button>
        )}
      </div>

      {!trainers.length ? (
        <EmptyState message="No trainers found" />
      ) : (
        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border">
                <th className="text-left text-xs font-medium text-text-secondary uppercase px-6 py-3">Name</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase px-6 py-3">Email</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase px-6 py-3">Phone</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase px-6 py-3">Status</th>
                <th className="text-right text-xs font-medium text-text-secondary uppercase px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {trainers.map((t) => (
                <tr key={t.id} className="hover:bg-hover-bg/50 transition">
                  <td className="px-6 py-4 text-sm text-text-primary font-medium">{t.full_name}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{t.email}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{t.phone}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full border ${
                        t.is_active
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-red-100 text-red-700 border-red-200'
                      }`}
                    >
                      {t.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => navigate(`/admin/academy/trainers/${t.id}`)}
                        className="text-accent hover:text-accent-hover text-sm font-medium transition"
                      >
                        View
                      </button>
                      {canWrite && (
                        <>
                          <button
                            onClick={() => navigate(`/admin/academy/trainers/${t.id}/edit`)}
                            className="text-text-secondary hover:text-text-primary text-sm transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeactivate(t.id)}
                            className={`text-sm font-medium transition ${
                              t.is_active ? 'text-red-700 hover:text-red-800' : 'text-green-700 hover:text-green-800'
                            }`}
                          >
                            {t.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}
    </div>
  );
}