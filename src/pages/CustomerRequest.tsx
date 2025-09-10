import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { listActiveServices, createLaundryRequest, addRequestService } from '../lib/supabase.ts'
import ServiceSelector, { type ServiceQuantities } from '../components/ServiceSelector.tsx'
import type { Row } from '../types/database.ts'
import { useToast } from '../components/ToastProvider.tsx'
import Hero from '../components/Hero.tsx'
import Stepper from '../components/Stepper.tsx'

type Service = Row<'laundry_services'>

type FormInputs = {
  fullName: string
  email: string
  phone: string
  address: string
  pickupDate: string
  pickupTime: 'morning' | 'afternoon' | 'evening'
  notes?: string
  quantities: Record<string, number>
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value)
}

function getTomorrowISO(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

function getTwoWeeksISO(): string {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

export default function CustomerRequest() {
  const [services, setServices] = useState<Service[] | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormInputs>({
    defaultValues: {
      pickupTime: 'morning',
      quantities: {},
    },
  })

  const quantities: ServiceQuantities = watch('quantities') || {}

  useEffect(() => {
    async function load() {
      const res = await listActiveServices()
      if (res.ok) {
        setServices(res.data)
      } else {
        setServices([])
        // eslint-disable-next-line no-console
        console.error(res.error)
      }
    }
    load()
  }, [])

  const items = services ?? []

  const lineTotals = useMemo(() => {
    return items.map((s) => {
      const qty = Math.max(0, Number(quantities[s.id] || 0))
      const price = Number(s.price_per_item ?? s.price_per_pound ?? '0')
      return qty * price
    })
  }, [items, quantities])

  const total = useMemo(() => lineTotals.reduce((a, b) => a + b, 0), [lineTotals])
  const toast = useToast()

  async function onSubmit(data: FormInputs) {
    try {
      setSubmitError(null)
      setSubmitSuccess(null)
      setSubmitLoading(true)

      // Validate at least one service selected
      const selected = items.filter((s) => Number(data.quantities?.[s.id] || 0) > 0)
      if (selected.length === 0) {
        setSubmitError('Please select at least one service with quantity > 0.')
        return
      }

      const payload = {
        customer_name: data.fullName,
        customer_email: data.email,
        customer_phone: data.phone,
        pickup_address: data.address,
        pickup_date: data.pickupDate,
        pickup_time_slot:
          data.pickupTime === 'morning' ? 'Morning 8-12' : data.pickupTime === 'afternoon' ? 'Afternoon 12-16' : 'Evening 16-20',
        special_instructions: data.notes ?? null,
        status: 'pending' as const,
        total_estimated_cost: total.toFixed(2),
      }

      const created = await createLaundryRequest(payload as any)
      if (!created.ok) throw new Error(created.error)

      // Insert all selected services. If any fail, attempt to rollback the request.
      await Promise.all(
        selected.map(async (s) => {
          const qty = Number(data.quantities?.[s.id] || 0)
          const price = Number(s.price_per_item ?? s.price_per_pound ?? '0')
          const estimated_cost = (qty * price).toFixed(2)
          const rs = await addRequestService({
            request_id: created.data.id,
            service_id: s.id,
            quantity: qty,
            estimated_cost,
          } as any)
          if (!rs.ok) throw new Error(rs.error)
          return rs
        })
      )

      setSubmitSuccess('Request submitted successfully!')
      toast.show('Request submitted successfully!', 'success')
      reset()
    } catch (e: any) {
      setSubmitError(e.message || 'Something went wrong')
      toast.show(e.message || 'Submission failed', 'error')
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Hero
        title="Laundry Pickup Request"
        subtitle="Book a convenient pickup and we’ll handle the rest. Transparent pricing and fast turnaround."
        badges={["✓ Next-day pickup", "✓ Secure order", "✓ Clear pricing"]}
      />

      <Stepper steps={["Customer", "Pickup", "Services", "Review"]} current={0} />

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <fieldset disabled={submitLoading} className="contents">
        <section className="md:col-span-2 space-y-6">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-medium">Customer Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Full Name</label>
                <input
                  placeholder="e.g. Alex Johnson"
                  className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('fullName', { required: 'Full name is required' })}
                />
                {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
                  })}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Phone Number</label>
                <input
                  placeholder="e.g. (555) 123-4567"
                  className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('phone', { required: 'Phone number is required' })}
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-medium">Pickup Details</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Full Address</label>
                <input
                  placeholder="Street, City, ZIP"
                  className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('address', { required: 'Address is required' })}
                />
                {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Pickup Date</label>
                <input
                  type="date"
                  min={getTomorrowISO()}
                  max={getTwoWeeksISO()}
                  className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('pickupDate', { required: 'Pickup date is required' })}
                />
                {errors.pickupDate && <p className="mt-1 text-sm text-red-600">{errors.pickupDate.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Time Slot</label>
                <select className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" {...register('pickupTime', { required: true })}>
                  <option value="morning">Morning 8-12</option>
                  <option value="afternoon">Afternoon 12-16</option>
                  <option value="evening">Evening 16-20</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <ServiceSelector
              value={quantities}
              onChange={(next) => setValue('quantities', next, { shouldDirty: true, shouldTouch: true })}
            />
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-lg font-medium">Additional Information</h2>
            <textarea
              rows={4}
              className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Special instructions (optional)"
              {...register('notes')}
            />
          </div>
        </section>

        <aside className="md:col-span-1">
          <div className="sticky top-4 rounded-lg border bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-medium">Order Summary</h2>
            <div className="space-y-2 text-sm">
              {items
                .filter((s) => Number(quantities?.[s.id] || 0) > 0)
                .map((s) => {
                  const qty = Math.max(0, Number(quantities?.[s.id] || 0))
                  const price = Number(s.price_per_item ?? s.price_per_pound ?? '0')
                  const lineTotal = qty * price
                  return (
                    <div key={s.id} className="flex items-center justify-between">
                      <span>{s.name} × {qty}</span>
                      <span className="font-medium">{formatCurrency(lineTotal)}</span>
                    </div>
                  )
                })}
            </div>
            <div className="mt-4 flex items-center justify-between border-t pt-3">
              <span className="text-base">Total</span>
              <span className="text-base font-semibold">{formatCurrency(total)}</span>
            </div>

            {submitError && <p className="mt-3 text-sm text-red-600" aria-live="assertive">{submitError}</p>}
            {submitSuccess && <p className="mt-3 text-sm text-green-700" aria-live="polite">{submitSuccess}</p>}

            <button
              type="submit"
              disabled={submitLoading}
              className="mt-4 inline-flex w-full items-center justify-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitLoading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Submitting…
                </span>
              ) : (
                'Submit Request'
              )}
            </button>
          </div>
        </aside>
        </fieldset>
      </form>
    </div>
  )
}


