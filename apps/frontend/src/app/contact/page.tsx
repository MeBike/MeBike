"use client";

import type React from "react";
import Header from "@components/ui/layout/Header";
import { Footer as LandingFooter} from "@components/landing/landing-footer";
import { Card } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Label } from "@components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { sendContactEmail } from "./actions";
export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("subject", formData.subject);
      formDataToSend.append("message", formData.message);

      await sendContactEmail(formDataToSend);
      toast.success("Tin nhắn của bạn đã được gửi thành công!");
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại!");
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24">
        <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 text-balance">
                Liên hệ với chúng tôi
              </h1>
              <p className="text-xl text-muted-foreground text-pretty">
                Có câu hỏi? Chúng tôi luôn sẵn sàng hỗ trợ bạn
              </p>
            </div>
          </div>
        </section>
        <section className="py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="lg:col-span-2">
                <Card className="p-8">
                  <h2 className="text-2xl font-bold text-foreground mb-6">
                    Gửi tin nhắn
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Họ và tên *</Label>
                        <Input
                          id="name"
                          placeholder="Nguyễn Văn A"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="email@example.com"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Số điện thoại</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="0901234567"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">Chủ đề *</Label>
                        <Select
                          value={formData.subject}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              subject: value,
                            })
                          }
                          required
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chọn chủ đề cần hỗ trợ" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Vấn đề thuê trả xe đạp">Vấn đề thuê trả xe đạp</SelectItem>
                            <SelectItem value="Vấn đề nạp tiền vào ví">Vấn đề nạp tiền vào ví</SelectItem>
                            <SelectItem value="Vấn đề đặt chỗ trước">Vấn đề đặt chỗ trước</SelectItem>
                            <SelectItem value="Vấn đề bảo trì xe đạp">Vấn đề bảo trì xe đạp</SelectItem>
                            <SelectItem value="Vấn đề hoàn tiền">Vấn đề hoàn tiền</SelectItem>
                            <SelectItem value="Vấn đề rút tiền">Vấn đề rút tiền</SelectItem>
                            <SelectItem value="Vấn đề tài khoản">Vấn đề tài khoản</SelectItem>
                            <SelectItem value="Vấn đề kỹ thuật ứng dụng">Vấn đề kỹ thuật ứng dụng</SelectItem>
                            <SelectItem value="Vấn đề thanh toán">Vấn đề thanh toán</SelectItem>
                            <SelectItem value="Khác">Khác</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Nội dung *</Label>
                      <Textarea
                        id="message"
                        placeholder="Mô tả chi tiết vấn đề của bạn..."
                        rows={6}
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full md:w-auto cursor-pointer"
                    >
                      Gửi tin nhắn
                    </Button>
                  </form>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        Email
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        nguyennvse173423@fpt.edu.vn
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        Điện thoại
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Hotline: 0392588354
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Hỗ trợ: 028 1234 5678
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        Văn phòng
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        138 Đường 400, Phường Tăng Nhơn Phú, TP. Hồ Chí
                        Minh
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        Giờ làm việc
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Cả tuần
                      </p>
                      <p className="text-sm text-muted-foreground">
                        05:00 - 22:00
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
                Vị trí văn phòng
              </h2>
              <Card className="p-8 bg-muted/50">
                <div className="aspect-video bg-background rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Bản đồ Google Maps sẽ hiển thị ở đây
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      123 Đường Lê Lợi, Quận 1, TP.HCM
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
