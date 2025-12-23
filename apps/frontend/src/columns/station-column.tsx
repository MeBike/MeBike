import { ColumnDef } from "@tanstack/react-table";
import { Eye, Edit2, Trash2, MapPin, Bike, AlertCircle } from "lucide-react";
import type { Station } from "@/types/station.type";
import { Badge } from "@/components/ui/badge"; // Assuming shadcn/ui
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { formatToVNTime } from "@/lib/formateVNDate";

export const stationColumns = ({
  onView,
  setIsDetailModalOpen,
  onEdit,
  onDelete,
}: {
  onView?: ({ id }: { id: string }) => void;
  setIsDetailModalOpen?: (isOpen: boolean) => void;
  onEdit?: ({ id }: { id: string }) => void;
  onDelete?: ({ id }: { id: string }) => void;
}): ColumnDef<Station>[] => [
  {
    accessorKey: "name",
    header: "Station Detail",
    cell: ({ row }) => (
      <div className="flex flex-col gap-1 min-w-[200px]">
        <div className="font-bold text-foreground capitalize tracking-tight">
          {row.original.name}
        </div>
        <div className="flex items-center text-xs text-muted-foreground italic">
          <MapPin className="mr-1 h-3 w-3 shrink-0" />
          <span className="truncate max-w-[180px]" title={row.original.address}>
            {row.original.address}
          </span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "availableBike",
    header: () => <div className="text-center">Availability</div>,
    cell: ({ row }) => {
      const percentage =
        (200 / 200) * 100;
      return (
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-bold ${percentage < 20 ? "text-red-500" : "text-green-600"}`}
            >
              {row.original.availableBike}
            </span>
            <span className="text-muted-foreground text-xs">
              / {row.original.capacity}
            </span>
          </div>
          <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full ${percentage < 20 ? "bg-red-500" : "bg-green-500"}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      );
    },
  },
  {
    id: "inventory",
    header: "Bike Status",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1 max-w-[150px]">
        {row.original.bookedBike > 0 && (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 border-blue-200 text-blue-600 bg-blue-50"
          >
            {row.original.bookedBike} Booked
          </Badge>
        )}
        {row.original.brokenBike > 0 && (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 border-destructive/30 text-destructive bg-destructive/5"
          >
            {row.original.brokenBike} Broken
          </Badge>
        )}
        {row.original.maintanedBike > 0 && (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 border-amber-200 text-amber-600 bg-amber-50"
          >
            {row.original.maintanedBike} Maint.
          </Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: "updatedAt",
    header: "Last Activity",
    cell: ({ row }) => (
      <div className="text-xs text-muted-foreground whitespace-nowrap">
        {formatToVNTime(row.original.updatedAt)}
      </div>
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-right pr-4">Actions</div>,
    cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <button
          className="p-2 hover:bg-primary/10 hover:text-primary rounded-md transition-all group"
          onClick={() => {
            onView?.({ id: row.original.id });
            setIsDetailModalOpen?.(true);
          }}
        >
          <Eye className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
        </button>

        <button
          className="p-2 hover:bg-primary/10 hover:text-primary rounded-md transition-all group"
          onClick={() => onEdit?.({ id: row.original.id })}
        >
          <Edit2 className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
        </button>

        <Dialog>
          <DialogTrigger asChild>
            <button className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-md transition-all group">
              <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-destructive" />
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Confirm Deletion
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <b className="text-foreground">{row.original.name}</b>? This
              action cannot be undone.
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <button className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-secondary">
                  Cancel
                </button>
              </DialogClose>
              <button
                className="px-4 py-2 text-sm font-medium bg-destructive text-white rounded-md hover:bg-destructive/90"
                onClick={() => onDelete?.({ id: row.original.id })}
              >
                Delete Station
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    ),
  },
];
