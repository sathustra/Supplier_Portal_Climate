import LoadingSpinner from './LoadingSpinner'
import EmptyState from './EmptyState'

export interface Column<T> {
  header: string
  accessor: keyof T | ((row: T) => React.ReactNode)
  className?: string
}

interface Props<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  keyFn: (row: T) => string
  footerRow?: React.ReactNode
}

export default function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyTitle = 'Keine Einträge',
  emptyDescription,
  onEdit,
  onDelete,
  keyFn,
  footerRow,
}: Props<T>) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" className="text-secondary" />
      </div>
    )
  }
  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  const hasActions = onEdit || onDelete

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide ${col.className ?? ''}`}
              >
                {col.header}
              </th>
            ))}
            {hasActions && (
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Aktionen
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {data.map((row) => (
            <tr key={keyFn(row)} className="hover:bg-gray-50 transition-colors">
              {columns.map((col, i) => (
                <td key={i} className={`px-4 py-3 text-gray-700 ${col.className ?? ''}`}>
                  {typeof col.accessor === 'function'
                    ? col.accessor(row)
                    : (row[col.accessor] as React.ReactNode)}
                </td>
              ))}
              {hasActions && (
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(row)}
                      className="text-secondary hover:text-primary text-xs font-medium mr-3 transition-colors"
                    >
                      Bearbeiten
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(row)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium transition-colors"
                    >
                      Löschen
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
        {footerRow && (
          <tfoot className="bg-gray-50 border-t border-gray-200">{footerRow}</tfoot>
        )}
      </table>
    </div>
  )
}
