export function formatPrice(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value) + ' đ'
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value)
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return ''
  // If the date string doesn't specify timezone, append 'Z' to treat it as UTC
  let parsedDateStr = dateStr
  if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
    parsedDateStr = dateStr + 'Z'
  }
  return new Date(parsedDateStr).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
