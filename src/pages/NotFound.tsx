import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold tracking-tight">404</h1>
      <p className="mt-2 text-lg text-gray-700">Page not found</p>
      <p className="mt-1 text-gray-600">The page you are looking for might have been moved or deleted.</p>
      <Link to="/" className="mt-6 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Go home</Link>
    </div>
  )
}


