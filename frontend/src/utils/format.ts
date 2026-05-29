// File: frontend/src/utils/format.ts
// Nhiệm vụ: Các hàm tiện ích định dạng dữ liệu (tiền tệ, số, ngày tháng) hiển thị trên giao diện người dùng.

/**
 * Định dạng số thành tiền tệ Việt Nam Đồng (VND).
 * Ví dụ: 1250000 -> "1.250.000 đ"
 */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value) + ' đ'
}

/**
 * Định dạng số theo chuẩn phân cách hàng nghìn của Việt Nam.
 * Ví dụ: 100000 -> "100.000"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value)
}

/**
 * Định dạng chuỗi ngày giờ từ Backend gửi về thành chuỗi ngày giờ Việt Nam trực quan.
 * Ví dụ: "2026-05-29T10:13:35" -> "29/05/2026, 10:13"
 */
export function formatDateTime(dateStr: string): string {
  if (!dateStr) return ''
  // Nếu chuỗi ngày không có chỉ định múi giờ, đính kèm thêm 'Z' để chuyển thành giờ UTC
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

