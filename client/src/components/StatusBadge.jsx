const statusMap = {
  PENDING: { label: 'Pending', color: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
  PROCESSING: { label: 'Processing', color: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
  ACTIVE: { label: 'Active', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25' },
  READY_FOR_PICKUP: { label: 'Ready', color: 'bg-green-500/15 text-green-400 border-green-500/25' },
  PICKED_UP: { label: 'Picked Up', color: 'bg-purple-500/15 text-purple-400 border-purple-500/25' },
  DELIVERED: { label: 'Delivered', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' },
  COMPLETED: { label: 'Completed', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' },
  ISSUED: { label: 'Issued', color: 'bg-violet-500/15 text-violet-400 border-violet-500/25' },
  FULFILLED: { label: 'Fulfilled', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' },
  SUCCESS: { label: 'Success', color: 'bg-green-500/15 text-green-400 border-green-500/25' },
  FAILED: { label: 'Failed', color: 'bg-red-500/15 text-red-400 border-red-500/25' },
};

const fallback = { label: 'Unknown', color: 'bg-gray-500/15 text-gray-400 border-gray-500/25' };

export default function StatusBadge({ status, className = '' }) {
  const config = statusMap[status] || fallback;
  return (
    <span className={`badge border ${config.color} ${className}`}>
      {config.label}
    </span>
  );
}
