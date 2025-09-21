import { useUser } from '@clerk/clerk-react'
import AdminDashboard from '../components/dashboards/AdminDashboard'
import HRDashboard from '../components/dashboards/HRDashboard'
import EngineerDashboard from '../components/dashboards/EngineerDashboard'
import DirectorDashboard from '../components/dashboards/DirectorDashboard'
import StaffDashboard from '../components/dashboards/StaffDashboard'

export default function Dashboard() {
  const { user } = useUser()
  const userRole = user?.publicMetadata?.role as string || 'staff'

  const dashboardComponents = {
    admin: AdminDashboard,
    hr: HRDashboard,
    engineer: EngineerDashboard,
    director: DirectorDashboard,
    staff: StaffDashboard
  }

  const DashboardComponent = dashboardComponents[userRole as keyof typeof dashboardComponents] || StaffDashboard

  return <DashboardComponent />
}