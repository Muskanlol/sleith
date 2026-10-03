import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { academyApi } from '../../api/academy.api';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';

export default function TrainerBatchesAttendance() {
  const { trainerId } = useParams();
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    academyApi.getTrainerBatchesForAttendance(trainerId)
      .then((res) => setBatches(res.data.results || res.data))
      .catch((err) => console.error('Failed to load batches:', err))
      .finally(() => setLoading(false));
  }, [trainerId]);

  if (loading) return <LoadingState message="Loading batches..." />;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/academy/attendance')} className="text-text-secondary hover:text-text-primary transition">
          ← Back to Trainers
        </button>
      </div>
      <h3 className="text-text-primary text-xl font-semibold mb-6">Trainer's Batches</h3>

      {!batches.length ? (
        <EmptyState message="This trainer has no batches" />
      ) : (
        <div className="grid gap-4">
          {batches.map((batch) => (
            <div
              key={batch.id}
              onClick={() => navigate(`/admin/academy/attendance/batches/${batch.id}/students`)}
              className="bg-card-bg border border-card-border rounded-xl p-5 cursor-pointer hover:border-accent transition"
            >
              <h4 className="text-text-primary font-medium text-lg">{batch.name}</h4>
              <p className="text-text-secondary text-sm mt-1">{batch.course_name}</p>
              <p className="text-text-secondary text-sm">{batch.start_date} → {batch.end_date}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}