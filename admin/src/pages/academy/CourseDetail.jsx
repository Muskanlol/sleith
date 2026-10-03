import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { academyApi } from '../../api/academy.api';
import { ROLES } from '../../utils/constants';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import Toast from '../../components/common/Toast';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);

  const [loading, setLoading] = useState(true);
  const [moduleLoading, setModuleLoading] = useState(true);

  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const [showModuleForm, setShowModuleForm] = useState(false);

  const [editingModule, setEditingModule] = useState(null);

  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    order: '',
  });

  const canWrite =
    user?.role === ROLES.ADMIN ||
    user?.role === ROLES.MANAGER;

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const res = await academyApi.getCourseById(id);

      setCourse(res.data);
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Failed to load course'
      );
    } finally {
      setLoading(false);
    }

    fetchModules();
  };

  const fetchModules = async () => {
    try {
      setModuleLoading(true);

      const res = await academyApi.getCourseModules(id);

      setModules(res.data.results || res.data);
    } catch (err) {
      setToast({
        type: 'error',
        message:
          err.response?.data?.detail ||
          'Failed to load modules',
      });
    } finally {
      setModuleLoading(false);
    }
  };

  const openAddModule = () => {
    setEditingModule(null);

    setModuleForm({
      title: '',
      description: '',
      order: modules.length + 1,
    });

    setShowModuleForm(true);
  };

  const openEditModule = (module) => {
    setEditingModule(module);

    setModuleForm({
      title: module.title || '',
      description: module.description || '',
      order: module.order || '',
    });

    setShowModuleForm(true);
  };

  const handleModuleChange = (e) => {
    setModuleForm({
      ...moduleForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleModuleSubmit = async (e) => {
    e.preventDefault();

    if (!moduleForm.title.trim()) {
      setToast({
        type: 'error',
        message: 'Module title is required',
      });
      return;
    }

    try {
      const data = {
        title: moduleForm.title,
        description: moduleForm.description,
        order: Number(moduleForm.order) || 0,
      };

      if (editingModule) {
        await academyApi.updateCourseModule(
          id,
          editingModule.id,
          data
        );

        setToast({
          type: 'success',
          message: 'Module updated successfully',
        });
      } else {
        await academyApi.createCourseModule(id, data);

        setToast({
          type: 'success',
          message: 'Module added successfully',
        });
      }

      setShowModuleForm(false);
      setEditingModule(null);

      await fetchModules();
    } catch (err) {
      setToast({
        type: 'error',
        message:
          err.response?.data?.detail ||
          err.response?.data?.error ||
          'Failed to save module',
      });
    }
  };

  const handleDeleteModule = async (moduleId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this module?'
    );

    if (!confirmed) return;

    try {
      await academyApi.deleteCourseModule(id, moduleId);

      setModules((prev) =>
        prev.filter((module) => module.id !== moduleId)
      );

      setToast({
        type: 'success',
        message: 'Module deleted successfully',
      });
    } catch (err) {
      setToast({
        type: 'error',
        message:
          err.response?.data?.detail ||
          err.response?.data?.error ||
          'Failed to delete module',
      });
    }
  };

  if (loading) {
    return <LoadingState message="Loading course..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-red-700">{error}</div>

        <button
          onClick={() =>
            navigate('/admin/academy/courses')
          }
          className="text-accent hover:text-accent-hover transition"
        >
          ← Back
        </button>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              navigate('/admin/academy/courses')
            }
            className="text-text-secondary hover:text-text-primary transition"
          >
            ← Back
          </button>

          <h3 className="text-text-primary text-xl font-semibold">
            {course.name}
          </h3>
        </div>

        {canWrite && (
          <button
            onClick={() =>
              navigate(
                `/admin/academy/courses/${id}/edit`
              )
            }
            className="px-4 py-2 bg-accent/20 text-accent border border-accent/30 rounded-lg hover:bg-accent/30 transition"
          >
            Edit Course
          </button>
        )}
      </div>

      <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden mb-8">
        <div className="divide-y divide-card-border">
          <div className="flex items-center px-6 py-4">
            <span className="w-40 text-sm font-medium text-text-secondary">
              Course Name
            </span>

            <span className="text-sm text-text-primary">
              {course.name}
            </span>
          </div>

          <div className="flex items-center px-6 py-4">
            <span className="w-40 text-sm font-medium text-text-secondary">
              Description
            </span>

            <span className="text-sm text-text-primary">
              {course.description || '—'}
            </span>
          </div>

          <div className="flex items-center px-6 py-4">
            <span className="w-40 text-sm font-medium text-text-secondary">
              Duration
            </span>

            <span className="text-sm text-text-primary">
              {course.duration_months} months
            </span>
          </div>

          <div className="flex items-center px-6 py-4">
            <span className="w-40 text-sm font-medium text-text-secondary">
              Fee
            </span>

            <span className="text-sm text-text-primary">
              ₹{course.fee}
            </span>
          </div>

          <div className="flex items-center px-6 py-4">
            <span className="w-40 text-sm font-medium text-text-secondary">
              Status
            </span>

            <span
              className={
                course.is_active
                  ? 'text-green-700'
                  : 'text-red-700'
              }
            >
              {course.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>

          {(course.image_before_url || course.image_after_url) && (
            <div className="flex items-start px-6 py-4">
              <span className="w-40 text-sm font-medium text-text-secondary pt-1">
                Course photos
              </span>
              <div className="flex gap-3">
                {course.image_before_url && (
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Default</p>
                    <img src={course.image_before_url} alt="Default" className="w-28 h-20 object-cover rounded-lg border border-card-border" />
                  </div>
                )}
                {course.image_after_url && (
                  <div>
                    <p className="text-xs text-text-secondary mb-1">On hover</p>
                    <img src={course.image_after_url} alt="On hover" className="w-28 h-20 object-cover rounded-lg border border-card-border" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h4 className="text-text-primary text-lg font-semibold">
          Course Modules ({modules.length})
        </h4>

        {canWrite && (
          <button
            onClick={openAddModule}
            className="px-4 py-2 bg-accent text-sidebar-text font-medium rounded-lg hover:bg-accent-hover transition"
          >
            + Add Module
          </button>
        )}
      </div>

      {showModuleForm && canWrite && (
        <div className="bg-card-bg border border-card-border rounded-xl p-6 mb-6">
          <h5 className="text-text-primary font-semibold mb-5">
            {editingModule
              ? 'Edit Module'
              : 'Add Module'}
          </h5>

          <form
            onSubmit={handleModuleSubmit}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm text-text-secondary mb-2">
                Module Title
              </label>

              <input
                type="text"
                name="title"
                value={moduleForm.title}
                onChange={handleModuleChange}
                placeholder="e.g. Introduction to Hair Styling"
                className="w-full px-4 py-2.5 bg-hover-bg border border-card-border rounded-lg text-text-primary outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-2">
                Description
              </label>

              <textarea
                name="description"
                value={moduleForm.description}
                onChange={handleModuleChange}
                rows={3}
                placeholder="Describe this module"
                className="w-full px-4 py-2.5 bg-hover-bg border border-card-border rounded-lg text-text-primary outline-none focus:border-accent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-2">
                Order
              </label>

              <input
                type="number"
                name="order"
                value={moduleForm.order}
                onChange={handleModuleChange}
                min="0"
                className="w-full px-4 py-2.5 bg-hover-bg border border-card-border rounded-lg text-text-primary outline-none focus:border-accent"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-accent text-sidebar-text font-medium rounded-lg hover:bg-accent-hover transition"
              >
                {editingModule
                  ? 'Update Module'
                  : 'Add Module'}
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowModuleForm(false)
                }
                className="px-4 py-2 border border-card-border text-text-secondary rounded-lg hover:text-text-primary hover:bg-hover-bg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {moduleLoading ? (
        <LoadingState message="Loading modules..." />
      ) : !modules.length ? (
        <EmptyState message="No modules added yet" />
      ) : (
        <div className="space-y-3">
          {modules.map((module, index) => (
            <div
              key={module.id}
              className="bg-card-bg border border-card-border rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-semibold">
                    {module.order || index + 1}
                  </div>

                  <div>
                    <h5 className="text-text-primary font-semibold">
                      {module.title}
                    </h5>

                    <p className="text-text-secondary text-sm mt-1">
                      {module.description ||
                        'No description'}
                    </p>
                  </div>
                </div>

                {canWrite && (
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        openEditModule(module)
                      }
                      className="px-3 py-1.5 text-sm bg-accent/20 text-accent border border-accent/30 rounded-lg hover:bg-accent/30 transition"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        handleDeleteModule(module.id)
                      }
                      className="px-3 py-1.5 text-sm bg-red-100 text-red-700 border border-red-200 rounded-lg hover:bg-red-200 transition"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
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