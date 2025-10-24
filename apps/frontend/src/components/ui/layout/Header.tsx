"use client";
import React, { useTransition } from "react";
import { Button } from "../button";
import { Logo as MetroLogo } from "@/components/logo";
import { useRouter } from "next/navigation";
import NProgress from "nprogress";
import "nprogress/nprogress.css"; // Đảm bảo import CSS (nên import ở file layout nếu chưa)
// nếu TypeScript báo lỗi, bạn đã có file khai báo d.ts rồi !

const Header = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Tạo hàm điều hướng có loading bar
  const navWithLoading = (href: string) => {
    NProgress.start();
    startTransition(() => {
      router.push(href);
      setTimeout(() => NProgress.done(), 600); // có thể tinh chỉnh thời gian cho cảm giác mượt
    });
  };

  return (
    <header
      className="p-4"
      style={{ opacity: isPending ? 0.7 : 1, transition: "opacity .2s" }}
    >
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <MetroLogo />
        </div>
        <div className="flex items-center gap-4">
          <div>
            <Button
              variant="ghost"
              className="text_header cursor-pointer hover:bg-primary"
              onClick={() => navWithLoading("/guide")}
              disabled={isPending}
            >
              Hướng dẫn sử dụng
            </Button>
          </div>
          <div>
            <Button
              variant="ghost"
              className="text_header cursor-pointer hover:bg-primary"
              onClick={() => navWithLoading("/station")}
              disabled={isPending}
            >
              Trạm xe
            </Button>
          </div>
          <div>
            <Button
              variant="ghost"
              className="text_header cursor-pointer hover:bg-primary"
              onClick={() => navWithLoading("/pricing")}
              disabled={isPending}
            >
              Bảng giá
            </Button>
          </div>
          <div>
            <Button
              variant="ghost"
              onClick={() => navWithLoading("/contact")}
              className="text_header cursor-pointer hover:bg-primary"
              disabled={isPending}
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
              onClick={() => navWithLoading("/auth/login")}
              disabled={isPending}
            >
              Đăng nhập
            </Button>
          </div>
          <div>
            <Button
              onClick={() => navWithLoading("/auth/register")}
              className="bg-[linear-gradient(135deg,_#2563eb,_#60a5fa)] text-white hover:scale-105 hover:shadow-[var(--shadow-metro)]
              cursor-pointer"
              disabled={isPending}
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
