import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { academyApi } from '../../api/academy.api';
import { ROLES, isFutureCalendarDate } from '../../utils/constants';
import PageHeader from '../../components/common/PageHeader';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import Toast from '../../components/common/Toast';

export default function PracticalSessions() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const canWrite = [ROLES.TRAINER, ROLES.ADMIN, ROLES.MANAGER].includes(user?.role);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await academyApi.getPracticalSessions();
      setSessions(res.data.results || res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this session?')) return;
    try {
      await academyApi.deletePracticalSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setToast({ type: 'success', message: 'Session deleted' });
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to delete' });
    }
  };

  if (loading) return <LoadingState message="Loading sessions..." />;
  if (error) return <EmptyState message={error} type="error" />;

  return (
    <div>
      <PageHeader title="Practical Sessions" subtitle="Hands-on training & evaluation" />

      {canWrite && (
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/academy/practical/new')}
            className="px-4 py-2 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover transition"
          >
            + New Session
          </button>
        </div>
      )}

      {!sessions.length ? (
        <EmptyState message="No practical sessions found" />
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="bg-card-bg border border-card-border rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-text-primary font-semibold text-lg">{session.title}</h4>
                  <p className="text-text-secondary text-sm">Student: {session.student_name}</p>
                  <p className="text-text-secondary text-sm">Trainer: {session.trainer_name}</p>
                </div>
                <span className="text-text-secondary text-sm">{session.date}</span>
              </div>

              <p className="text-text-primary text-sm mb-3">{session.notes || 'No notes'}</p>

              {session.evaluation ? (
                <div className={`rounded-lg p-4 mb-3 border ${
                  session.evaluation.is_passed
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-semibold ${
                      session.evaluation.is_passed ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {session.evaluation.total_marks}/{session.evaluation.max_marks}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      session.evaluation.is_passed
                        ? 'bg-green-500/15 text-green-400 border-green-500/30'
                        : 'bg-red-500/15 text-red-400 border-red-500/30'
                    }`}>
                      {session.evaluation.is_passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>

                  <div className="space-y-1 mb-2">
                    {session.evaluation.scores?.map((score) => (
                      <div key={score.id} className="flex justify-between text-sm">
                        <span className="text-text-secondary">{score.criteria_name}</span>
                        <span className="text-text-primary">{score.marks_obtained}/{score.max_marks}</span>
                      </div>
                    ))}
                  </div>

                  {session.evaluation.feedback && (
                    <p className="text-text-secondary text-sm italic">"{session.evaluation.feedback}"</p>
                  )}
                </div>
              ) : (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-3">
                  <span className="text-yellow-400 text-sm">Not evaluated yet</span>
                </div>
              )}

              {canWrite && (
                <div className="flex gap-2">
                  {!session.evaluation && !isFutureCalendarDate(session.date) && (
                    <button
                      onClick={() => navigate(`/admin/academy/practical/${session.id}/evaluate`)}
                      className="px-3 py-1.5 text-sm bg-accent/20 text-accent border border-accent/30 rounded-lg hover:bg-accent/30"
                    >
                      Evaluate
                    </button>
                  )}
                  {!session.evaluation && isFutureCalendarDate(session.date) && (
                    <span className="px-3 py-1.5 text-sm text-text-secondary border border-card-border rounded-lg">
                      Marks open {session.date}
                    </span>
                  )}
                  {session.evaluation && (
                    <button
                      onClick={() => navigate(`/admin/academy/practical/${session.id}/evaluate`)}
                      className="px-3 py-1.5 text-sm bg-accent/20 text-accent border border-accent/30 rounded-lg hover:bg-accent/30"
                    >
                      {isFutureCalendarDate(session.date) ? 'View Evaluation' : 'Edit Evaluation'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(session.id)}
                    className="px-3 py-1.5 text-sm bg-red-100 text-red-700 border border-red-200 rounded-lg hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}