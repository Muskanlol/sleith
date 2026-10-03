import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { academyApi } from '../../api/academy.api';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import Toast from '../../components/common/Toast';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  PAID: 'bg-green-100 text-green-700 border-green-200',
  OVERDUE: 'bg-red-100 text-red-700 border-red-200',
};

function MarkPaidModal({ fee, onClose, onConfirm, saving }) {
  return createPortal(
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="bg-card-bg border border-card-border rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h4 className="text-text-primary text-lg font-semibold mb-2">Mark as Paid?</h4>
        <p className="text-text-secondary text-sm mb-5">
          ₹{fee.amount} due on {fee.due_date} will be marked as paid today.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition disabled:opacity-40">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="px-4 py-2 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded-lg disabled:opacity-40 transition"
          >
            {saving ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function StudentCourseFees() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFee, setSelectedFee] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const errorMessage = (err, fallback) => {
    const data = err.response?.data;
    if (typeof data === 'string') return data;
    return data?.error || data?.detail || fallback;
  };

  const fetchFees = () => {
    academyApi.getAcademyFees(studentId)
      .then((res) => setFees(res.data.results || res.data || []))
      .catch((err) =>
        setToast({ type: 'error', message: errorMessage(err, 'Failed to load fees') })
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchFees(); }, [studentId]);

  const handleMarkPaid = async () => {
    setSaving(true);
    try {
      await academyApi.markFeePaid(selectedFee.id);
      setSelectedFee(null);
      setToast({ type: 'success', message: 'Fee marked as paid' });
      fetchFees();
    } catch (err) {
      setToast({ type: 'error', message: errorMessage(err, 'Failed to mark fee as paid') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading course fees..." />;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text-primary transition">← Back</button>
      </div>
      <h3 className="text-text-primary text-xl font-semibold mb-6">Course Fees</h3>

      {!fees.length ? (
        <EmptyState message="No fee records for this student" />
      ) : (
        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-hover-bg border-b border-card-border">
              <tr>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary">Batch</th>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary">Amount</th>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary">Due Date</th>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary">Paid Date</th>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary">Status</th>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fees.map((fee) => {
                const displayStatus = fee.is_overdue ? 'OVERDUE' : fee.status;
                return (
                  <tr key={fee.id} className="border-b border-card-border">
                    <td className="px-6 py-4 text-sm text-text-primary">{fee.batch_name}</td>
                    <td className="px-6 py-4 text-sm text-text-primary">₹{fee.amount}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{fee.due_date}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{fee.paid_date || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${statusColors[displayStatus] || statusColors.PENDING}`}>
                        {displayStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {fee.status !== 'PAID' && (
                        <button onClick={() => setSelectedFee(fee)} className="text-xs text-green-700 hover:text-green-800 transition">
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedFee && (
        <MarkPaidModal
          fee={selectedFee}
          saving={saving}
          onClose={() => setSelectedFee(null)}
          onConfirm={handleMarkPaid}
        />
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}