import { useEffect, useState } from 'react';
import { salaryApi } from '../api/salary.api';
import { staffApi } from '../api/staff.api';
import MarkSalaryPaidModal from '../components/MarkSalaryPaidModal';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import Toast from '../components/common/Toast';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  PAID: 'bg-green-100 text-green-700 border-green-200',
};

export default function SalonSalary() {
  const [activeRole, setActiveRole] = useState('STAFF');
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employee: '',
    amount: '',
    month: '',
  });

  const fetchSalaries = () => {
    setLoading(true);
    salaryApi.getByRole(activeRole)
      .then((res) => setSalaries(res.data.results || res.data))
      .catch((err) => console.error('Failed to load salaries:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSalaries(); }, [activeRole]);

  const fetchEmployees = async () => {
    try {
      const res = await staffApi.getEligibleUsers();
      const list = (res.data.results || res.data).filter(
        u => u.role === activeRole
      );
      setEmployees(list);
    } catch (err) {
      console.error('Failed to load employees:', err);
      setToast({ type: 'error', message: 'Failed to load employees list' });
    }
  };

  const openCreate = () => {
    setFormMode('create');
    setFormData({ employee: '', amount: '', month: '' });
    fetchEmployees();
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
    fetchEmployees();
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
        await salaryApi.create(payload);
        setToast({ type: 'success', message: 'Salary record created successfully' });
      } else {
        await salaryApi.update(selected.id, payload);
        setToast({ type: 'success', message: 'Salary record updated successfully' });
      }
      setShowForm(false);
      setSelected(null);
      fetchSalaries();
    } catch (err) {
      setToast({ 
        type: 'error', 
        message: err.response?.data?.error || err.response?.data?.detail || 'Failed to save salary record' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this salary record?')) return;
    try {
      await salaryApi.delete(id);
      setToast({ type: 'success', message: 'Salary record deleted successfully' });
      fetchSalaries();
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to delete salary record' });
    }
  };

  const handleMarkPaid = async () => {
    setSaving(true);
    try {
      await salaryApi.markPaid(selected.id);
      setSelected(null);
      fetchSalaries();
      setToast({ type: 'success', message: 'Salary marked as paid' });
    } catch (err) {
      console.error('Failed to mark paid:', err);
      setToast({ type: 'error', message: 'Failed to mark as paid' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-text-primary text-xl font-semibold">Salary</h3>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-accent text-sidebar-text font-medium rounded-lg hover:bg-accent-hover transition"
        >
          + Add Salary
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {['STAFF', 'MANAGER'].map((role) => (
          <button
            key={role}
            onClick={() => setActiveRole(role)}
            className={`px-4 py-2 text-sm rounded-lg border transition ${
              activeRole === role
                ? 'bg-accent text-sidebar-text border-accent font-semibold'
                : 'bg-card-bg border-card-border text-text-primary hover:bg-hover-bg'
            }`}
          >
            {role === 'STAFF' ? 'Staff' : 'Manager'}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState message="Loading salaries..." />
      ) : !salaries.length ? (
        <EmptyState message={`No salary records for ${activeRole.toLowerCase()}`} />
      ) : (
        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-hover-bg border-b border-card-border">
              <tr>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary">Employee</th>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary">Month</th>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary">Amount</th>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary">Paid Date</th>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary">Status</th>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {salaries.map((sal) => (
                <tr key={sal.id} className="border-b border-card-border hover:bg-hover-bg/50 transition">
                  <td className="px-6 py-4">
                    <p className="text-sm text-text-primary">{sal.employee_name}</p>
                    <p className="text-xs text-text-secondary">{sal.employee_email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {new Date(sal.month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-sm text-accent">₹{sal.amount}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{sal.paid_date || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${statusColors[sal.status] || statusColors.PENDING}`}>
                      {sal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openEdit(sal)}
                        className="text-xs text-text-secondary hover:text-text-primary transition"
                      >
                        Edit
                      </button>
                      {sal.status !== 'PAID' && (
                        <button 
                          onClick={() => setSelected(sal)} 
                          className="text-xs text-green-600 hover:text-green-500 transition"
                        >
                          Mark Paid
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(sal.id)}
                        className="text-xs text-danger hover:text-red-600 transition"
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

      {selected && !showForm && (
        <MarkSalaryPaidModal
          salary={selected}
          saving={saving}
          onClose={() => setSelected(null)}
          onConfirm={handleMarkPaid}
        />
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={() => setShowForm(false)}>
          <div className="bg-card-bg border border-card-border rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-text-primary text-lg font-semibold mb-4">
              {formMode === 'create' ? 'Add Salary Record' : 'Edit Salary Record'}
            </h4>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">Employee</label>
                <select
                  value={formData.employee}
                  onChange={(e) => setFormData({...formData, employee: e.target.value})}
                  required
                  disabled={formMode === 'edit'}
                  className="w-full px-4 py-2 bg-hover-bg border border-card-border rounded-lg text-text-primary focus:outline-none focus:border-accent disabled:opacity-50"
                >
                  <option value="">Select {activeRole === 'STAFF' ? 'Staff' : 'Manager'}</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name || emp.email} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-2">Amount (₹)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required
                  min="0"
                  step="0.01"
                  placeholder="e.g. 25000"
                  className="w-full px-4 py-2 bg-hover-bg border border-card-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-2">Salary Month</label>
                <input
                  type="month"
                  value={formData.month ? formData.month.slice(0, 7) : ''}
                  onChange={(e) => setFormData({...formData, month: e.target.value + '-01'})}
                  required
                  className="w-full px-4 py-2 bg-hover-bg border border-card-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                  className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-accent text-sidebar-text rounded-lg hover:bg-accent-hover disabled:opacity-50 transition"
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