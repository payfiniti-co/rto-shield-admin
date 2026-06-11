import { useEffect, useState } from 'react'
import { api, type ErrorLogEntry } from '../api'

const LEVELS = ['', 'ERROR', 'FATAL']

export default function Errors() {
  const [rows, setRows] = useState<ErrorLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [level, setLevel] = useState('')
  const [source, setSource] = useState('')
  const [shopId, setShopId] = useState('')

  function load() {
    setLoading(true)
    setError('')
    api
      .errors({ level, source, shopId })
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed'))
      .finally(() => setLoading(false))
  }

  // Reload whenever filters change.
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, source, shopId])

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Error Log</h1>

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1.5 text-sm"
        >
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l || 'All levels'}
            </option>
          ))}
        </select>
        <input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Source"
          className="rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
        <input
          value={shopId}
          onChange={(e) => setShopId(e.target.value)}
          placeholder="Shop ID"
          className="w-48 rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>

      {error && <p className="mb-3 text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Time</th>
              <th className="px-4 py-2 font-medium">Level</th>
              <th className="px-4 py-2 font-medium">Source</th>
              <th className="px-4 py-2 font-medium">Shop</th>
              <th className="px-4 py-2 font-medium">Message</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100 align-top">
                <td className="whitespace-nowrap px-4 py-2 text-slate-500">
                  {new Date(r.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      r.level === 'FATAL'
                        ? 'bg-red-200 text-red-800'
                        : r.level === 'ERROR'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {r.level}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-600">{r.source}</td>
                <td className="px-4 py-2 text-slate-600">
                  {r.shop?.shopifyDomain ?? r.shopId ?? '—'}
                </td>
                <td className="px-4 py-2">{r.message}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No errors match these filters.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
