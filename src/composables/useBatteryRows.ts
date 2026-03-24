import axios from 'axios'

export type BatteryRow = {
  sohPercent?: number | null
  soc?: number | null
  voltage?: number | null
  temperature?: number | null
  rulCycles?: number | null
  lastRecordAt?: string | null
}

type BatteryPageResp = {
  content?: BatteryRow[]
}

const PAGE_SIZE = 200
const CACHE_TTL_MS = 15000

let cachedRows: BatteryRow[] = []
let lastFetchAt = 0
let inFlight: Promise<BatteryRow[]> | null = null

async function fetchAllRows(): Promise<BatteryRow[]> {
  const first = await axios.get<BatteryPageResp>('/api/batteries', {
    params: { page: 0, size: PAGE_SIZE },
  })
  const firstRows = first.data?.content || []
  if (firstRows.length < PAGE_SIZE) return firstRows

  const rows: BatteryRow[] = [...firstRows]
  for (let page = 1; ; page++) {
    const resp = await axios.get<BatteryPageResp>('/api/batteries', {
      params: { page, size: PAGE_SIZE },
    })
    const pageRows = resp.data?.content || []
    if (pageRows.length === 0) break
    rows.push(...pageRows)
    if (pageRows.length < PAGE_SIZE) break
  }
  return rows
}

export async function loadBatteryRows(force = false): Promise<BatteryRow[]> {
  const now = Date.now()
  if (!force && cachedRows.length > 0 && now - lastFetchAt < CACHE_TTL_MS) {
    return cachedRows
  }
  if (inFlight) return inFlight

  inFlight = fetchAllRows()
    .then((rows) => {
      cachedRows = rows
      lastFetchAt = Date.now()
      return rows
    })
    .finally(() => {
      inFlight = null
    })

  return inFlight
}
