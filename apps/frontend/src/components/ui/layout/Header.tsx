"use client";
import React from "react";
import { ArrowLeft } from "lucide-react";
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
              className="text_header cursor-pointer"
              onClick={() => router.push("/guide")}
            >
              Hướng dẫn sử dụng
            </Button>
          </div>
          <div>
            <Button
              variant="ghost"
              className="text_header cursor-pointer"
              onClick={() => router.push("/station")}
            >
              Danh sách trạm
            </Button>
          </div>
          <div>
            <Button
              variant="ghost"
              className="text_header cursor-pointer"
              onClick={() => router.push("/pricing")}
            >
              Bảng giá
            </Button>
          </div>
          <div>
            <Button variant="ghost" className="text_header cursor-pointer">
              Dịch vụ
            </Button>
          </div>
          <div>
            <Button
              variant="ghost"
              className="text_header cursor-pointer"
              onClick={() => router.push("/auth/login")}
            >
              Đăng nhập
            </Button>
            |
            <Button
              variant="ghost"
              className="text_header cursor-pointer"
              onClick={() => router.push("/auth/register")}
            >
              Đăng ký
            </Button>
          </div>
        </div>
        <div>
          <Button
            onClick={() => router.push("/")}
            className="bg-[linear-gradient(135deg,_#2563eb,_#60a5fa)] text-white hover:scale-105 hover:shadow-[var(--shadow-metro)]
            cursor-pointer"
          >
            Bắt đầu sử dụng
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
