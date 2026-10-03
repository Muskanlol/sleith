import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { academyApi } from '../../api/academy.api';
import { ROLES } from '../../utils/constants';
import LoadingState from '../../components/common/LoadingState';
import Toast from '../../components/common/Toast';

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const isAdmin = user?.role === ROLES.ADMIN;

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const res = await academyApi.getStudentById(id);
      setStudent(res.data);
      setError(null);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Student not found');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view this student');
      } else {
        setError('Failed to load student details');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState message="Loading student..." />;
  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="text-red-700">{error}</div>
      <button
        onClick={() => navigate('/admin/academy/students')}
        className="text-accent hover:text-accent-hover transition"
      >
        ← Back to Students
      </button>
    </div>
  );
  if (!student) return null;

  const rows = [
    { label: 'Student ID', value: `#${student.id}` },
    { label: 'Name', value: student.student_name || '—' },
    { label: 'Email', value: student.student_email || '—' },
    { label: 'Phone', value: student.student_phone || '—' },
    { label: 'Batch', value: student.batch_name || '—' },
    { label: 'Course', value: student.course_name || '—' },
    { label: 'Trainer', value: student.trainer_name || '—' },
    { label: 'Enrolled On', value: student.enrolled_at ? new Date(student.enrolled_at).toLocaleDateString() : '—' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/academy/students')}
            className="text-text-secondary hover:text-text-primary transition"
          >
            ← Back
          </button>
          <h3 className="text-text-primary text-xl font-semibold">{student.student_name}</h3>
        </div>

        {isAdmin && (
          <button
            onClick={() => navigate(`/admin/academy/students/${id}/edit`)}
            className="px-4 py-2 bg-accent/20 text-accent border border-accent/30 rounded-lg hover:bg-accent/30 transition"
          >
            Edit
          </button>
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
        </div>
      </div>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}