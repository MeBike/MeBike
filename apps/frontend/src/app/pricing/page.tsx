
import Header from "@/components/ui/layout/Header";
import { Footer as LandingFooter } from "@/components/landing/landing-footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const pricingPlans = [
  {
    name: "Gói Cơ bản",
    price: "119.000",
    unit: "VNĐ/30 ngày",
    description: "30 lượt thuê trong 30 ngày",
    features: [
      "30 lượt thuê xe",
      "Thời hạn 30 ngày",
      "Ưu tiên hỗ trợ cơ bản",
      "Bảo hiểm cơ bản",
      "Tiết kiệm 60% so với thuê lẻ",
    ],
    popular: false,
  },
  {
    name: "Gói Premium",
    price: "199.000",
    unit: "VNĐ/30 ngày",
    description: "60 lượt thuê trong 30 ngày",
    features: [
      "60 lượt thuê xe",
      "Thời hạn 30 ngày",
      "Ưu tiên hỗ trợ cao",
      "Bảo hiểm toàn diện",
      "Tiết kiệm 70% so với thuê lẻ",
    ],
    popular: true,
  },
  {
    name: "Gói Unlimited",
    price: "299.000",
    unit: "VNĐ/30 ngày",
    description: "Thuê không giới hạn trong 30 ngày",
    features: [
      "Thuê không giới hạn",
      "Thời hạn 30 ngày",
      "Hỗ trợ VIP 24/7",
      "Bảo hiểm toàn diện cao cấp",
      "Ưu tiên đặt xe cao nhất",
    ],
    popular: false,
  },
];

const additionalServices = [
  { name: "Thuê theo lượt (Ví)", price: "2.000 VNĐ/30 phút" },
  { name: "Phí phạt quá 24 giờ", price: "50.000 VNĐ/lần" },
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
                3 gói subscription với số lượt thuê khác nhau trong 30 ngày
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
                Tùy chọn thanh toán khác
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
                    Gói subscription hoạt động như thế nào?
                  </h3>
                  <p className="text-muted-foreground">
                    Gói subscription cho phép bạn thuê xe với số lượt giới hạn
                    trong thời gian 30 ngày. Ví dụ: Gói Cơ bản (119.000 VNĐ) cho
                    30 lượt thuê, Gói Premium (199.000 VNĐ) cho 60 lượt thuê. 1 
                    lượt thuê được quy ước theo 10 giờ.
                  </p>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">
                    Thuê theo lượt (Ví) là gì?
                  </h3>
                  <p className="text-muted-foreground">
                    Nếu không có gói subscription, bạn có thể thuê xe theo lượt
                    với giá 2.000 VNĐ mỗi 30 phút. Thời gian được làm tròn lên
                    đơn vị 30 phút gần nhất.
                  </p>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">
                    Có thể trả xe ở trạm khác không?
                  </h3>
                  <p className="text-muted-foreground">
                    Không, bạn không thể trả xe tại trạm nào khác trạm ban đầu.
                  </p>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold text-foreground mb-2">
                    Phí phạt khi trả muộn?
                  </h3>
                  <p className="text-muted-foreground">
                    Nếu thời gian thuê xe vượt quá 24 giờ, bạn sẽ bị tính thêm
                    phí phạt 50.000 VNĐ. Hãy trả xe đúng hạn để tránh phát sinh
                    chi phí không đáng có.
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
