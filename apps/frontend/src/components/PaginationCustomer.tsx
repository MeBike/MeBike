import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationDemoProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function PaginationDemo({
  totalPages,
  currentPage,
  onPageChange,
}: PaginationDemoProps) {
  // 1. Ép totalPages tối thiểu là 1 để luôn render ra số 1 khi data rỗng
  const safeTotalPages = Math.max(1, totalPages);

  const getPageNumbers = () => {
    // Trả về duy nhất trang 1 nếu mảng trống
    if (safeTotalPages === 1) return [1];

    const pageNumbers = [];
    const maxPagesToShow = 5;
    const halfPagesToShow = Math.floor(maxPagesToShow / 2);

    pageNumbers.push(1);

    if (currentPage > halfPagesToShow + 2) {
      pageNumbers.push("...");
    }

    let startPage = Math.max(2, currentPage - halfPagesToShow);
    let endPage = Math.min(safeTotalPages - 1, currentPage + halfPagesToShow);

    if (currentPage <= halfPagesToShow + 1) {
      endPage = Math.min(safeTotalPages - 1, maxPagesToShow);
    }

    if (currentPage >= safeTotalPages - halfPagesToShow) {
      startPage = Math.max(2, safeTotalPages - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (currentPage < safeTotalPages - halfPagesToShow - 1) {
      pageNumbers.push("...");
    }

    pageNumbers.push(safeTotalPages);

    return [...new Set(pageNumbers)];
  };

  const pageNumbers = getPageNumbers();
  
  // 2. Logic kiểm tra xem nút Trước/Sau có nên bị vô hiệu hóa hay không
  const isPrevDisabled = currentPage <= 1;
  const isNextDisabled = currentPage >= safeTotalPages;

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (!isPrevDisabled) {
                onPageChange(currentPage - 1);
              }
            }}
            style={{
              pointerEvents: isPrevDisabled ? "none" : "auto",
              opacity: isPrevDisabled ? 0.5 : 1,
            }}
          />
        </PaginationItem>

        {pageNumbers.map((page, index) => (
          <PaginationItem key={index}>
            {typeof page === "number" ? (
              <PaginationLink
                href="#"
                isActive={currentPage === page}
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(page);
                }}
              >
                {page}
              </PaginationLink>
            ) : (
              <PaginationEllipsis />
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (!isNextDisabled) {
                onPageChange(currentPage + 1);
              }
            }}
            style={{
              pointerEvents: isNextDisabled ? "none" : "auto",
              opacity: isNextDisabled ? 0.5 : 1,
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}