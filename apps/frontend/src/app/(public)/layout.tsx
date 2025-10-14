"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo as MetroLogo } from "@/components/logo";
import {

  MapPin,
  Clock,
  Leaf,
  Smartphone,

  CheckCircle,

} from "lucide-react";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/layout/Header";
export default function About() {
  const router = useRouter();

  const features = [
    {
      icon: MapPin,
      title: "Tiện lợi cạnh trạm Metro",
      description:
        "Dịch vụ của chúng tôi giúp bạn di chuyển nhanh chóng và dễ dàng hơn sau khi rời ga tàu điện ngầm.",
    },
    {
      icon: Smartphone,
      title: "Ứng dụng thông minh",
      description: "Tìm kiếm và thuê xe đạp chỉ với vài thao tác đơn giản",
    },
    {
      icon: Clock,
      title: "24/7 Hoạt động",
      description: "Dịch vụ hoạt động liên tục để phục vụ mọi hành trình",
    },
    {
      icon: Leaf,
      title: "Thân thiện môi trường",
      description: "Giảm thiểu khí thải và bảo vệ môi trường đô thị",
    },
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Tìm kiếm trạm",
      description: "Sử dụng bản đồ để tìm trạm xe đạp gần nhất",
    },
    {
      step: "2",
      title: "Quét mã QR",
      description: "Quét mã QR trên xe đạp để mở khóa",
    },
    {
      step: "3",
      title: "Bắt đầu hành trình",
      description: "Đạp xe đến điểm đến một cách an toàn",
    },
    {
      step: "4",
      title: "Trả xe",
      description: "Gửi xe tại bất kỳ trạm MetroBike nào",
    },
  ];

  const pricing = [
    {
      plan: "Cơ bản",
      price: "10,000đ",
      duration: "30 phút đầu",
      features: ["Thuê theo giờ", "Truy cập tất cả trạm", "Hỗ trợ 24/7"],
    },
    {
      plan: "Ngày",
      price: "50,000đ",
      duration: "cả ngày",
      features: ["Sử dụng không giới hạn", "Ưu tiên đặt xe", "Bảo hiểm cơ bản"],
    },
    {
      plan: "Tháng",
      price: "300,000đ",
      duration: "30 ngày",
      features: ["Giá ưu đãi nhất", "Xe đạp cao cấp", "Hỗ trợ ưu tiên"],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <section className=" bg-[linear-gradient(135deg,_#2563eb,_#60a5fa)] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Giải pháp di chuyển <br />
            <span className="text-[hsl(38_95%_49%)]">thông minh</span>
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            MetroBike kết nối hoàn hảo hệ thống tàu điện ngầm với dịch vụ chia
            sẻ xe đạp, giúp bạn hoàn thành hành trình cuối cùng một cách dễ dàng
            và thân thiện với môi trường.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-[hsl(38_95%_49%)] text-black hover:bg-metro-yellow-light cursor-pointer"
              onClick={() => router.push("/customer")}
            >
              Thuê xe ngay
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-black hover:bg-white hover:text-foreground cursor-pointer"
            >
              Xem thêm thông tin
            </Button>
          </div>
        </div>
      </section>

     
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Tính năng nổi bật
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-gradient-card shadow-card border-0"
              >
                <CardContent className="p-6 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="rounded-full bg-gradient-metro p-3 bg-[linear-gradient(135deg,_#2563eb,_#60a5fa)]">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 ">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Cách sử dụng</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((step, index) => (
              <div key={index} className="text-center">
                <div className="mb-4 flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-[linear-gradient(135deg,_#2563eb,_#60a5fa)] text-white flex items-center justify-center text-xl font-bold">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Bảng giá dịch vụ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {pricing.map((plan, index) => (
              <Card
                key={index}
                className={`bg-gradient-card shadow-card border-0 ${
                  index === 1 ? "ring-2 ring-[hsl(210,100%,50%)] scale-105" : ""
                }`}
              >
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.plan}</CardTitle>
                  <div className="text-3xl font-bold text-primary">
                    {plan.price}
                    <span className="text-sm text-muted-foreground">
                      /{plan.duration}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  <Button
                    className="w-full mt-4 bg-gradient-metro bg-[linear-gradient(135deg,_#2563eb,_#60a5fa)] cursor-pointer"
                    onClick={() => router.push("/customer")}
                  >
                    Chọn gói này
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Những con số biết nói
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2 text-[hsl(210_100%_50%)]">
                50+
              </div>
              <p className="text-muted-foreground">Trạm xe đạp</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2 text-[hsl(210_100%_50%)]">
                2,847
              </div>
              <p className="text-muted-foreground">Người dùng hoạt động</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2 text-[hsl(210_100%_50%)]">
                8,924
              </div>
              <p className="text-muted-foreground">Chuyến đi hoàn thành</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2 text-[hsl(210_100%_50%)]">
                98%
              </div>
              <p className="text-muted-foreground">Tỷ lệ hài lòng</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-hero text-white  bg-[linear-gradient(135deg,_#2563eb,_#60a5fa)]">
        <div className="container mx-auto px-4 text-center ">
          <h2 className="text-3xl font-bold mb-6">
            Sẵn sàng trải nghiệm MetroBike?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Tham gia cộng đồng MetroBike và trải nghiệm cách di chuyển thông
            minh nhất thành phố
          </p>
          <Button
            size="lg"
            className="bg-[hsl(38_95%_49%)] text-black hover:bg-metro-yellow-light cursor-pointer"
            onClick={() => router.push("/customer")}
          >
            Bắt đầu ngay
          </Button>
        </div>
      </section>

      <footer className="border-t bg-gradient-card py-8">
        <div className="container mx-auto px-4 text-center">
          <MetroLogo />
          <p className="text-muted-foreground mt-4">
            © 2025 MetroBike. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </footer>
    </div>
  );
}
