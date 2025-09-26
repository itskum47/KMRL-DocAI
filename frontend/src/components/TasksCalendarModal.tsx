import { useEffect, useState } from 'react'

interface Task { id: string; title: string; due_date?: string; assigned_department?: string }

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function daysInRange(start: Date, end: Date) {
  const days: Date[] = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d))
  }
  return days
}

export default function TasksCalendarModal({ open, onClose }: { open: boolean, onClose: ()=>void }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [monthStart, setMonthStart] = useState<Date>(startOfMonth(new Date()))

  useEffect(()=>{ if (open) fetchTasks() }, [open, monthStart])

  async function fetchTasks() {
    try {
      const res = await fetch('/api/v1/tasks')
      const data = await res.json()
      const list = Array.isArray(data?.tasks) ? data.tasks : []
      setTasks(list)
    } catch (e) { console.warn('Failed to fetch tasks for calendar', e) }
  }

  if (!open) return null

  const start = startOfMonth(monthStart)
  const end = endOfMonth(monthStart)
  const days = daysInRange(start, end)

  const tasksByDate: Record<string, Task[]> = {}
  for (const t of tasks) {
    if (!t.due_date) continue
    const key = new Date(t.due_date).toISOString().slice(0,10)
    tasksByDate[key] = tasksByDate[key] || []
    tasksByDate[key].push(t)
  }

  const nextMonth = ()=> setMonthStart(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1))
  const prevMonth = ()=> setMonthStart(new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white w-11/12 md:w-3/4 lg:w-2/3 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Tasks Calendar — {monthStart.toLocaleString(undefined,{ month: 'long', year: 'numeric'})}</h2>
          <div className="space-x-2">
            <button className="btn" onClick={prevMonth}>Prev</button>
            <button className="btn" onClick={nextMonth}>Next</button>
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['S','M','T','W','T','F','S'].map(d=> (
            <div key={d} className="text-sm text-center font-medium text-gray-600">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2 mt-2">
          {days.map(day=>{
            const dayKey = day.toISOString().slice(0,10)
            const list = tasksByDate[dayKey] || []
            return (
              <div key={dayKey} className="border rounded-lg p-3 min-h-[100px] bg-gray-50">
                <div className="text-sm font-semibold mb-2">{day.getDate()}</div>
                <div className="space-y-1 text-xs">
                  {list.length === 0 ? (
                    <div className="text-gray-400">—</div>
                  ) : list.map(t=> (
                    <div key={t.id} className="p-1 rounded text-xs bg-white border">
                      <div className="font-medium truncate" title={t.title}>{t.title}</div>
                      <div className="text-xxs text-gray-500">{t.assigned_department || ''}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
