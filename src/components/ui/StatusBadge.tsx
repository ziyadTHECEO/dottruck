type Status = 'success' | 'warning' | 'error' | 'pending'

interface StatusBadgeProps {
  status: Status
  label?: string
}

const config: Record<Status, { icon: string; classes: string }> = {
  success: { icon: '✓', classes: 'bg-green-50 text-success border-green-200' },
  warning: { icon: '⚠', classes: 'bg-amber-50 text-warning border-amber-200' },
  error:   { icon: '✗', classes: 'bg-red-50 text-error border-red-200' },
  pending: { icon: '⏳', classes: 'bg-gray-50 text-gray-500 border-gray-200' },
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const { icon, classes } = config[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${classes}`}>
      {icon} {label}
    </span>
  )
}
