import { fakerVI as faker } from "@faker-js/faker";

const DEMO_FAKER_SEED = 20260404;

function withDemoSeed<T>(offset: number, build: (fakerInstance: typeof faker) => T): T {
  faker.seed(DEMO_FAKER_SEED + offset);
  return build(faker);
}

export function buildDemoTechnicianFullName(index: number): string {
  return withDemoSeed(1_000 + index, fakerInstance => fakerInstance.person.fullName());
}

export function buildDemoCustomerFullName(index: number): string {
  return withDemoSeed(2_000 + index, fakerInstance => fakerInstance.person.fullName());
}

export function buildDemoRatingComment(index: number): string | null {
  if (index % 2 !== 0) {
    return null;
  }

  return withDemoSeed(3_000 + index, (fakerInstance) => {
    const opening = fakerInstance.helpers.arrayElement([
      "Trải nghiệm tổng thể khá ổn",
      "Chuyến đi hôm nay tương đối mượt",
      "Nhìn chung lần thuê này khá hài lòng",
      "Trải nghiệm sử dụng hôm nay ổn áp",
    ]);
    const bikeNote = fakerInstance.helpers.arrayElement([
      "xe chạy êm và dễ kiểm soát",
      "xe ổn nhưng phanh cần nhạy hơn một chút",
      "xe vận hành tốt và không có lỗi lớn",
      "xe dùng được, pin vẫn đủ cho quãng ngắn",
    ]);
    const stationNote = fakerInstance.helpers.arrayElement([
      "trạm trả xe cũng dễ tìm",
      "khu vực trạm khá gọn gàng",
      "thao tác tại trạm diễn ra nhanh",
      "việc nhận và trả xe ở trạm khá thuận tiện",
    ]);

    return `${opening}, ${bikeNote}; ${stationNote}.`;
  });
}
