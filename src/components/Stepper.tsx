export default function Stepper({ steps, current = 0 }: { steps: string[]; current?: number }) {
  return (
    <nav aria-label="Progress" className="mb-6">
      <ol className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        {steps.map((s, i) => (
          <li
            key={i}
            className={`rounded-lg border p-2 text-center shadow-sm ${i === current ? 'bg-white font-medium text-blue-700' : 'bg-white text-gray-700'}`}
          >
            {i + 1}. {s}
          </li>
        ))}
      </ol>
    </nav>
  )
}


