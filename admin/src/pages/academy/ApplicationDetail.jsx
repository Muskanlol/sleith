import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { academyApi } from '../../api/academy.api';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';


const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  APPROVED: 'bg-green-100 text-green-700 border-green-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
};

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = [ROLES.ADMIN, ROLES.MANAGER].includes(user?.role);

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Notify panel state
  const [showNotify, setShowNotify]   = useState(false);
  const [noteText,   setNoteText]     = useState('');
  const [noteSaving, setNoteSaving]   = useState(false);
  const [noteError,  setNoteError]    = useState(null);
  const [noteSuccess,setNoteSuccess]  = useState(false);

  const fetchApplication = () => {
    setLoading(true);
    api
      .get(`/admin/academy/applications/${id}/`)
      .then((res) => {
        setApplication(res.data);
        setNewStatus(res.data.status);
        setLoadError(null);
      })
      .catch((err) => {
        const data = err.response?.data;
        setLoadError(
          data?.error ||
          data?.detail ||
          (err.response?.status === 403
            ? 'You do not have permission to view this application.'
            : 'Failed to load application.')
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const handleSaveStatus = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      if (newStatus === 'APPROVED') {
        // Approve without a batch; batch is assigned later on the Students page
        await api.post(`/admin/academy/applications/${id}/approve/`, {});
      } else {
        // The status endpoint only supports rejection
        await academyApi.updateApplicationStatus(id, { status: 'REJECTED' });
      }
      setIsEditing(false);
      fetchApplication();
    } catch (err) {
      setSaveError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.response?.data?.status?.[0] ||
        'Failed to update status'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSendNote = async () => {
    if (!noteText.trim()) return;
    setNoteSaving(true);
    setNoteError(null);
    setNoteSuccess(false);
    try {
      await api.post(`/admin/academy/applications/${id}/notify/`, { note: noteText.trim() });
      setNoteSuccess(true);
      setShowNotify(false);
      setNoteText('');
      fetchApplication();
    } catch (err) {
      setNoteError(err.response?.data?.error || 'Failed to send note.');
    } finally {
      setNoteSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading application...</div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-text-secondary">{loadError || 'Application not found.'}</div>
        <button
          onClick={() => navigate('/admin/academy/applications')}
          className="text-accent hover:text-accent-hover transition"
        >
          ← Back to Applications
        </button>
      </div>
    );
  }

  // Parse structured notes into labelled sections
  const parseNotes = (raw) => {
    if (!raw) return null;
    const lines = raw.split('\n').filter(Boolean);
    return lines.map((line) => {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) return { key: null, val: line };
      return { key: line.slice(0, colonIdx).trim(), val: line.slice(colonIdx + 1).trim() };
    });
  };
  const parsedNotes = parseNotes(application.notes);

  const rows = [
    { label: 'Application ID', value: `#${application.id}` },
    { label: 'Student',        value: application.student_name  || '—' },
    { label: 'Email',          value: application.student_email || '—' },
    { label: 'Phone',          value: application.student_phone || '—' },
    { label: 'Course',         value: application.course_name   || '—' },
    { label: 'Applied On',     value: new Date(application.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
    {
      label: 'Reviewed At',
      value: application.reviewed_at
        ? new Date(application.reviewed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : '—',
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/academy/applications')}
            className="text-text-secondary hover:text-text-primary transition"
          >
            ← Back
          </button>
          <h3 className="text-text-primary text-xl font-semibold">Application #{application.id}</h3>
        </div>

        {isAdmin && !isEditing && (
          <div className="flex gap-2">
            {/* Only show Notify if not yet resolved */}
            {['PENDING', 'AWAITING_RESPONSE'].includes(application.status) && (
              <button
                onClick={() => { setShowNotify((v) => !v); setNoteSuccess(false); }}
                className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
                style={{ background: 'rgba(201,169,110,0.08)', borderColor: 'rgba(201,169,110,0.35)', color: 'var(--accent)' }}
              >
                {showNotify ? 'Cancel Note' : '✉ Notify Customer'}
              </button>
            )}
            <button
              onClick={() => { setIsEditing(true); setNewStatus(application.status); }}
              className="px-4 py-2 bg-hover-bg border border-card-border rounded-lg text-text-primary text-sm hover:border-accent transition-colors"
            >
              Edit Status
            </button>
          </div>
        )}
      </div>

      <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
        <div className="divide-y divide-card-border">
          {rows.map((row, idx) => (
            <div key={idx} className="flex items-center px-6 py-4">
              <span className="w-40 text-sm font-medium text-text-secondary">{row.label}</span>
              <span className="flex-1 text-sm text-text-primary">{row.value}</span>
            </div>
          ))}

          {/* ── Student Preferences / Notes ── */}
          {parsedNotes && parsedNotes.length > 0 && (
            <div className="px-6 py-5">
              <span className="text-sm font-medium text-text-secondary block mb-3">
                Student Preferences
              </span>
              <div className="rounded-xl p-4 space-y-3"
                style={{ background: 'var(--hover-bg)', border: '1px solid var(--card-border)' }}>
                {parsedNotes.map((item, i) => (
                  item.key ? (
                    <div key={i} className="flex gap-3 text-sm">
                      <span className="font-medium min-w-[140px] flex-shrink-0"
                        style={{ color: 'var(--accent)' }}>
                        {item.key}
                      </span>
                      <span style={{ color: 'var(--text-primary)' }}>{item.val}</span>
                    </div>
                  ) : (
                    <p key={i} className="text-sm" style={{ color: 'var(--text-primary)' }}>{item.val}</p>
                  )
                ))}
              </div>
            </div>
          )}

          {/* No notes fallback */}
          {!application.notes && (
            <div className="flex items-center px-6 py-4">
              <span className="w-40 text-sm font-medium text-text-secondary">Preferences</span>
              <span className="text-sm text-text-secondary italic">No notes provided</span>
            </div>
          )}

          <div className="flex items-center px-6 py-4">
            <span className="w-40 text-sm font-medium text-text-secondary">Status</span>
            <div className="flex-1">
              {isEditing ? (
                <div className="flex items-center gap-3">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="px-3 py-1.5 bg-hover-bg border border-card-border rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent"
                  >
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                  <button
                    onClick={handleSaveStatus}
                    disabled={saving}
                    className="px-3 py-1.5 bg-accent text-sidebar-text text-sm font-medium rounded-lg disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-sm text-text-secondary hover:text-text-primary"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <span
                  className={`text-xs px-2.5 py-1 rounded-full border ${
                    statusColors[application.status] || statusColors.PENDING
                  }`}
                >
                  {application.status}
                </span>
              )}
            </div>
          </div>

          {saveError && (
            <div className="px-6 py-3 text-sm text-red-700 bg-red-100">{saveError}</div>
          )}
        </div>
      </div>

      {isAdmin && application.status === 'APPROVED' && (
        <p className="text-xs text-text-secondary mt-3">
          Approved applicants without a batch appear under "Pending Batch Assignment" on the Students page.
        </p>
      )}

      {/* ── Send Note to Customer panel ── */}
      {showNotify && (
        <div className="mt-4 rounded-xl border p-5 space-y-3"
          style={{ background: 'rgba(201,169,110,0.05)', borderColor: 'rgba(201,169,110,0.25)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
            ✉ Send a note to the customer
          </p>
          <p className="text-xs text-text-secondary">
            Explain what batches are available, alternatives, or wait time. The customer will see this and respond with <strong>Yes</strong> or <strong>No</strong>.
          </p>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={4}
            placeholder={`e.g. "Hi! We currently don't have an afternoon batch for this course. We do have a weekend morning batch starting 15 Sep. Would you like to join that, or would you prefer to wait ~15 days for the next afternoon batch?"`}
            className="w-full rounded-lg px-4 py-3 text-sm outline-none resize-none"
            style={{ background: 'var(--hover-bg)', border: '1px solid var(--card-border)', color: 'var(--text-primary)' }}
          />
          {noteError && <p className="text-xs text-red-500">{noteError}</p>}
          <div className="flex gap-3">
            <button
              onClick={handleSendNote}
              disabled={noteSaving || !noteText.trim()}
              className="px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-all"
              style={{ background: 'var(--accent)', color: '#0a0a0a' }}
            >
              {noteSaving ? 'Sending…' : 'Send Note & Await Response'}
            </button>
            <button onClick={() => setShowNotify(false)}
              className="text-sm text-text-secondary hover:text-text-primary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {noteSuccess && (
        <p className="mt-3 text-sm text-green-600">✓ Note sent. Application status set to "Awaiting Response".</p>
      )}

      {/* ── Customer Response panel ── */}
      {application.admin_note && (
        <div className="mt-4 rounded-xl border p-5"
          style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}>
          <p className="text-xs font-semibold tracking-widest uppercase mb-3 text-text-secondary">
            Note sent to customer
          </p>
          <p className="text-sm p-4 rounded-lg whitespace-pre-wrap"
            style={{ background: 'var(--hover-bg)', color: 'var(--text-primary)' }}>
            {application.admin_note}
          </p>

          {/* Response */}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-xs text-text-secondary">Customer response:</span>
            {!application.customer_response ? (
              <span className="text-xs px-2.5 py-1 rounded-full border"
                style={{ background: 'rgba(234,179,8,0.1)', color: '#ca8a04', borderColor: 'rgba(234,179,8,0.3)' }}>
                Awaiting response…
              </span>
            ) : application.customer_response === 'ACCEPTED' ? (
              <span className="text-xs px-2.5 py-1 rounded-full border"
                style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a', borderColor: 'rgba(34,197,94,0.3)' }}>
                ✓ Accepted — proceed to approve &amp; assign batch
              </span>
            ) : (
              <span className="text-xs px-2.5 py-1 rounded-full border"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', borderColor: 'rgba(239,68,68,0.3)' }}>
                ✗ Declined — auto-rejected
              </span>
            )}
            {application.customer_response_at && (
              <span className="text-xs text-text-secondary">
                · {new Date(application.customer_response_at).toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}