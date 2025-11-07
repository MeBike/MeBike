import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bike } from "lucide-react";
import { dashboardService } from "@/services/dashboard.service";

interface StationData {
  name: string;
  availableBikes: number;
}

export function Stations() {
  const [stations, setStations] = useState<StationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const response = await dashboardService.getStations();
        if (response.data.result) {
          //order by most available first
          const sortedStations = response.data.result.sort((a, b) => b.availableBikes - a.availableBikes);
          setStations(sortedStations);
        }
      } catch (error) {
        console.error("Error fetching stations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  const getStatus = (availableBikes: number) => {
    return availableBikes >= 0 && availableBikes <= 5 ? "low" : "available";
  };

  if (loading) {
    return (
      <section id="stations" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
              Trạm xe đạp
            </h2>
            <p className="text-lg text-muted-foreground text-pretty">
              Xe đạp có sẵn tại các trạm của MeBike
            </p>
          </div>
          <div className="text-center">Đang tải...</div>
        </div>
      </section>
    );
  }

  return (
    <section id="stations" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
            Trạm xe đạp
          </h2>
          <p className="text-lg text-muted-foreground text-pretty">
            Xe đạp có sẵn tại các trạm của MeBike
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
                      Tuyến 1
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    getStatus(station.availableBikes) === "available" ? "default" : "secondary"
                  }
                >
                  {getStatus(station.availableBikes) === "available" ? "Sẵn sàng" : "Sắp hết"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <Bike className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">{station.availableBikes}</span>
                <span className="text-sm text-muted-foreground">xe có sẵn</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
