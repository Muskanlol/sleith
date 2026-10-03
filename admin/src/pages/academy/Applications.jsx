import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import api from '../../api/client';
import { academyApi } from '../../api/academy.api';

function courseIdOf(item) {
  if (!item) return null;
  const raw = item.course_id ?? item.course;
  if (raw && typeof raw === 'object') return raw.id;
  return raw;
}

function isAssignableBatch(batch, courseId) {
  if (!batch) return false;
  const active = batch.is_active !== false;
  const statusOk = !batch.status || batch.status === 'ACTIVE';
  return active && statusOk && String(courseIdOf(batch)) === String(courseId);
}

let toastId = 0;

function ToastContainer({ toasts, removeToast }) {
  return createPortal(
    <div
      className="fixed top-6 right-6 flex flex-col gap-2 w-80"
      style={{ zIndex: 9999 }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg text-sm
            ${
              t.type === 'success'
                ? 'bg-green-100 border-green-200 text-green-700'
                : t.type === 'warning'
                ? 'bg-orange-100 border-orange-200 text-orange-700'
                : 'bg-red-100 border-red-200 text-red-700'
            }`}
        >
          <span className="flex-1">{t.message}</span>

          <button
            type="button"
            onClick={() => removeToast(t.id)}
            className="text-current opacity-60 hover:opacity-100 transition"
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}

const ITEMS_PER_PAGE = 20;

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  AWAITING_RESPONSE: 'bg-orange-100 text-orange-700 border-orange-200',
  APPROVED: 'bg-green-100 text-green-700 border-green-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
};

const APPROVABLE_STATUSES = ['PENDING', 'AWAITING_RESPONSE'];

function Applications() {
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [batches, setBatches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [toasts, setToasts] = useState([]);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [sortField, setSortField] = useState('applied_at');
  const [sortDirection, setSortDirection] = useState('desc');

  const [currentPage, setCurrentPage] = useState(1);

  const [showApproveModal, setShowApproveModal] = useState(false);

  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState('');

  const [approving, setApproving] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    const id = ++toastId;

    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3500);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const fetchData = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const [appsRes, batchesRes] = await Promise.all([
          api.get('/admin/academy/applications/'),
          academyApi.getBatches(),
        ]);

        const applicationsData =
          appsRes.data?.results ?? appsRes.data ?? [];

        const batchesData =
          batchesRes.data?.results ?? batchesRes.data ?? [];

        setApplications(
          Array.isArray(applicationsData) ? applicationsData : []
        );

        setBatches(Array.isArray(batchesData) ? batchesData : []);
      } catch (error) {
        console.error('Failed to load academy applications:', error);

        showToast(
          error.response?.data?.detail || 'Failed to load applications',
          'error'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }

    setCurrentPage(1);
  };

  const clearFilters = () => {
    setStatusFilter('ALL');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const filteredApps = applications.filter((app) => {
    if (statusFilter !== 'ALL' && app.status !== statusFilter) {
      return false;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();

      const matchesName = app.student_name
        ?.toLowerCase()
        .includes(term);

      const matchesCourse = app.course_name
        ?.toLowerCase()
        .includes(term);

      if (!matchesName && !matchesCourse) {
        return false;
      }
    }

    return true;
  });

  const sortedApps = [...filteredApps].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === 'applied_at' || sortField === 'reviewed_at') {
      valA = new Date(valA || 0);
      valB = new Date(valB || 0);
    } else {
      valA = (valA ?? '').toString().toLowerCase();
      valB = (valB ?? '').toString().toLowerCase();
    }

    if (valA < valB) {
      return sortDirection === 'asc' ? -1 : 1;
    }

    if (valA > valB) {
      return sortDirection === 'asc' ? 1 : -1;
    }

    return 0;
  });

  const totalPages = Math.ceil(sortedApps.length / ITEMS_PER_PAGE) || 1;

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const endIndex = Math.min(
    startIndex + ITEMS_PER_PAGE,
    sortedApps.length
  );

  const paginatedApps = sortedApps.slice(startIndex, endIndex);

  const hasActiveFilters =
    statusFilter !== 'ALL' || searchTerm.trim() !== '';

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages = [];

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);

    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const openApproveModal = (app) => {
    setSelectedApp(app);
    setSelectedBatch('');
    setShowApproveModal(true);
  };

  const closeApproveModal = () => {
    if (approving) return;

    setShowApproveModal(false);
    setSelectedApp(null);
    setSelectedBatch('');
  };

  const handleApprove = async () => {
    if (!selectedApp) {
      showToast('No application selected', 'warning');
      return;
    }

    if (!selectedBatch) {
      showToast('Please select a batch', 'warning');
      return;
    }

    setApproving(true);

    try {
      await api.post(
        `/admin/academy/applications/${selectedApp.id}/approve/`,
        {
          batch_id: selectedBatch,
        }
      );

      showToast(
        `Application #${selectedApp.id} approved successfully`,
        'success'
      );

      closeApproveModal();

      await fetchData(true);
    } catch (error) {
      console.error('Approve application error:', error);

      showToast(
        error.response?.data?.error ||
          error.response?.data?.detail ||
          'Failed to approve application',
        'error'
      );
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to reject this application?'
    );

    if (!confirmed) return;

    setRejectingId(id);

    try {
      await api.patch(
        `/admin/academy/applications/${id}/status/`,
        {
          status: 'REJECTED',
        }
      );

      showToast(
        `Application #${id} rejected successfully`,
        'success'
      );

      await fetchData(true);
    } catch (error) {
      console.error('Reject application error:', error);

      showToast(
        error.response?.data?.error ||
          error.response?.data?.detail ||
          'Failed to reject application',
        'error'
      );
    } finally {
      setRejectingId(null);
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return (
        <span className="text-text-secondary/40 ml-1">
          ↕
        </span>
      );
    }

    return (
      <span className="text-accent ml-1">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';

    const date = new Date(dateStr);

    if (Number.isNaN(date.getTime())) {
      return 'N/A';
    }

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const courseBatches = batches.filter((batch) =>
    isAssignableBatch(batch, courseIdOf(selectedApp))
  );

  return (
    <div>
      <ToastContainer
        toasts={toasts}
        removeToast={removeToast}
      />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-text-primary text-xl font-semibold">
            Academy Applications
          </h3>

          {refreshing && (
            <span className="text-xs text-text-secondary animate-pulse">
              Refreshing...
            </span>
          )}
        </div>
      </div>

      <div className="bg-card-bg border border-card-border rounded-xl p-4 mb-4 flex flex-wrap items-center gap-3">
        <input
          id="academy-application-search"
          name="academy-application-search"
          type="text"
          placeholder="Search by student or course..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-secondary flex-1 min-w-50 focus:outline-none focus:border-accent"
        />

        <select
          id="academy-application-status"
          name="academy-application-status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="AWAITING_RESPONSE">Awaiting Response</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-accent hover:text-accent-hover transition"
          >
            Clear Filters
          </button>
        )}

        <span className="text-xs text-text-secondary ml-auto">
          Showing{' '}
          {sortedApps.length > 0
            ? `${startIndex + 1}–${endIndex}`
            : '0'}{' '}
          of {sortedApps.length}
        </span>
      </div>

      <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-hover-bg border-b border-card-border">
              <tr>
                <th
                  onClick={() => handleSort('student_name')}
                  className="px-6 py-4 text-sm font-medium text-text-secondary cursor-pointer hover:text-text-primary select-none transition"
                >
                  Student
                  <SortIcon field="student_name" />
                </th>

                <th
                  onClick={() => handleSort('course_name')}
                  className="px-6 py-4 text-sm font-medium text-text-secondary cursor-pointer hover:text-text-primary select-none transition"
                >
                  Course
                  <SortIcon field="course_name" />
                </th>

                <th
                  onClick={() => handleSort('status')}
                  className="px-6 py-4 text-sm font-medium text-text-secondary cursor-pointer hover:text-text-primary select-none transition"
                >
                  Status
                  <SortIcon field="status" />
                </th>

                <th
                  onClick={() => handleSort('applied_at')}
                  className="px-6 py-4 text-sm font-medium text-text-secondary cursor-pointer hover:text-text-primary select-none transition"
                >
                  Applied On
                  <SortIcon field="applied_at" />
                </th>

                <th className="px-6 py-4 text-sm font-medium text-text-secondary">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-10 text-center text-sm text-text-secondary"
                  >
                    Loading applications...
                  </td>
                </tr>
              ) : paginatedApps.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-10 text-center text-sm text-text-secondary"
                  >
                    No applications match your filters.
                  </td>
                </tr>
              ) : (
                paginatedApps.map((app) => (
                  <tr
                    key={app.id}
                    className="border-b border-card-border hover:bg-hover-bg/50 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center text-xs font-bold text-pink-400">
                          {app.student_name
                            ?.charAt(0)
                            ?.toUpperCase() || 'A'}
                        </div>

                        <p className="text-sm text-text-primary font-medium">
                          {app.student_name || 'Unknown'}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {app.course_name || '-'}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full border ${
                          statusColors[app.status] ||
                          statusColors.PENDING
                        }`}
                      >
                        {app.status || 'PENDING'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {formatDate(app.applied_at)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/admin/academy/applications/${app.id}`
                            )
                          }
                          className="text-xs text-text-secondary hover:text-text-primary transition"
                        >
                          View
                        </button>

                        {APPROVABLE_STATUSES.includes(app.status) && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                openApproveModal(app)
                              }
                              className="text-xs text-green-600 hover:text-green-700 transition font-medium"
                            >
                              Approve
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleReject(app.id)
                              }
                              disabled={rejectingId === app.id}
                              className="text-xs text-red-600 hover:text-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {rejectingId === app.id
                                ? 'Rejecting...'
                                : 'Reject'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {sortedApps.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between mt-4">
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-sm rounded-lg border border-card-border bg-card-bg text-text-primary hover:bg-hover-bg disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            ← Previous
          </button>

          <div className="flex items-center gap-1">
            {getPageNumbers().map((page) => (
              <button
                type="button"
                key={page}
                onClick={() => goToPage(page)}
                className={`w-8 h-8 text-sm rounded-lg border transition ${
                  page === currentPage
                    ? 'bg-accent text-sidebar-text border-accent font-semibold'
                    : 'bg-card-bg border-card-border text-text-primary hover:bg-hover-bg'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-sm rounded-lg border border-card-border bg-card-bg text-text-primary hover:bg-hover-bg disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Next →
          </button>
        </div>
      )}

      {showApproveModal && selectedApp && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-card-bg border border-card-border rounded-xl p-6 w-full max-w-md">
            <h4 className="text-text-primary text-lg font-semibold mb-2">
              Approve Application
            </h4>

            <p className="text-text-secondary text-sm mb-5">
              Approving{' '}
              <span className="text-text-primary font-medium">
                {selectedApp.student_name}
              </span>{' '}
              for{' '}
              <span className="text-text-primary font-medium">
                {selectedApp.course_name}
              </span>
            </p>

            <label
              htmlFor="academy-application-batch"
              className="block text-sm text-text-secondary mb-2"
            >
              Select Batch
            </label>

            <select
              id="academy-application-batch"
              name="academy-application-batch"
              value={selectedBatch}
              onChange={(e) =>
                setSelectedBatch(e.target.value)
              }
              disabled={approving}
              className="w-full bg-hover-bg border border-card-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent mb-4 disabled:opacity-50"
            >
              <option value="">-- Select a batch --</option>

              {courseBatches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name || `Batch #${batch.id}`}
                  {batch.capacity
                    ? ` (Capacity: ${batch.capacity})`
                    : ''}
                </option>
              ))}
            </select>

            {courseBatches.length === 0 && (
              <p className="text-xs text-red-400 mb-4">
                No batches available for this course.
              </p>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={closeApproveModal}
                disabled={approving}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition disabled:opacity-40"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleApprove}
                disabled={
                  !selectedBatch ||
                  approving ||
                  courseBatches.length === 0
                }
                className="px-4 py-2 text-sm bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {approving
                  ? 'Approving...'
                  : 'Confirm Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Applications;