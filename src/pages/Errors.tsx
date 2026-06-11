import { useEffect, useState } from 'react'
import { api, type ErrorLogEntry } from '../api'

const LEVELS = ['', 'ERROR', 'FATAL']

// RFC 4180 CSV escaping. EVERY field is wrapped in double quotes and
// embedded quotes are doubled (""), so commas, quotes, AND newlines in
// stack traces / context JSON stay safely inside their cell.
//   he said "hi", then\na newline  →  "he said ""hi"", then\na newline"
function escapeCsvField(value: unknown): string {
  let s: string
  if (value === null || value === undefined) s = ''
  else if (typeof value === 'string') s = value
  else if (typeof value === 'object') s = JSON.stringify(value) // context JSON
  else s = String(value)
  return `"${s.replace(/"/g, '""')}"`
}

const CSV_HEADERS = [
  'Time',
  'Level',
  'Source',
  'Shop',
  'Shop ID',
  'Message',
  'Error Code',
  'Request ID',
  'Job ID',
  'Fingerprint',
  'Stack',
  'Context',
]

function errorsToCsv(rows: ErrorLogEntry[]): string {
  const lines = [CSV_HEADERS.map(escapeCsvField).join(',')]
  for (const r of rows) {
    lines.push(
      [
        r.createdAt, // ISO string from the API
        r.level,
        r.source,
        r.shop?.shopifyDomain ?? null,
        r.shopId,
        r.message,
        r.errorCode,
        r.requestId,
        r.jobId,
        r.fingerprint,
        r.stack,
        r.context, // object/null → escapeCsvField JSON-stringifies it
      ].map(escapeCsvField).join(','),
    )
  }
  // CRLF line terminator per RFC 4180.
  return lines.join('\r\n')
}

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

  // Export the currently-loaded (filtered) rows to a CSV download.
  // Client-side only — no new API call; exports exactly what's in view.
  function exportCsv() {
    const csv = errorsToCsv(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rto-errors-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

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
        <button
          type="button"
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="ml-auto rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Export CSV
        </button>
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
              <th className="px-4 py-2 font-medium">Shop ID</th>
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
                <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-slate-500">
                  {r.shopId ?? '—'}
                </td>
                <td className="px-4 py-2">{r.message}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  No errors match these filters.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
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
