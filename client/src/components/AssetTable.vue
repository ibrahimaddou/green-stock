<template>
  <div class="table-container">
    <div v-if="assets.length === 0" class="empty-state">
      <p class="empty-icon">🌱</p>
      <p>Aucun actif enregistre</p>
      <p class="empty-hint">Cliquez sur "Ajouter un actif" pour commencer</p>
    </div>

    <table v-else class="assets-table">
      <thead>
        <tr>
          <th>Nom</th>
          <th>Categorie</th>
          <th>Poids (kg)</th>
          <th>CO2 Economise (kg)</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="asset in assets" :key="asset.id" class="asset-row">
          <td class="cell-name">{{ asset.name }}</td>
          <td class="cell-category">{{ asset.category }}</td>
          <td class="cell-weight">{{ asset.weight }}</td>
          <td class="cell-co2">{{ asset.co2_saved?.toFixed(2) }}</td>
          <td class="cell-actions">
            <button class="btn-action btn-edit" @click="$emit('edit', asset)" title="Modifier">&#9998;</button>
            <button class="btn-action btn-delete" @click="handleDelete(asset)" title="Supprimer">&#128465;</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  assets: { type: Array, default: () => [] }
})

const emit = defineEmits(['edit', 'delete'])

const handleDelete = (asset) => {
  if (confirm('Etes-vous sur de vouloir supprimer "' + asset.name + '" ?')) {
    emit('delete', asset.id)
  }
}
</script>

<style scoped>
.table-container {
  background: white; border-radius: 12px; overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.empty-state { padding: 3rem 2rem; text-align: center; color: #999; }
.empty-icon { font-size: 3rem; margin: 0; }
.empty-state p { margin: 0.5rem 0; font-size: 1.1rem; }
.empty-hint { font-size: 0.9rem !important; color: #bbb; }
.assets-table { width: 100%; border-collapse: collapse; }
.assets-table thead { background: #2d5016; color: white; }
.assets-table th { padding: 1rem; text-align: left; font-weight: 600; font-size: 0.95rem; }
.asset-row { border-bottom: 1px solid #f0f0f0; transition: background 0.2s; }
.asset-row:hover { background: #f9faf8; }
.asset-row:nth-child(even) { background: #fafaf9; }
.assets-table td { padding: 1rem; color: #333; }
.cell-name { font-weight: 500; }
.cell-category { color: #666; }
.cell-weight, .cell-co2 { text-align: center; font-family: 'Courier New', monospace; }
.cell-actions { text-align: center; }
.btn-action {
  background: none; border: none; font-size: 1.2rem;
  cursor: pointer; padding: 0.5rem; transition: transform 0.2s;
}
.btn-action:hover { transform: scale(1.2); }

@media (max-width: 768px) {
  .assets-table { font-size: 0.9rem; }
  .assets-table th, .assets-table td { padding: 0.75rem 0.5rem; }
}
</style>
