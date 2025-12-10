"use client";

import { Logo as MetroLogo } from "@/components/logo";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/layout/Header";
export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>{children}</main>
      <section className="py-16 bg-gradient-hero text-white  bg-[linear-gradient(135deg,_#2563eb,_#60a5fa)]">
        <div className="container mx-auto px-4 text-center ">
          <h2 className="text-3xl font-bold mb-6">
            Sẵn sàng trải nghiệm MeBike?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Tham gia cộng đồng MeBike và trải nghiệm cách di chuyển thông
            minh nhất thành phố
          </p>
        </div>
      </section>
      <footer className=" bg-gradient-card py-8">
        <div className="container mx-auto px-4 text-center">
          <MetroLogo />
          <p className="text-muted-foreground mt-4">
            ©
            {" "}
            {new Date().getFullYear()}
            {" "} MeBike. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </footer>
    </div>
  );
}
