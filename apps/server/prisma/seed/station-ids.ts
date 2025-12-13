// Map Station Name -> Fixed UUIDv7 derived from seed-bikes.ts
// This ensures that when we seed bikes (which use a fixed map), the stations exist with these exact IDs.

export const STATION_IDS: Record<string, string> = {
  "Ga An Phú": "019b167a-3b6e-7f4b-bf73-211744979185",
  "Ga Phước Long": "019b167a-3b6b-768b-a37e-275860a058bf",
  "Ga Thủ Đức": "019b167a-3b6d-7d11-907e-8cc5f92237e9",
  "Ga Bến xe Suối Tiên": "019b167a-3b6e-7ae1-927d-bbb110d83f08",
  "Ga Bến Thành": "019b167a-3b6f-7a43-90a0-58bbd459a125",
  "Ga Ba Son": "019b167a-3b73-71b1-af45-bae168e64bed",
  "Ga Bình Thái": "019b167a-3b74-7915-8b3e-274ccc3a226e",
  "Ga Khu Công nghệ cao": "019b167a-3b75-7b20-a4c3-5dd979d19528",
  "Ga Tân Cảng": "019b167a-3b77-7399-b85c-ba5903840020",
  "Ga Rạch Chiếc": "019b167a-3b78-7598-88b3-3842c1fa491f",
  "Ga Đại học Quốc gia": "019b167a-3b79-77f1-b0d7-334394c5cd07",
  "Ga Nhà hát Thành phố": "019b167a-3b7b-7fcc-9a8e-1331c44e37a6",
  "Ga Công viên Văn Thánh": "019b167a-3b7c-7933-9c4d-9637d540c092",
  "Ga Thảo Điền": "019b167a-3b7d-7000-0000-000000000000", // Manually added for Thảo Điền as it was missing from the bike seed map comment
};
