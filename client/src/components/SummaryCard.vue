<template>
  <div class="summary-card">
    <div class="summary-content">
      <span class="summary-icon">♻️</span>
      <div class="summary-text">
        <h2 class="summary-title">CO2 Economise</h2>
        <p class="summary-value">{{ totalCo2.toFixed(2) }} kg</p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  totalCo2: {
    type: Number,
    default: 0
  }
})
</script>

<style scoped>
.summary-card {
  background: linear-gradient(135deg, #2d5016 0%, #3a6b1f 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(45, 80, 22, 0.2);
}
.summary-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.summary-icon { font-size: 3rem; }
.summary-text { flex: 1; }
.summary-title {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.9;
  margin: 0;
}
.summary-value {
  font-size: 2.5rem;
  font-weight: bold;
  margin: 0.5rem 0 0;
}
</style>
