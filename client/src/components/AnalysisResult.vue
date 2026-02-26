<template>
  <div v-if="isLoading || result" class="analysis-container">
    <!-- Spinner de chargement -->
    <div v-if="isLoading" class="loading-section">
      <div class="spinner-eco">
        <div class="spinner"></div>
      </div>
      <p class="loading-message">{{ currentLoadingMessage }}</p>
      <p class="loading-subtitle">Économisons la planète... 🌍</p>
    </div>

    <!-- Résultat - Fiche de Recommandations -->
    <div v-else-if="result" class="recommendations-card fade-in">
      <div class="card-header">
        <h3>📊 Fiche d'Analyse IA</h3>
        <span class="timestamp">{{ formattedDate }}</span>
      </div>

      <!-- Recommandations avec priorités et codes couleurs -->
      <div class="recommendations-grid">
        <div v-if="parsedRecommendations.length > 0" class="recommendations-container">
          <div 
            v-for="(rec, idx) in parsedRecommendations" 
            :key="idx"
            class="recommendation-item"
            :class="`priority-${rec.priority || 'low'}`"
            :style="{ animationDelay: `${idx * 0.15}s` }"
          >
            <div class="priority-bar"></div>
            <div class="rec-icon">{{ rec.icon || getIcon(rec.type) }}</div>
            <div class="rec-content">
              <div class="rec-header">
                <h4>{{ rec.title }}</h4>
                <span class="priority-badge" :class="`badge-${rec.priority || 'low'}`">
                  {{ rec.priority === 'high' ? 'URGENT' : rec.priority === 'medium' ? 'IMPORTANT' : 'À CONSIDÉRER' }}
                </span>
              </div>
              <p>{{ rec.description }}</p>
            </div>
          </div>
        </div>
        <div v-else class="raw-result">
          <pre>{{ result }}</pre>
        </div>
      </div>

      <!-- Statistiques rapides -->
      <div class="stats-section">
        <div class="stat">
          <span class="stat-icon">📦</span>
          <span class="stat-value">{{ assetCount }}</span>
          <span class="stat-label">Actifs analysés</span>
        </div>
        <div class="stat">
          <span class="stat-icon">♻️</span>
          <span class="stat-value">{{ totalCo2 }}kg</span>
          <span class="stat-label">CO₂ économisé</span>
        </div>
      </div>

      <!-- Historique & Comparaison -->
      <div class="history-section">
        <button 
          class="btn btn-history"
          @click="toggleHistory"
        >
          {{ showHistory ? '📈 Masquer historique' : '📈 Voir historique' }}
        </button>

        <transition name="slide-down">
          <div v-if="showHistory && analysisHistory.length >= 1" class="history-list">
            <h4>Historique des analyses</h4>
            <div class="history-items">
              <div 
                v-for="(hist, idx) in analysisHistory" 
                :key="idx"
                class="history-item"
                :class="{ 'current': idx === analysisHistory.length - 1 }"
              >
                <span class="history-date">{{ formatHistoryDate(hist.date) }}</span>
                <span class="history-badge">{{ hist.assetCount }} actifs</span>
                <div class="history-bar" :style="{ width: getHistoryBarWidth(hist.co2) }"></div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  isLoading: Boolean,
  result: String,
  assetCount: { type: Number, default: 0 },
  totalCo2: { type: Number, default: 0 },
  analysisHistory: { type: Array, default: () => [] }
})

const emit = defineEmits(['compare'])

const showHistory = ref(false)

const loadingMessages = [
  '⚙️ Optimisation de l\'inventaire en cours...',
  '🌱 Calcul de l\'impact écologique...',
  '🫁 Calcul de l\'oxygène sauvé...',
  '📊 Analyse des tendances climatiques...',
  '🔄 Recyclage de vos données...',
  '🎯 Alignement avec les ODD...',
  '💡 Génération d\'idées durables...',
  '🌍 Sauvegarde de la planète (0.001%)...',
  '⚡ Chargement éco-responsable...',
  '🌿 Pensées vertes en cours...',
  '♻️ Estimation de la réduction des déchets...',
  '📱 Analyse de l\'empreinte numérique...',
  '🌊 Calcul de l\'eau économisée...',
  '🌳 Comptage des arbres sauvés...'
]

const currentMessageIndex = ref(0)
const currentLoadingMessage = computed(() => loadingMessages[currentMessageIndex.value])

// Cycle à travers les messages
watch(() => props.isLoading, (loading) => {
  if (loading) {
    const interval = setInterval(() => {
      currentMessageIndex.value = (currentMessageIndex.value + 1) % loadingMessages.length
    }, 1000)
    
    return () => clearInterval(interval)
  }
})

