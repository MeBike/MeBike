"use client";
import React from "react";
import { Button } from "../button";
import { Logo as MetroLogo } from "@/components/logo";
import { useRouter } from "next/navigation";

const Header = () => {
  const router = useRouter();
  return (
    <header className="p-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <MetroLogo />
        </div>
        <div className="flex items-center gap-4">
          <div>
            <Button
              variant="ghost"
              className="text_header cursor-pointer hover:bg-primary"
              onClick={() => router.push("/guide")}
            >
              Hướng dẫn sử dụng
            </Button>
          </div>
          <div>
            <Button
              variant="ghost"
              className="text_header cursor-pointer hover:bg-primary"
              onClick={() => router.push("/station")}
            >
              Trạm xe
            </Button>
          </div>
          <div>
            <Button
              variant="ghost"
              className="text_header cursor-pointer hover:bg-primary"
              onClick={() => router.push("/pricing")}
            >
              Bảng giá
            </Button>
          </div>
          <div>
            <Button
              variant="ghost"
              onClick={() => router.push("/contact")}
              className="text_header cursor-pointer hover:bg-primary"
            >
              Liên hệ
            </Button>
          </div>
        </div>
        <div className="flex gap-3">
          <div>
            <Button
              variant="ghost"
              className="text_header cursor-pointer hover:bg-primary"
              onClick={() => router.push("/auth/login")}
            >
              Đăng nhập
            </Button>
          </div>
          <div>
            <Button
              onClick={() => router.push("/auth/register")}
              className="bg-[linear-gradient(135deg,_#2563eb,_#60a5fa)] text-white hover:scale-105 hover:shadow-[var(--shadow-metro)]
            cursor-pointer"
            >
              Đăng ký
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
