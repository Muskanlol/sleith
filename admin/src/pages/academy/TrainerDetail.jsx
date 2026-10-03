import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { academyApi } from '../../api/academy.api';
import { salaryApi } from '../../api/salary.api';
import { ROLES } from '../../utils/constants';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  PAID: 'bg-green-100 text-green-700 border-green-200',
};

export default function TrainerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trainer, setTrainer] = useState(null);
  const [batches, setBatches] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdmin = user?.role === ROLES.ADMIN;
  const isManager = user?.role === ROLES.MANAGER;
  const canWrite = isAdmin || isManager;

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [trainerRes, batchesRes, salariesRes] = await Promise.all([
        academyApi.getTrainerById(id),
        academyApi.getTrainerBatches(id),
        // Salaries are admin-only; requesting them as a manager fails the whole page.
        isAdmin ? salaryApi.getByRole('TRAINER') : Promise.resolve({ data: [] }),
      ]);
      setTrainer(trainerRes.data);
      setBatches(batchesRes.data.results || batchesRes.data);

      const allSalaries = salariesRes.data.results || salariesRes.data || [];
      const trainerSalaries = allSalaries.filter(s => s.employee === id || s.employee?.id === id);
      setSalaries(trainerSalaries);

      setError(null);
    } catch (err) {
      if (err.response?.status === 404) setError('Trainer not found');
      else if (err.response?.status === 403) setError('No permission');
      else setError('Failed to load trainer');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState message="Loading trainer..." />;
  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="text-red-700">{error}</div>
      <button onClick={() => navigate('/admin/academy/trainers')} className="text-accent hover:text-accent-hover transition">
        ← Back
      </button>
    </div>
  );
  if (!trainer) return null;

  const rows = [
    { label: 'Name', value: trainer.full_name },
    { label: 'Email', value: trainer.email },
    { label: 'Phone', value: trainer.phone || '—' },
    { label: 'Role', value: trainer.role },
    {
      label: 'Status',
      value: (
        <span
          className={`text-xs px-2.5 py-1 rounded-full border ${
            trainer.is_active
              ? 'bg-green-100 text-green-700 border-green-200'
              : 'bg-red-100 text-red-700 border-red-200'
          }`}
        >
          {trainer.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    { label: 'Joined', value: new Date(trainer.date_joined).toLocaleDateString() },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/academy/trainers')} className="text-text-secondary hover:text-text-primary transition">
            ← Back
          </button>
          <h3 className="text-text-primary text-xl font-semibold">{trainer.full_name}</h3>
        </div>
        {canWrite && (
          <button
            onClick={() => navigate(`/admin/academy/trainers/${id}/edit`)}
            className="px-4 py-2 bg-accent/20 text-accent border border-accent/30 rounded-lg hover:bg-accent/30 transition"
          >
            Edit
          </button>
        )}
      </div>

      <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden mb-6">
        <div className="divide-y divide-card-border">
          {rows.map((row, idx) => (
            <div key={idx} className="flex items-center px-6 py-4">
              <span className="w-40 text-sm font-medium text-text-secondary">{row.label}</span>
              <span className="flex-1 text-sm text-text-primary">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <h4 className="text-text-primary text-lg font-semibold mb-4">Assigned Batches</h4>
      {!batches.length ? (
        <EmptyState message="No batches assigned" />
      ) : (
        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border">
                <th className="text-left text-xs font-medium text-text-secondary uppercase px-6 py-3">Batch</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase px-6 py-3">Course</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase px-6 py-3">Start Date</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase px-6 py-3">End Date</th>
                <th className="text-left text-xs font-medium text-text-secondary uppercase px-6 py-3">Capacity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {batches.map((b) => (
                <tr key={b.id} className="hover:bg-hover-bg/50 transition">
                  <td className="px-6 py-4 text-sm text-text-primary">{b.name}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{b.course_name}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{b.start_date}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{b.end_date}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{b.capacity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h4 className="text-text-primary text-lg font-semibold mb-4">Salary History</h4>
      {!salaries.length ? (
        <EmptyState message="No salary records found for this trainer" />
      ) : (
        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-hover-bg border-b border-card-border">
              <tr>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary">Month</th>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary">Amount</th>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary">Paid Date</th>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {salaries.map((sal) => (
                <tr key={sal.id} className="hover:bg-hover-bg/50 transition">
                  <td className="px-6 py-4 text-sm text-text-primary">
                    {new Date(sal.month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-primary">₹{sal.amount}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{sal.paid_date || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${statusColors[sal.status] || statusColors.PENDING}`}>
                      {sal.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}