import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { academyApi } from '../../api/academy.api';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';

export default function BatchStudentsAttendance() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    academyApi.getBatchStudentsAttendance(batchId)
      .then((res) => setStudents(res.data.results || res.data))
      .catch((err) => console.error('Failed to load students:', err))
      .finally(() => setLoading(false));
  }, [batchId]);

  if (loading) return <LoadingState message="Loading students..." />;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text-primary transition">← Back</button>
      </div>
      <h3 className="text-text-primary text-xl font-semibold mb-6">Student Attendance (Read-only)</h3>

      {!students.length ? (
        <EmptyState message="No students enrolled" />
      ) : (
        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-hover-bg border-b border-card-border">
              <tr>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary">Student</th>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary">Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => navigate(`/admin/academy/attendance/batches/${batchId}/students/${s.student}`)}
                  className="border-b border-card-border hover:bg-hover-bg/50 transition cursor-pointer"
                >
                  <td className="px-6 py-4 text-sm text-text-primary">{s.student_name}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">
                    {s.attendance_percentage !== null ? `${s.attendance_percentage}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}