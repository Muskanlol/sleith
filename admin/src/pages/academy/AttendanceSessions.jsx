import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { academyApi } from '../../api/academy.api';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';

export default function AttendanceSessions() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [batchId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [batchRes, sessionsRes] = await Promise.all([
        academyApi.getBatchById(batchId),
        academyApi.getBatchSessions(batchId),
      ]);
      setBatch(batchRes.data);
      const raw = sessionsRes.data.results || sessionsRes.data;
      setSessions(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState message="Loading sessions..." />;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-text-secondary hover:text-text-primary transition"
        >
          ← Back
        </button>
      </div>

      <h3 className="text-text-primary text-xl font-semibold mb-2">
        {batch?.name} — Sessions
      </h3>
      <p className="text-text-secondary text-sm mb-6">
        Select a session to mark attendance
      </p>
      <button
        type="button"
        onClick={() => navigate(`/admin/academy/batches/${batchId}`)}
        className="mb-6 px-4 py-2 text-sm bg-accent/20 text-accent border border-accent/30 rounded-lg hover:bg-accent/30 transition"
      >
        + Add session in this batch
      </button>

      {!sessions.length ? (
        <EmptyState message="No sessions scheduled for this batch. Open the batch and add a session first." />
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => navigate(`/admin/academy/attendance/${batchId}/sessions/${session.id}`)}
              className="bg-card-bg border border-card-border rounded-xl p-5 cursor-pointer hover:border-accent transition"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-text-primary font-medium">{session.title || `Session ${session.session_number}`}</h4>
                  <p className="text-text-secondary text-sm mt-1">
                    {session.date} | {session.start_time} - {session.end_time}
                  </p>
                </div>
                <span className="text-accent text-sm font-medium">Mark →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}