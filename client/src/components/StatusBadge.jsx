const statusMap = {
  PENDING:          { label: 'Pending',     bg: '#FEF3C7', color: '#92400E' },
  PROCESSING:       { label: 'Processing',  bg: '#DBEAFE', color: '#1E40AF' },
  ACTIVE:           { label: 'Active',      bg: '#EDE9FE', color: '#5B21B6' },
  READY_FOR_PICKUP: { label: 'Ready',       bg: '#D1FAE5', color: '#065F46' },
  PICKED_UP:        { label: 'Picked up',   bg: '#EDE9FE', color: '#6D28D9' },
  DELIVERED:        { label: 'Delivered',   bg: '#D1FAE5', color: '#065F46' },
  COMPLETED:        { label: 'Completed',   bg: '#D1FAE5', color: '#065F46' },
  ISSUED:           { label: 'Issued',      bg: '#EDE9FE', color: '#6D28D9' },
  FULFILLED:        { label: 'Fulfilled',   bg: '#D1FAE5', color: '#065F46' },
  SUCCESS:          { label: 'Success',     bg: '#D1FAE5', color: '#065F46' },
  FAILED:           { label: 'Failed',      bg: '#FEE2E2', color: '#991B1B' },
  CANCELLED:        { label: 'Cancelled',   bg: '#F4F4F5', color: '#52525B' },
};

const fallback = { label: 'Unknown', bg: '#F4F4F5', color: '#71717A' };

export default function StatusBadge({ status, className = '' }) {
  const cfg = statusMap[status] || fallback;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${className}`}
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}
