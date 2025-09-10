import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase.ts'
import type { Row } from '../../types/database.ts'
import { useToast } from '../../components/ToastProvider.tsx'
import ServiceForm, { type ServiceFormValues } from '../../components/admin/ServiceForm.tsx'
import ServiceTable from '../../components/admin/ServiceTable.tsx'
import DeleteConfirmation from '../../components/admin/DeleteConfirmation.tsx'

type Service = Row<'laundry_services'>

type ServiceForm = {
  id?: string
  name: string
  description?: string | null
  price_per_item?: string | number | null
  price_per_pound?: string | number | null
  is_active: boolean
}

function emptyForm(): ServiceForm {
  return { name: '', description: '', price_per_item: '', price_per_pound: '', is_active: true }
}

export default function ServiceManagementPage() {
  const toast = useToast()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<ServiceForm>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null)

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const res = await supabase.from('laundry_services').select('*').order('created_at', { ascending: false })
      if (res.error) throw new Error(res.error.message)
      setServices((res.data as Service[]) || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load services')
      setServices([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return services
    return services.filter((s) =>
      s.name.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q)
    )
  }, [services, search])

  function openCreate() {
    setForm(emptyForm())
    setShowModal(true)
  }

  function openEdit(s: Service) {
    setForm({
      id: s.id,
      name: s.name,
      description: s.description || '',
      price_per_item: s.price_per_item ?? '',
      price_per_pound: s.price_per_pound ?? '',
      is_active: Boolean(s.is_active),
    })
    setShowModal(true)
  }

  // validation moved into ServiceForm

  async function submitService(values: ServiceFormValues) {
    const payload: any = {
      name: values.name.trim(),
      description: values.description?.toString().trim() || null,
      price_per_item: values.price_per_item ?? null,
      price_per_pound: values.price_per_pound ?? null,
      is_active: values.is_active,
    }
    try {
      setSaving(true)
      if (form.id) {
        const prev = services
        const idx = prev.findIndex((s) => s.id === form.id)
        const optimistic = [...prev]
        optimistic[idx] = { ...prev[idx], ...payload }
        setServices(optimistic)

        const res = await supabase.from('laundry_services').update(payload).eq('id', form.id).select('*').single()
        if (res.error) throw new Error(res.error.message)
        toast.show('Service updated', 'success')
      } else {
        const res = await supabase.from('laundry_services').insert(payload).select('*').single()
        if (res.error) throw new Error(res.error.message)
        setServices((s) => [res.data as Service, ...s])
        toast.show('Service created', 'success')
      }
      setShowModal(false)
    } catch (e: any) {
      toast.show(e?.message || 'Failed to save service', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(s: Service) {
    const nextActive = !s.is_active
    // optimistic
    setServices((list) => list.map((x) => (x.id === s.id ? { ...x, is_active: nextActive } : x)))
    const res = await supabase.from('laundry_services').update({ is_active: nextActive }).eq('id', s.id)
    if (res.error) {
      // revert
      setServices((list) => list.map((x) => (x.id === s.id ? { ...x, is_active: s.is_active } : x)))
      toast.show(res.error.message, 'error')
    } else {
      toast.show(nextActive ? 'Service activated' : 'Service archived', 'success')
    }
  }

  async function removeServiceConfirmed() {
    if (!deleteTarget) return
    const s = deleteTarget
    const prev = services
    setServices((list) => list.filter((x) => x.id !== s.id))
    const res = await supabase.from('laundry_services').delete().eq('id', s.id)
    if (res.error) {
      setServices(prev)
      toast.show(res.error.message, 'error')
    } else {
      toast.show('Service deleted', 'success')
    }
    setDeleteTarget(null)
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Service Management</h1>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-600">Manage your laundry services</div>
        <button
          className="inline-flex items-center justify-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={openCreate}
        >
          + Add Service
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <ServiceTable
        services={filtered}
        loading={loading}
        search={search}
        onSearchChange={setSearch}
        onEdit={openEdit}
        onDelete={(s) => setDeleteTarget(s)}
        onToggleActive={toggleActive}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-lg border bg-white p-4 shadow-lg">
            <h2 className="mb-3 text-lg font-medium">{form.id ? 'Edit Service' : 'Add Service'}</h2>
            <ServiceForm
              initialValues={{
                name: form.name,
                description: form.description || '',
                price_per_item: form.price_per_item === '' ? undefined : Number(form.price_per_item),
                price_per_pound: form.price_per_pound === '' ? undefined : Number(form.price_per_pound),
                is_active: form.is_active,
              }}
              saving={saving}
              onSubmit={submitService}
              onCancel={() => setShowModal(false)}
            />
          </div>
        </div>
      )}

      {deleteTarget && (
        <DeleteConfirmation
          title="Delete service"
          message={`Delete service "${deleteTarget.name}"? This cannot be undone.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={removeServiceConfirmed}
        />
      )}
    </div>
  )
}


