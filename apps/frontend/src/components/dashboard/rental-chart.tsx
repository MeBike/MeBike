"use client";

import { Card } from "@/components/ui/card";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const data = [
  { time: "00:00", rentals: 12 },
  { time: "03:00", rentals: 8 },
  { time: "06:00", rentals: 25 },
  { time: "09:00", rentals: 45 },
  { time: "12:00", rentals: 62 },
  { time: "15:00", rentals: 58 },
  { time: "18:00", rentals: 72 },
  { time: "21:00", rentals: 38 },
  { time: "24:00", rentals: 15 },
];

export function RentalChart() {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Lượt thuê xe hôm nay
          </h3>
          <p className="text-sm text-muted-foreground">Thống kê theo giờ</p>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRentals" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="time"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--foreground))",
              }}
            />
            <Area
              type="monotone"
              dataKey="rentals"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRentals)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
