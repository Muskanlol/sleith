import { useEffect, useState } from 'react';
import { salaryApi } from '../../api/salary.api';
import MarkSalaryPaidModal from '../../components/MarkSalaryPaidModal';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import Toast from '../../components/common/Toast';
import { usersApi } from '../../api/users.api'; // For fetching trainers

const statusColors = {
  PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  PAID: 'bg-green-500/10 text-green-400 border-green-500/20',
};

export default function AcademySalary() {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  
  // CRUD states
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' | 'edit'
  const [trainers, setTrainers] = useState([]);
  const [formData, setFormData] = useState({
    employee: '',
    amount: '',
    month: '',
  });

  const fetchSalaries = () => {
    setLoading(true);
    salaryApi.getByRole('TRAINER')
      .then((res) => setSalaries(res.data.results || res.data))
      .catch((err) => console.error('Failed to load salaries:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSalaries(); }, []);

  // Fetch trainers for dropdown
  const fetchTrainers = async () => {
    try {
      const res = await usersApi.getAll(); // Or staffApi.getEligibleUsers()
      const trainerList = (res.data.results || res.data).filter(
        u => u.role === 'TRAINER'
      );
      setTrainers(trainerList);
    } catch (err) {
      console.error('Failed to load trainers:', err);
    }
  };

  const openCreate = () => {
    setFormMode('create');
    setFormData({ employee: '', amount: '', month: '' });
    fetchTrainers();
    setShowForm(true);
  };

  const openEdit = (salary) => {
    setFormMode('edit');
    setSelected(salary);
    setFormData({
      employee: salary.employee,
      amount: salary.amount,
      month: salary.month,
    });
    fetchTrainers();
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        employee: formData.employee,
        amount: parseFloat(formData.amount),
        month: formData.month,
      };

      if (formMode === 'create') {
        await salaryApi.create(payload); // Need to add this API method
        setToast({ type: 'success', message: 'Salary record created' });
      } else {
        await salaryApi.update(selected.id, payload); // Need to add this API method
        setToast({ type: 'success', message: 'Salary record updated' });
      }
      setShowForm(false);
      fetchSalaries();
    } catch (err) {
      setToast({ 
        type: 'error', 
        message: err.response?.data?.error || 'Failed to save salary' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this salary record?')) return;
    try {
      await salaryApi.delete(id); // Need to add this API method
      setToast({ type: 'success', message: 'Salary record deleted' });
      fetchSalaries();
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to delete salary' });
    }
  };

  const handleMarkPaid = async () => {
    setSaving(true);
    try {
      await salaryApi.markPaid(selected.id);
      setSelected(null);
      fetchSalaries();
    } catch (err) {
      console.error('Failed to mark paid:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading salaries..." />;

  return (
    <div>
      {/* Header with Add Button */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white text-xl font-semibold">Salary — Trainers</h3>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-accent text-black font-medium rounded-lg hover:bg-accent-hover transition"
        >
          + Add Salary
        </button>
      </div>

      {!salaries.length ? (
        <EmptyState message="No salary records for trainers" />
      ) : (
        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-hover-bg border-b border-card-border">
              <tr>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary">Trainer</th>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary">Month</th>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary">Amount</th>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary">Paid Date</th>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary">Status</th>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {salaries.map((sal) => (
                <tr key={sal.id} className="border-b border-card-border">
                  <td className="px-6 py-4">
                    <p className="text-sm text-white">{sal.employee_name}</p>
                    <p className="text-xs text-text-secondary">{sal.employee_email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {new Date(sal.month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-sm text-white">₹{sal.amount}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{sal.paid_date || '---'}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${statusColors[sal.status] || statusColors.PENDING}`}>
                      {sal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Edit Button */}
                      <button 
                        onClick={() => openEdit(sal)}
                        className="text-xs text-accent hover:text-accent-hover transition"
                      >
                        Edit
                      </button>
                      
                      {/* Mark Paid (only if pending) */}
                      {sal.status !== 'PAID' && (
                        <button 
                          onClick={() => setSelected(sal)} 
                          className="text-xs text-green-400 hover:text-green-300 transition"
                        >
                          Mark Paid
                        </button>
                      )}
                      
                      {/* Delete Button */}
                      <button 
                        onClick={() => handleDelete(sal.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mark Paid Modal */}
      {selected && !showForm && (
        <MarkSalaryPaidModal
          salary={selected}
          saving={saving}
          onClose={() => setSelected(null)}
          onConfirm={handleMarkPaid}
        />
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-card-bg border border-card-border rounded-xl p-6 w-full max-w-md">
            <h4 className="text-white text-lg font-semibold mb-4">
              {formMode === 'create' ? 'Add Salary Record' : 'Edit Salary Record'}
            </h4>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Trainer Select */}
              <div>
                <label className="block text-sm text-text-secondary mb-2">Trainer</label>
                <select
                  value={formData.employee}
                  onChange={(e) => setFormData({...formData, employee: e.target.value})}
                  required
                  disabled={formMode === 'edit'}
                  className="w-full px-4 py-2 bg-black/20 border border-card-border rounded-lg text-white focus:outline-none focus:border-accent disabled:opacity-50"
                >
                  <option value="">Select Trainer</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>{t.full_name} ({t.email})</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm text-text-secondary mb-2">Amount (₹)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required
                  min="0"
                  className="w-full px-4 py-2 bg-black/20 border border-card-border rounded-lg text-white focus:outline-none focus:border-accent"
                />
              </div>

              {/* Month */}
              <div>
                <label className="block text-sm text-text-secondary mb-2">Salary Month</label>
                <input
                  type="month"
                  value={formData.month ? formData.month.slice(0, 7) : ''}
                  onChange={(e) => setFormData({...formData, month: e.target.value + '-01'})}
                  required
                  className="w-full px-4 py-2 bg-black/20 border border-card-border rounded-lg text-white focus:outline-none focus:border-accent"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                  className="px-4 py-2 text-sm text-text-secondary hover:text-white transition disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-accent text-black rounded-lg hover:bg-accent-hover disabled:opacity-50 transition"
                >
                  {saving ? 'Saving...' : formMode === 'create' ? 'Create' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}