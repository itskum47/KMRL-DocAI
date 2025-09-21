import { FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react'

export default function HRDashboard() {
  return (
    <div className="space-y-6">
      {/* HR Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">HR Documents</p>
              <p className="text-2xl font-semibold text-gray-900">156</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Compliance</p>
              <p className="text-2xl font-semibold text-gray-900">8</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
              <p className="text-2xl font-semibold text-gray-900">42</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Due This Week</p>
              <p className="text-2xl font-semibold text-gray-900">5</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent HR Documents */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent HR Documents</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Safety Training Circular - Q4 2024</p>
                <p className="text-xs text-gray-500">Uploaded 2 hours ago • Compliance required</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                Urgent
              </span>
              <button className="btn-primary text-xs">Review</button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Employee Handbook Update</p>
                <p className="text-xs text-gray-500">Uploaded 1 day ago • Department: All</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                Review
              </span>
              <button className="btn-secondary text-xs">View</button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Annual Leave Policy 2025</p>
                <p className="text-xs text-gray-500">Uploaded 3 days ago • Department: HR</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Processed
              </span>
              <button className="btn-secondary text-xs">View</button>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Tasks */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Tasks</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-red-200 bg-red-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-red-900">Safety Training Acknowledgment</p>
              <p className="text-xs text-red-600">Due: Tomorrow • 23 pending acknowledgments</p>
            </div>
            <button className="btn-primary text-xs">Send Reminder</button>
          </div>

          <div className="flex items-center justify-between p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-yellow-900">Code of Conduct Review</p>
              <p className="text-xs text-yellow-600">Due: Next week • 12 pending acknowledgments</p>
            </div>
            <button className="btn-secondary text-xs">View Status</button>
          </div>

          <div className="flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-green-900">Emergency Procedures Update</p>
              <p className="text-xs text-green-600">Completed • 100% acknowledgment rate</p>
            </div>
            <button className="btn-secondary text-xs">View Report</button>
          </div>
        </div>
      </div>
    </div>
  )
}