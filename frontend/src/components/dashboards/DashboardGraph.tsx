import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { name: 'Jan', documents: 12, tasks: 4 },
  { name: 'Feb', documents: 18, tasks: 6 },
  { name: 'Mar', documents: 23, tasks: 3 },
  { name: 'Apr', documents: 15, tasks: 5 },
  { name: 'May', documents: 20, tasks: 7 },
];

export default function DashboardGraph() {
  return (
    <div className="card mt-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Overview (Last 5 Months)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="documents" fill="#2563eb" name="Documents" radius={[4, 4, 0, 0]} />
          <Bar dataKey="tasks" fill="#f59e42" name="Tasks" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
