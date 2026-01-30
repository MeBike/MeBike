// "use client";

// import type { Bike } from "@custom-types";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import { Edit, Trash2, Eye, MapPin, Star } from "lucide-react";
// import Image from "next/image";

// interface BikeCardProps {
//   bike: Bike;
//   onEdit?: (bike: Bike) => void;
//   onDelete?: (bike: Bike) => void;
//   onView?: (bike: Bike) => void;
// }

// const statusConfig = {
//   available: {
//     label: "Sẵn sàng",
//     className: "bg-green-500/10 text-green-500 border-green-500/20",
//   },
//   rented: {
//     label: "Đang thuê",
//     className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
//   },
//   maintenance: {
//     label: "Bảo trì",
//     className: "bg-orange-500/10 text-orange-500 border-orange-500/20",
//   },
//   retired: {
//     label: "Ngừng hoạt động",
//     className: "bg-red-500/10 text-red-500 border-red-500/20",
//   },
// };

// const typeConfig = {
//   mountain: "Xe đạp địa hình",
//   road: "Xe đạp đường trường",
//   city: "Xe đạp thành phố",
//   electric: "Xe đạp điện",
//   hybrid: "Xe đạp hybrid",
// };

// export function BikeCard({ bike, onEdit, onDelete, onView }: BikeCardProps) {
//   const status = statusConfig[bike.status];
//   return (
//     <Card className="group overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300">
//       <div className="relative h-48 overflow-hidden bg-muted">
//         <Image
//           src={bike.image || "/placeholder.svg"}
//           alt={bike.name}
//           fill
//           className="object-cover group-hover:scale-105 transition-transform duration-300"
//         />
//         <Badge className={`absolute top-3 right-3 ${status.className}`}>
//           {status.label}
//         </Badge>
//       </div>

//       <div className="p-4 space-y-3">
//         <div>
//           <h3 className="font-semibold text-lg text-foreground mb-1">
//             {bike.name}
//           </h3>
//           <p className="text-sm text-muted-foreground">
//             {bike.brand} - {typeConfig[bike.type]}
//           </p>
//         </div>

//         <div className="flex items-center gap-4 text-sm">
//           <div className="flex items-center gap-1 text-muted-foreground">
//             <MapPin className="w-4 h-4" />
//             <span>{bike.location}</span>
//           </div>
//           <div className="flex items-center gap-1 text-yellow-500">
//             <Star className="w-4 h-4 fill-yellow-500" />
//             <span className="text-foreground">{bike.rating.toFixed(1)}</span>
//           </div>
//         </div>

//         <div className="flex items-baseline gap-2">
//           <span className="text-2xl font-bold text-primary">
//             {bike.price_per_hour.toLocaleString()}đ
//           </span>
//           <span className="text-sm text-muted-foreground">/giờ</span>
//           <span className="text-sm text-muted-foreground ml-auto">
//             {bike.price_per_day.toLocaleString()}đ/ngày
//           </span>
//         </div>

//         <div className="flex items-center gap-2 pt-2 border-t border-border">
//           <Button
//             variant="outline"
//             size="sm"
//             className="flex-1 bg-transparent"
//             onClick={() => onView?.(bike)}
//           >
//             <Eye className="w-4 h-4 mr-1" />
//             Xem
//           </Button>
//           <Button
//             variant="outline"
//             size="sm"
//             className="flex-1 bg-transparent"
//             onClick={() => onEdit?.(bike)}
//           >
//             <Edit className="w-4 h-4 mr-1" />
//             Sửa
//           </Button>
//           <Button variant="outline" size="sm" onClick={() => onDelete?.(bike)}>
//             <Trash2 className="w-4 h-4 text-destructive" />
//           </Button>
//         </div>
//       </div>
//     </Card>
//   );
// }
import React from 'react'

const BikeCard = () => {
  return (
    <div>
      
    </div>
  )
}

export default BikeCard;
