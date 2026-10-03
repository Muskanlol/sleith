import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { academyApi } from '../../api/academy.api';
import { ROLES } from '../../utils/constants';
import PageHeader from '../../components/common/PageHeader';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import Toast from '../../components/common/Toast';

const STATUS_STYLES = {
  DRAFT: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  ISSUED: 'bg-blue-100 text-blue-700 border-blue-200',
  VERIFIED: 'bg-green-100 text-green-700 border-green-200',
  REVOKED: 'bg-red-100 text-red-700 border-red-200',
};

export default function Certificates() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCert, setSelectedCert] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [formData, setFormData] = useState({ student: '', course: '', batch: '' });
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const isAdmin = user?.role === ROLES.ADMIN;
  const canManage = isAdmin;

  useEffect(() => {
    fetchCertificates();
    if (formOpen) {
      fetchFormOptions();
    }
  }, [statusFilter, search, formOpen]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const res = await academyApi.getCertificates(params);
      setCertificates(res.data.results || res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const fetchFormOptions = async () => {
    try {
      const [studentsRes, coursesRes, batchesRes] = await Promise.all([
        academyApi.getStudents(),
        academyApi.getCourses(),
        academyApi.getBatches(),
      ]);
      const studentsData = studentsRes.data.enrolled || studentsRes.data.results || studentsRes.data;
      setStudents(Array.isArray(studentsData) ? studentsData : []);
      setCourses(coursesRes.data.results || coursesRes.data);
      setBatches(batchesRes.data.results || batchesRes.data);
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to load form options' });
    }
  };

  const handleAction = async (action, certId) => {
    setActionLoading(true);
    try {
      let res;
      if (action === 'issue') res = await academyApi.issueCertificate(certId);
      else if (action === 'verify') res = await academyApi.verifyCertificate(certId);
      else if (action === 'revoke') res = await academyApi.revokeCertificate(certId);
      else if (action === 'restore') res = await academyApi.restoreCertificate(certId);
      else if (action === 'delete') res = await academyApi.deleteCertificate(certId);

      if (action === 'delete') {
        setCertificates((prev) => prev.filter((c) => c.id !== certId));
        setToast({ type: 'success', message: 'Certificate deleted successfully' });
      } else {
        setCertificates((prev) =>
          prev.map((c) => (c.id === certId ? res.data : c))
        );
        if (selectedCert?.id === certId) setSelectedCert(res.data);
        setToast({ type: 'success', message: `Certificate ${action}d successfully` });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || `Failed to ${action}` });
    } finally {
      setActionLoading(false);
      if (action === 'delete') setDetailOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        student: formData.student,
        course: parseInt(formData.course),
        batch: formData.batch ? parseInt(formData.batch) : null,
      };

      if (formMode === 'create') {
        await academyApi.createCertificate(payload);
        setToast({ type: 'success', message: 'Certificate created successfully' });
      } else {
        await academyApi.updateCertificate(selectedCert.id, payload);
        setToast({ type: 'success', message: 'Certificate updated successfully' });
      }
      setFormOpen(false);
      fetchCertificates();
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Failed to save certificate' });
    } finally {
      setActionLoading(false);
    }
  };

  const openCreate = () => {
    setFormMode('create');
    setFormData({ student: '', course: '', batch: '' });
    setFormOpen(true);
  };

  const openEdit = (cert) => {
    setFormMode('edit');
    setSelectedCert(cert);
    setFormData({
      student: cert.student,
      course: String(cert.course),
      batch: cert.batch ? String(cert.batch) : '',
    });
    setFormOpen(true);
  };

  const openDetail = (cert) => {
    setSelectedCert(cert);
    setDetailOpen(true);
  };

  if (loading) return <LoadingState message="Loading certificates..." />;
  if (error) return <EmptyState message={error} type="error" />;

  return (
    <div>
      <PageHeader title="Certificates" subtitle="Manage course certificates" />

      {canManage && (
        <div className="mb-6">
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-accent text-sidebar-text font-medium rounded-lg hover:bg-accent-hover transition"
          >
            + Create Certificate
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-4 items-center mb-6">
        <div className="flex-1 min-w-50">
          <input
            type="text"
            placeholder="Search by student or certificate number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 bg-card-bg border border-card-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-card-bg border border-card-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="ISSUED">Issued</option>
          <option value="VERIFIED">Verified</option>
          <option value="REVOKED">Revoked</option>
        </select>
        <button
          onClick={fetchCertificates}
          className="px-4 py-2 bg-accent text-sidebar-text font-medium rounded-lg hover:bg-accent-hover transition"
        >
          Search
        </button>
      </div>

      {!certificates.length ? (
        <EmptyState message="No certificates found" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-card-bg border border-card-border rounded-xl p-5 hover:border-accent/30 transition"
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-text-primary font-semibold truncate">{cert.certificate_number}</h4>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${
                    STATUS_STYLES[cert.status] || STATUS_STYLES.DRAFT
                  }`}
                >
                  {cert.status}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Student</span>
                  <span className="text-text-primary">{cert.student_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Course</span>
                  <span className="text-text-primary">{cert.course_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Batch</span>
                  <span className="text-text-primary">{cert.batch_name || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Issued</span>
                  <span className="text-text-primary">
                    {cert.issued_at
                      ? new Date(cert.issued_at).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Verified</span>
                  <span className={cert.is_verified ? 'text-green-700' : 'text-text-secondary'}>
                    {cert.is_verified ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-card-border">
                <button
                  onClick={() => openDetail(cert)}
                  className="flex-1 px-3 py-1.5 text-sm bg-accent/20 text-accent border border-accent/30 rounded-lg hover:bg-accent/30 transition"
                >
                  View
                </button>

                {canManage && cert.status === 'DRAFT' && (
                  <>
                    <button
                      onClick={() => openEdit(cert)}
                      className="flex-1 px-3 py-1.5 text-sm bg-accent/20 text-accent border border-accent/30 rounded-lg hover:bg-accent/30 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleAction('issue', cert.id)}
                      disabled={actionLoading}
                      className="flex-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-200 transition disabled:opacity-50"
                    >
                      Issue
                    </button>
                  </>
                )}

                {canManage && cert.status === 'ISSUED' && (
                  <button
                    onClick={() => handleAction('verify', cert.id)}
                    disabled={actionLoading}
                    className="flex-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 border border-green-200 rounded-lg hover:bg-green-200 transition disabled:opacity-50"
                  >
                    Verify
                  </button>
                )}

                {canManage && (cert.status === 'ISSUED' || cert.status === 'VERIFIED') && (
                  <button
                    onClick={() => handleAction('revoke', cert.id)}
                    disabled={actionLoading}
                    className="flex-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 border border-red-200 rounded-lg hover:bg-red-200 transition disabled:opacity-50"
                  >
                    Revoke
                  </button>
                )}

                {canManage && cert.status === 'REVOKED' && (
                  <>
                    <button
                      onClick={() => handleAction('restore', cert.id)}
                      disabled={actionLoading}
                      className="flex-1 px-3 py-1.5 text-sm bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-200 transition disabled:opacity-50"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => handleAction('delete', cert.id)}
                      disabled={actionLoading}
                      className="flex-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 border border-red-200 rounded-lg hover:bg-red-200 transition disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {detailOpen && selectedCert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card-bg border border-card-border rounded-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Certificate Details</h3>
              <button
                onClick={() => setDetailOpen(false)}
                className="text-text-secondary hover:text-text-primary text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Certificate Number</span>
                <span className="text-text-primary font-mono">{selectedCert.certificate_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Student</span>
                <span className="text-text-primary">{selectedCert.student_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Course</span>
                <span className="text-text-primary">{selectedCert.course_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Batch</span>
                <span className="text-text-primary">{selectedCert.batch_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Status</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${
                    STATUS_STYLES[selectedCert.status] || STATUS_STYLES.DRAFT
                  }`}
                >
                  {selectedCert.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Issued At</span>
                <span className="text-text-primary">
                  {selectedCert.issued_at
                    ? new Date(selectedCert.issued_at).toLocaleString()
                    : 'Not issued yet'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Verified</span>
                <span className={selectedCert.is_verified ? 'text-green-700' : 'text-text-secondary'}>
                  {selectedCert.is_verified ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            {canManage && (
              <div className="flex gap-3 mt-6 pt-4 border-t border-card-border">
                {selectedCert.status === 'DRAFT' && (
                  <>
                    <button
                      onClick={() => { openEdit(selectedCert); setDetailOpen(false); }}
                      className="flex-1 px-4 py-2 bg-accent text-sidebar-text rounded-lg hover:bg-accent-hover"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => { handleAction('issue', selectedCert.id); setDetailOpen(false); }}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-sidebar-text rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Issue
                    </button>
                  </>
                )}
                {selectedCert.status === 'ISSUED' && (
                  <button
                    onClick={() => { handleAction('verify', selectedCert.id); setDetailOpen(false); }}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-green-600 text-sidebar-text rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Verify
                  </button>
                )}
                {(selectedCert.status === 'ISSUED' || selectedCert.status === 'VERIFIED') && (
                  <button
                    onClick={() => { handleAction('revoke', selectedCert.id); setDetailOpen(false); }}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-red-600 text-sidebar-text rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    Revoke
                  </button>
                )}
                {selectedCert.status === 'REVOKED' && (
                  <>
                    <button
                      onClick={() => { handleAction('restore', selectedCert.id); setDetailOpen(false); }}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2 bg-yellow-500 text-sidebar-text rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => { handleAction('delete', selectedCert.id); setDetailOpen(false); }}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2 bg-red-600 text-sidebar-text rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card-bg border border-card-border rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-text-primary">
                {formMode === 'create' ? 'Create Certificate' : 'Edit Certificate'}
              </h3>
              <button
                onClick={() => setFormOpen(false)}
                className="text-text-secondary hover:text-text-primary text-xl"
              >
                ✕
              </button>
            </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Batch</label>
              <select
                value={formData.batch}
                onChange={async (e) => {
                  const batchId = e.target.value;
                  setFormData({ ...formData, batch: batchId, student: '' });

                  if (batchId) {
                    const res = await academyApi.getBatchStudents(batchId);
                    const studentsData = res.data.results || res.data;
                    setStudents(Array.isArray(studentsData) ? studentsData : []);

                    const batchObj = batches.find((b) => String(b.id) === String(batchId));
                    if (batchObj) {
                      setFormData((prev) => ({ ...prev, course: String(batchObj.course_id) }));
                    }
                  } else {
                    setStudents([]);
                    setFormData((prev) => ({ ...prev, course: '' }));
                  }
                }}
                required
                className="w-full px-4 py-2 bg-card-bg border border-card-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
              >
                <option value="">Select Batch</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-1">Student</label>
              <select
                value={formData.student}
                onChange={(e) => setFormData({ ...formData, student: e.target.value })}
                required
                disabled={!formData.batch}
                className="w-full px-4 py-2 bg-card-bg border border-card-border rounded-lg text-text-primary focus:outline-none focus:border-accent disabled:opacity-50"
              >
                <option value="">Select Student</option>
                {students.map((s) => (
                  <option key={s.student_id || s.student} value={s.student_id || s.student}>
                    {s.student_name || s.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-1">Course</label>
              <input
                type="text"
                value={courses.find((c) => String(c.id) === String(formData.course))?.name || ''}
                disabled
                className="w-full px-4 py-2 bg-card-bg border border-card-border rounded-lg text-text-primary opacity-50"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="flex-1 px-4 py-2 bg-card-bg border border-card-border text-text-primary rounded-lg hover:bg-hover-bg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-accent text-sidebar-text font-medium rounded-lg hover:bg-accent-hover transition disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : formMode === 'create' ? 'Create' : 'Update'}
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