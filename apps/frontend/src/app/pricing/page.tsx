
import Header from "@/components/ui/layout/Header";
import { Footer as LandingFooter } from "@/components/landing/landing-footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const pricingPlans = [
  {
    name: "Thuê theo giờ",
    price: "10.000",
    unit: "VNĐ/giờ",
    description: "Phù hợp cho chuyến đi ngắn",
    features: [
      "Thuê tối thiểu 1 giờ",
      "Trả xe tại bất kỳ trạm nào",
      "Không cần đăng ký trước",
      "Thanh toán qua app",
      "Bảo hiểm cơ bản",
    ],
    popular: false,
  },
  {
    name: "Gói ngày",
    price: "50.000",
    unit: "VNĐ/ngày",
    description: "Tiết kiệm cho cả ngày khám phá",
    features: [
      "Thuê không giới hạn trong ngày",
      "Trả xe tại bất kỳ trạm nào",
      "Ưu tiên hỗ trợ",
      "Thanh toán qua app",
      "Bảo hiểm toàn diện",
      "Giảm 50% so với thuê theo giờ",
    ],
    popular: true,
  },
  {
    name: "Gói tháng",
    price: "500.000",
    unit: "VNĐ/tháng",
    description: "Tốt nhất cho người đi làm hàng ngày",
    features: [
      "Thuê không giới hạn cả tháng",
      "Trả xe tại bất kỳ trạm nào",
      "Hỗ trợ ưu tiên 24/7",
      "Thanh toán qua app",
      "Bảo hiểm toàn diện",
      "Tích điểm thưởng",
      "Giảm 67% so với thuê theo ngày",
    ],
    popular: false,
  },
];

const additionalServices = [
  { name: "Mũ bảo hiểm", price: "5.000 VNĐ/lần" },
  { name: "Khóa xe bổ sung", price: "10.000 VNĐ/lần" },
  { name: "Giỏ xe", price: "5.000 VNĐ/lần" },
  { name: "Bảo hiểm mở rộng", price: "20.000 VNĐ/ngày" },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24">
        <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance">
                Bảng giá dịch vụ
              </h1>
              <p className="text-xl text-muted-foreground text-pretty">
                Chọn gói phù hợp với nhu cầu di chuyển của bạn
              </p>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {pricingPlans.map((plan, index) => (
                <Card
                  key={index}
                  className={`p-8 relative ${plan.popular ? "border-primary border-2 shadow-xl" : ""}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                        Phổ biến nhất
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {plan.description}
                    </p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-foreground">
                        {plan.price}
                      </span>
                      <span className="text-muted-foreground">{plan.unit}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    Chọn gói này
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                Dịch vụ bổ sung
              </h2>
              <Card className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {additionalServices.map((service, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <span className="font-medium text-foreground">
                        {service.name}
                      </span>
                      <span className="text-primary font-semibold">
                        {service.price}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                Câu hỏi thường gặp
              </h2>
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">
                    Làm sao để thanh toán?
                  </h3>
                  <p className="text-muted-foreground">
                    Bạn có thể thanh toán qua app MeBike bằng thẻ tín dụng,
                    ví điện tử (MoMo, ZaloPay) hoặc chuyển khoản ngân hàng.
                  </p>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">
                    Có thể trả xe ở trạm khác không?
                  </h3>
                  <p className="text-muted-foreground">
                    Có, bạn có thể trả xe tại bất kỳ trạm MeBike nào trên hệ
                    thống. Không cần trả về trạm ban đầu.
                  </p>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">
                    Nếu xe bị hỏng trong lúc thuê thì sao?
                  </h3>
                  <p className="text-muted-foreground">
                    Hãy liên hệ ngay với bộ phận hỗ trợ qua app. Chúng tôi sẽ hỗ
                    trợ bạn đổi xe hoặc sửa chữa miễn phí nếu không phải lỗi của
                    bạn.
                  </p>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">
                    Có thể hủy gói đã mua không?
                  </h3>
                  <p className="text-muted-foreground">
                    Gói ngày và gói tháng có thể được hoàn tiền trong vòng 24
                    giờ đầu tiên nếu chưa sử dụng. Vui lòng liên hệ bộ phận chăm
                    sóc khách hàng.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
