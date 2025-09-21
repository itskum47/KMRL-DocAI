import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { 
  Users, 
  FileText, 
  Settings, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Server,
  RefreshCw
} from 'lucide-react'
import { useApi } from '../hooks/useApi'

interface SystemStats {
  documents: {
    total: number
    processing: number
    failed: number
    processed_today: number
  }
  users: {
    total: number
    active_today: number
    by_role: Record<string, number>
  }
  tasks: {
    total: number
    pending: number
    overdue: number
  }
  system: {
    queue_length: number
    avg_processing_time: number
    success_rate: number
    storage_usage: number
  }
}

interface User {
  id: string
  name: string
  email: string
  role: string
  department: string
  created_at: string
}

export default function Admin() {
  const { user } = useUser()
  const { apiCall } = useApi()
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'system'>('overview')

  // Redirect if not admin
  if (user?.publicMetadata?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">You need admin privileges to access this page.</p>
      </div>
    )
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch system stats (this would be a dedicated admin endpoint)
      const [documentsRes, usersRes, tasksRes] = await Promise.all([
        apiCall('/documents?limit=1'), // Get count from pagination
        apiCall('/users'),
        apiCall('/tasks?limit=1') // Get count from pagination
      ])

      // Mock system stats for now
      setStats({
        documents: {
          total: documentsRes.pagination?.total || 0,
          processing: 5,
          failed: 2,
          processed_today: 23
        },
        users: {
          total: usersRes.pagination?.total || 0,
          active_today: 45,
          by_role: {
            admin: 2,
            hr: 5,
            engineer: 12,
            director: 3,
            staff: 28
          }
        },
        tasks: {
          total: tasksRes.pagination?.total || 0,
          pending: 15,
          overdue: 3
        },
        system: {
          queue_length: 2,
          avg_processing_time: 28,
          success_rate: 98.2,
          storage_usage: 67
        }
      })

      setUsers(usersRes.users || [])
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      await apiCall(`/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole })
      })
      fetchData() // Refresh data
    } catch (error) {
      console.error('Failed to update user role:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Admin Panel</h1>
        <button
          onClick={fetchData}
          className="btn-secondary flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: Activity },
            { id: 'users', name: 'Users', icon: Users },
            { id: 'system', name: 'System', icon: Server }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Documents</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.documents.total}</p>
                  <p className="text-xs text-gray-500">+{stats.documents.processed_today} today</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.users.active_today}</p>
                  <p className="text-xs text-gray-500">of {stats.users.total} total</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.tasks.pending}</p>
                  <p className="text-xs text-red-500">{stats.tasks.overdue} overdue</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.system.success_rate}%</p>
                  <p className="text-xs text-gray-500">Processing accuracy</p>
                </div>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Performance</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Queue Length</span>
                  <span className="text-sm font-medium text-gray-900">{stats.system.queue_length} jobs</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg Processing Time</span>
                  <span className="text-sm font-medium text-gray-900">{stats.system.avg_processing_time}s</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Storage Usage</span>
                  <span className="text-sm font-medium text-gray-900">{stats.system.storage_usage}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Failed Documents</span>
                  <span className="text-sm font-medium text-red-600">{stats.documents.failed}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
              <div className="space-y-2">
                {Object.entries(stats.users.by_role).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">{role}</span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Management</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="staff">Staff</option>
                        <option value="engineer">Engineer</option>
                        <option value="hr">HR</option>
                        <option value="director">Director</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.department || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-primary-600 hover:text-primary-900">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* System Tab */}
      {activeTab === 'system' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Queue</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Jobs in Queue</span>
                  <span className="text-sm font-medium text-gray-900">{stats.system.queue_length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Processing</span>
                  <span className="text-sm font-medium text-yellow-600">{stats.documents.processing}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Failed Today</span>
                  <span className="text-sm font-medium text-red-600">{stats.documents.failed}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage & Performance</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Storage Usage</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full" 
                        style={{ width: `${stats.system.storage_usage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{stats.system.storage_usage}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg Response Time</span>
                  <span className="text-sm font-medium text-gray-900">142ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Uptime</span>
                  <span className="text-sm font-medium text-green-600">99.9%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="btn-secondary flex items-center justify-center space-x-2">
                <Database className="w-4 h-4" />
                <span>Backup Database</span>
              </button>
              <button className="btn-secondary flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4" />
                <span>Clear Cache</span>
              </button>
              <button className="btn-secondary flex items-center justify-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>System Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}