// VaaniStock — Formatters
export const formatCurrency = (amount, currency = 'INR') => {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatNumber = (n) => {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-IN').format(n)
}

export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return formatDate(dateStr)
}

export const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

export const getStatusColor = (status) => {
  switch (status) {
    case 'HEALTHY': return 'text-accent-green'
    case 'LOW_STOCK': return 'text-accent-orange'
    case 'OUT_OF_STOCK': return 'text-accent-red'
    default: return 'text-gray-400'
  }
}

export const getStatusBadge = (status) => {
  switch (status) {
    case 'HEALTHY': return 'badge-green'
    case 'LOW_STOCK': return 'badge-orange'
    case 'OUT_OF_STOCK': return 'badge-red'
    default: return 'badge-blue'
  }
}

export const truncate = (str, len = 30) =>
  str && str.length > len ? str.slice(0, len) + '…' : str
