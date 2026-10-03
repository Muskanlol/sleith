import { useCallback, useEffect, useState } from 'react';
import { reviewsApi } from '../api/reviews.api';

const STATUS = {
  PENDING:  { label: 'Pending',  bg: 'rgba(234,179,8,0.1)',  text: '#ca8a04', border: 'rgba(234,179,8,0.3)' },
  APPROVED: { label: 'Approved', bg: 'rgba(34,197,94,0.1)',  text: '#16a34a', border: 'rgba(34,197,94,0.3)' },
  REJECTED: { label: 'Rejected', bg: 'rgba(239,68,68,0.1)',  text: '#dc2626', border: 'rgba(239,68,68,0.3)' },
};

function Badge({ status }) {
  const s = STATUS[status] || STATUS.PENDING;
  return (
    <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold tracking-widest uppercase border"
      style={{ background: s.bg, color: s.text, borderColor: s.border }}>
      {s.label}
    </span>
  );
}

function Stars({ value }) {
  return (
    <span style={{ color: '#C9A96E', letterSpacing: 2 }}>
      {'★'.repeat(value)}{'☆'.repeat(5 - value)}
    </span>
  );
}

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [statusError, setStatusError] = useState('');

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'ALL' ? { status: filter } : {};
      const { data } = await reviewsApi.getAll(params);
      setReviews(Array.isArray(data) ? data : data.results ?? []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const setStatus = async (status) => {
    if (!selected) return;
    setUpdating(true);
    try {
      const { data } = await reviewsApi.updateStatus(selected.id, status);
      setSelected(data);
      setReviews((prev) => prev.map((r) => (r.id === data.id ? data : r)));
      setStatusError('');
    } catch (err) {
      const data = err.response?.data;
      setStatusError(data?.error || data?.detail || 'Failed to update review status');
    } finally {
      setUpdating(false);
    }
  };

  const pendingCount = reviews.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
            Reviews
          </h2>
          {pendingCount > 0 && filter === 'ALL' && (
            <p className="text-sm mt-0.5" style={{ color: '#ca8a04' }}>
              {pendingCount} awaiting approval
            </p>
          )}
        </div>
        <button onClick={fetchReviews}
          className="px-4 py-2 rounded-lg border text-sm hover:border-accent"
          style={{ background: 'var(--hover-bg)', borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}>
          ↻ Refresh
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase border transition-all"
            style={filter === f ? {
              background: 'var(--accent)', color: '#0a0a0a', borderColor: 'var(--accent)',
            } : {
              background: 'var(--hover-bg)', color: 'var(--text-secondary)', borderColor: 'var(--card-border)',
            }}>
            {f === 'ALL' ? 'All' : STATUS[f].label}
          </button>
        ))}
      </div>

      <div className="flex gap-5 flex-1 min-h-0">
        <div className="w-80 flex-shrink-0 flex flex-col gap-2 overflow-y-auto">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--hover-bg)' }} />
            ))
          ) : reviews.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-12">No reviews found.</p>
          ) : (
            reviews.map((r) => (
              <div key={r.id} onClick={() => setSelected(r)}
                className="p-4 rounded-xl border cursor-pointer transition-all"
                style={{
                  background: selected?.id === r.id ? 'var(--hover-bg)' : 'var(--card-bg)',
                  borderColor: selected?.id === r.id ? 'var(--accent)' : 'var(--card-border)',
                }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-text-primary truncate">{r.customer_name}</p>
                  <Badge status={r.status} />
                </div>
                <Stars value={r.rating} />
                <p className="text-xs text-text-secondary truncate mt-1">{r.comment || 'No comment'}</p>
                <p className="text-[10px] text-text-secondary mt-1">{fmtDate(r.created_at)}</p>
              </div>
            ))
          )}
        </div>

        <div className="flex-1 rounded-xl border overflow-hidden"
          style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center p-8">
              <p className="text-4xl">★</p>
              <p className="text-text-secondary text-sm">Select a review to approve or reject</p>
            </div>
          ) : (
            <div className="p-6 h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <Badge status={selected.status} />
                  <span className="text-xs text-text-secondary">{fmtDate(selected.created_at)}</span>
                </div>
                <div className="flex gap-2">
                  {selected.status !== 'APPROVED' && (
                    <button onClick={() => setStatus('APPROVED')} disabled={updating}
                      className="px-3 py-1.5 text-xs rounded-lg border disabled:opacity-50"
                      style={{ borderColor: 'rgba(34,197,94,0.4)', color: '#16a34a', background: 'rgba(34,197,94,0.07)' }}>
                      Approve
                    </button>
                  )}
                  {selected.status !== 'REJECTED' && (
                    <button onClick={() => setStatus('REJECTED')} disabled={updating}
                      className="px-3 py-1.5 text-xs rounded-lg border disabled:opacity-50"
                      style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#dc2626', background: 'rgba(239,68,68,0.07)' }}>
                      Reject
                    </button>
                  )}
                </div>
              </div>

              {statusError && (
                <p className="mb-4 text-xs text-red-600">{statusError}</p>
              )}

              <div className="grid grid-cols-2 gap-4 mb-5 p-4 rounded-xl" style={{ background: 'var(--hover-bg)' }}>
                {[
                  { label: 'Customer', value: selected.customer_name },
                  { label: 'Email', value: selected.customer_email },
                  { label: 'Staff', value: selected.staff_name },
                  { label: 'Visit', value: fmtDate(selected.appointment_date) },
                  { label: 'Services', value: (selected.service_names || []).join(', ') || '—' },
                  { label: 'Rating', value: `${selected.rating} / 5` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] tracking-widest uppercase text-text-secondary mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-text-primary">{value}</p>
                  </div>
                ))}
              </div>

              <p className="text-[10px] tracking-widest uppercase text-text-secondary mb-2">Comment</p>
              <p className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap p-4 rounded-xl"
                style={{ background: 'var(--hover-bg)', border: '1px solid var(--card-border)' }}>
                {selected.comment || 'No comment left.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
