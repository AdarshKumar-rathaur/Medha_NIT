/**
 * Format numeric value as Indian Rupee (INR)
 * Example: 135 -> "₹135", 127.5 -> "₹127.50"
 */
export function formatINR(amount: number, showDecimals: boolean = false): string {
  if (isNaN(amount)) return '₹0'
  const isWhole = Math.round(amount) === amount
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: showDecimals || !isWhole ? 2 : 0,
    minimumFractionDigits: showDecimals && !isWhole ? 2 : 0,
  }
  return new Intl.NumberFormat('en-IN', options).format(amount)
}

/**
 * Format probability or percentage
 * Example: 0.6838 -> "68.4%" or 15 -> "15%"
 */
export function formatPercent(value: number, isDecimal: boolean = false, decimals: number = 1): string {
  if (isNaN(value)) return '0%'
  const val = isDecimal ? value * 100 : value
  return `${val.toFixed(decimals)}%`
}

/**
 * Format distance in meters or kilometers
 * Example: 140 -> "140m", 1250 -> "1.3 km"
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)} km`
}

/**
 * Format walking duration
 * Example: 2.3 -> "2 min walk"
 */
export function formatWalkTime(minutes: number): string {
  const rounded = Math.max(1, Math.round(minutes))
  return `${rounded} min walk`
}

/**
 * Format date time string
 */
export function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString)
    return d.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return isoString
  }
}
