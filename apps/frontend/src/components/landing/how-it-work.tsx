import { Card } from "@/components/ui/card";
import Image from "next/image";
const steps = [
  {
    number: "01",
    title: "Ứng dụng MeBike",
    description:
      "Khám phá ứng dụng MeBike - giải pháp di chuyển xanh, tiện lợi và thân thiện với môi trường.",
    image: "/01.ung-dung-mebike.png",
  },
  {
    number: "02",
    title: "Đăng ký/Đăng nhập tài khoản",
    description:
      "Tạo tài khoản hoặc đăng nhập để bắt đầu trải nghiệm dịch vụ thuê xe đạp thông minh.",
    image: "/02.dang-ki-dang-nhap-tai-khoan.png",
  },
  {
    number: "03",
    title: "Tìm trạm gần nhất",
    description:
      "Sử dụng bản đồ tích hợp để tìm trạm xe đạp gần vị trí của bạn nhất.",
    image: "/03.tim-tram-gan-nhat.png",
  },
  {
    number: "04",
    title: "Đặt xe và bắt đầu",
    description:
      "Chọn xe yêu thích, đặt trước và bắt đầu hành trình khám phá thành phố xanh.",
    image: "/04.dat-xe-va-bat-dau.png",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
            Cách hoạt động
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">
            Chỉ 4 bước đơn giản để bắt đầu hành trình của bạn
          </p>
        </div>

        <div className="space-y-24">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex flex-col ${index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-12`}
            >
              <div className="flex-1">
                <Card className="flex items-center justify-center min-h-[400px]">
                  <Image
                    src={step.image || "/placeholder.svg"}
                    alt={step.title}
                    className="w-full h-auto object-contain max-h-[600px]"
                    width={640}
                    height={400}
                  />
                </Card>
              </div>
              <div className="flex-1 space-y-4">
                <div className="text-6xl font-bold text-primary/20">
                  {step.number}
                </div>
                <h3 className="text-3xl font-bold text-foreground">
                  {step.title}
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
