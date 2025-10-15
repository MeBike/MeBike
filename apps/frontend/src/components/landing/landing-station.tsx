import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bike } from "lucide-react";

const stations = [
  { name: "Bến Thành", line: "Tuyến 1", bikes: 45, status: "available" },
  {
    name: "Nhà hát Thành phố",
    line: "Tuyến 1",
    bikes: 38,
    status: "available",
  },
  { name: "Ba Son", line: "Tuyến 1", bikes: 12, status: "low" },
  { name: "Tân Cảng", line: "Tuyến 1", bikes: 52, status: "available" },
  { name: "Thảo Điền", line: "Tuyến 1", bikes: 28, status: "available" },
  { name: "An Phú", line: "Tuyến 1", bikes: 5, status: "low" },
];

export function Stations() {
  return (
    <section id="stations" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
            Trạm xe đạp
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">
            Xe đạp có sẵn tại các trạm metro chính trên tuyến 1
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stations.map((station, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {station.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {station.line}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    station.status === "available" ? "default" : "secondary"
                  }
                >
                  {station.status === "available" ? "Sẵn sàng" : "Sắp hết"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Bike className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{station.bikes}</span>
                <span className="text-sm text-muted-foreground">xe có sẵn</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
