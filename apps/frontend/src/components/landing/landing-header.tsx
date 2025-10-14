import { Button } from "@/components/ui/button";
import { ArrowRight, Smartphone } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative h-[80vh] flex items-center justify-center overflow-hidden pt-10">
      <div className="absolute inset-0 z-0">
        <img
          src="/ho-chi-minh-city-metro-station-with-bicycles--mode.jpg"
          alt="Metro station with bikes"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground text-balance leading-tight">
            Kết nối Metro với Xe đạp
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground text-pretty leading-relaxed">
            Giải pháp di chuyển hoàn hảo từ trung tâm ra ngoại ô TP.HCM. Xuống
            metro, thuê xe đạp, khám phá thành phố.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="text-base px-6 h-12 gap-2">
              <Smartphone className="w-4 h-4" />
              Tải ứng dụng
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-6 h-12 bg-transparent"
              asChild
            >
              <Link href="#how-it-works">Tìm hiểu thêm</Link>
            </Button>
          </div>
          <div className="flex items-center justify-center gap-8 pt-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">15+</div>
              <div className="text-sm text-muted-foreground">Trạm Metro</div>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">Xe đạp</div>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">10K+</div>
              <div className="text-sm text-muted-foreground">Người dùng</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
