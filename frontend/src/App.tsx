import { useState, useEffect } from 'react'

interface User {
  id: number
  name: string
}

export default function App() {
  const [name, setName] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [status, setStatus] = useState('')

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      setUsers(data)
    } catch {
      console.error('Failed to fetch users')
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (res.ok) {
        setStatus('Saved!')
        setName('')
        fetchUsers()
        setTimeout(() => setStatus(''), 2000)
      } else {
        setStatus('Error saving')
      }
    } catch {
      setStatus('Backend not reachable')
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-6 shadow-xl">
        <h1 className="text-2xl font-bold text-amber-400 text-center">BigBite Demo</h1>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-sm placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-amber-500 text-slate-900 font-semibold text-sm hover:bg-amber-400 transition"
          >
            Save
          </button>
        </form>

        {status && (
          <p className="text-center text-sm text-emerald-400">{status}</p>
        )}

        {users.length > 0 && (
          <div className="border-t border-slate-700 pt-4 space-y-2">
            <h2 className="text-sm font-semibold text-slate-400">Saved Users</h2>
            <ul className="space-y-1">
              {users.map((u) => (
                <li key={u.id} className="flex justify-between text-sm bg-slate-900 px-3 py-2 rounded-lg border border-slate-700">
                  <span>{u.name}</span>
                  <span className="text-slate-500">#{u.id}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
