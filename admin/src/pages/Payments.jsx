import { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import { createPortal } from 'react-dom';
import PaymentDetailModal from './PaymentDetailModal';

const statusColors = {
  PENDING:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  SUCCESS:  'bg-green-500/10  text-green-400  border-green-500/20',
  FAILED:   'bg-red-500/10    text-red-400    border-red-500/20',
  REFUNDED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const paymentForColors = {
  PACKAGE:     'bg-blue-500/10   text-blue-400   border-blue-500/20',
  APPOINTMENT: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  ACADEMY:     'bg-pink-500/10   text-pink-400   border-pink-500/20',
};

const ITEMS_PER_PAGE = 20;

let toastId = 0;

function ToastContainer({ toasts, removeToast }) {
  return createPortal(
    <div className="fixed top-6 right-6 flex flex-col gap-2 w-80" style={{ zIndex: 9999 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl text-sm"
          style={{
            background:  t.type === 'success' ? 'rgba(34,197,94,0.1)' : t.type === 'warning' ? 'rgba(251,146,60,0.1)' : 'rgba(239,68,68,0.1)',
            borderColor: t.type === 'success' ? 'rgba(34,197,94,0.3)' : t.type === 'warning' ? 'rgba(251,146,60,0.3)' : 'rgba(239,68,68,0.3)',
            color:       t.type === 'success' ? '#4ade80'              : t.type === 'warning' ? '#fb923c'              : '#f87171',
            backdropFilter: 'blur(8px)',
          }}
        >
          <span className="flex-1">{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="opacity-60 hover:opacity-100 transition">✕</button>
        </div>
      ))}
    </div>,
    document.body
  );
}

function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toasts, setToasts] = useState([]);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedPaymentId, setSelectedPaymentId] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const [fetchError, setFetchError] = useState(null);

  const fetchPayments = useCallback((silent = false) => {
    if (silent) setRefreshing(true); else { setLoading(true); setFetchError(null); }
    api.get('/admin/payments/')
      .then((res) => {
        const salonOnly = (Array.isArray(res.data) ? res.data : res.data.results ?? [])
          .filter((p) => p.payment_for !== 'ACADEMY');
        setPayments(salonOnly);
      })
      .catch(() => {
        if (!silent) setFetchError('Failed to load payments. Check your connection and try again.');
      })
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handleStatusChange = (id, newStatus) => {
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
    showToast(`Payment #${id} marked as ${newStatus.toLowerCase()}`, newStatus === 'REFUNDED' ? 'warning' : 'success');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'var(--accent) transparent var(--accent) var(--accent)' }} />
    </div>
  );

  if (fetchError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{fetchError}</p>
      <button onClick={() => fetchPayments()}
        className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
        style={{ background: 'var(--hover-bg)', border: '1px solid var(--card-border)', color: 'var(--text-primary)' }}>
        Try Again
      </button>
    </div>
  );

  const filtered = payments.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (typeFilter === 'PACKAGE' && p.payment_for !== 'PACKAGE') return false;
    if (typeFilter === 'NON_PACKAGE' && p.payment_for !== 'APPOINTMENT') return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return p.customer_name?.toLowerCase().includes(term) || String(p.id).includes(term) || p.gateway_order_id?.toLowerCase().includes(term);
    }
    return true;
  });

  const hasActiveFilters = statusFilter !== 'ALL' || typeFilter !== 'ALL' || searchTerm;

  const clearFilters = () => {
    setStatusFilter('ALL'); setTypeFilter('ALL'); setSearchTerm(''); setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDirection('asc'); }
    setCurrentPage(1);
  };

  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0;
    // Numeric sort for amount field, string sort for everything else
    if (sortField === 'amount') {
      const diff = Number(a.amount ?? 0) - Number(b.amount ?? 0);
      return sortDirection === 'asc' ? diff : -diff;
    }
    const valA = (a[sortField] ?? '').toString().toLowerCase();
    const valB = (b[sortField] ?? '').toString().toLowerCase();
    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, sorted.length);
  const paginated = sorted.slice(startIndex, endIndex);

  const goToPage = (p) => { if (p >= 1 && p <= totalPages) setCurrentPage(p); };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <span className="text-text-secondary/40 ml-1">↕</span>;
    return <span className="text-accent ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  const getPageNumbers = () => {
    const pages = [];
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-text-primary text-xl font-semibold">Payments — Customers</h3>
          {refreshing && <span className="text-xs text-text-secondary animate-pulse">Refreshing...</span>}
        </div>
      </div>

      <div className="bg-card-bg border border-card-border rounded-xl p-4 mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text" placeholder="Search by customer, ID or order ID..." value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-secondary flex-1 min-w-50 focus:outline-none focus:border-accent"
        />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent">
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
          className="bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent">
          <option value="ALL">All (Package + Non-Package)</option>
          <option value="PACKAGE">Package</option>
          <option value="NON_PACKAGE">Non-Package</option>
        </select>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-sm text-accent hover:text-accent-hover transition">Clear Filters</button>
        )}
        <span className="text-xs text-text-secondary ml-auto">
          Showing {sorted.length > 0 ? `${startIndex + 1}–${endIndex}` : '0'} of {sorted.length}
        </span>
      </div>

      <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-hover-bg border-b border-card-border">
            <tr>
              <th onClick={() => handleSort('id')} className="px-6 py-4 text-sm font-medium text-text-secondary cursor-pointer hover:text-text-primary select-none transition">ID <SortIcon field="id" /></th>
              <th onClick={() => handleSort('customer_name')} className="px-6 py-4 text-sm font-medium text-text-secondary cursor-pointer hover:text-text-primary select-none transition">Customer <SortIcon field="customer_name" /></th>
              <th onClick={() => handleSort('amount')} className="px-6 py-4 text-sm font-medium text-text-secondary cursor-pointer hover:text-text-primary select-none transition">Amount <SortIcon field="amount" /></th>
              <th onClick={() => handleSort('payment_for')} className="px-6 py-4 text-sm font-medium text-text-secondary cursor-pointer hover:text-text-primary select-none transition">Type <SortIcon field="payment_for" /></th>
              <th onClick={() => handleSort('status')} className="px-6 py-4 text-sm font-medium text-text-secondary cursor-pointer hover:text-text-primary select-none transition">Status <SortIcon field="status" /></th>
              <th className="px-6 py-4 text-sm font-medium text-text-secondary">Order ID</th>
              <th onClick={() => handleSort('created_at')} className="px-6 py-4 text-sm font-medium text-text-secondary cursor-pointer hover:text-text-primary select-none transition">Date <SortIcon field="created_at" /></th>
              <th className="px-6 py-4 text-sm font-medium text-text-secondary">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan="8" className="px-6 py-10 text-center text-sm text-text-secondary">No payments match your filters.</td></tr>
            ) : (
              paginated.map((p) => (
                <tr key={p.id} className="border-b border-card-border hover:bg-hover-bg/50 transition">
                  <td className="px-6 py-4 text-sm text-text-primary">#{p.id}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-text-primary">{p.customer_name || 'Unknown'}</p>
                    <p className="text-xs text-text-secondary">{p.customer_email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-primary">₹{p.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${paymentForColors[p.payment_for] || ''}`}>
                      {p.payment_for === 'APPOINTMENT' ? 'Non-Package' : 'Package'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${statusColors[p.status] || statusColors.PENDING}`}>{p.status}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{p.gateway_order_id || '-'}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => setSelectedPaymentId(p.id)} className="text-xs text-text-secondary hover:text-text-primary transition">View</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {sorted.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between mt-4">
          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
            className="px-3 py-1.5 text-sm rounded-lg border border-card-border bg-card-bg text-text-primary hover:bg-hover-bg disabled:opacity-40 disabled:cursor-not-allowed transition">← Previous</button>
          <div className="flex items-center gap-1">
            {getPageNumbers().map((p) => (
              <button key={p} onClick={() => goToPage(p)}
                className={`w-8 h-8 text-sm rounded-lg border transition ${p === currentPage ? 'bg-accent text-sidebar-text border-accent font-semibold' : 'bg-card-bg border-card-border text-text-primary hover:bg-hover-bg'}`}>{p}</button>
            ))}
          </div>
          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-sm rounded-lg border border-card-border bg-card-bg text-text-primary hover:bg-hover-bg disabled:opacity-40 disabled:cursor-not-allowed transition">Next →</button>
        </div>
      )}

      {selectedPaymentId && (
        <PaymentDetailModal
          paymentId={selectedPaymentId}
          onClose={() => setSelectedPaymentId(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

export default Payments;