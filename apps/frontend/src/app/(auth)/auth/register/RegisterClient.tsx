"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { RegisterSchemaFormData } from "@/schemas/authSchema";
import { useAuthActions } from "@/hooks/useAuthAction";
import { toast } from "sonner";
import RegisterForm from "./components/RegisterForm";
const RegisterClient = () => {
  const [agreeTerms, setAgreeTerms] = useState<boolean>(false);
  const router = useRouter();
  const { register: registerUser, verifyEmail } = useAuthActions();
  const handleRegister = async (data: RegisterSchemaFormData) => {
    if (!agreeTerms) {
      toast.error("Vui lòng đồng ý với điều khoản sử dụng!");
      return;
    }
    if (data.password !== data.confirmPassword) {
      toast.error("Mật khẩu và xác nhận mật khẩu không khớp!");
      return;
    }
    const registerData = { ...data };
    console.log("Register data:", registerData);
    try {
      console.log("Starting registration with email:", data.email);
      await registerUser(registerData);
      console.log("Registration successful! Email:", data.email);
      router.push("/user/profile");
    } catch (err) {
      console.log("Registration error:", err);
    }
  };


  return (
      <RegisterForm handleRegister={handleRegister} agreeTerms={agreeTerms} setAgreeTerms={setAgreeTerms}/>
  );
};

export default RegisterClient;
