"use client";

import { Logo as MetroLogo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/layout/Header";
import { Footer } from "@/components/landing/landing-footer";
export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>{children}</main>
      <Footer/>
    </div>
  );
}
