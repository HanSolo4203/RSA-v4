import { useEffect, useState, useMemo } from 'react'
import { supabase, updateRequest } from '../../lib/supabase.ts'
import { sendStatusUpdateEmail } from '../../lib/emailService.ts'
import { useToast } from '../ToastProvider.tsx'
import type { Row } from '../../types/database.ts'

type RequestRow = Row<'laundry_requests'>
type RequestServiceRow = Row<'request_services'>
type ServiceRow = Row<'laundry_services'>

type RequestWithServices = RequestRow & { request_services: RequestServiceRow[] }

interface RequestManagementProps {
  onRequestSelect?: (request: RequestWithServices) => void
}

const STATUS_OPTIONS: RequestRow['status'][] = ['pending', 'confirmed', 'in_progress', 'completed']
const STATUS_LABELS: Record<RequestRow['status'], string> = {
  pending: 'Pending',
  confirmed: 'Confirmed', 
  in_progress: 'In Progress',
  completed: 'Completed'
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString()
}

// Email function using the email service
async function sendStatusUpdateNotification(request: RequestWithServices, status: string): Promise<void> {
  try {
    const result = await sendStatusUpdateEmail({
      customerName: request.customer_name,
      customerEmail: request.customer_email,
      requestId: request.id,
      status: status as any,
      pickupDate: request.pickup_date,
      pickupTime: request.pickup_time_slot,
      totalCost: Number(request.total_estimated_cost || 0),
      specialInstructions: request.special_instructions || undefined
    })
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to send email')
    }
  } catch (error) {
    console.error('Email sending failed:', error)
    throw error
  }
}

