function StatusBadge({ status }) {
  const styles = {
    PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    CONFIRMED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    COMPLETED: "bg-green-500/10 text-green-400 border-green-500/20",
    CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
    RESCHEDULED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    APPROVED: "bg-green-500/10 text-green-400 border-green-500/20",
    REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
    ACTIVE: "bg-green-500/10 text-green-400 border-green-500/20",
    INACTIVE: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    SUCCESS: "bg-green-500/10 text-green-400 border-green-500/20",
    FAILED: "bg-red-500/10 text-red-400 border-red-500/20",
    REFUNDED: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    PAID: "bg-green-500/10 text-green-400 border-green-500/20",
    OVERDUE: "bg-red-500/10 text-red-400 border-red-500/20",
    PRESENT: "bg-green-500/10 text-green-400 border-green-500/20",
    ABSENT: "bg-red-500/10 text-red-400 border-red-500/20",
    THEORY: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    PRACTICAL: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    FINAL: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  };

  const normalized = status?.toUpperCase();
  const style = styles[normalized] || "bg-gray-500/10 text-gray-400 border-gray-500/20";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {status}
    </span>
  );
}

export default StatusBadge;