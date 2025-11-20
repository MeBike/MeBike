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
      </div>
      <div className="container px-4 mx-auto my-12 text-center">
        <h1 className="text-xl md:text-4xl drop-shadow-lg">
          Hướng dẫn sử dụng MeBike
        </h1>
      </div>
      <div className="container px-4 mx-auto my-12">
        <Stepper />
      </div>
    </div>
  );
};

export default page;
