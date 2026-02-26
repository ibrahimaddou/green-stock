import { ref, computed } from 'vue'
import { api } from '../api.js'

export function useAssets() {
  const assets = ref([])
  const loading = ref(false)
  const error = ref(null)

  const totalCo2 = computed(() => assets.value.reduce((sum, a) => sum + (a.co2_saved || 0), 0))

  const fetchAssets = async () => {
    loading.value = true
    error.value = null
    try {
      assets.value = await api.getAssets()
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const addAsset = async (newAsset) => {
    error.value = null
    const created = await api.createAsset(newAsset)
    assets.value.push(created)
    return created
  }

  const updateAsset = async (id, data) => {
    error.value = null
    const updated = await api.updateAsset(id, data)
    const idx = assets.value.findIndex(a => a.id === id)
    if (idx !== -1) assets.value[idx] = updated
    return updated
  }

  const deleteAsset = async (id) => {
    error.value = null
    await api.deleteAsset(id)
    assets.value = assets.value.filter(a => a.id !== id)
  }

  return { assets, loading, error, totalCo2, fetchAssets, addAsset, updateAsset, deleteAsset }
}
