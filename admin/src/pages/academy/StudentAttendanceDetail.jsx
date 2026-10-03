import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { academyApi } from '../../api/academy.api';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';

export default function StudentAttendanceDetail() {
  const { batchId, studentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    academyApi.getStudentAttendanceDetail(batchId, studentId)
      .then((res) => setData(res.data))
      .catch((err) => console.error('Failed to load attendance:', err))
      .finally(() => setLoading(false));
  }, [batchId, studentId]);

  if (loading) return <LoadingState message="Loading attendance..." />;
  if (!data) return <EmptyState message="Could not load attendance" />;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text-primary transition">← Back</button>
      </div>
      <h3 className="text-text-primary text-xl font-semibold mb-2">Attendance Detail</h3>
      <p className="text-text-secondary mb-6">
        Overall: {data.attendance_percentage !== null ? `${data.attendance_percentage}%` : 'Not enough data yet'}
      </p>

      <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-hover-bg border-b border-card-border">
            <tr>
              <th className="px-6 py-4 text-sm font-medium text-text-secondary">Session</th>
              <th className="px-6 py-4 text-sm font-medium text-text-secondary">Date</th>
              <th className="px-6 py-4 text-sm font-medium text-text-secondary">Status</th>
            </tr>
          </thead>
          <tbody>
            {(data.sessions || []).map((s) => (
              <tr key={s.session_id} className="border-b border-card-border">
                <td className="px-6 py-4 text-sm text-text-primary">{s.title}</td>
                <td className="px-6 py-4 text-sm text-text-secondary">{s.date}</td>
                <td className="px-6 py-4 text-sm text-text-secondary">{s.status || 'Not yet conducted'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}