// CSV Export function
function exportToCSV(requests: RequestWithServices[], filename: string = 'laundry_requests.csv'): void {
  const headers = [
    'ID',
    'Customer Name',
    'Customer Email', 
    'Customer Phone',
    'Pickup Date',
    'Pickup Time',
    'Pickup Address',
    'Status',
    'Total Cost',
    'Special Instructions',
    'Internal Notes',
    'Created At'
  ]
  
  const rows = requests.map(request => [
    request.id,
    request.customer_name,
    request.customer_email,
    request.customer_phone,
    request.pickup_date,
    request.pickup_time_slot,
    request.pickup_address,
    request.status,
    request.total_estimated_cost || 0,
    request.special_instructions || '',
    request.internal_notes || '',
    new Date(request.created_at as any).toLocaleString()
  ])
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default function RequestManagement({ onRequestSelect }: RequestManagementProps) {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<RequestWithServices[]>([])
  const [serviceMap, setServiceMap] = useState<Record<string, ServiceRow>>({})
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<RequestRow['status'] | 'all'>('all')
  const [dateFilter, setDateFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Batch operations
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set())
  const [batchStatus, setBatchStatus] = useState<RequestRow['status']>('confirmed')
  const [batchNotes, setBatchNotes] = useState('')
  const [showBatchPanel, setShowBatchPanel] = useState(false)
  
  // Individual request editing
  const [editingRequest, setEditingRequest] = useState<string | null>(null)
  const [editNotes, setEditNotes] = useState('')
  const [editStatus, setEditStatus] = useState<RequestRow['status']>('pending')

  // Load data
  useEffect(() => {
    loadRequests()
  }, [])

  async function loadRequests() {
    try {
      setLoading(true)
      const [requestsRes, servicesRes] = await Promise.all([
        supabase
          .from('laundry_requests')
          .select('*, request_services(*)')
          .order('created_at', { ascending: false }),
        supabase
          .from('laundry_services')
          .select('id, name')
      ])

      if (requestsRes.error) throw new Error(requestsRes.error.message)
      if (servicesRes.error) throw new Error(servicesRes.error.message)

      setRequests((requestsRes.data || []) as any)
      
      // Build service map
      const map: Record<string, ServiceRow> = {}
      for (const service of servicesRes.data || []) {
        map[service.id] = service as ServiceRow
      }
      setServiceMap(map)
    } catch (e: any) {
      toast.show(e?.message || 'Failed to load requests', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      // Status filter
      if (statusFilter !== 'all' && request.status !== statusFilter) return false
      
      // Date filter
      if (dateFilter && request.pickup_date !== dateFilter) return false
      
      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        return (
          request.customer_name.toLowerCase().includes(term) ||
          request.customer_email.toLowerCase().includes(term) ||
          request.customer_phone.includes(term) ||
          request.id.toLowerCase().includes(term)
        )
      }
      
      return true
    })
  }, [requests, statusFilter, dateFilter, searchTerm])

  // Update single request
  async function updateSingleRequest(requestId: string, updates: Partial<RequestRow>) {
    try {
      const res = await updateRequest(requestId, updates as any)
      if (!res.ok) throw new Error(res.error)
      
      // Update local state
      setRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, ...updates } : req
      ))
      
      toast.show('Request updated successfully', 'success')
      
      // Send email if status changed
      if (updates.status) {
        const request = requests.find(r => r.id === requestId)
        if (request) {
          try {
            await sendStatusUpdateNotification(request, updates.status)
            toast.show('Status update email sent', 'success')
          } catch (e: any) {
            toast.show(`Status updated but email failed: ${e.message}`, 'error')
          }
        }
      }
    } catch (e: any) {
      toast.show(e?.message || 'Failed to update request', 'error')
    }
  }

  // Batch operations
  async function handleBatchStatusUpdate() {
    if (selectedRequests.size === 0) return
    
    try {
      const promises = Array.from(selectedRequests).map(requestId => 
        updateRequest(requestId, { 
          status: batchStatus,
          internal_notes: batchNotes || undefined
        } as any)
      )
      
      const results = await Promise.all(promises)
      const failed = results.filter(r => !r.ok)
      
      if (failed.length === 0) {
        toast.show(`Updated ${selectedRequests.size} requests successfully`, 'success')
        setSelectedRequests(new Set())
        setShowBatchPanel(false)
        setBatchNotes('')
        await loadRequests()
      } else {
        toast.show(`Updated ${results.length - failed.length} requests, ${failed.length} failed`, 'error')
      }
    } catch (e: any) {
      toast.show(e?.message || 'Failed to update requests', 'error')
    }
  }

  function handleSelectAll() {
    if (selectedRequests.size === filteredRequests.length) {
      setSelectedRequests(new Set())
    } else {
      setSelectedRequests(new Set(filteredRequests.map(r => r.id)))
    }
  }

  function handleSelectRequest(requestId: string) {
    const newSelected = new Set(selectedRequests)
    if (newSelected.has(requestId)) {
      newSelected.delete(requestId)
    } else {
      newSelected.add(requestId)
    }
    setSelectedRequests(newSelected)
  }

  function startEditRequest(request: RequestWithServices) {
    setEditingRequest(request.id)
    setEditNotes(request.internal_notes || '')
    setEditStatus(request.status)
  }

  async function saveEditRequest() {
    if (!editingRequest) return
    
    await updateSingleRequest(editingRequest, {
      status: editStatus,
      internal_notes: editNotes
    })
    
    setEditingRequest(null)
    setEditNotes('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-lg font-medium">Loading requests...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with filters and actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Request Management</h2>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded bg-green-600 px-3 py-2 text-white hover:bg-green-700"
            onClick={() => exportToCSV(filteredRequests)}
          >
            Export CSV
          </button>
          {selectedRequests.size > 0 && (
            <button
              className="rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
              onClick={() => setShowBatchPanel(true)}
            >
              Batch Actions ({selectedRequests.size})
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>{STATUS_LABELS[status]}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
          <input
            type="date"
            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
        
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            placeholder="Search by name, email, phone, or ID..."
            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Batch Actions Panel */}
      {showBatchPanel && (
        <div className="rounded border bg-blue-50 p-4">
          <h3 className="mb-3 font-medium">Batch Actions for {selectedRequests.size} requests</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={batchStatus}
                onChange={(e) => setBatchStatus(e.target.value as RequestRow['status'])}
              >
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Internal Notes</label>
              <input
                type="text"
                placeholder="Add notes for all selected requests..."
                className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={batchNotes}
                onChange={(e) => setBatchNotes(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                onClick={handleBatchStatusUpdate}
              >
                Update All
              </button>
              <button
                className="rounded border px-4 py-2 hover:bg-gray-50"
                onClick={() => setShowBatchPanel(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Showing {filteredRequests.length} of {requests.length} requests
      </div>

      {/* Requests table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">
                <input
                  type="checkbox"
                  checked={selectedRequests.size === filteredRequests.length && filteredRequests.length > 0}
                  onChange={handleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Customer</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Pickup</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Status</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Total</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Notes</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                  No requests found
                </td>
              </tr>
            ) : (
              filteredRequests.map((request) => (
                <tr key={request.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedRequests.has(request.id)}
                      onChange={() => handleSelectRequest(request.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{request.customer_name}</div>
                    <div className="text-gray-600">{request.customer_email}</div>
                    <div className="text-gray-600">{request.customer_phone}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div>{formatDate(request.pickup_date)}</div>
                    <div className="text-gray-600">{request.pickup_time_slot}</div>
                    <div className="text-gray-600 truncate max-w-xs">{request.pickup_address}</div>
                  </td>
                  <td className="px-3 py-2">
                    {editingRequest === request.id ? (
                      <select
                        className="rounded border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as RequestRow['status'])}
                      >
                        {STATUS_OPTIONS.map(status => (
                          <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        request.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {STATUS_LABELS[request.status]}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-medium">
                    {formatCurrency(Number(request.total_estimated_cost || 0))}
                  </td>
                  <td className="px-3 py-2">
                    {editingRequest === request.id ? (
                      <input
                        type="text"
                        placeholder="Internal notes..."
                        className="w-full rounded border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                      />
                    ) : (
                      <div className="max-w-xs truncate text-gray-600">
                        {request.internal_notes || '—'}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      {editingRequest === request.id ? (
                        <>
                          <button
                            className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                            onClick={saveEditRequest}
                          >
                            Save
                          </button>
                          <button
                            className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                            onClick={() => setEditingRequest(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                            onClick={() => startEditRequest(request)}
                          >
                            Edit
                          </button>
                          <button
                            className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                            onClick={() => onRequestSelect?.(request)}
                          >
                            View
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
