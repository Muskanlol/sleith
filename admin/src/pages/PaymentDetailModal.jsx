import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import api from '../api/client';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  SUCCESS: 'bg-green-100 text-green-700 border-green-200',
  FAILED: 'bg-red-100 text-red-700 border-red-200',
  REFUNDED: 'bg-purple-100 text-purple-700 border-purple-200',
};

export default function PaymentDetailModal({ paymentId, onClose, onStatusChange }) {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get(`/admin/payments/${paymentId}/`)
      .then((res) => { if (!cancelled) setPayment(res.data); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [paymentId]);

  const updateStatus = useCallback(async (newStatus) => {
    setUpdating(true);
    try {
      await api.patch(`/admin/payments/${paymentId}/update/`, { status: newStatus });
      setPayment((prev) => ({ ...prev, status: newStatus }));
      setUpdateError('');
      onStatusChange?.(paymentId, newStatus);
    } catch (err) {
      const data = err.response?.data;
      setUpdateError(
        data?.error || data?.detail || data?.status?.[0] || 'Failed to update payment status'
      );
    } finally {
      setUpdating(false);
    }
  }, [paymentId, onStatusChange]);

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-card-bg border border-card-border rounded-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-text-primary text-lg font-semibold">
            Payment {payment ? `#${payment.id}` : ''}
          </h4>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition">✕</button>
        </div>

        {loading || !payment ? (
          <div className="text-text-secondary text-sm py-8 text-center">Loading...</div>
        ) : (
          <>
            <div className="divide-y divide-card-border mb-6">
              {[
                { label: 'Customer', value: payment.customer_name || payment.customer?.full_name || '—' },
                { label: 'Email', value: payment.customer_email || payment.customer?.email || '—' },
                { label: 'Phone', value: payment.customer_phone || payment.customer?.phone || '—' },
                { label: 'Amount', value: `₹${payment.amount}` },
                { label: 'Payment For', value: payment.payment_for },
                { label: 'Package', value: payment.package_name || '—' },
                { label: 'Order ID', value: payment.gateway_order_id || '—' },
                { label: 'Gateway Payment ID', value: payment.gateway_payment_id || '—' },
                {
                  label: 'Status',
                  value: (
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${statusColors[payment.status] || statusColors.PENDING}`}>
                      {payment.status}
                    </span>
                  ),
                },
                { label: 'Created At', value: new Date(payment.created_at).toLocaleString() },
                { label: 'Updated At', value: new Date(payment.updated_at).toLocaleString() },
              ].map((row, idx) => (
                <div key={idx} className="flex items-center py-3">
                  <span className="w-36 text-sm text-text-secondary">{row.label}</span>
                  <span className="flex-1 text-sm text-text-primary">{row.value}</span>
                </div>
              ))}
            </div>

            {updateError && (
              <p className="mb-3 text-xs text-red-600 text-right">{updateError}</p>
            )}

            <div className="flex gap-2 justify-end">
              {payment.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => updateStatus('SUCCESS')}
                    disabled={updating}
                    className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-3 py-2 rounded transition disabled:opacity-50"
                  >
                    Mark Success
                  </button>
                  <button
                    onClick={() => updateStatus('FAILED')}
                    disabled={updating}
                    className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-3 py-2 rounded transition disabled:opacity-50"
                  >
                    Mark Failed
                  </button>
                </>
              )}
              {payment.status === 'SUCCESS' && (
                <button
                  onClick={() => updateStatus('REFUNDED')}
                  disabled={updating}
                  className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-2 rounded transition disabled:opacity-50"
                >
                  Refund
                </button>
              )}
              <button
                onClick={onClose}
                className="text-xs px-3 py-2 rounded border border-card-border text-text-primary hover:bg-hover-bg transition"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}