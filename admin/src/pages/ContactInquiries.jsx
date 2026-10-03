import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';

const STATUS_CONFIG = {
  NEW:      { label: 'New',      bg: 'rgba(155,90,110,0.15)', text: '#c97b90', border: 'rgba(155,90,110,0.35)' },
  READ:     { label: 'Read',     bg: 'rgba(234,179,8,0.1)',   text: '#ca8a04', border: 'rgba(234,179,8,0.3)'   },
  RESOLVED: { label: 'Resolved', bg: 'rgba(34,197,94,0.1)',   text: '#16a34a', border: 'rgba(34,197,94,0.3)'   },
};

function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.NEW;
  return (
    <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold tracking-widest uppercase border"
      style={{ background: s.bg, color: s.text, borderColor: s.border }}>
      {s.label}
    </span>
  );
}

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function ContactInquiries() {
  const [inquiries,    setInquiries]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState('ALL');
  const [selected,     setSelected]     = useState(null);
  const [updating,     setUpdating]     = useState(false);
  const [replyText,    setReplyText]    = useState('');
  const [replySending, setReplySending] = useState(false);
  const [replyStatus,  setReplyStatus]  = useState(null); // 'ok' | 'err' | null
  const [replyError,   setReplyError]   = useState('');
  const [statusError,  setStatusError]  = useState('');

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'ALL' ? `?status=${filter}` : '';
      const res = await api.get(`/admin/contact-inquiries/${params}`);
      setInquiries(Array.isArray(res.data) ? res.data : res.data.results ?? []);
    } catch {
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchInquiries(); }, [fetchInquiries]);

  const sendReply = async () => {
    if (!replyText.trim() || !selected) return;
    setReplySending(true);
    setReplyStatus(null);
    setReplyError('');
    try {
      await api.post(`/admin/contact-inquiries/${selected.id}/reply/`, { message: replyText });
      setReplyStatus('ok');
      setReplyText('');
      // mark as resolved locally
      const updated = { ...selected, status: 'RESOLVED' };
      setSelected(updated);
      setInquiries((prev) => prev.map((i) => i.id === selected.id ? updated : i));
    } catch (err) {
      setReplyStatus('err');
      setReplyError(err?.response?.data?.error || 'Failed to send reply.');
    } finally {
      setReplySending(false);
    }
  };

  const openInquiry = async (inq) => {
    setSelected(inq);
    setReplyText('');
    setReplyStatus(null);
    setReplyError('');
    // auto-mark as READ on open
    if (inq.status === 'NEW') {
      try {
        await api.patch(`/admin/contact-inquiries/${inq.id}/`, { status: 'READ' });
        setInquiries((prev) => prev.map((i) => i.id === inq.id ? { ...i, status: 'READ' } : i));
        setSelected((prev) => prev ? { ...prev, status: 'READ' } : prev);
      } catch {}
    }
  };

  const updateStatus = async (status) => {
    if (!selected) return;
    setUpdating(true);
    try {
      await api.patch(`/admin/contact-inquiries/${selected.id}/`, { status });
      setInquiries((prev) => prev.map((i) => i.id === selected.id ? { ...i, status } : i));
      setSelected((prev) => prev ? { ...prev, status } : prev);
      setStatusError('');
    } catch (err) {
      const data = err.response?.data;
      setStatusError(data?.error || data?.detail || 'Failed to update status');
    }
    setUpdating(false);
  };

  const newCount = inquiries.filter((i) => i.status === 'NEW').length;

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
            Contact Inquiries
          </h2>
          {newCount > 0 && (
            <p className="text-sm mt-0.5" style={{ color: '#c97b90' }}>
              {newCount} new message{newCount !== 1 ? 's' : ''} awaiting review
            </p>
          )}
        </div>
        <button onClick={fetchInquiries}
          className="px-4 py-2 rounded-lg border text-sm transition-colors hover:border-accent"
          style={{ background: 'var(--hover-bg)', borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}>
          ↻ Refresh
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {['ALL', 'NEW', 'READ', 'RESOLVED'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase border transition-all"
            style={filter === f ? {
              background: 'var(--accent)', color: '#0a0a0a', borderColor: 'var(--accent)',
            } : {
              background: 'var(--hover-bg)', color: 'var(--text-secondary)', borderColor: 'var(--card-border)',
            }}>
            {f === 'ALL' ? 'All' : STATUS_CONFIG[f]?.label}
          </button>
        ))}
      </div>

      <div className="flex gap-5 flex-1 min-h-0">
        {/* ── List ── */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-2 overflow-y-auto">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--hover-bg)' }} />
            ))
          ) : inquiries.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-12">No inquiries found.</p>
          ) : (
            inquiries.map((inq) => (
              <div key={inq.id}
                onClick={() => openInquiry(inq)}
                className="p-4 rounded-xl border cursor-pointer transition-all"
                style={{
                  background: selected?.id === inq.id ? 'var(--hover-bg)' : 'var(--card-bg)',
                  borderColor: selected?.id === inq.id ? 'var(--accent)' : 'var(--card-border)',
                }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-text-primary truncate">{inq.name}</p>
                  <StatusBadge status={inq.status} />
                </div>
                <p className="text-xs font-medium truncate" style={{ color: 'var(--accent)' }}>{inq.subject}</p>
                <p className="text-xs text-text-secondary truncate mt-0.5">{inq.message}</p>
                <p className="text-[10px] text-text-secondary mt-1">{fmtDate(inq.created_at)}</p>
              </div>
            ))
          )}
        </div>

        {/* ── Detail ── */}
        <div className="flex-1 rounded-xl border overflow-hidden"
          style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center p-8">
              <p className="text-4xl">✉️</p>
              <p className="text-text-secondary text-sm">Select an inquiry to view the full message</p>
            </div>
          ) : (
            <div className="p-6 h-full overflow-y-auto">
              {/* Status bar */}
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <StatusBadge status={selected.status} />
                  <span className="text-xs text-text-secondary">{fmtDate(selected.created_at)}</span>
                </div>
                <div className="flex gap-2">
                  {selected.status !== 'READ' && (
                    <button onClick={() => updateStatus('READ')} disabled={updating}
                      className="px-3 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-50"
                      style={{ borderColor: 'rgba(234,179,8,0.4)', color: '#ca8a04', background: 'rgba(234,179,8,0.07)' }}>
                      Mark Read
                    </button>
                  )}
                  {selected.status !== 'RESOLVED' && (
                    <button onClick={() => updateStatus('RESOLVED')} disabled={updating}
                      className="px-3 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-50"
                      style={{ borderColor: 'rgba(34,197,94,0.4)', color: '#16a34a', background: 'rgba(34,197,94,0.07)' }}>
                      Mark Resolved ✓
                    </button>
                  )}
                </div>
              </div>

              {statusError && (
                <p className="mb-4 text-xs text-red-600">{statusError}</p>
              )}

              {/* Sender info */}
              <div className="grid grid-cols-2 gap-4 mb-5 p-4 rounded-xl"
                style={{ background: 'var(--hover-bg)' }}>
                {[
                  { label: 'Name',    value: selected.name },
                  { label: 'Email',   value: selected.email },
                  { label: 'Phone',   value: selected.phone || '—' },
                  { label: 'Subject', value: selected.subject },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] tracking-widest uppercase text-text-secondary mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-text-primary">{value}</p>
                  </div>
                ))}
              </div>

              {/* Message */}
              <div>
                <p className="text-[10px] tracking-widest uppercase text-text-secondary mb-2">Message</p>
                <p className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap p-4 rounded-xl"
                  style={{ background: 'var(--hover-bg)', border: '1px solid var(--card-border)' }}>
                  {selected.message}
                </p>
              </div>

              {/* ── Reply Box ── */}
              <div className="mt-6 p-4 rounded-xl border" style={{ background: 'var(--hover-bg)', borderColor: 'var(--card-border)' }}>
                <p className="text-[10px] tracking-widest uppercase text-text-secondary mb-3 font-semibold">
                  ✉ Reply to {selected.name}
                </p>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => { setReplyText(e.target.value); setReplyStatus(null); }}
                  placeholder={`Type your reply to ${selected.email}…`}
                  className="w-full rounded-lg p-3 text-sm resize-none outline-none border transition-all"
                  style={{
                    background: 'var(--card-bg)',
                    borderColor: replyStatus === 'err' ? '#e57373' : 'var(--card-border)',
                    color: 'var(--text-primary)',
                  }}
                />

                {replyStatus === 'ok' && (
                  <p className="text-xs mt-2 font-medium" style={{ color: '#16a34a' }}>
                    ✓ Reply sent! Inquiry marked as Resolved.
                  </p>
                )}
                {replyStatus === 'err' && (
                  <p className="text-xs mt-2 font-medium" style={{ color: '#e57373' }}>
                    ✗ {replyError}
                  </p>
                )}

                <div className="flex items-center justify-between mt-3">
                  <p className="text-[10px] text-text-secondary">Will be sent to: {selected.email}</p>
                  <button
                    onClick={sendReply}
                    disabled={replySending || !replyText.trim()}
                    className="px-5 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
                    style={{ background: 'var(--accent)', color: '#0a0a0a' }}>
                    {replySending ? 'Sending…' : 'Send Reply ✉'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
