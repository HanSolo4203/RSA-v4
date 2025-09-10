import { useEffect, useMemo, useState } from 'react'
import { supabase, updateRequest, getRequestWithServices } from '../../lib/supabase.ts'
// Removed skeleton components
import { useToast } from '../../components/ToastProvider.tsx'
import RequestDetails, { type RequestWithServices } from '../../components/RequestDetails.tsx'
import type { Row } from '../../types/database.ts'

type RequestRow = Row<'laundry_requests'>
type RequestServiceRow = Row<'request_services'>
type ServiceRow = Row<'laundry_services'>

type PendingWithServices = RequestRow & { request_services: RequestServiceRow[] }

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
}

function startOfMonthISO(): string {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function todayISODate(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [pendingCount, setPendingCount] = useState<number>(0)
  const [todayCount, setTodayCount] = useState<number>(0)
  const [monthRevenue, setMonthRevenue] = useState<number>(0)
  const [mostRequestedService, setMostRequestedService] = useState<string>('—')

  const [pendingRequests, setPendingRequests] = useState<PendingWithServices[]>([])
  const [recentRequests, setRecentRequests] = useState<RequestRow[]>([])
  const [selectedRequest, setSelectedRequest] = useState<RequestWithServices | null>(null)

  async function loadData() {
    try {
      setError(null)
      setLoading(true)

      const today = todayISODate()
      const monthStart = startOfMonthISO()

      const [pendingRes, todayRes, revenueRes, mostRes, pendingListRes, recentRes] = await Promise.all([
        supabase.from('laundry_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('laundry_requests').select('*', { count: 'exact', head: true }).eq('pickup_date', today),
        supabase
          .from('laundry_requests')
          .select('total_estimated_cost')
          .gte('created_at', monthStart),
        supabase
          .from('request_services')
          .select('service_id, quantity'),
        supabase
          .from('laundry_requests')
          .select('*, request_services(*)')
          .eq('status', 'pending')
          .order('pickup_date', { ascending: true })
          .limit(50),
        supabase
          .from('laundry_requests')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      if (pendingRes.error) throw new Error(pendingRes.error.message)
      if (todayRes.error) throw new Error(todayRes.error.message)
      if (revenueRes.error) throw new Error(revenueRes.error.message)
      if (mostRes.error) throw new Error(mostRes.error.message)
      if (pendingListRes.error) throw new Error(pendingListRes.error.message)
      if (recentRes.error) throw new Error(recentRes.error.message)

      setPendingCount(pendingRes.count || 0)
      setTodayCount(todayRes.count || 0)
      const monthSum = (revenueRes.data || []).reduce((acc, r: any) => acc + Number(r.total_estimated_cost || 0), 0)
      setMonthRevenue(monthSum)

      // Compute most requested service by total quantity
      const qtyByService = new Map<string, number>()
      for (const r of mostRes.data || []) {
        const sid = (r as any).service_id as string
        const q = Number((r as any).quantity || 0)
        qtyByService.set(sid, (qtyByService.get(sid) || 0) + q)
      }
      let topServiceId: string | null = null
      let topQty = 0
      for (const [sid, q] of qtyByService) {
        if (q > topQty) {
          topQty = q
          topServiceId = sid
        }
      }
      if (topServiceId) {
        const svc = await supabase.from('laundry_services').select('name').eq('id', topServiceId).single()
        if (!svc.error && svc.data) setMostRequestedService((svc.data as ServiceRow).name)
        else setMostRequestedService('—')
      } else {
        setMostRequestedService('—')
      }

      setPendingRequests((pendingListRes.data || []) as any)
      setRecentRequests((recentRes.data || []) as any)
    } catch (e: any) {
      setError(e?.message || 'Failed to load dashboard data')
      setPendingRequests([])
      setRecentRequests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const id = setInterval(loadData, 30000)
    return () => clearInterval(id)
  }, [])

  const pendingRows = useMemo(() => pendingRequests, [pendingRequests])

  async function markConfirmed(id: string) {
    try {
      const res = await updateRequest(id, { status: 'confirmed' } as any)
      if (!res.ok) throw new Error(res.error)
      await loadData()
      toast.show('Request marked as confirmed', 'success')
    } catch (e: any) {
      // eslint-disable-next-line no-alert
      toast.show(e?.message || 'Failed to mark as confirmed', 'error')
    }
  }

  const toast = useToast()

  async function handleViewDetails(requestId: string) {
    try {
      const res = await getRequestWithServices(requestId)
      if (!res.ok) throw new Error(res.error)
      setSelectedRequest(res.data)
    } catch (e: any) {
      toast.show(e?.message || 'Failed to load request details', 'error')
    }
  }

  function handleStatusUpdated(status: RequestRow['status']) {
    if (selectedRequest) {
      setSelectedRequest({ ...selectedRequest, status })
    }
    loadData() // Refresh the dashboard data
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Admin Dashboard</h1>
      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-600">Pending Requests</div>
          <div className="mt-2 text-2xl font-semibold">{loading ? '…' : pendingCount}</div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-600">Today's Requests</div>
          <div className="mt-2 text-2xl font-semibold">{loading ? '…' : todayCount}</div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-600">Revenue This Month</div>
          <div className="mt-2 text-2xl font-semibold">{loading ? '…' : formatCurrency(monthRevenue)}</div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-600">Most Requested Service</div>
          <div className="mt-2 truncate text-2xl font-semibold">{loading ? '…' : mostRequestedService}</div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="mb-3 text-lg font-medium">Pending Requests</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full bg-white text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Customer</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Pickup</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Services</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Total</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">Loading…</td>
                </tr>
              ) : pendingRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-gray-500">No pending requests</td>
                </tr>
              ) : (
                pendingRows.map((r) => {
                  const summary = (r.request_services || [])
                    .filter((x) => Number(x.quantity || 0) > 0)
                    .map((x) => `${x.quantity} × ${x.service_id.slice(0, 6)}…`)
                    .join(', ')
                  return (
                    <tr key={r.id} className="border-t">
                      <td className="px-3 py-2">
                        <div className="font-medium">{r.customer_name}</div>
                        <div className="text-gray-600">{r.customer_email} · {r.customer_phone}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div>{r.pickup_date}</div>
                        <div className="text-gray-600">{r.pickup_time_slot}</div>
                        <div className="text-gray-600">{r.pickup_address}</div>
                      </td>
                      <td className="px-3 py-2">{summary || '—'}</td>
                      <td className="px-3 py-2 font-medium">{formatCurrency(Number(r.total_estimated_cost || 0))}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <button 
                            className="rounded border px-2 py-1 hover:bg-gray-50"
                            onClick={() => handleViewDetails(r.id)}
                          >
                            View Details
                          </button>
                          <button
                            className="rounded bg-green-600 px-2 py-1 text-white hover:bg-green-700"
                            onClick={() => markConfirmed(r.id)}
                          >
                            Mark Confirmed
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Recent Requests</h2>
        <div className="divide-y rounded-lg border bg-white">
          {loading && recentRequests.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">Loading…</div>
          ) : recentRequests.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">No recent requests</div>
          ) : (
            recentRequests.map((r) => (
              <div key={r.id} className="p-4 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{r.customer_name}</div>
                    <div className="text-gray-600">{r.customer_email}</div>
                  </div>
                  <div className="text-gray-700">{formatCurrency(Number(r.total_estimated_cost || 0))}</div>
                </div>
                <div className="mt-1 text-gray-600">{new Date(r.created_at as any).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedRequest && (
        <RequestDetails
          request={selectedRequest}
          asModal={true}
          onClose={() => setSelectedRequest(null)}
          onStatusUpdated={handleStatusUpdated}
        />
      )}
    </div>
  )
}

