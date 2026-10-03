import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { academyApi } from '../../api/academy.api';
import { isFutureCalendarDate } from '../../utils/constants';
import PageHeader from '../../components/common/PageHeader';
import LoadingState from '../../components/common/LoadingState';
import Toast from '../../components/common/Toast';

export default function PracticalEvaluation() {
  const navigate = useNavigate();
  const { id: sessionId } = useParams();

  const [session, setSession] = useState(null);
  const [criteria, setCriteria] = useState([]);
  const [scores, setScores] = useState({});
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    fetchData();
  }, [sessionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sessionRes, criteriaRes] = await Promise.all([
        academyApi.getPracticalSession(sessionId),  
        academyApi.getPracticalCriteria()
      ]);
      const sessionData = sessionRes.data;
      setSession(sessionData);
      setCriteria(criteriaRes.data.results || criteriaRes.data);
      const hasEvaluation = sessionData?.evaluation?.id != null;
      
      if (hasEvaluation) {
        setIsEdit(true);
        setFeedback(sessionData.evaluation.feedback || '');
        
        const existingScores = {};
        sessionData.evaluation.scores?.forEach((s) => {
          existingScores[s.criteria] = s.marks_obtained;
        });
        setScores(existingScores);
      } else {
        setIsEdit(false);
        setFeedback('');
        
        const initialScores = {};
        (criteriaRes.data.results || criteriaRes.data).forEach((c) => {
          initialScores[c.id] = '';
        });
        setScores(initialScores);
      }
      
      setLoading(false);
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to load data' });
      setLoading(false);
    }
  };

  const handleScoreChange = (criteriaId, value) => {
    setScores((prev) => ({
      ...prev,
      [criteriaId]: value === '' ? '' : Math.min(Number(value), getMaxMarks(criteriaId)),
    }));
  };

  const getMaxMarks = (criteriaId) => {
    const c = criteria.find((item) => item.id === Number(criteriaId));
    return c?.max_marks || 20;
  };

  const calculateTotal = () => {
    return Object.values(scores).reduce((sum, val) => sum + (Number(val) || 0), 0);
  };

  const calculateMax = () => {
    return criteria.reduce((sum, c) => sum + c.max_marks, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isFutureCalendarDate(session?.date)) {
      setToast({
        type: 'error',
        message: `Cannot enter marks before ${session.date}. Marks can be saved on that date or after.`,
      });
      return;
    }
    
    const scoresArray = Object.entries(scores)
      .filter(([_, val]) => val !== '' && val !== null)
      .map(([criteriaId, marks]) => ({
        criteria_id: Number(criteriaId),
        marks: Number(marks),
      }));
    
    if (scoresArray.length === 0) {
      setToast({ type: 'error', message: 'Please enter at least one score' });
      return;
    }

    try {
      setSaving(true);
      const data = {
        scores: scoresArray,
        feedback,
      };
      
      if (isEdit) {
        await academyApi.updateEvaluation(sessionId, data);
      } else {
        await academyApi.createEvaluation(sessionId, data);
      }
      
      navigate('/admin/academy/practical');
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Failed to save evaluation' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading..." />;

  const marksLocked = isFutureCalendarDate(session?.date);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/academy/practical')} className="text-text-secondary hover:text-text-primary">
          ← Back
        </button>
        <PageHeader
          title={isEdit ? 'Edit Evaluation' : 'Practical Evaluation'}
          subtitle={`${session?.title} - ${session?.student_name}${session?.date ? ` | Date: ${session.date}` : ''}`}
        />
      </div>

      {marksLocked && (
        <div className="mb-6 max-w-2xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Marks open on {session.date}. You can prepare this practical now, but scores cannot be saved until that date.
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl bg-card-bg border border-card-border rounded-xl p-6">
        <div className="mb-6">
          <h3 className="text-text-primary font-semibold mb-4">Criteria Scoring</h3>
          
          <div className="space-y-4">
            {criteria.map((c) => (
              <div key={c.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="block text-sm text-text-secondary mb-1">{c.name}</label>
                  {c.description && <p className="text-xs text-text-secondary">{c.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max={c.max_marks}
                    value={scores[c.id] || ''}
                    onChange={(e) => handleScoreChange(c.id, e.target.value)}
                    disabled={marksLocked}
                    className="w-20 px-3 py-2 bg-page-bg border border-card-border rounded-lg text-text-primary outline-none focus:border-accent text-center disabled:opacity-50"
                  />
                  <span className="text-text-secondary text-sm">/ {c.max_marks}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-card-border">
            <div className="flex justify-between text-text-primary font-semibold">
              <span>Total</span>
              <span>{calculateTotal()} / {calculateMax()}</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm text-text-secondary mb-2">Trainer Feedback</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            disabled={marksLocked}
            placeholder="Enter detailed feedback about student's performance..."
            className="w-full px-4 py-2.5 bg-page-bg border border-card-border rounded-lg text-text-primary outline-none focus:border-accent resize-none placeholder-text-secondary disabled:opacity-50"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/academy/practical')}
            className="px-4 py-2 text-sm text-text-secondary border border-card-border rounded-lg hover:bg-hover-bg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || marksLocked}
            className="px-5 py-2 bg-accent text-white font-medium rounded-lg hover:bg-accent-hover transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEdit ? 'Update Evaluation' : 'Submit Evaluation'}
          </button>
        </div>
      </form>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}