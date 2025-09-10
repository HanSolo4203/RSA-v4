import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type { Row } from '../../types/database.ts'

export type Service = Row<'laundry_services'>

export type ServiceFormValues = {
  name: string
  description?: string | null
  price_per_item?: number | null
  price_per_pound?: number | null
  is_active: boolean
}

export interface ServiceFormProps {
  initialValues?: Partial<ServiceFormValues>
  saving?: boolean
  onSubmit: (values: ServiceFormValues) => Promise<void> | void
  onCancel?: () => void
  className?: string
}

export default function ServiceForm(props: ServiceFormProps) {
  const { initialValues, onSubmit, onCancel, saving = false, className } = props

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
  } = useForm<ServiceFormValues>({
    defaultValues: {
      name: '',
      description: '',
      price_per_item: undefined,
      price_per_pound: undefined,
      is_active: true,
      ...initialValues,
    },
  })

  const priceItem = watch('price_per_item')
  const pricePound = watch('price_per_pound')

  useEffect(() => {
    if (initialValues) {
      for (const [k, v] of Object.entries(initialValues)) {
        // @ts-expect-error dynamic set
        setValue(k, v as any, { shouldDirty: false })
      }
    }
  }, [initialValues, setValue])

  function validateAtLeastOnePrice(values: ServiceFormValues): string | null {
    const hasItem = typeof values.price_per_item === 'number' && !isNaN(values.price_per_item)
    const hasPound = typeof values.price_per_pound === 'number' && !isNaN(values.price_per_pound)
    if (!hasItem && !hasPound) return 'Provide at least one price.'
    if (hasItem && (values.price_per_item as number) < 0) return 'Price per item must be non-negative.'
    if (hasPound && (values.price_per_pound as number) < 0) return 'Price per pound must be non-negative.'
    return null
  }

  const onSubmitInternal = async (values: ServiceFormValues) => {
    const err = validateAtLeastOnePrice(values)
    if (err) {
      // surfacing via HTML errors is possible, but we keep it simple
      alert(err)
      return
    }
    await onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit(onSubmitInternal)} className={className || 'space-y-3'}>
      <div>
        <label className="mb-1 block text-sm font-medium">Name</label>
        <input
          className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          {...register('name', { required: 'Name is required' })}
          aria-invalid={!!errors.name}
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          rows={3}
          className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          {...register('description')}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Price per item</label>
          <input
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register('price_per_item', {
              setValueAs: (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
              min: { value: 0, message: 'Must be ≥ 0' },
            })}
            aria-invalid={!!errors.price_per_item}
          />
          {errors.price_per_item && <p className="mt-1 text-sm text-red-600">{errors.price_per_item.message as string}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Price per pound</label>
          <input
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...register('price_per_pound', {
              setValueAs: (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
              min: { value: 0, message: 'Must be ≥ 0' },
            })}
            aria-invalid={!!errors.price_per_pound}
          />
          {errors.price_per_pound && <p className="mt-1 text-sm text-red-600">{errors.price_per_pound.message as string}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input id="is_active_switch" type="checkbox" {...register('is_active')} />
        <label htmlFor="is_active_switch" className="text-sm">Active</label>
      </div>
      <div className="mt-4 flex items-center justify-end gap-2">
        {onCancel && (
          <button type="button" className="rounded border px-3 py-2 hover:bg-gray-50" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      {(priceItem === undefined && pricePound === undefined) && (
        <p className="text-xs text-amber-700">Tip: Provide at least one price (per item or per pound).</p>
      )}
    </form>
  )
}


