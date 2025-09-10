import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, updateRequest } from '../lib/supabase.ts'
import type { Row } from '../types/database.ts'
import { useToast } from './ToastProvider.tsx'

export type RequestRow = Row<'laundry_requests'>
export type RequestServiceRow = Row<'request_services'>
export type ServiceRow = Row<'laundry_services'>

export type RequestWithServices = RequestRow & { request_services: RequestServiceRow[] }

export interface RequestDetailsProps {
  request: RequestWithServices
  asModal?: boolean
  onClose?: () => void
  onStatusUpdated?: (status: RequestRow['status']) => void
}

const STATUS_OPTIONS: RequestRow['status'][] = ['pending', 'confirmed', 'in_progress', 'completed']

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
}

export default function RequestDetails(props: RequestDetailsProps) {
  const { request, asModal = false, onClose, onStatusUpdated } = props
  const toast = useToast()
  const [status, setStatus] = useState<RequestRow['status']>(request.status)
  const [internalNotes, setInternalNotes] = useState(request.internal_notes || '')
  const [saving, setSaving] = useState(false)
  const [serviceMap, setServiceMap] = useState<Record<string, ServiceRow>>({})

  // Fetch service names for better display
  useEffect(() => {
    const ids = Array.from(new Set((request.request_services || []).map((rs) => rs.service_id)))
    if (ids.length === 0) return
    async function load() {
      const res = await supabase.from('laundry_services').select('id, name').in('id', ids)
      if (!res.error && res.data) {
        const map: Record<string, ServiceRow> = {}
        for (const s of res.data as ServiceRow[]) map[s.id] = s
        setServiceMap(map)
      }
    }
    load()
  }, [request])

  const services = request.request_services || []

  const computedTotal = useMemo(() => {
    if (!services.length) return 0
    return services.reduce((acc, rs) => acc + Number(rs.estimated_cost || 0), 0)
  }, [services])

  async function saveStatus() {
    try {
      setSaving(true)
      const res = await updateRequest(request.id, { 
        status,
        internal_notes: internalNotes || null
      } as any)
      if (!res.ok) throw new Error(res.error)
      toast.show('Request updated', 'success')
      onStatusUpdated?.(status)
    } catch (e: any) {
      toast.show(e?.message || 'Failed to update request', 'error')
    } finally {
      setSaving(false)
    }
  }

  const content = (
    <div className="w-full max-w-3xl rounded-lg border bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="text-xl font-semibold">Request Details</h2>
        <div className="flex gap-2">
          {asModal && (
            <Link
              to={`/admin/requests/${request.id}`}
              className="rounded border px-2 py-1 hover:bg-gray-50"
            >
              Open in Page
            </Link>
          )}
          {onClose && (
            <button className="rounded border px-2 py-1 hover:bg-gray-50" onClick={onClose} aria-label="Close details">Close</button>
          )}
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded border p-3">
          <h3 className="mb-2 text-sm font-medium text-gray-700">Customer</h3>
          <div className="text-sm">
            <div className="font-medium">{request.customer_name}</div>
            <div className="text-gray-700">{request.customer_email}</div>
            <div className="text-gray-700">{request.customer_phone}</div>
          </div>
        </div>
        <div className="rounded border p-3">
          <h3 className="mb-2 text-sm font-medium text-gray-700">Pickup</h3>
          <div className="text-sm">
            <div className="text-gray-900">{request.pickup_address}</div>
            <div className="text-gray-700">{request.pickup_date} • {request.pickup_time_slot}</div>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded border p-3">
        <h3 className="mb-2 text-sm font-medium text-gray-700">Selected Services</h3>
        {services.length === 0 ? (
          <div className="text-sm text-gray-600">No services selected.</div>
        ) : (
          <div className="divide-y text-sm">
            {services.map((rs) => {
              const name = serviceMap[rs.service_id]?.name || rs.service_id.slice(0, 6) + '…'
              return (
                <div key={rs.id} className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium">{name}</div>
                    <div className="text-gray-600">Quantity: {rs.quantity}</div>
                  </div>
                  <div className="font-medium">{formatCurrency(Number(rs.estimated_cost || 0))}</div>
                </div>
              )
            })}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm">
          <span className="text-gray-700">Total</span>
          <span className="text-base font-semibold">{formatCurrency(Number(request.total_estimated_cost || computedTotal || 0))}</span>
        </div>
      </section>

      {request.special_instructions && (
        <section className="mt-4 rounded border p-3">
          <h3 className="mb-2 text-sm font-medium text-gray-700">Special Instructions</h3>
          <p className="whitespace-pre-wrap text-sm text-gray-800">{request.special_instructions}</p>
        </section>
      )}

      <section className="mt-4 rounded border p-3">
        <h3 className="mb-2 text-sm font-medium text-gray-700">Internal Notes</h3>
        <textarea
          className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Add internal notes for this request..."
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
        />
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded border p-3">
          <h3 className="mb-2 text-sm font-medium text-gray-700">Status</h3>
          <div className="flex items-center gap-2">
            <select
              className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={status}
              onChange={(e) => setStatus(e.target.value as RequestRow['status'])}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              className="rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
              onClick={saveStatus}
              disabled={saving || (status === request.status && internalNotes === (request.internal_notes || ''))}
            >
              {saving ? 'Saving…' : 'Update'}
            </button>
          </div>
        </div>
        <div className="rounded border p-3 text-sm text-gray-700">
          <div><span className="font-medium">Request ID:</span> {request.id}</div>
          <div className="mt-1"><span className="font-medium">Created:</span> {new Date(request.created_at as any).toLocaleString()}</div>
        </div>
      </section>
    </div>
  )

  if (!asModal) return content
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true">
      {content}
    </div>
  )
}


