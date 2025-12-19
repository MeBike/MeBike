export const formatDateVN = (dateString: string | Date): string => {
  const date = new Date(dateString);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};
export const formatDateOnlyVN = (dateString: string | Date): string => {
  if (!dateString) return "N/A";

  // Nếu là đối tượng Date
  if (dateString instanceof Date) {
    const day = String(dateString.getDate()).padStart(2, "0");
    const month = String(dateString.getMonth() + 1).padStart(2, "0");
    const year = dateString.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Nếu là String (Ví dụ: "17/12/2025 05:44:14...")
  try {
    // 1. Lấy 10 ký tự đầu tiên (DD/MM/YYYY)
    const datePart = dateString.substring(0, 10);

    // 2. Kiểm tra xem có đúng định dạng không bằng Regex
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(datePart)) {
      return datePart; // Trả về luôn 17/12/2025
    }

    // 3. Nếu chuỗi string kiểu khác (ISO), dùng logic cũ nhưng thêm kiểm tra
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Ngày không hợp lệ";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    return "Lỗi định dạng";
  }
};