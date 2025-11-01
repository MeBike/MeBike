import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { Search } from "lucide-react";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface FilterOptionsProps {
  value: string;
  status?:
    | "SHIPPING"
    | "CANCELLED"
    | "DELIVERED"
    | "PROCESSING"
    | "ALL"
    | "CONFIRMED"
    | "PENDING";
  label?:
    | "Đang giao"
    | "Đã hủy"
    | "Đã giao"
    | "Đang xử lý"
    | "Tất cả"
    | "Đã đồng ý"
    | "Đang chờ"
    | "Chờ xử lý"
    | "Đã xác nhận"
    | "Đang vận chuyển"
    | "Đã giao hàng";
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];

  isHaveFilter?: boolean;
  filterOptions?: FilterOptionsProps[];
  callBackFunction?: (status?: FilterOptionsProps["status"]) => void;
  status?: string;

  filterPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  title?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterPlaceholder,
  searchValue,
  onSearchChange,
  title,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const showSearchBar = onSearchChange !== undefined;

  // // Hàm ánh xạ status sang variant
  // const getVariantFromStatus = (status: FilterOptionsProps["status"]) => {
  //   switch (status) {
  //     case "CANCELLED":
  //       return "destructive";
  //     case "DELIVERED":
  //       return "complete";
  //     case "SHIPPING":
  //       return "shipping";
  //     case "PROCESSING":
  //       return "processing";
  //     case "CONFIRMED":
  //       return "confirmed";
  //     case "PENDING":
  //       return "pending";
  //     case "ALL":
  //       return "secondary";
  //     default:
  //       return "outline";
  //   }
  // };

  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            {showSearchBar && (
              <>
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={filterPlaceholder || "Tìm kiếm..."}
                  value={searchValue ?? ""}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="pl-10"
                />
              </>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {table.getHeaderGroups().map((headerGroup) =>
                    headerGroup.headers.map((header) => (
                      <th key={header.id} className="text-left py-3 px-4 font-medium">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-b hover:bg-muted/50">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="py-3 px-4">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="h-20 text-center text-muted-foreground">
                      Không có kết quả.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );

}
