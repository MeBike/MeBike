import { Card } from "@/components/ui/card";
import Image from "next/image";
const steps = [
  {
    number: "01",
    title: "Tải ứng dụng MeBike",
    description:
      "Tải app miễn phí trên App Store hoặc Google Play. Đăng ký tài khoản chỉ trong 2 phút.",
    image: "/smartphone-app-download-screen-with-bike-rental-in.jpg",
  },
  {
    number: "02",
    title: "Tìm trạm xe gần nhất",
    description:
      "Sử dụng bản đồ trong app để tìm trạm xe gần ga metro bạn đang ở. Xem số lượng xe còn trống.",
    image: "/map-showing-metro-stations-with-bike-rental-locati.jpg",
  },
  {
    number: "03",
    title: "Quét QR và bắt đầu",
    description:
      "Quét mã QR trên xe, mở khóa tự động. Bắt đầu hành trình khám phá thành phố của bạn.",
    image: "/person-scanning-qr-code-on-bicycle-with-smartphone.jpg",
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
            Chỉ 3 bước đơn giản để bắt đầu hành trình của bạn
          </p>
        </div>

        <div className="space-y-24">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex flex-col ${index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-12`}
            >
              <div className="flex-1">
                <Card className="overflow-hidden">
                  <Image
                    src={step.image || "/placeholder.svg"}
                    alt={step.title}
                    className="w-full h-[400px] object-cover"
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
