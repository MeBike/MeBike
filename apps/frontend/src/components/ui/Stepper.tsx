"use client"; 

import React, { useState } from "react";
import Image from "next/image";
const stepsData = [
  {
    id: 1,
    title: "Ứng dụng MeBike",
    description:
      "Khám phá ứng dụng MeBike - giải pháp di chuyển xanh, tiện lợi và thân thiện với môi trường.",
    image: "/01.ung-dung-mebike.jpg",
    icon: "📱",
  },
  {
    id: 2,
    title: "Đăng ký/Đăng nhập tài khoản",
    description:
      "Tạo tài khoản hoặc đăng nhập để bắt đầu trải nghiệm dịch vụ thuê xe đạp thông minh.",
    image: "/02.dang-nhap-mebike.jpg",
    icon: "👤",
  },
  {
    id: 3,
    title: "Tìm trạm gần nhất",
    description:
      "Sử dụng bản đồ tích hợp để tìm trạm xe đạp gần vị trí của bạn nhất.",
    image: "/03.tim-tram-gan-nhat.jpg",
    icon: "📍",
  },
  {
    id: 4,
    title: "Đặt xe và bắt đầu",
    description:
      "Chọn xe yêu thích, đặt trước và bắt đầu hành trình khám phá thành phố xanh.",
    image: "/04.dat-xe.jpg",
    icon: "🚴",
  },
  {
    id: 5,
    title: "Đưa QR cho staff để kết thúc phiên thuê",
    description:
      "Khi hoàn thành chuyến đi, đưa mã QR cho nhân viên để kết thúc phiên thuê xe.",
    image: "/05.qr.jpg",
    icon: "✅",
  },
];

const Stepper = () => {
  const [activeStep, setActiveStep] = useState(1);
  const handleStepClick = (stepId: number) => {
    setActiveStep(stepId);
  };
  return (
    <div className="w-full max-w-6xl mx-auto p-8">
      {/* Stepper Navigation */}
      <div className="flex items-center justify-center mb-12">
        {stepsData.map((step, index) => (
          <React.Fragment key={step.id}>
            <div
              className="flex flex-col items-center cursor-pointer group"
              onClick={() => handleStepClick(step.id)}
            >
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold transition-all duration-300 transform group-hover:scale-110
                  ${
                    activeStep === step.id
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-gray-200 text-gray-500 group-hover:bg-gray-300"
                  }
                `}
              >
                {step.icon}
              </div>
              <p
                className={`mt-3 text-sm font-semibold transition-colors duration-300
                ${activeStep === step.id ? "text-blue-600" : "text-gray-500"}
              `}
              >
                {step.title}
              </p>
            </div>

            {index < stepsData.length - 1 && (
              <div className="h-1 w-24 mx-4 bg-gray-200 rounded"></div>
            )}
          </React.Fragment>
        ))}
      </div>

    
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex flex-col lg:flex-row">
      
          <div className="lg:w-1/2 bg-gradient-to-br from-blue-50 to-blue-100 p-8 flex items-center justify-center">
            <div className="text-center">
              <Image
                width={1920}
                height={1080}
                src={stepsData[stepsData[activeStep - 1] ? activeStep - 1 : 0].image}
                alt={stepsData[stepsData[activeStep - 1] ? activeStep - 1 : 0].title}
                className="w-full h-auto object-contain max-h-[500px] rounded-lg"
                priority={activeStep === 1}
              />
            </div>
          </div>

          {/* Text Section */}
          <div className="lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-600 text-sm font-medium rounded-full">
                Bước {activeStep}
              </span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-6">
              {stepsData[activeStep - 1].title}
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              {stepsData[activeStep - 1].description}
            </p>

            {/* Action Button */}
            <div className="mt-8">
              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors duration-300 transform hover:scale-105">
                {activeStep === 1 && "Khám phá ứng dụng"}
                {activeStep === 2 && "Đăng ký ngay"}
                {activeStep === 3 && "Tìm trạm gần nhất"}
                {activeStep === 4 && "Đặt xe ngay"}
                {activeStep === 5 && "Hoàn thành chuyến đi"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stepper;
