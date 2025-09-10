import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

type Toast = { id: string; message: string; type?: 'success' | 'error' | 'info' }

type ToastContextValue = {
  toasts: Toast[]
  show: (message: string, type?: Toast['type']) => void
  remove: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const remove = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const show = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = String(++idRef.current)
    setToasts((t) => [...t, { id, message, type }])
    // Auto-dismiss after 4s
    window.setTimeout(() => remove(id), 4000)
  }, [remove])

  const value = useMemo(() => ({ toasts, show, remove }), [toasts, show, remove])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" aria-atomic="true" className="pointer-events-none fixed inset-0 z-50 flex flex-col items-end gap-2 p-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto w-full max-w-sm rounded border px-4 py-3 text-sm shadow-lg ${
              t.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' :
              t.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' :
              'border-gray-200 bg-white text-gray-900'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}


