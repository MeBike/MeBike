import Stepper from "@/components/ui/Stepper";
import React from "react";

const page = () => {
  return (
    <div className="w-full">
      <div
        className="relative w-full h-96 bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage: "url('/5228.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative z-10 text-center text-white p-4">
          <h1 className="text-4xl md:text-6xl font-bold drop-shadow-lg">
            Hướng dẫn sử dụng MeBike
          </h1>
          <p className="mt-4 text-lg md:text-xl drop-shadow-md">
            Và đây là dòng mô tả phụ, giải thích thêm.
          </p>
          <button className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors">
            Tìm hiểu thêm
          </button>
        </div>
      </div>
      <div className="container px-4 mx-auto my-12 text-center">
        <h1 className="text-xl md:text-4xl drop-shadow-lg">
          Hướng dẫn sử dụng MeBike
        </h1>
      </div>
      <div className="container px-4 mx-auto my-12">
        <p className="mt-4 text-lg md:text-xl drop-shadow-md">
          Sau khi đăng ký {""}
          <span className="text-blue-500 font-bold">đăng ký tài khoản</span> và
          bắt đầu sử dụng dịch vụ
        </p>
      </div>
      <div className="container px-4 mx-auto my-12">
        <Stepper />
      </div>
    </div>
  );
};

export default page;
