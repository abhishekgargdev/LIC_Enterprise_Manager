"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  PaginationState,
  useReactTable,
} from "@tanstack/react-table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"

type DataTableProps<T extends object> = {
  columns: ColumnDef<T, any>[]
  data: T[]
  title?: string
  placeholder?: string
}

export function DataTable<T extends object>({
  columns,
  data,
  title,
  placeholder = "Search records...",
}: DataTableProps<T>) {
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  })
  const [columnVisibility, setColumnVisibility] = React.useState<
    Record<string, boolean>
  >({})

  const filteredData = React.useMemo(() => {
    if (!globalFilter.trim()) {
      return data
    }

    const lowerCase = globalFilter.toLowerCase()
    return data.filter((row) =>
      columns.some((column) => {
        const accessor = (column as any).accessorKey as keyof T | undefined
        const cell = accessor ? row[accessor] : undefined
        return String(cell ?? "").toLowerCase().includes(lowerCase)
      })
    )
  }, [data, globalFilter, columns])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      pagination,
      columnVisibility,
    },
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    pageCount: Math.ceil(filteredData.length / pagination.pageSize),
  })

  return (
    <div className="space-y-4 rounded-[2rem] border border-border bg-card p-4 shadow-sm shadow-black/5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Search className="size-5 text-muted-foreground" />
          <Input
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder={placeholder}
            className="max-w-xs"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="outline" size="sm" className="inline-flex items-center gap-2">
              Columns
              <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-44">
            {table
              .getAllLeafColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuItem
                  key={column.id}
                  onClick={() => column.toggleVisibility(!column.getIsVisible())}
                >
                  <span>{column.id}</span>
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Table className="min-w-full">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
                No records match your search.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>
          Showing {filteredData.length === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1} to {Math.min(filteredData.length, (pagination.pageIndex + 1) * pagination.pageSize)} of {filteredData.length} results
        </span>
        <div className="inline-flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
