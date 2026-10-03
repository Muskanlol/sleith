import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { academyApi } from '../../api/academy.api';
import { ROLES } from '../../utils/constants';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';

export default function BatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [batch, setBatch] = useState(null);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  const [error, setError] = useState(null);
  const [sessionError, setSessionError] = useState(null);

  const [showSessionForm, setShowSessionForm] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);

  const [sessionForm, setSessionForm] = useState({
    title: '',
    date: '',
    start_time: '',
    end_time: '',
  });

  const isAdmin = user?.role === ROLES.ADMIN;
  const isManager = user?.role === ROLES.MANAGER;
  const isTrainer = user?.role === ROLES.TRAINER;

  const canManageBatch = isAdmin || isManager;
  const canAddSessions = isAdmin || isManager || isTrainer;

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [batchRes, studentsRes] = await Promise.all([
        academyApi.getBatchById(id),
        academyApi.getBatchStudents(id),
      ]);

      setBatch(batchRes.data);
      setStudents(studentsRes.data.results || studentsRes.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load batch:', err);

      if (err.response?.status === 404) {
        setError('Batch not found');
      } else {
        setError('Failed to load batch');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      setSessionsLoading(true);

      const response = await academyApi.getBatchSessions(id);

      setSessions(response.data.results || response.data);
      setSessionError(null);
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setSessionError('Failed to load sessions');
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [id]);

  const handleSessionChange = (e) => {
    const { name, value } = e.target;

    setSessionForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();

    if (!sessionForm.title.trim()) {
      return;
    }

    try {
      setCreatingSession(true);

      await academyApi.createSession(id, {
        title: sessionForm.title.trim(),
        date: sessionForm.date,
        start_time: sessionForm.start_time,
        end_time: sessionForm.end_time,
      });

      setSessionForm({
        title: '',
        date: '',
        start_time: '',
        end_time: '',
      });

      setShowSessionForm(false);

      await fetchSessions();
    } catch (err) {
      console.error('Failed to create session:', err);

      const data = err.response?.data;
      const firstField =
        data && typeof data === 'object'
          ? Object.values(data).flat?.()[0] || Object.values(data)[0]
          : null;
      const message =
        (typeof firstField === 'string' ? firstField : null) ||
        data?.detail ||
        data?.error ||
        'Failed to create session';

      setSessionError(message);
    } finally {
      setCreatingSession(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';

    return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (time) => {
    if (!time) return '—';

    const [hours, minutes] = time.split(':');

    const date = new Date();
    date.setHours(hours, minutes);

    return date.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <LoadingState message="Loading batch..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-red-700">{error}</div>

        <button
          onClick={() => navigate('/admin/academy/batches')}
          className="text-accent hover:text-accent-hover transition"
        >
          ← Back
        </button>
      </div>
    );
  }

  if (!batch) return null;

  const rows = [
    { label: 'Batch Name', value: batch.name },
    { label: 'Course', value: batch.course_name },
    { label: 'Trainer', value: batch.trainer_name || '—' },
    { label: 'Start Date', value: formatDate(batch.start_date) },
    { label: 'End Date', value: formatDate(batch.end_date) },
    { label: 'Capacity', value: batch.capacity },
    { label: 'Status', value: batch.is_active ? 'Active' : 'Inactive' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/academy/batches')}
            className="text-text-secondary hover:text-text-primary transition"
          >
            ← Back
          </button>

          <h3 className="text-text-primary text-xl font-semibold">
            {batch.name}
          </h3>
        </div>

        {canManageBatch && batch.is_active && (
          <button
            onClick={() =>
              navigate(`/admin/academy/batches/${id}/edit`)
            }
            className="px-4 py-2 bg-accent/20 text-accent border border-accent/30 rounded-lg hover:bg-accent/30 transition"
          >
            Edit
          </button>
        )}
      </div>

      <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden mb-8">
        <div className="divide-y divide-card-border">
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="flex items-center px-6 py-4"
            >
              <span className="w-40 text-sm font-medium text-text-secondary">
                {row.label}
              </span>

              <span className="flex-1 text-sm text-text-primary">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-text-primary text-lg font-semibold">
            Sessions ({sessions.length})
          </h4>

          {canAddSessions && batch.is_active && (
            <button
              onClick={() => {
                setSessionError(null);
                setShowSessionForm(true);
              }}
              className="px-4 py-2 bg-accent/20 text-accent border border-accent/30 rounded-lg hover:bg-accent/30 transition"
            >
              + Add Session
            </button>
          )}
        </div>

        {sessionError && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-100 border border-red-200 text-red-700 text-sm">
            {sessionError}
          </div>
        )}

        {sessionsLoading ? (
          <LoadingState message="Loading sessions..." />
        ) : !sessions.length ? (
          <EmptyState message="No sessions created for this batch yet" />
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-card-bg border border-card-border rounded-xl px-6 py-4 hover:bg-hover-bg/50 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-text-primary font-medium">
                      {session.title}
                    </h5>

                    <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
                      <span>
                        {formatDate(session.date)}
                      </span>

                      <span>
                        {formatTime(session.start_time)}
                        {' - '}
                        {formatTime(session.end_time)}
                      </span>
                    </div>

                    {session.trainer_name && (
                      <div className="mt-2 text-xs text-text-secondary">
                        Trainer: {session.trainer_name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

              <div>
        <h4 className="text-text-primary text-lg font-semibold mb-4">
          Enrolled Students ({students.length})
        </h4>

        {!students.length ? (
          <EmptyState message="No students enrolled yet" />
        ) : (
          <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-card-border">
                  <th className="text-left text-xs font-medium text-text-secondary uppercase px-6 py-3">
                    Name
                  </th>

                  <th className="text-left text-xs font-medium text-text-secondary uppercase px-6 py-3">
                    Email
                  </th>

                  <th className="text-left text-xs font-medium text-text-secondary uppercase px-6 py-3">
                    Phone
                  </th>

                  <th className="text-left text-xs font-medium text-text-secondary uppercase px-6 py-3">
                    Attendance
                  </th>

                  <th className="text-left text-xs font-medium text-text-secondary uppercase px-6 py-3">
                    Enrolled
                  </th>

                  <th className="text-right text-xs font-medium text-text-secondary uppercase px-6 py-3">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-card-border">
                {students.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-hover-bg/50 transition"
                  >
                    <td className="px-6 py-4 text-sm text-text-primary">
                      {s.student_name}
                    </td>

                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {s.student_email}
                    </td>

                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {s.student_phone}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      {s.attendance_percentage != null ? (
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full border ${
                            s.attendance_percentage >= 75
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : s.attendance_percentage >= 40
                              ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                              : 'bg-red-100 text-red-700 border-red-200'
                          }`}
                        >
                          {s.attendance_percentage}%
                        </span>
                      ) : (
                        <span className="text-text-secondary text-xs">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {new Date(
                        s.enrolled_at
                      ).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() =>
                          navigate(
                            `/admin/academy/batches/${id}/students/${s.student_id || s.student}/progress`
                          )
                        }
                        className="text-accent hover:text-accent-hover text-sm font-medium transition"
                      >
                        View Progress
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showSessionForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg bg-card-bg border border-card-border rounded-xl shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-card-border">
              <div>
                <h4 className="text-text-primary text-lg font-semibold">
                  Create Session
                </h4>

                <p className="text-text-secondary text-sm mt-1">
                  {batch.name}
                </p>
              </div>

              <button
                onClick={() => setShowSessionForm(false)}
                className="text-text-secondary hover:text-text-primary text-xl transition"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleCreateSession}
              className="p-6 space-y-5"
            >
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Session Title
                </label>

                <input
                  type="text"
                  name="title"
                  value={sessionForm.title}
                  onChange={handleSessionChange}
                  placeholder="e.g. Nail art lecture"
                  required
                  className="w-full px-4 py-2.5 bg-hover-bg border border-card-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Date
                </label>

                <input
                  type="date"
                  name="date"
                  value={sessionForm.date}
                  onChange={handleSessionChange}
                  required
                  min={batch.start_date}
                  max={batch.end_date}
                  className="w-full px-4 py-2.5 bg-hover-bg border border-card-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
                />
                <p className="text-xs text-text-secondary mt-1">
                  Date must be between {batch.start_date} and {batch.end_date}.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Start Time
                  </label>

                  <input
                    type="time"
                    name="start_time"
                    value={sessionForm.start_time}
                    onChange={handleSessionChange}
                    required
                    className="w-full px-4 py-2.5 bg-hover-bg border border-card-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    End Time
                  </label>

                  <input
                    type="time"
                    name="end_time"
                    value={sessionForm.end_time}
                    onChange={handleSessionChange}
                    required
                    className="w-full px-4 py-2.5 bg-hover-bg border border-card-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSessionForm(false)}
                  disabled={creatingSession}
                  className="px-4 py-2 text-sm text-text-secondary border border-card-border rounded-lg hover:text-text-primary hover:bg-hover-bg transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creatingSession}
                  className="px-4 py-2 text-sm bg-accent text-sidebar-text rounded-lg hover:bg-accent-hover disabled:opacity-50 transition"
                >
                  {creatingSession
                    ? 'Creating...'
                    : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}