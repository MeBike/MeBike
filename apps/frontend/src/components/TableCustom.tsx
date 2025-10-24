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
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterPlaceholder,
  searchValue,
  onSearchChange,
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
    <div className="w-full  rounded-2xl  from-blue-50 via-white to-zinc-50  border-gray-200 overflow-x-auto">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {showSearchBar && (
          <div className="relative w-full max-w-xs">
            <Search className="absolute top-1/2 left-2 h-5 w-5 -translate-y-1/2 text-blue-400" />
            <Input
              placeholder={filterPlaceholder || "Tìm kiếm..."}
              value={searchValue ?? ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="rounded-xl border border-blue-200 bg-white py-3 pl-10 pr-3 focus:ring-2 focus:ring-blue-300 shadow-sm"
            />
          </div>
        )}
        {/* Có thể thêm filter dropdown ở đây nếu cần */}
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <Table className="min-w-full">
          <TableHeader className="bg-blue-50 sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="px-4 py-3 text-blue-800 font-semibold uppercase tracking-wide text-xs border-b border-blue-200"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="transition-colors hover:bg-blue-50/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-4 py-3 border-b border-gray-100 text-gray-800"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-20 text-center text-gray-500"
                >
                  Không có kết quả.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

}
