export function formatCurrency(amount: number | string): string {
  // Chuyển đổi sang số phòng trường hợp đầu vào là string
  const numericAmount = Number(amount);

  // Kiểm tra nếu không phải là số hợp lệ
  if (isNaN(numericAmount)) return "0 đ";

  // Sử dụng toLocaleString với locale 'vi-VN' để tự động thêm dấu chấm
  return `${numericAmount.toLocaleString("vi-VN")} ₫`;
}