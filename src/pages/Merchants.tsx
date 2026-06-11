import { useEffect, useState } from 'react'
import { api, type Merchant } from '../api'

export default function Merchants() {
  const [rows, setRows] = useState<Merchant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .merchants()
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-slate-500">Loading merchants…</p>
  if (error) return <p className="text-red-600">{error}</p>

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Merchants</h1>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Domain</th>
              <th className="px-4 py-2 font-medium">Installed</th>
              <th className="px-4 py-2 font-medium">Plan</th>
              <th className="px-4 py-2 font-medium">Risk Model</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const active = !m.uninstalledAt
              return (
                <tr key={m.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium">{m.shopifyDomain}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {new Date(m.installedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{m.planTier}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {m.riskModelState}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {active ? 'Active' : 'Uninstalled'}
                    </span>
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No merchants found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
