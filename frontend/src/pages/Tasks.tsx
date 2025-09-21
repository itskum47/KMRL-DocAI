import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { 
  CheckSquare, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Filter,
  Search,
  Calendar,
  User,
  FileText
} from 'lucide-react'
import { useApi } from '../hooks/useApi'

interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'acknowledged' | 'closed'
  due_date: string
  assigned_department: string
  created_at: string
  document?: {
    id: string
    file_name: string
    doc_type: string
  }
  assigned_user?: {
    id: string
    name: string
    email: string
  }
}

export default function Tasks() {
  const { user } = useUser()
  const { apiCall } = useApi()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    department: '',
    search: ''
  })
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    acknowledged: 0,
    closed: 0
  })

  useEffect(() => {
    fetchTasks()
    fetchStats()
  }, [filters])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
      
      const response = await apiCall(`/tasks?${params.toString()}`)
      setTasks(response.tasks)
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // This would be a separate endpoint for task statistics
      // For now, we'll calculate from the current tasks
      const response = await apiCall('/tasks')
      const allTasks = response.tasks
      
      setStats({
        total: allTasks.length,
        pending: allTasks.filter((t: Task) => t.status === 'pending').length,
        acknowledged: allTasks.filter((t: Task) => t.status === 'acknowledged').length,
        closed: allTasks.filter((t: Task) => t.status === 'closed').length,
      })
    } catch (error) {
      console.error('Failed to fetch task stats:', error)
    }
  }

  const handleAcknowledgeTask = async (taskId: string) => {
    try {
      await apiCall(`/tasks/${taskId}/acknowledge`, {
        method: 'PATCH',
        body: JSON.stringify({ notes: '' })
      })
      fetchTasks()
      fetchStats()
    } catch (error) {
      console.error('Failed to acknowledge task:', error)
    }
  }

  const handleCloseTask = async (taskId: string) => {
    try {
      await apiCall(`/tasks/${taskId}/close`, {
        method: 'PATCH'
      })
      fetchTasks()
      fetchStats()
    } catch (error) {
      console.error('Failed to close task:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'acknowledged':
        return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'closed':
        return <CheckSquare className="w-4 h-4 text-green-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      acknowledged: 'bg-blue-100 text-blue-800',
      closed: 'bg-green-100 text-green-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'text-red-600' // Overdue
    if (diffDays <= 1) return 'text-orange-600' // Due soon
    if (diffDays <= 7) return 'text-yellow-600' // Due this week
    return 'text-gray-600' // Normal
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Tasks</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <CheckSquare className="w-6 h-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Acknowledged</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.acknowledged}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckSquare className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Closed</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.closed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tasks..."
                className="pl-10 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            >
              <option value="">All Departments</option>
              <option value="engineering">Engineering</option>
              <option value="hr">HR</option>
              <option value="finance">Finance</option>
              <option value="operations">Operations</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="card">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8">
            <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
            <p className="mt-1 text-sm text-gray-500">No tasks match your current filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(task.status)}
                      <h3 className="text-sm font-medium text-gray-900">{task.title}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {task.due_date && (
                        <div className={`flex items-center space-x-1 ${getPriorityColor(task.due_date)}`}>
                          <Calendar className="w-3 h-3" />
                          <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{task.assigned_department}</span>
                      </div>
                      
                      {task.document && (
                        <div className="flex items-center space-x-1">
                          <FileText className="w-3 h-3" />
                          <span>{task.document.file_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    {task.status === 'pending' && (
                      <button
                        onClick={() => handleAcknowledgeTask(task.id)}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                      >
                        Acknowledge
                      </button>
                    )}
                    
                    {(task.status === 'acknowledged' || task.status === 'pending') && (
                      <button
                        onClick={() => handleCloseTask(task.id)}
                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}