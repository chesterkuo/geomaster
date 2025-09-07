import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronRight, 
  MoreVertical,
  ArrowUpDown,
  SlidersHorizontal
} from "lucide-react";
import { useTouchGestures } from "@/hooks/useTouchGestures";

interface MobileDataTableProps {
  data: any[];
  columns: {
    key: string;
    label: string;
    sortable?: boolean;
    render?: (value: any, row: any) => React.ReactNode;
    sticky?: boolean;
  }[];
  searchable?: boolean;
  filterable?: boolean;
  expandable?: boolean;
  onRowClick?: (row: any) => void;
  className?: string;
}

export const MobileDataTable = ({
  data,
  columns,
  searchable = true,
  filterable = false,
  expandable = false,
  onRowClick,
  className
}: MobileDataTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  // Filter and sort data
  const processedData = data
    .filter(row => 
      !searchTerm || 
      Object.values(row).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => {
      if (!sortConfig) return 0;
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      const modifier = sortConfig.direction === "asc" ? 1 : -1;
      return aValue < bValue ? -modifier : aValue > bValue ? modifier : 0;
    });

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === "asc" ? "desc" : "asc"
    }));
  };

  const toggleRowExpansion = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  // Touch gestures for horizontal scrolling
  const touchHandlers = useTouchGestures({
    onSwipeLeft: () => {
      if (tableRef.current) {
        tableRef.current.scrollLeft += 100;
      }
    },
    onSwipeRight: () => {
      if (tableRef.current) {
        tableRef.current.scrollLeft -= 100;
      }
    }
  });

  // Identify main column (usually first non-sticky column)
  const stickyColumns = columns.filter(col => col.sticky);
  const mainColumns = columns.filter(col => !col.sticky);

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Header Controls */}
      <div className="p-4 border-b border-border space-y-3">
        {searchable && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜尋資料..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
        
        {filterable && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>篩選</span>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform",
                showFilters && "rotate-180"
              )} />
            </Button>
            <span className="text-sm text-muted-foreground">
              共 {processedData.length} 筆資料
            </span>
          </div>
        )}
      </div>

      {/* Mobile Table */}
      <div className="relative">
        {/* Card-based layout for mobile */}
        <div className="md:hidden">
          <div className="divide-y divide-border">
            {processedData.map((row, rowIndex) => (
              <MobileTableCard
                key={rowIndex}
                row={row}
                columns={columns}
                expandable={expandable}
                expanded={expandedRows.has(rowIndex)}
                onToggleExpand={() => toggleRowExpansion(rowIndex)}
                onClick={() => onRowClick?.(row)}
              />
            ))}
          </div>
        </div>

        {/* Traditional table for larger screens */}
        <div 
          ref={tableRef}
          className="hidden md:block overflow-x-auto"
          {...touchHandlers}
        >
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "px-4 py-3 text-left text-sm font-medium text-foreground",
                      column.sticky && "sticky left-0 bg-muted/30 z-10",
                      column.sortable && "cursor-pointer hover:bg-muted/50"
                    )}
                    onClick={column.sortable ? () => handleSort(column.key) : undefined}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{column.label}</span>
                      {column.sortable && (
                        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {processedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={cn(
                    "hover:bg-muted/30 transition-colors",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-4 py-3 text-sm",
                        column.sticky && "sticky left-0 bg-background z-10"
                      )}
                    >
                      {column.render 
                        ? column.render(row[column.key], row)
                        : row[column.key]
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty state */}
      {processedData.length === 0 && (
        <div className="p-8 text-center">
          <p className="text-muted-foreground">沒有找到符合條件的資料</p>
        </div>
      )}
    </Card>
  );
};

// Mobile table card component
interface MobileTableCardProps {
  row: any;
  columns: any[];
  expandable: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onClick?: () => void;
}

const MobileTableCard = ({
  row,
  columns,
  expandable,
  expanded,
  onToggleExpand,
  onClick
}: MobileTableCardProps) => {
  const [isPressed, setIsPressed] = useState(false);
  
  // Show first 2-3 columns in collapsed view
  const primaryColumns = columns.slice(0, 3);
  const secondaryColumns = columns.slice(3);

  return (
    <div
      className={cn(
        "p-4 transition-all duration-200 hover:bg-muted/30",
        isPressed && "bg-muted/50 scale-[0.98]",
        onClick && "cursor-pointer"
      )}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onTouchCancel={() => setIsPressed(false)}
      onClick={onClick}
    >
      {/* Primary info */}
      <div className="space-y-2">
        {primaryColumns.map((column) => (
          <div key={column.key} className="flex justify-between items-start">
            <span className="text-sm text-muted-foreground font-medium min-w-0 flex-1">
              {column.label}:
            </span>
            <span className="text-sm text-foreground font-medium text-right ml-2">
              {column.render 
                ? column.render(row[column.key], row)
                : row[column.key]
              }
            </span>
          </div>
        ))}
      </div>

      {/* Expandable content */}
      {expandable && secondaryColumns.length > 0 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="w-full mt-3 justify-center text-xs"
          >
            {expanded ? "收起" : "展開更多"}
            <ChevronDown className={cn(
              "h-4 w-4 ml-2 transition-transform",
              expanded && "rotate-180"
            )} />
          </Button>

          {expanded && (
            <div className="mt-3 pt-3 border-t border-border space-y-2">
              {secondaryColumns.map((column) => (
                <div key={column.key} className="flex justify-between items-start">
                  <span className="text-sm text-muted-foreground font-medium min-w-0 flex-1">
                    {column.label}:
                  </span>
                  <span className="text-sm text-foreground text-right ml-2">
                    {column.render 
                      ? column.render(row[column.key], row)
                      : row[column.key]
                    }
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Action button */}
      <div className="flex justify-end mt-3">
        <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};