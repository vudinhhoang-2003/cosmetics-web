export function formatPrice(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value) + ' đ'
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value)
}
