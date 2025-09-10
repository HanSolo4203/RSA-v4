import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRequestWithServices } from '../../lib/supabase.ts'
import RequestDetails, { type RequestWithServices } from '../../components/RequestDetails.tsx'
import { useToast } from '../../components/ToastProvider.tsx'
import type { Row } from '../../types/database.ts'

type RequestRow = Row<'laundry_requests'>

export default function RequestDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const [request, setRequest] = useState<RequestWithServices | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setError('Request ID is required')
      setLoading(false)
      return
    }

    async function loadRequest() {
      try {
        setLoading(true)
        setError(null)
        const res = await getRequestWithServices(id)
        if (!res.ok) throw new Error(res.error)
        setRequest(res.data)
      } catch (e: any) {
        setError(e?.message || 'Failed to load request')
        toast.show(e?.message || 'Failed to load request', 'error')
      } finally {
        setLoading(false)
      }
    }

    loadRequest()
  }, [id, toast])

  function handleStatusUpdated(status: RequestRow['status']) {
    if (request) {
      setRequest({ ...request, status })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-lg font-medium">Loading request details...</div>
          <div className="mt-2 text-sm text-gray-600">Please wait while we fetch the information.</div>
        </div>
      </div>
    )
  }

  if (error || !request) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-lg font-medium text-red-600">Error loading request</div>
          <div className="mt-2 text-sm text-gray-600">{error || 'Request not found'}</div>
          <button
            className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            onClick={() => navigate('/admin')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Request Details</h1>
        <button
          className="rounded border px-3 py-2 hover:bg-gray-50"
          onClick={() => navigate('/admin')}
        >
          Back to Dashboard
        </button>
      </div>
      
      <RequestDetails
        request={request}
        asModal={false}
        onStatusUpdated={handleStatusUpdated}
      />
    </div>
  )
}
