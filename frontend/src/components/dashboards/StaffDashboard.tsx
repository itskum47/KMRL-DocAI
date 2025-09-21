import { FileText, ClipboardList, FolderOpen, Clock } from 'lucide-react'
import DashboardGraph from './DashboardGraph'

export default function StaffDashboard() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="card flex flex-col items-center text-center">
          <div className="bg-blue-100 rounded-full p-3 mb-3">
            <FileText className="w-7 h-7 text-blue-600" />
          </div>
          <h3 className="text-base font-medium text-gray-900 mb-1">My Documents</h3>
          <p className="text-4xl font-extrabold text-blue-600 mb-1">23</p>
          <span className="text-xs text-gray-500">Uploaded</span>
        </div>
        <div className="card flex flex-col items-center text-center">
          <div className="bg-orange-100 rounded-full p-3 mb-3">
            <ClipboardList className="w-7 h-7 text-orange-500" />
          </div>
          <h3 className="text-base font-medium text-gray-900 mb-1">My Tasks</h3>
          <p className="text-4xl font-extrabold text-orange-500 mb-1">3</p>
          <span className="text-xs text-gray-500">Pending</span>
        </div>
        <div className="card flex flex-col items-center text-center">
          <div className="bg-green-100 rounded-full p-3 mb-3">
            <FolderOpen className="w-7 h-7 text-green-600" />
          </div>
          <h3 className="text-base font-medium text-gray-900 mb-1">Department Docs</h3>
          <p className="text-4xl font-extrabold text-green-600 mb-1">156</p>
          <span className="text-xs text-gray-500">Available</span>
        </div>
      </div>

      <DashboardGraph />
      <div className="card mt-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-gray-400" />
          Recent Activity
        </h3>
        <p className="text-gray-600 text-sm">Your recent documents and tasks will appear here...</p>
      </div>
    </div>
  )
}