import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import Pagination from "./Pagination";

interface DataTableColumn<T> {
  header: string;
  accessorKey: keyof T | ((row: T) => ReactNode);
  cell?: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  totalItems: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
}

export default function DataTable<T>({
  data,
  columns,
  totalItems,
  currentPage,
  onPageChange,
  itemsPerPage,
}: DataTableProps<T>) {
  const renderCell = (row: T, column: DataTableColumn<T>) => {
    if (column.cell) {
      return column.cell(row);
    }

    const accessorKey = column.accessorKey;
    
    if (typeof accessorKey === "function") {
      return accessorKey(row);
    }
    
    return String(row[accessorKey] || "");
  };

  return (
    <Card className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, idx) => (
                <th
                  key={idx}
                  scope="col"
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ""}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {columns.map((column, colIdx) => (
                  <td
                    key={colIdx}
                    className={`px-6 py-4 whitespace-nowrap ${column.className || ""}`}
                  >
                    {renderCell(row, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <Pagination
        totalItems={totalItems}
        currentPage={currentPage}
        onPageChange={onPageChange}
        itemsPerPage={itemsPerPage}
      />
    </Card>
  );
}
