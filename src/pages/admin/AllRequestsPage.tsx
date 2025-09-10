import { useState } from 'react'
import RequestManagement from '../../components/admin/RequestManagement.tsx'
import RequestDetails, { type RequestWithServices } from '../../components/RequestDetails.tsx'

export default function AllRequestsPage() {
  const [selectedRequest, setSelectedRequest] = useState<RequestWithServices | null>(null)

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">All Requests</h1>
      
      <RequestManagement 
        onRequestSelect={setSelectedRequest}
      />

      {selectedRequest && (
        <RequestDetails
          request={selectedRequest}
          asModal={true}
          onClose={() => setSelectedRequest(null)}
          onStatusUpdated={(status) => {
            setSelectedRequest({ ...selectedRequest, status })
          }}
        />
      )}
    </div>
  )
}


