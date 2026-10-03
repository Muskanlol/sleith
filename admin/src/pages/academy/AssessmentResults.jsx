import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { academyApi } from '../../api/academy.api';
import { ROLES, isFutureCalendarDate } from '../../utils/constants';
import PageHeader from '../../components/common/PageHeader';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import Toast from '../../components/common/Toast';

export default function AssessmentResults() {
  const navigate = useNavigate();
  const { id: assessmentId } = useParams();
  const { user } = useAuth();

  const [assessment, setAssessment] = useState(null);
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState({});
  const [existingResults, setExistingResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const canWrite = [ROLES.TRAINER, ROLES.ADMIN, ROLES.MANAGER].includes(user?.role);

  useEffect(() => {
    fetchData();
  }, [assessmentId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const assessmentRes = await academyApi.getAssessmentById(assessmentId);
      setAssessment(assessmentRes.data);

      const studentsRes = await academyApi.getBatchStudents(assessmentRes.data.batch);
      const studentsData = studentsRes.data.results || studentsRes.data;
      setStudents(studentsData);

      const resultsRes = await academyApi.getAssessmentResults(assessmentId);
      const existing = {};
      (resultsRes.data.results || resultsRes.data).forEach((r) => {
        existing[r.student] = r;
      });
      setExistingResults(existing);

      const initialResults = {};
      studentsData.forEach((student) => {
        const studentId = student.student_id || student.student;
        const existingResult = existing[studentId];
        initialResults[studentId] = existingResult ? existingResult.marks_obtained : '';
      });
      setResults(initialResults);

      setLoading(false);
    } catch (err) {
      setToast({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to load data',
      });
      setLoading(false);
    }
  };

  const handleMarksChange = (studentId, value) => {
    setResults((prev) => ({
      ...prev,
      [studentId]: value,
    }));
  };

 const handleSave = async () => {
  if (isFutureCalendarDate(assessment?.date)) {
    setToast({
      type: 'error',
      message: `Cannot enter marks before ${assessment.date}. Marks can be saved on that date or after.`,
    });
    return;
  }

  try {
    setSaving(true);

    const enrolledIds = students.map((s) =>
      String(s.student_id || s.student)
    );

    const records = Object.entries(results)
      .filter(([_, marks]) => marks !== '' && marks !== null)
      .map(([studentId, marks]) => ({
        assessment: Number(assessmentId),
        student: studentId,
        marks_obtained: Number(marks),
      }));

    for (const record of records) {
      if (!enrolledIds.includes(String(record.student))) {
        setToast({
          type: 'error',
          message: `Student #${record.student} is not enrolled in this batch`,
        });
        continue;
      }

      const existingResult = existingResults[record.student];

      if (existingResult) {
        await academyApi.updateAssessmentResult(existingResult.id, {
          marks_obtained: record.marks_obtained,
        });
      } else {
        await academyApi.createAssessmentResult(assessmentId, record);
      }
    }

    setToast({
      type: 'success',
      message: 'Results saved successfully',
    });

    fetchData();
  } catch (err) {
    setToast({
      type: 'error',
      message:
        err.response?.data?.detail ||
        err.response?.data?.error ||
        err.response?.data?.non_field_errors?.[0] ||
        'Failed to save results',
    });
  } finally {
    setSaving(false);
  }
};


  if (loading) return <LoadingState message="Loading assessment data..." />;

  if (!assessment) return <EmptyState message="Assessment not found" type="error" />;

  const passingMarks = assessment.passing_marks || Math.round(assessment.max_marks * 0.4);
  const marksLocked = isFutureCalendarDate(assessment.date);
  const canEnterMarks = canWrite && !marksLocked;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/admin/academy/assessments')}
          className="text-text-secondary hover:text-text-primary"
        >
          ← Back
        </button>
        <PageHeader
          title={assessment.title}
          subtitle={`${assessment.assessment_type} | Max: ${assessment.max_marks} | Passing: ${passingMarks} | Date: ${assessment.date}`}
        />
      </div>

      {marksLocked && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Marks open on {assessment.date}. You can prepare this assessment now, but results cannot be saved until that date.
        </div>
      )}

      <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden mb-6">
        <table className="w-full">
          <thead>
            <tr className="border-b border-card-border">
              <th className="text-left px-6 py-4 text-sm font-medium text-text-secondary">Student</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-text-secondary">Marks Obtained</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-text-secondary">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-card-border">
            {students.map((student) => {
              const studentId = student.student_id || student.student;
              const existingResult = existingResults[studentId];
              const marks = results[studentId] || '';

              return (
                <tr key={studentId}>
                  <td className="px-6 py-4">
                    <div className="text-text-primary font-medium">{student.student_name || student.student?.full_name}</div>
                    <div className="text-text-secondary text-sm">{student.student_email || student.student?.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    {canEnterMarks ? (
                      <input
                        type="number"
                        min="0"
                        max={assessment.max_marks}
                        value={marks}
                        onChange={(e) => handleMarksChange(studentId, e.target.value)}
                        className="w-24 px-3 py-2 bg-page-bg border border-card-border rounded-lg text-text-primary outline-none focus:border-accent text-center"
                        placeholder="0"
                      />
                    ) : (
                      <span className="text-text-primary">{existingResult?.marks_obtained ?? '-'}</span>
                    )}
                    <span className="text-text-secondary text-sm ml-2">/ {assessment.max_marks}</span>
                  </td>
                  <td className="px-6 py-4">
                    {existingResult ? (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          existingResult.is_passed
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-red-100 text-red-700 border-red-200'
                        }`}
                      >
                        {existingResult.is_passed ? 'PASS' : 'FAIL'}
                      </span>
                    ) : (
                      <span className="text-text-secondary text-sm">Not evaluated</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {canEnterMarks && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Results'}
          </button>
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