import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { academyApi } from '../../api/academy.api';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import Toast from '../../components/common/Toast';

export default function AttendanceMarking() {
  const { batchId, sessionId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchAttendance();
  }, [sessionId]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await academyApi.getSessionAttendance(sessionId);
      setStudents(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const setStatus = (studentId, status) => {
    setStudents((prev) =>
      prev.map((s) => (s.student === studentId ? { ...s, status } : s))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = students
        .filter((s) => s.status)
        .map((s) => ({ student: s.student, status: s.status }));

      if (records.length === 0) {
        setToast({ type: 'error', message: 'Mark at least one student before saving' });
        setSaving(false);
        return;
      }

      await academyApi.markAttendance(sessionId, records);
      setToast({ type: 'success', message: 'Attendance saved' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Failed to save attendance' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading attendance..." />;
  if (error) return <EmptyState message={error} type="error" />;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(`/admin/academy/attendance/${batchId}/sessions`)}
          className="text-text-secondary hover:text-text-primary transition"
        >
          ← Back to Sessions
        </button>
      </div>

      <h3 className="text-text-primary text-xl font-semibold mb-6">Mark Attendance</h3>

      {!students.length ? (
        <EmptyState message="No students enrolled in this batch" />
      ) : (
        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-hover-bg border-b border-card-border">
              <tr>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary">Student</th>
                <th className="px-6 py-4 text-sm font-medium text-text-secondary">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.student} className="border-b border-card-border">
                  <td className="px-6 py-4 text-sm text-text-primary">{s.student_name}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setStatus(s.student, 'PRESENT')}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                          s.status === 'PRESENT'
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-transparent text-text-secondary border-card-border hover:border-green-200'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => setStatus(s.student, 'ABSENT')}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                          s.status === 'ABSENT'
                            ? 'bg-red-100 text-red-700 border-red-200'
                            : 'bg-transparent text-text-secondary border-card-border hover:border-red-200'
                        }`}
                      >
                        Absent
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {students.length > 0 && (
        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-accent text-sidebar-text font-medium rounded-lg hover:bg-accent-hover transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}