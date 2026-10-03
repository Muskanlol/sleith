import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { academyApi } from '../../api/academy.api';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';

function TrainerAttendanceFlow() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    academyApi.getMyBatches()
      .then((res) => setBatches(res.data.results || res.data))
      .catch((err) => console.error('Failed to load batches:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading batches..." />;

  return (
    <div>
      <h3 className="text-text-primary text-xl font-semibold mb-6">Select Batch for Attendance</h3>
      {!batches.length ? (
        <EmptyState message="No active batches found" />
      ) : (
        <div className="grid gap-4">
          {batches.map((batch) => (
            <div
              key={batch.id}
              onClick={() => navigate(`/admin/academy/attendance/${batch.id}/sessions`)}
              className="bg-card-bg border border-card-border rounded-xl p-5 cursor-pointer hover:border-accent transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-text-primary font-medium text-lg">{batch.name}</h4>
                  <p className="text-text-secondary text-sm mt-1">{batch.course_name}</p>
                  <p className="text-text-secondary text-sm">{batch.start_date} → {batch.end_date}</p>
                </div>
                <span className="text-accent text-sm font-medium">→ Select</span>
              </div>
              <div className="mt-3 flex gap-4 text-xs text-text-secondary">
                <span>Capacity: {batch.capacity}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewerAttendanceFlow() {
  const navigate = useNavigate();
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    academyApi.getTrainers()
      .then((res) => setTrainers(res.data.results || res.data))
      .catch((err) => console.error('Failed to load trainers:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading trainers..." />;

  return (
    <div>
      <h3 className="text-text-primary text-xl font-semibold mb-6">Attendance — Select Trainer</h3>
      {!trainers.length ? (
        <EmptyState message="No trainers found" />
      ) : (
        <div className="grid gap-4">
          {trainers.map((trainer) => (
            <div
              key={trainer.id}
              onClick={() => navigate(`/admin/academy/attendance/trainers/${trainer.id}`)}
              className="bg-card-bg border border-card-border rounded-xl p-5 cursor-pointer hover:border-accent transition flex justify-between items-center"
            >
              <div>
                <h4 className="text-text-primary font-medium text-lg">{trainer.full_name}</h4>
                <p className="text-text-secondary text-sm mt-1">{trainer.email}</p>
              </div>
              <span className="text-accent text-sm font-medium">→ View Batches</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Attendance() {
  const { user } = useAuth();
  const isTrainer = user?.role === ROLES.TRAINER;

  return isTrainer ? <TrainerAttendanceFlow /> : <ReviewerAttendanceFlow />;
}