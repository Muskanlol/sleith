import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { academyApi } from '../../api/academy.api';
import { ROLES } from '../../utils/constants';
import PageHeader from '../../components/common/PageHeader';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import Toast from '../../components/common/Toast';

const STATUS_STYLES = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  INACTIVE: 'bg-red-100 text-red-700 border-red-200',
};

export default function Courses() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const isAdmin = user?.role === ROLES.ADMIN;
  const isManager = user?.role === ROLES.MANAGER;
  const canWrite = isAdmin || isManager;

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await academyApi.getCourses();
      setCourses(res.data.results || res.data);
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Failed to load courses'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const res = await academyApi.toggleCourseStatus(id);

      setCourses((prev) =>
        prev.map((course) =>
          course.id === id
            ? { ...course, is_active: !currentStatus }
            : course
        )
      );

      setToast({
        type: 'success',
        message: res.data.message,
      });
    } catch (err) {
      setToast({
        type: 'error',
        message: err.response?.data?.error || 'Failed to update course status',
      });
    }
  };

  if (loading) {
    return <LoadingState message="Loading courses..." />;
  }

  if (error) {
    return <EmptyState message={error} type="error" />;
  }

  return (
    <div>
      <PageHeader
        title="Courses"
        subtitle={
          canWrite
            ? 'Manage academy courses'
            : 'Available academy courses'
        }
      />

      {canWrite && (
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/academy/courses/new')}
            className="px-4 py-2 bg-accent text-sidebar-text font-medium rounded-lg hover:bg-accent-hover transition"
          >
            + Create Course
          </button>
        </div>
      )}

      {!courses.length ? (
        <EmptyState message="No courses found" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-card-bg border border-card-border rounded-xl p-5 hover:border-accent/30 cursor-pointer transition"
              onClick={() => navigate(`/admin/academy/courses/${course.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <h4 className="text-text-primary font-semibold text-lg">
                  {course.name}
                </h4>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${
                    course.is_active
                      ? STATUS_STYLES.ACTIVE
                      : STATUS_STYLES.INACTIVE
                  }`}
                >
                  {course.is_active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-text-secondary block mb-1">
                    Description
                  </span>
                  <p className="text-text-primary">
                    {course.description || '—'}
                  </p>
                </div>

                <div className="flex justify-between">
                  <span className="text-text-secondary">Duration</span>
                  <span className="text-text-primary">
                    {course.duration_months} month
                    {course.duration_months !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-text-secondary">Fee</span>
                  <span className="text-text-primary">₹{course.fee}</span>
                </div>
              </div>

              {canWrite && (
                <div className="flex gap-2 mt-5 pt-4 border-t border-card-border">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/academy/courses/${course.id}/edit`);
                    }}
                    className="flex-1 px-3 py-1.5 text-sm bg-accent/20 text-accent border border-accent/30 rounded-lg hover:bg-accent/30 transition"
                  >
                    Edit
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(course.id, course.is_active);
                    }}
                    className={`flex-1 px-3 py-1.5 text-sm rounded-lg transition ${
                      course.is_active
                        ? 'bg-red-100 text-red-700 border border-red-200 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200'
                    }`}
                  >
                    {course.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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