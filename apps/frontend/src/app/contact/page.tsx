"use client";

import type React from "react";
import Header from "@components/ui/layout/Header";
import { Footer as LandingFooter} from "@components/landing/landing-footer";
import { Card } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { Label } from "@components/ui/label";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[v0] Contact form submitted:", formData);
    toast.success("Tin nhắn của bạn đã được gửi thành công!");
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
                        <Input
                          id="subject"
                          placeholder="Vấn đề cần hỗ trợ"
                          value={formData.subject}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              subject: e.target.value,
                            })
                          }
                          required
                        />
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
                      className="w-full md:w-auto"
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
                        support@metrobike.vn
                      </p>
                      <p className="text-sm text-muted-foreground">
                        info@metrobike.vn
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
                        Hotline: 1900 1234
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
                        123 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí
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
                        Thứ 2 - Thứ 6: 8:00 - 18:00
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Thứ 7: 8:00 - 12:00
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Chủ nhật: Nghỉ
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
