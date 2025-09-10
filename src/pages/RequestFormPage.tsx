import { useForm } from 'react-hook-form'

type RequestFormInputs = {
  name: string
  phone: string
  address: string
  service: string
  notes?: string
}

export default function RequestFormPage() {
  const { register, handleSubmit, reset } = useForm<RequestFormInputs>()

  function onSubmit(data: RequestFormInputs) {
    // Placeholder submit
    // eslint-disable-next-line no-console
    console.log('Request submitted', data)
    reset()
  }

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-2xl font-semibold">Customer Request</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input {...register('name', { required: true })} className="w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input {...register('phone', { required: true })} className="w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <input {...register('address', { required: true })} className="w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Service</label>
          <select {...register('service', { required: true })} className="w-full rounded border px-3 py-2">
            <option value="wash-fold">Wash & Fold</option>
            <option value="dry-clean">Dry Clean</option>
            <option value="ironing">Ironing</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea {...register('notes')} className="w-full rounded border px-3 py-2" rows={3} />
        </div>
        <button type="submit" className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Submit Request</button>
      </form>
    </div>
  )
}


