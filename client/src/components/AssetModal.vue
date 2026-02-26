<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ mode === 'create' ? 'Nouvel Actif' : 'Modifier l\'Actif' }}</h3>
        <button class="modal-close" @click="$emit('close')">&#10005;</button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-form">
        <div class="form-group">
          <label for="name">Nom *</label>
          <input id="name" v-model="formData.name" type="text" placeholder="Ex: PC Bureau Dell" required />
          <span v-if="errors.name" class="error-msg">{{ errors.name }}</span>
        </div>

        <div class="form-group">
          <label for="category">Categorie *</label>
          <select id="category" v-model="formData.category" required>
            <option value="">-- Selectionner --</option>
            <option value="Laptop">Laptop</option>
            <option value="Ecran">Ecran</option>
            <option value="Smartphone">Smartphone</option>
            <option value="PC">PC</option>
          </select>
          <span v-if="errors.category" class="error-msg">{{ errors.category }}</span>
        </div>

        <div class="form-group">
          <label for="weight">Poids (kg) *</label>
          <input id="weight" v-model.number="formData.weight" type="number" step="0.1" min="0.1" placeholder="Ex: 2.5" required />
          <span v-if="errors.weight" class="error-msg">{{ errors.weight }}</span>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">Annuler</button>
          <button type="submit" class="btn btn-primary">Enregistrer</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  asset: Object,
  mode: { type: String, default: 'create' }
})

const emit = defineEmits(['close', 'save'])

const formData = ref({ name: '', category: '', weight: null })
const errors = ref({})

watch(() => props.isOpen, (open) => {
  if (open) {
    if (props.mode === 'edit' && props.asset) {
      formData.value = { name: props.asset.name, category: props.asset.category, weight: props.asset.weight }
    } else {
      formData.value = { name: '', category: '', weight: null }
    }
    errors.value = {}
  }
})

const validate = () => {
  errors.value = {}
  if (!formData.value.name?.trim()) errors.value.name = 'Le nom est requis'
  if (!formData.value.category) errors.value.category = 'La categorie est requise'
  if (!formData.value.weight || formData.value.weight <= 0) errors.value.weight = 'Le poids doit etre > 0'
  return Object.keys(errors.value).length === 0
}

const handleSubmit = () => {
  if (validate()) emit('save', { ...formData.value })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: white; border-radius: 12px; padding: 2rem;
  max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 1.5rem;
}
.modal-header h3 { margin: 0; font-size: 1.5rem; color: #2d5016; }
.modal-close {
  background: none; border: none; font-size: 1.5rem;
  cursor: pointer; color: #666; padding: 0;
}
.modal-form { display: flex; flex-direction: column; gap: 1.5rem; }
.form-group { display: flex; flex-direction: column; gap: 0.5rem; }
.form-group label { font-weight: 600; color: #333; font-size: 0.95rem; }
.form-group input,
.form-group select {
  padding: 0.75rem; border: 1px solid #ddd;
  border-radius: 6px; font-size: 1rem; font-family: inherit;
}
.form-group input:focus,
.form-group select:focus {
  outline: none; border-color: #52cc52;
  box-shadow: 0 0 0 3px rgba(82,204,82,0.1);
}
.error-msg { color: #d32f2f; font-size: 0.85rem; }
.modal-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1rem; }
.btn {
  padding: 0.75rem 1.5rem; border: none; border-radius: 6px;
  font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s;
}
.btn-primary { background: #52cc52; color: white; }
.btn-primary:hover { background: #3aa83a; transform: translateY(-2px); }
.btn-secondary { background: #f5f5f5; color: #333; border: 1px solid #ddd; }
.btn-secondary:hover { background: #efefef; }
</style>
