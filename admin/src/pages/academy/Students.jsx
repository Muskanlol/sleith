import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { academyApi } from '../../api/academy.api';
import { ROLES } from '../../utils/constants';
import PageHeader from '../../components/common/PageHeader';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import Toast from '../../components/common/Toast';

export default function Students() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [enrolled, setEnrolled] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [batches, setBatches] = useState([]);
  const [toast, setToast] = useState(null);
  const [assigningId, setAssigningId] = useState(null);
  const [assignBatchValue, setAssignBatchValue] = useState('');
  const [assigning, setAssigning] = useState(false);

  const isAdmin = user?.role === ROLES.ADMIN;
  const isManager = user?.role === ROLES.MANAGER;
  const isTrainer = user?.role === ROLES.TRAINER;

  const canRemove = isAdmin || isManager;
  const canAssign = isAdmin || isManager;

  useEffect(() => {
    fetchStudents();

    if (!isTrainer) {
      fetchBatches();
    }
  }, []);

  const fetchStudents = async (batchOverride) => {
    try {
      setLoading(true);

      const params = {};

      if (search.trim()) {
        params.search = search.trim();
      }

      const effectiveBatch =
        batchOverride !== undefined ? batchOverride : batchFilter;

      if (effectiveBatch) {
        params.batch_id = effectiveBatch;
      }

      const res = await academyApi.getStudents(params);

      if (res.data && Array.isArray(res.data.enrolled)) {
        setEnrolled(res.data.enrolled);
        setPending(res.data.pending_assignment || []);
      } else {
        setEnrolled(res.data.results || res.data);
        setPending([]);
      }

      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Failed to load students'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await academyApi.getBatches();

      const data = res.data.results || res.data;

      const activeBatches = Array.isArray(data)
        ? data.filter(
            (batch) =>
              batch.status === 'ACTIVE' &&
              batch.is_active === true
          )
        : [];

      setBatches(activeBatches);
    } catch {
      setBatches([]);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleRemove = async (id) => {
    if (
      !window.confirm(
        'Are you sure you want to remove this student from the batch?'
      )
    ) {
      return;
    }

    try {
      await academyApi.removeStudent(id);

      setEnrolled((prev) => prev.filter((s) => s.id !== id));

      setToast({
        type: 'success',
        message: 'Student removed successfully',
      });
    } catch (err) {
      setToast({
        type: 'error',
        message:
          err.response?.data?.error ||
          err.response?.data?.detail ||
          'Failed to remove student',
      });
    }
  };

  const openAssign = (applicationId) => {
    setAssigningId(applicationId);
    setAssignBatchValue('');
  };

  const cancelAssign = () => {
    if (assigning) return;

    setAssigningId(null);
    setAssignBatchValue('');
  };

  const handleAssignSubmit = async (studentUserId, applicationId) => {
    if (!assignBatchValue) {
      setToast({
        type: 'warning',
        message: 'Please select a batch',
      });
      return;
    }

    setAssigning(true);

    try {
      await academyApi.enrollStudent(studentUserId, {
        batch_id: assignBatchValue,
        application_id: applicationId,
      });

      setToast({
        type: 'success',
        message: 'Batch assigned successfully',
      });

      setAssigningId(null);
      setAssignBatchValue('');

      await fetchStudents();
    } catch (err) {
      setToast({
        type: 'error',
        message:
          err.response?.data?.error ||
          err.response?.data?.detail ||
          'Failed to assign batch',
      });
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading students..." />;
  }

  if (error) {
    return <EmptyState message={error} type="error" />;
  }

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle={
          isTrainer
            ? 'Your assigned students'
            : 'All academy students'
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form
          onSubmit={handleSearch}
          className="flex-1 flex gap-2"
        >
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 bg-card-bg border border-card-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent"
          />

          <button
            type="submit"
            className="px-4 py-2 bg-accent text-sidebar-text font-medium rounded-lg hover:bg-accent-hover transition"
          >
            Search
          </button>
        </form>

        {!isTrainer && (
          <select
            value={batchFilter}
            onChange={(e) => {
              const value = e.target.value;
              setBatchFilter(value);
              fetchStudents(value);
            }}
            className="px-4 py-2 bg-card-bg border border-card-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="">All Batches</option>

            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {pending.length > 0 && (
        <div className="mb-8">
          <h4 className="text-text-primary text-sm font-semibold mb-3 flex items-center gap-2">
            Pending Batch Assignment

            <span className="text-xs bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-full px-2 py-0.5">
              {pending.length}
            </span>
          </h4>

          <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-card-border">
                    <th className="text-left text-xs font-medium text-text-secondary uppercase px-6 py-3">
                      Name
                    </th>

                    <th className="text-left text-xs font-medium text-text-secondary uppercase px-6 py-3">
                      Email
                    </th>

                    <th className="text-left text-xs font-medium text-text-secondary uppercase px-6 py-3">
                      Phone
                    </th>

                    <th className="text-left text-xs font-medium text-text-secondary uppercase px-6 py-3">
                      Approved Course
                    </th>

                    <th className="text-right text-xs font-medium text-text-secondary uppercase px-6 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-card-border">
                  {pending.map((p) => {
                    const courseBatches = batches.filter((batch) => {
                      const batchCourse = batch.course_id ?? batch.course;
                      const appCourse = p.course_id ?? p.course;
                      const active = batch.is_active !== false;
                      const statusOk = !batch.status || batch.status === 'ACTIVE';
                      return (
                        active &&
                        statusOk &&
                        String(batchCourse) === String(appCourse)
                      );
                    });
                    return (
                      <tr
                        key={p.application_id}
                        className="hover:bg-hover-bg/50 transition"
                      >
                        <td className="px-6 py-4 text-sm text-text-primary font-medium">
                          {p.student_name}
                        </td>

                        <td className="px-6 py-4 text-sm text-text-secondary">
                          {p.student_email}
                        </td>

                        <td className="px-6 py-4 text-sm text-text-secondary">
                          {p.student_phone || '—'}
                        </td>

                        <td className="px-6 py-4 text-sm text-text-secondary">
                          {p.course_name}
                        </td>

                        <td className="px-6 py-4 text-right">
                          {canAssign ? (
                            assigningId === p.application_id ? (
                              <div className="flex items-center justify-end gap-2">
                                <select
                                  value={assignBatchValue}
                                  onChange={(e) =>
                                    setAssignBatchValue(e.target.value)
                                  }
                                  className="px-2 py-1 bg-hover-bg border border-card-border rounded text-text-primary text-sm focus:outline-none focus:border-accent"
                                >
                                  <option value="">
                                    Select batch
                                  </option>
                                  {courseBatches.map((batch) => {
                                    const seatsLeft = batch.capacity - (batch.enrolled_count || 0);

                                    return (
                                      <option
                                        key={batch.id}
                                        value={batch.id}
                                        disabled={seatsLeft <= 0}
                                      >
                                        {batch.name} 
                                        {seatsLeft > 0 ? ` (Seats left: ${seatsLeft})` : ' (Full)'}
                                      </option>
                                    );
                                  })}
                                </select>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAssignSubmit(
                                      p.student,
                                      p.application_id
                                    )
                                  }
                                  disabled={
                                    !assignBatchValue || assigning
                                  }
                                  className="text-xs px-3 py-1 bg-accent text-sidebar-text rounded font-medium disabled:opacity-50"
                                >
                                  {assigning ? '...' : 'Confirm'}
                                </button>

                                <button
                                  type="button"
                                  onClick={cancelAssign}
                                  disabled={assigning}
                                  className="text-xs text-text-secondary hover:text-text-primary disabled:opacity-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  openAssign(p.application_id)
                                }
                                className="text-accent hover:text-accent-hover text-sm font-medium transition"
                              >
                                Assign Batch
                              </button>
                            )
                          ) : (
                            <span className="text-xs text-text-secondary">
                              Awaiting batch
                            </span>
                          )}

                          {assigningId === p.application_id &&
                            courseBatches.length === 0 && (
                              <p className="text-xs text-red-600 mt-2">
                                No active batch available for this course.
                              </p>
                            )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!enrolled.length ? (
        <EmptyState message="No enrolled students found" />
      ) : (
        <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-card-border">
                  <th className="text-left text-xs font-medium text-text-secondary uppercase px-6 py-3">
                    ID
                  </th>

                  <th className="text-left text-xs font-medium text-text-secondary uppercase px-6 py-3">
                    Name
                  </th>

                  <th className="text-left text-xs font-medium text-text-secondary uppercase px-6 py-3">
                    Email
                  </th>

                  <th className="text-left text-xs font-medium text-text-secondary uppercase px-6 py-3">
                    Phone
                  </th>

                  <th className="text-left text-xs font-medium text-text-secondary uppercase px-6 py-3">
                    Batch
                  </th>

                  <th className="text-left text-xs font-medium text-text-secondary uppercase px-6 py-3">
                    Course
                  </th>

                  <th className="text-left text-xs font-medium text-text-secondary uppercase px-6 py-3">
                    Enrolled
                  </th>

                  <th className="text-right text-xs font-medium text-text-secondary uppercase px-6 py-3">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-card-border">
                {enrolled.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-hover-bg/50 transition"
                  >
                    <td className="px-6 py-4 text-sm text-text-primary">
                      #{s.id}
                    </td>

                    <td className="px-6 py-4 text-sm text-text-primary font-medium">
                      {s.student_name}
                    </td>

                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {s.student_email}
                    </td>

                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {s.student_phone || '—'}
                    </td>

                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {s.batch_name}
                    </td>

                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {s.course_name}
                    </td>

                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {s.enrolled_at
                        ? new Date(
                            s.enrolled_at
                          ).toLocaleDateString()
                        : '—'}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/admin/academy/students/${s.id}`
                            )
                          }
                          className="text-accent hover:text-accent-hover text-sm font-medium transition"
                        >
                          View
                        </button>

                        {canRemove && (
                          <button
                            type="button"
                            onClick={() => handleRemove(s.id)}
                            className="text-red-700 hover:text-red-800 text-sm font-medium transition"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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