export const SUGGESTED_PROMPTS = [
  { icon: "bike" as const, text: "Tôi đang có chuyến thuê nào không?" },
  { icon: "calendar" as const, text: "Cho tôi xem đặt chỗ mới nhất." },
  { icon: "wallet" as const, text: "Ví của tôi hôm nay thế nào?" },
] as const;

export const INTRO_MARKDOWN = `Chào bạn! Mình là **Trợ lý MeBike**.

Mình có thể hỗ trợ các câu hỏi liên quan đến:

- tình trạng thuê xe hiện tại
- chi tiết đặt chỗ
- thông tin ví và giao dịch gần đây

Bạn cần giúp gì hôm nay?`;
