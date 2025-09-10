import { Route, Routes, Link } from 'react-router-dom'
import CustomerRequest from './pages/CustomerRequest.tsx'
import AdminDashboardPage from './pages/admin/AdminDashboardPage.tsx'
import ServiceManagementPage from './pages/admin/ServiceManagementPage.tsx'
import AllRequestsPage from './pages/admin/AllRequestsPage.tsx'
import RequestDetailsPage from './pages/admin/RequestDetailsPage.tsx'
import AdminLayout from './components/AdminLayout.tsx'
import NotFound from './pages/NotFound.tsx'

function App() {
  return (
    <div className="min-h-screen text-gray-900">
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-semibold tracking-tight text-gray-900">Laundry Service</Link>
          <nav className="flex items-center gap-2 text-sm" aria-label="Primary">
            <Link to="/" className="rounded px-3 py-1.5 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">Request</Link>
            <Link to="/admin" className="rounded px-3 py-1.5 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">Admin</Link>
            <Link to="/admin/services" className="rounded px-3 py-1.5 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">Services</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<CustomerRequest />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="services" element={<ServiceManagementPage />} />
            <Route path="requests" element={<AllRequestsPage />} />
            <Route path="requests/:id" element={<RequestDetailsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="mt-8 border-t bg-white/70">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-gray-600">
          © {new Date().getFullYear()} Laundry Service. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

export default App
