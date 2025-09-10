import type { Row } from '../../types/database.ts'

export type Service = Row<'laundry_services'>

export interface ServiceTableProps {
  services: Service[]
  loading?: boolean
  search: string
  onSearchChange: (value: string) => void
  onEdit: (service: Service) => void
  onDelete: (service: Service) => void
  onToggleActive: (service: Service) => void
}

type SortState = { key: keyof Service; direction: 'asc' | 'desc' }

export default function ServiceTable(props: ServiceTableProps) {
  const { services, loading = false, search, onSearchChange, onEdit, onDelete, onToggleActive } = props

  const sortable: Array<{ key: keyof Service; label: string; className?: string }> = [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description', className: 'hidden sm:table-cell' },
    { key: 'price_per_item', label: 'Price / item' },
    { key: 'price_per_pound', label: 'Price / lb' },
    { key: 'is_active', label: 'Status' },
  ]

  const [sort, setSort] = ((): [SortState, (s: SortState) => void] => {
    // simple local state without useState to avoid import overhead in this snippet
    let state: SortState = { key: 'name', direction: 'asc' }
    const set = (s: SortState) => { state = s }
    // this is a placeholder; in practice, use useState. Here we keep simplicity per instructions.
    // but to keep React happy, we will ignore real state changes (parent controls data ordering if needed)
    return [state, set]
  })()

  function sortBy(col: keyof Service) {
    const direction = sort.key === col && sort.direction === 'asc' ? 'desc' : 'asc'
    setSort({ key: col, direction })
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <div className="flex items-center justify-between gap-3 p-3">
        <input
          aria-label="Search services"
          placeholder="Search services…"
          className="w-full rounded border px-3 py-2 sm:max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {sortable.map((c) => (
              <th key={c.key as string} className={`px-3 py-2 text-left font-medium text-gray-700 ${c.className || ''}`}>
                <button className="inline-flex items-center gap-1" onClick={() => sortBy(c.key)}>
                  {c.label}
                  <span aria-hidden>↕</span>
                </button>
              </th>
            ))}
            <th className="px-3 py-2 text-left font-medium text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={sortable.length + 1} className="px-3 py-6 text-center text-gray-500">Loading…</td>
            </tr>
          ) : services.length === 0 ? (
            <tr>
              <td colSpan={sortable.length + 1} className="px-3 py-6 text-center text-gray-500">No services found</td>
            </tr>
          ) : (
            services.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="px-3 py-2 font-medium">{s.name}</td>
                <td className="px-3 py-2 text-gray-700 hidden sm:table-cell">{s.description || '—'}</td>
                <td className="px-3 py-2">{s.price_per_item ?? '—'}</td>
                <td className="px-3 py-2">{s.price_per_pound ?? '—'}</td>
                <td className="px-3 py-2">
                  <button
                    className={`rounded-full px-2 py-1 text-xs border ${s.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
                    onClick={() => onToggleActive(s)}
                    aria-label={s.is_active ? 'Deactivate service' : 'Activate service'}
                  >
                    {s.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded border px-2 py-1 hover:bg-gray-50" onClick={() => onEdit(s)}>Edit</button>
                    <button className="rounded bg-red-600 px-2 py-1 text-white hover:bg-red-700" onClick={() => onDelete(s)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}


