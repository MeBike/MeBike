import { Card } from "@/components/ui/card";
import { MapPin, Clock, Wallet, Shield } from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "Trạm xe tại mọi ga Metro",
    description:
      "Xe đạp có sẵn tại tất cả các trạm metro chính ở TP.HCM, sẵn sàng phục vụ bạn ngay khi xuống tàu.",
  },
  {
    icon: Clock,
    title: "Thuê xe nhanh chóng",
    description:
      "Đăng kí tài khoản, đặt xe đang sẵn sàng được thuê và bắt đầu hành trình chỉ trong 2 phút. Không cần thủ tục phức tạp.",
  },
  {
    icon: Wallet,
    title: "Giá cả phải chăng",
    description:
      "Chỉ từ 2.000đ/30 phút. Nhiều gói cước linh hoạt phù hợp với nhu cầu di chuyển hàng ngày của bạn.",
  },
  {
    icon: Shield,
    title: "An toàn & Bảo hiểm",
    description:
      "Xe được bảo trì định kỳ. Hỗ trợ bạn trong phiên thuê xe khi bạn cần.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
            Tại sao chọn MeBike?
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">
            Giải pháp di chuyển thông minh, tiết kiệm và thân thiện với môi
            trường
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
