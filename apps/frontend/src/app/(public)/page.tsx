"use client";
import { Hero } from "@/components/landing/landing-header";
import Header from "@/components/ui/layout/Header";
import { Features } from "@/components/landing/landing-feature";
import { HowItWorks } from "@/components/landing/how-it-work";
import { Stations } from "@/components/landing/landing-station";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/landing-footer";
// import Header from "@/components/ui/layout/Header";
export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <Stations />
      <CTA />
      <Footer />
    </div>
  );
}
