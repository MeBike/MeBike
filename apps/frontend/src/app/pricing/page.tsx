
import Header from "@/components/ui/layout/Header";
import { Footer as LandingFooter } from "@/components/landing/landing-footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const pricingPlans = [
  {
    name: "Cơ bản",
    price: "119.000",
    unit: "VNĐ/30 ngày",
    description: "30 lượt thuê trong 30 ngày",
    features: [
      "30 lượt thuê xe",
      "Thời hạn 30 ngày",
    ],
    popular: false,
  },
  {
    name: "Cao cấp",
    price: "199.000",
    unit: "VNĐ/30 ngày",
    description: "60 lượt thuê trong 30 ngày",
    features: [
      "60 lượt thuê xe",
      "Thời hạn 30 ngày",
    ],
    popular: true,
  },
  {
    name: "Đặc biệt",
    price: "299.000",
    unit: "VNĐ/30 ngày",
    description: "90 lượt thuê trong 30 ngày",
    features: [
      "90 lượt thuê",
      "Thời hạn 30 ngày",
    ],
    popular: false,
  },
];

const additionalServices = [
  { name: "Thuê theo lượt (Ví)", price: "2.000 đ/30 phút" },
  { name: "Phí phạt quá 24 giờ", price: "500.000 đ/lần" },
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
                3 gói tháng với số lượt thuê khác nhau trong 30 ngày
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
      </main>
    </div>
  );
}
