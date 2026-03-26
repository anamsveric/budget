import axios from 'axios'

const BASE = 'http://localhost:1337/api/mjesecni-budget'

export async function getTrosak(period) {
  const res = await axios.get(`${BASE}?filters[period][$eq]=${period}&pagination[pageSize]=1`)
  const items = res.data.data
  return items.length > 0 ? { id: items[0].id, ...items[0] } : null
}

export async function saveTrosak(period, data) {
  const existing = await getTrosak(period)
  if (existing) {
    await axios.put(`${BASE}/${existing.id}`, { data: { ...data, period } })
  } else {
    await axios.post(BASE, { data: { ...data, period } })
  }
}