const formattedDate = computed(() => {
  return new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

const parsedRecommendations = computed(() => {
  if (!props.result) return []
  
  // Nouveau format : JSON structuré avec priorités
  try {
    const parsed = JSON.parse(props.result)
    if (Array.isArray(parsed)) return parsed
    if (parsed.recommendations) return parsed.recommendations
    return []
  } catch {
    // Fallback: parser l'ancien format texte brut
    const lines = props.result.split('\n').filter(l => l.trim())
    const priorities = ['high', 'medium', 'low']
    const icons = ['⚡', '♻️', '🌱']
    
    return lines.map((line, idx) => {
      const cleanLine = line.replace(/^\d+\)\s+/, '').replace(/^Analyse automatique\s*:\s*/, '')
      if (!cleanLine.trim()) return null
      return {
        priority: priorities[idx] || 'low',
        title: cleanLine.length > 60 ? cleanLine.substring(0, 60) + '...' : cleanLine,
        description: cleanLine,
        icon: icons[idx] || '💡'
      }
    }).filter(Boolean)
  }
})

const getIcon = (type) => {
  const icons = {
    reduction: '📉',
    reuse: '♻️',
    recycle: '🔄',
    energy: '⚡',
    performance: '📈',
    cost: '💰',
    sustainability: '🌱',
    threat: '⚠️'
  }
  return icons[type] || '💡'
}

const toggleHistory = () => {
  showHistory.value = !showHistory.value
}

const formatHistoryDate = (date) => {
  if (typeof date === 'string') {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  return date
}

const getHistoryBarWidth = (co2) => {
  const maxCo2 = props.analysisHistory.reduce((max, h) => Math.max(max, h.co2), 0)
  return maxCo2 > 0 ? `${(co2 / maxCo2) * 100}%` : '10%'
}
</script>

<style scoped>
.analysis-container {
  animation: fadeIn 0.5s ease-out;
}

/* Spinner & Chargement */
.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  gap: 1.5rem;
}

.spinner-eco {
  position: relative;
  width: 60px;
  height: 60px;
}

.spinner {
  width: 100%;
  height: 100%;
  border: 4px solid #f5f5f5;
  border-top: 4px solid #52cc52;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-message {
  font-size: 1.1rem;
  color: #2d5016;
  font-weight: 600;
  text-align: center;
  margin: 0;
  min-height: 1.5rem;
}

.loading-subtitle {
  color: #999;
  font-size: 0.9rem;
  margin: 0;
}

/* Fiche de Recommandations */
.recommendations-card {
  background: white;
  border-radius: 12px;
  border: 2px solid #52cc52;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.card-header {
  background: linear-gradient(135deg, #2d5016 0%, #3a6b1f 100%);
  color: white;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 1.3rem;
}

.timestamp {
  font-size: 0.85rem;
  opacity: 0.9;
}

.recommendations-grid {
  padding: 2rem;
}

.recommendations-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .recommendations-container {
    grid-template-columns: 1fr;
  }
}

.recommendation-item {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  padding-top: 1.75rem;
  border-radius: 10px;
  border: 2px solid #e0e0e0;
  animation: slideInUp 0.5s ease-out both;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.recommendation-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

/* Priorité HAUTE — Rouge */
.recommendation-item.priority-high {
  border-color: #d32f2f;
  background: linear-gradient(135deg, #ffebee 0%, #fff5f5 100%);
}

.recommendation-item.priority-high .priority-bar {
  background: linear-gradient(90deg, #d32f2f, #ff6b6b);
}

/* Priorité MOYENNE — Orange */
.recommendation-item.priority-medium {
  border-color: #f57c00;
  background: linear-gradient(135deg, #fff3e0 0%, #fffaf0 100%);
}

.recommendation-item.priority-medium .priority-bar {
  background: linear-gradient(90deg, #f57c00, #ffb74d);
}

/* Priorité BASSE — Gris vert */
.recommendation-item.priority-low {
  border-color: #9e9e9e;
  background: linear-gradient(135deg, #f5f5f5 0%, #fafafa 100%);
}

.recommendation-item.priority-low .priority-bar {
  background: linear-gradient(90deg, #9e9e9e, #bdbdbd);
}

.priority-bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
}

.rec-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

.rec-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.rec-content h4 {
  margin: 0;
  color: #2d5016;
  font-size: 1.05rem;
  font-weight: 600;
}

.priority-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.priority-badge.badge-high {
  background: #ffcdd2;
  color: #c62828;
}

.priority-badge.badge-medium {
  background: #ffe0b2;
  color: #e65100;
}

.priority-badge.badge-low {
  background: #eeeeee;
  color: #616161;
}

.rec-content p {
  margin: 0;
  color: #555;
  font-size: 0.95rem;
  line-height: 1.6;
}

.recommendation-item:last-child {
  margin-bottom: 0;
}

.raw-result {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
}

.raw-result pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: #333;
}

/* Statistiques */
.stats-section {
  display: flex;
  gap: 1.5rem;
  padding: 0 2rem 1.5rem;
  flex-wrap: wrap;
}

.stat {
  flex: 1;
  min-width: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #f9fff9;
  border-radius: 8px;
  text-align: center;
}

.stat-icon {
  font-size: 1.8rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #52cc52;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
}

/* Historique */
.history-section {
  padding: 1.5rem 2rem;
  border-top: 1px solid #eee;
}

.btn-history {
  background: #f5f5f5;
  color: #333;
  padding: 0.75rem 1.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-history:hover {
  background: #efefef;
  transform: translateY(-2px);
}

.history-list {
  margin-top: 1rem;
  animation: slideDown 0.3s ease-out;
}

.history-list h4 {
  color: #2d5016;
  margin: 0 0 1rem 0;
  font-size: 1rem;
}

.history-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: #f9fff9;
  border-radius: 6px;
  opacity: 0.7;
  transition: opacity 0.3s;
}

.history-item.current {
  background: linear-gradient(135deg, #e8f5e9 0%, #f1f5f0 100%);
  border-left: 3px solid #52cc52;
  opacity: 1;
  font-weight: 600;
}

.history-date {
  min-width: 100px;
  font-size: 0.9rem;
  color: #666;
}

.history-badge {
  background: #52cc52;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  min-width: 60px;
  text-align: center;
}

.history-bar {
  height: 4px;
  background: linear-gradient(90deg, #52cc52 0%, #3aa83a 100%);
  border-radius: 2px;
  flex: 1;
  transition: width 0.3s;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
    overflow: hidden;
  }
  to {
    opacity: 1;
    max-height: 500px;
  }
}

.fade-in {
  animation: fadeIn 0.5s ease-out;
}

/* Transitions Vue */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}

.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}
</style>
