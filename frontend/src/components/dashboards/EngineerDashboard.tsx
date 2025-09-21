export default function EngineerDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Maintenance Reports</h3>
          <p className="text-3xl font-bold text-blue-600">12</p>
          <p className="text-sm text-gray-500">This month</p>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Tasks</h3>
          <p className="text-3xl font-bold text-orange-600">5</p>
          <p className="text-sm text-gray-500">Due this week</p>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Equipment Status</h3>
          <p className="text-3xl font-bold text-green-600">98%</p>
          <p className="text-sm text-gray-500">Operational</p>
        </div>
      </div>
      
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Engineering Documents</h3>
        <p className="text-gray-600">Engineering-specific documents will appear here...</p>
      </div>
    </div>
  )
}