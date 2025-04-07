import { useMemo } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface PaginationProps {
  totalItems: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
}

export default function Pagination({
  totalItems,
  currentPage,
  onPageChange,
  itemsPerPage,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const paginationItems = useMemo(() => {
    const pages = [];
    
    // Always show first page
    pages.push(1);
    
    // Logic for middle pages
    const rangeStart = Math.max(2, currentPage - 1);
    const rangeEnd = Math.min(totalPages - 1, currentPage + 1);
    
    if (rangeStart > 2) {
      pages.push("...");
    }
    
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }
    
    if (rangeEnd < totalPages - 1) {
      pages.push("...");
    }
    
    // Always show last page if there are more than 1 page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Vorige
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Volgende
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Toont <span className="font-medium">{startItem}</span> tot{" "}
              <span className="font-medium">{endItem}</span> van{" "}
              <span className="font-medium">{totalItems}</span> resultaten
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="sr-only">Vorige</span>
                <FaChevronLeft className="h-4 w-4" />
              </button>
              
              {paginationItems.map((item, idx) => {
                if (item === "...") {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                    >
                      ...
                    </span>
                  );
                }
                
                return (
                  <button
                    key={`page-${item}`}
                    onClick={() => onPageChange(item as number)}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 ${
                      currentPage === item 
                        ? "bg-primary text-white z-10" 
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    } text-sm font-medium`}
                  >
                    {item}
                  </button>
                );
              })}
              
              <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="sr-only">Volgende</span>
                <FaChevronRight className="h-4 w-4" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
