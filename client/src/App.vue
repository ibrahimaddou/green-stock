<template>
  <div class="app-container">
    <div v-if="!serverOnline" class="server-alert">
      <span class="alert-icon">⚠️</span>
      <span>Le serveur backend n'est pas accessible. Certaines fonctionnalités pourraient être limitées.</span>
    </div>

    <header class="app-header">
      <h1>Green-Stock</h1>
      <p class="subtitle">Gestion d'inventaire informatique reconditionne</p>
    </header>

    <main class="app-main">
      <SummaryCard :totalCo2="totalCo2" />

      <div class="toolbar">
        <button class="btn btn-add" @click="openCreateModal">+ Ajouter un actif</button>
        <button class="btn btn-ia" @click="runAnalysis" :disabled="analyzing">🔬 Analyse IA</button>
      </div>

      <div v-if="loading" class="loading">Chargement...</div>
      <div v-if="error" class="error-banner">{{ error }}</div>

      <AnalysisResult
        :isLoading="analyzing"
        :result="analysisResult"
        :assetCount="assets.length"
        :totalCo2="totalCo2"
        :analysisHistory="analysisHistory"
        @compare="compareAnalyses"
      />

      <AssetTable :assets="assets" @edit="openEditModal" @delete="handleDelete" />

      <AssetModal
        :isOpen="showModal"
        :asset="currentAsset"
        :mode="modalMode"
        @close="closeModal"
        @save="handleSave"
      />
    </main>

    <footer class="app-footer">
      <p>Ensemble pour un avenir plus durable</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import SummaryCard from './components/SummaryCard.vue'
import AssetTable from './components/AssetTable.vue'
import AssetModal from './components/AssetModal.vue'
import AnalysisResult from './components/AnalysisResult.vue'
import { useAssets } from './composables/useAssets.js'
import { api } from './api.js'

const { assets, loading, error, totalCo2, fetchAssets, addAsset, updateAsset, deleteAsset } = useAssets()

const showModal = ref(false)
const currentAsset = ref(null)
const modalMode = ref('create')
const analyzing = ref(false)
const analysisResult = ref('')
const serverOnline = ref(true)
const analysisHistory = ref([])

onMounted(async () => {
  // Check server health
  serverOnline.value = await api.checkHealth()
  
  // Fetch assets
  fetchAssets()

  // Check server health periodically (every 30 seconds)
  setInterval(async () => {
    serverOnline.value = await api.checkHealth()
  }, 30000)
})

const openCreateModal = () => {
  currentAsset.value = null
  modalMode.value = 'create'
  showModal.value = true
}

const openEditModal = (asset) => {
  currentAsset.value = asset
  modalMode.value = 'edit'
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  currentAsset.value = null
}

const handleSave = async (formData) => {
  try {
    if (modalMode.value === 'create') {
      await addAsset(formData)
    } else {
      await updateAsset(currentAsset.value.id, formData)
    }
    closeModal()
  } catch (err) {
    console.error(err)
  }
}

const handleDelete = async (id) => {
  try { await deleteAsset(id) } catch (err) { console.error(err) }
}

const runAnalysis = async () => {
  analysisResult.value = ''
  analyzing.value = true
  try {
    // send current inventory to backend for analysis
    const res = await api.analyzeAssets(assets.value)
    // Nouveau format JSON structuré avec recommendations
    const result = res.recommendations
      ? JSON.stringify(res)
      : res.analysis || JSON.stringify(res, null, 2)
    analysisResult.value = result
    
    // Ajouter à l'historique
    analysisHistory.value.push({
      date: new Date().toISOString(),
      result: result,
      assetCount: assets.value.length,
      co2: totalCo2.value
    })
    
    // Garder seulement les 10 dernières analyses
    if (analysisHistory.value.length > 10) {
      analysisHistory.value = analysisHistory.value.slice(-10)
    }
  } catch (err) {
    analysisResult.value = 'Erreur lors de l\'analyse : ' + (err.message || err)
  } finally {
    analyzing.value = false
  }
}

const compareAnalyses = () => {
  console.log('Comparaison avec historique', analysisHistory.value)
}
</script>

<style scoped>
.app-container { min-height: 100vh; display: flex; flex-direction: column; background: #f5f5f5; }
.server-alert {
  background: #fff3cd; color: #856404; padding: 1rem 2rem;
  border-bottom: 2px solid #ffc107; display: flex; align-items: center;
  gap: 1rem; font-weight: 500;
}
.alert-icon { font-size: 1.3rem; }
.app-header {
  background: linear-gradient(135deg, #2d5016 0%, #3a6b1f 100%);
  color: white; padding: 2rem; text-align: center;
}
.app-header h1 { margin: 0; font-size: 2.5rem; }
.subtitle { margin: 0.5rem 0 0; opacity: 0.9; font-size: 1rem; }
.app-main { flex: 1; max-width: 1200px; margin: 0 auto; width: 100%; padding: 2rem; }
.toolbar { margin-bottom: 2rem; display: flex; align-items: center; flex-wrap: wrap; gap: 0; }
.btn-add {
  background: #52cc52; color: white; padding: 0.75rem 1.5rem;
  border: none; border-radius: 6px; font-size: 1rem;
  font-weight: 600; cursor: pointer; transition: all 0.3s;
}
.btn-add:hover { background: #3aa83a; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(82,204,82,0.3); }
.btn-ia {
  background: #2d5016; color: white; padding: 0.75rem 1.5rem;
  border: none; border-radius: 6px; font-size: 1rem;
  font-weight: 600; cursor: pointer; transition: all 0.3s;
  margin-left: 12px;
}
.btn-ia:hover { background: #3a6b1f; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(45,80,22,0.3); }
.btn-ia:disabled { background: #aaa; cursor: not-allowed; opacity: 0.6; transform: none; box-shadow: none; }
.loading { text-align: center; padding: 2rem; font-size: 1.1rem; color: #666; }
.error-banner {
  background: #ffe0e0; color: #d32f2f; padding: 1rem;
  border-radius: 6px; margin-bottom: 1.5rem; border-left: 4px solid #d32f2f;
}
.app-footer { background: #2d5016; color: white; padding: 1.5rem; text-align: center; margin-top: auto; }
.app-footer p { margin: 0; }
@media (max-width: 768px) {
  .app-header h1 { font-size: 1.8rem; }
  .app-main { padding: 1rem; }
}
</style>
