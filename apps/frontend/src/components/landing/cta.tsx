import { Button } from "@/components/ui/button";
import { Smartphone } from "lucide-react";

export function CTA() {
  return (
    <section className="py-24 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-balance">
            Sẵn sàng khám phá Sài Gòn?
          </h2>
          <p className="text-xl text-primary-foreground/90 text-pretty leading-relaxed">
            Tải ứng dụng MeBike ngay hôm nay. Trải nghiệm cách di chuyển thông minh nhất ở TP.HCM.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 h-14 gap-2"
            >
              <Smartphone className="w-5 h-5" />
              Tải trên App Store
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 h-14 gap-2"
            >
              <Smartphone className="w-5 h-5" />
              Tải trên Google Play
            </Button>
          </div>
          <p className="text-sm text-primary-foreground/70">
            Miễn phí tải về. Có sẵn trên iOS và Android.
          </p>
        </div>
      </div>
    </section>
  );
}
