export default function Hero({ title, subtitle, badges = [] }: { title: string; subtitle?: string; badges?: string[] }) {
  return (
    <div className="mb-6 rounded-xl border bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-sm">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-gray-700">{subtitle}</p>}
      {badges.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-700">
          {badges.map((b, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-white px-2 py-1">{b}</span>
          ))}
        </div>
      )}
    </div>
  )
}


