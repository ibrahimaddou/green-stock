const API_BASE = '/api'

export const api = {
  async getAssets() {
    const res = await fetch(`${API_BASE}/assets`)
    if (!res.ok) throw new Error('Failed to fetch assets')
    return res.json()
  },

  async getAsset(id) {
    const res = await fetch(`${API_BASE}/assets/${id}`)
    if (!res.ok) throw new Error('Asset not found')
    return res.json()
  },

  async createAsset(data) {
    const res = await fetch(`${API_BASE}/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to create asset')
    return res.json()
  },

  async updateAsset(id, data) {
    const res = await fetch(`${API_BASE}/assets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Failed to update asset')
    return res.json()
  },

  async deleteAsset(id) {
    const res = await fetch(`${API_BASE}/assets/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete asset')
    return res.json()
  }
,
  async analyzeAssets(items) {
    const res = await fetch(`${API_BASE}/assets/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error('Analysis failed: ' + text)
    }
    return res.json()
  },

  async getAnalysisHistory() {
    const res = await fetch(`${API_BASE}/assets/analysis`)
    if (!res.ok) throw new Error('Failed to fetch analysis history')
    return res.json()
  }
}
