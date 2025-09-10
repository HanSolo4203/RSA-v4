import { useEffect, useMemo, useState } from 'react'
import { listActiveServices } from '../lib/supabase.ts'
import type { Row } from '../types/database.ts'

export type Service = Row<'laundry_services'>

export type ServiceQuantities = Record<string, number>

export interface ServiceSelectorProps {
  value: ServiceQuantities
  onChange: (next: ServiceQuantities) => void
  disabled?: boolean
  className?: string
  /** When provided, component will render an overall total summary row. */
  showSummaryTotal?: boolean
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
}

export default function ServiceSelector(props: ServiceSelectorProps) {
  const { value, onChange, disabled = false, className, showSummaryTotal = true } = props

  const [services, setServices] = useState<Service[] | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const res = await listActiveServices()
        if (!cancelled) {
          if (res.ok) {
            setServices(res.data)
          } else {
            setServices([])
            setError(res.error || 'Failed to load services')
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setServices([])
          setError(e?.message || 'Failed to load services')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const items = services ?? []

  const lineTotals = useMemo(() => {
    return items.map((s) => {
      const qty = Math.max(0, Number(value?.[s.id] || 0))
      const price = Number(s.price_per_item ?? s.price_per_pound ?? '0')
      return qty * price
    })
  }, [items, value])

  const overallTotal = useMemo(() => lineTotals.reduce((a, b) => a + b, 0), [lineTotals])

  function setQuantity(serviceId: string, nextQty: number) {
    const safeQty = Math.max(0, Math.floor(nextQty || 0))
    const next = { ...value, [serviceId]: safeQty }
    if (safeQty === 0) {
      delete next[serviceId]
    }
    onChange(next)
  }

  function inc(serviceId: string) {
    const current = Number(value?.[serviceId] || 0)
    setQuantity(serviceId, current + 1)
  }

  function dec(serviceId: string) {
    const current = Number(value?.[serviceId] || 0)
    setQuantity(serviceId, Math.max(0, current - 1))
  }

  return (
    <div className={className}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium">Service Selection</h2>
        {loading && <span className="text-sm text-gray-500">Loading services…</span>}
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && items.length === 0 && !error && (
        <p className="text-sm text-gray-600">No services available at the moment.</p>
      )}

      {!loading && (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map((s) => {
          const priceItem = s.price_per_item ? Number(s.price_per_item) : null
          const pricePound = s.price_per_pound ? Number(s.price_per_pound) : null
          const displayPrice =
            priceItem !== null
              ? `${formatCurrency(priceItem)} per item`
              : pricePound !== null
              ? `${formatCurrency(pricePound)} per lb`
              : 'Contact for pricing'

          const qty = Math.max(0, Number(value?.[s.id] || 0))
          const unitPrice = Number(s.price_per_item ?? s.price_per_pound ?? '0')
          const lineTotal = qty * unitPrice

          return (
            <div key={s.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-medium">{s.name}</p>
                  {s.description && <p className="mt-1 line-clamp-2 text-sm text-gray-600">{s.description}</p>}
                  <p className="mt-2 text-sm text-gray-800">{displayPrice}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Line Total</div>
                  <div className="text-sm font-semibold">{formatCurrency(lineTotal)}</div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <button
                    type="button"
                    disabled={disabled || qty === 0}
                    onClick={() => dec(s.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
                    aria-label={`Decrease ${s.name}`}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    disabled={disabled}
                    value={qty}
                    onChange={(e) => setQuantity(s.id, Number(e.target.value))}
                    className="w-20 rounded border px-2 py-1 text-center"
                    aria-label={`${s.name} quantity`}
                  />
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => inc(s.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
                    aria-label={`Increase ${s.name}`}
                  >
                    +
                  </button>
                </div>

                <div className="text-sm text-gray-600">
                  Unit: {formatCurrency(unitPrice)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      )}

      {showSummaryTotal && (
        <div className="mt-4 flex items-center justify-end border-t pt-3">
          <div className="text-base">
            <span className="mr-2 text-gray-700">Total:</span>
            <span className="font-semibold">{formatCurrency(overallTotal)}</span>
          </div>
        </div>
      )}
    </div>
  )
}


