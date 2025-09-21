import { ReactNode, useState } from 'react'
import { UserButton, useUser } from '@clerk/clerk-react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  FileText, 
  CheckSquare, 
  Settings,
  Upload
} from 'lucide-react'
import UploadModal from './UploadModal'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useUser()
  const location = useLocation()
  const [showUpload, setShowUpload] = useState(false)

  const userRole = user?.publicMetadata?.role as string || 'staff'

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    ...(userRole === 'admin' ? [{ name: 'Admin', href: '/admin', icon: Settings }] : [])
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="flex flex-col w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="flex items-center justify-center h-16 px-4 border-b border-gray-100">
          <Link to="/" className="focus:outline-none">
            <h1 className="text-2xl font-extrabold tracking-tight text-primary-700 hover:text-primary-600 transition-colors">KMRL DocAI</h1>
          </Link>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 text-base font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-100 text-primary-700 border-l-4 border-primary-600 shadow'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-primary-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-gray-100 mt-auto">
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.fullName || user?.emailAddresses[0]?.emailAddress}
              </p>
              <p className="text-xs text-gray-500 capitalize">{userRole}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow border-b border-gray-100 px-8 py-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
            </h2>
            <button
              className="btn-primary flex items-center gap-2 shadow-sm"
              onClick={() => setShowUpload(true)}
            >
              <Upload className="w-5 h-5" />
              <span>Upload Document</span>
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
          {children}
        </main>
        {showUpload && (
          <UploadModal
            onClose={() => setShowUpload(false)}
            onUploadComplete={() => setShowUpload(false)}
          />
        )}
      </div>
    </div>
  )
}