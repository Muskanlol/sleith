import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { academyApi } from '../../api/academy.api';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';

export default function StudentProgress() {
  const { batchId, studentId } = useParams();
  const navigate = useNavigate();

  const [attendance, setAttendance] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [practicalSessions, setPracticalSessions] = useState([]);
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAll();
  }, [batchId, studentId]);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [attendanceRes, assessmentsRes, batchStudentsRes, practicalRes] = await Promise.all([
        academyApi.getStudentBatchAttendance(batchId, studentId),
        academyApi.getStudentBatchAssessments(batchId, studentId),
        academyApi.getBatchStudents(batchId),
        academyApi.getPracticalSessions({ student_id: studentId }),
      ]);

      setAttendance(attendanceRes.data);
      setAssessments(assessmentsRes.data);

      const students = batchStudentsRes.data.results || batchStudentsRes.data;
      const match = Array.isArray(students)
        ? students.find((s) => s.student_id === studentId || s.student === studentId)
        : null;
      setStudentName(match?.student_name || 'Student');

      const practicalData = practicalRes.data.results || practicalRes.data;
      setPracticalSessions(Array.isArray(practicalData) ? practicalData : []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load student progress');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState message="Loading student progress..." />;
  if (error) return <EmptyState message={error} type="error" />;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text-primary transition">
          ← Back
        </button>
        <h3 className="text-text-primary text-xl font-semibold">{studentName} — Progress</h3>
      </div>

      <div className="bg-card-bg border border-card-border rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-text-primary text-lg font-semibold">Attendance</h4>
          <span className="text-accent text-2xl font-bold">
            {attendance?.attendance_percentage != null ? `${attendance.attendance_percentage}%` : '—'}
          </span>
        </div>

        {!attendance?.sessions?.length ? (
          <EmptyState message="No sessions recorded yet" />
        ) : (
          <div className="divide-y divide-card-border">
            {attendance.sessions.map((s) => (
              <div key={s.session_id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-text-primary text-sm">{s.title}</p>
                  <p className="text-text-secondary text-xs">{s.date}</p>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full border ${
                    s.status === 'PRESENT'
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : s.status === 'ABSENT'
                      ? 'bg-red-100 text-red-700 border-red-200'
                      : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                  }`}
                >
                  {s.status || 'NOT MARKED'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card-bg border border-card-border rounded-xl p-6 mb-8">
        <h4 className="text-text-primary text-lg font-semibold mb-4">Assessments</h4>

        {!assessments.length ? (
          <EmptyState message="No assessments for this batch yet" />
        ) : (
          <div className="divide-y divide-card-border">
            {assessments.map((a) => (
              <div key={a.assessment_id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-text-primary text-sm">{a.title}</p>
                  <p className="text-text-secondary text-xs">
                    {a.assessment_type} · {a.date}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-text-primary text-sm">
                    {a.marks_obtained != null ? `${a.marks_obtained} / ${a.max_marks}` : 'Not evaluated'}
                  </span>
                  {a.is_passed != null && (
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full border ${
                        a.is_passed
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-red-100 text-red-700 border-red-200'
                      }`}
                    >
                      {a.is_passed ? 'PASS' : 'FAIL'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card-bg border border-card-border rounded-xl p-6">
        <h4 className="text-text-primary text-lg font-semibold mb-4">Practical Evaluation</h4>

        {!practicalSessions.length ? (
          <EmptyState message="No practical sessions recorded yet" />
        ) : (
          <div className="divide-y divide-card-border">
            {practicalSessions.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-text-primary text-sm">{p.title}</p>
                  <p className="text-text-secondary text-xs">{p.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  {p.evaluation ? (
                    <>
                      <span className="text-text-primary text-sm">
                        {p.evaluation.total_marks} / {p.evaluation.max_marks}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full border ${
                          p.evaluation.is_passed
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-red-100 text-red-700 border-red-200'
                        }`}
                      >
                        {p.evaluation.is_passed ? 'PASS' : 'FAIL'}
                      </span>
                    </>
                  ) : (
                    <span className="text-text-secondary text-sm">Not evaluated</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}