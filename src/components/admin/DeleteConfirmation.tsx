export interface DeleteConfirmationProps {
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function DeleteConfirmation(props: DeleteConfirmationProps) {
  const { title = 'Delete item', message = 'Are you sure? This action cannot be undone.', confirmText = 'Delete', cancelText = 'Cancel', onConfirm, onCancel } = props
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-lg border bg-white p-4 shadow-lg">
        <h2 className="mb-2 text-lg font-medium">{title}</h2>
        <p className="mb-4 text-sm text-gray-700">{message}</p>
        <div className="flex items-center justify-end gap-2">
          <button className="rounded border px-3 py-2 hover:bg-gray-50" onClick={onCancel}>{cancelText}</button>
          <button className="rounded bg-red-600 px-3 py-2 text-white hover:bg-red-700" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  )
}


