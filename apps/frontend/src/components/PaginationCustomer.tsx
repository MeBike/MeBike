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
  if (totalPages < 1) {
    return null;
  }

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    const halfPagesToShow = Math.floor(maxPagesToShow / 2);

    if (totalPages > 1) {
      pageNumbers.push(1);
    }

    if (currentPage > halfPagesToShow + 2) {
      pageNumbers.push("...");
    }

    let startPage = Math.max(2, currentPage - halfPagesToShow);
    let endPage = Math.min(totalPages - 1, currentPage + halfPagesToShow);

    if (currentPage <= halfPagesToShow + 1) {
      endPage = Math.min(totalPages - 1, maxPagesToShow);
    }

    if (currentPage >= totalPages - halfPagesToShow) {
      startPage = Math.max(2, totalPages - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (currentPage < totalPages - halfPagesToShow - 1) {
      pageNumbers.push("...");
    }

    pageNumbers.push(totalPages);

    return [...new Set(pageNumbers)];
  };

  const pageNumbers = getPageNumbers();

  return (
    <Pagination>
      <PaginationContent>
        {/* Nút Previous */}
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (currentPage > 1) {
                onPageChange(currentPage - 1);
              }
            }}
            style={{
              pointerEvents: currentPage === 1 ? "none" : "auto",
              opacity: currentPage === 1 ? 0.5 : 1,
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
              if (currentPage < totalPages) {
                onPageChange(currentPage + 1);
              }
            }}
            style={{
              pointerEvents: currentPage === totalPages ? "none" : "auto",
              opacity: currentPage === totalPages ? 0.5 : 1,
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
