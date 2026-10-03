import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { academyApi } from '../../api/academy.api';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';

export default function AcademyPayments() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    academyApi.getStudents()
      .then((res) => {
        const data = res.data;
        setStudents(data.enrolled || data.results || data);
      })
      .catch((err) => console.error('Failed to load students:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading students..." />;

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-text-primary dark:text-white text-xl font-semibold">
          Payments — Students
        </h3>
        <p className="text-text-secondary text-sm mt-1">
          View enrolled students and their course and batch details.
        </p>
      </div>

      {!students.length ? (
        <EmptyState message="No enrolled students found" />
      ) : (
        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-hover-bg border-b border-card-border">
                <tr>
                  <th className="px-6 py-4 text-sm font-medium text-text-secondary">
                    Student
                  </th>
                  <th className="px-6 py-4 text-sm font-medium text-text-secondary">
                    Course
                  </th>
                  <th className="px-6 py-4 text-sm font-medium text-text-secondary">
                    Batch
                  </th>
                </tr>
              </thead>

              <tbody>
                {students.map((s) => (
                  <tr
                    key={s.student_id || s.student}
                    onClick={() =>
                      navigate(
                        `/admin/academy/payments/students/${s.student_id || s.student}`
                      )
                    }
                    className="border-b border-card-border last:border-b-0 hover:bg-hover-bg transition cursor-pointer"
                  >
                    <td className="px-6 py-4 text-sm text-text-primary dark:text-white font-medium">
                      {s.student_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {s.course_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {s.batch_name || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}