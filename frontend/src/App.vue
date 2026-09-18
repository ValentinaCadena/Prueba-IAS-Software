<script setup>
import { computed, ref } from 'vue';
import { validQuantity } from './utils/validators.js';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const username = ref('');
const password = ref('');
const token = ref(sessionStorage.getItem('dispatch_token') || '');
const authError = ref('');
const error = ref('');
const result = ref(null);
const recent = ref([]);
const form = ref({
  requestReference: '',
  centerId: 'CENTER-001',
  partCode: 'PART-BRAKE-01',
  quantity: 1,
  priority: 'STANDARD',
  notes: ''
});

const canSubmit = computed(() =>
  form.value.requestReference.trim() &&
  form.value.centerId.trim() &&
  form.value.partCode.trim() &&
  validQuantity(form.value.quantity)
);

async function login() {
  authError.value = '';
  const response = await fetch(`${apiBase}/api/session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: username.value, password: password.value })
  });
  if (!response.ok) {
    authError.value = 'No fue posible iniciar sesión.';
    return;
  }
  const data = await response.json();
  token.value = data.accessToken;
  sessionStorage.setItem('dispatch_token', data.accessToken);
  await loadRecent();
}

async function submitDispatch() {
  error.value = '';
  result.value = null;
  if (!canSubmit.value) {
    error.value = 'Revisa los datos de la solicitud.';
    return;
  }
  const response = await fetch(`${apiBase}/api/dispatch-requests`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ ...form.value, quantity: Number(form.value.quantity) })
  });
  const data = await response.json();
  if (!response.ok) {
    error.value = data.error || 'No fue posible registrar la solicitud.';
    return;
  }
  result.value = data;
  await loadRecent();
}

async function loadRecent() {
  if (!token.value) return;
  const response = await fetch(`${apiBase}/api/dispatch-requests`, { headers: authHeaders(false) });
  if (response.ok) recent.value = (await response.json()).items || [];
}

function authHeaders(json = true) {
  const headers = { authorization: `Bearer ${token.value}` };
  if (json) headers['content-type'] = 'application/json';
  return headers;
}

function logout() {
  token.value = '';
  sessionStorage.removeItem('dispatch_token');
  recent.value = [];
  result.value = null;
}

if (token.value) loadRecent();
</script>

<template>
  <main class="container">
    <h1>Solicitudes de despacho</h1>
    <p class="subtitle">Centro de servicio - repuestos críticos</p>

    <section v-if="!token" class="card">
      <h2>Acceso</h2>
      <form @submit.prevent="login">
        <label>Usuario<input v-model="username" autocomplete="username" /></label>
        <label>Contraseña<input v-model="password" type="password" autocomplete="current-password" /></label>
        <button type="submit">Ingresar</button>
        <p v-if="authError" class="error">{{ authError }}</p>
      </form>
    </section>

    <template v-else>
      <button class="secondary" @click="logout">Cerrar sesión</button>
      <section class="card">
        <h2>Nueva solicitud</h2>
        <form @submit.prevent="submitDispatch">
          <label>Referencia<input v-model="form.requestReference" /></label>
          <label>Centro<input v-model="form.centerId" /></label>
          <label>Repuesto<input v-model="form.partCode" /></label>
          <label>Cantidad<input v-model="form.quantity" type="number" min="1" max="50" /></label>
          <label>Prioridad
            <select v-model="form.priority">
              <option>STANDARD</option>
              <option>CRITICAL</option>
            </select>
          </label>
          <label>Notas<textarea v-model="form.notes"></textarea></label>
          <button type="submit">Registrar</button>
        </form>
        <p v-if="error" class="error">{{ error }}</p>
        <div v-if="result" class="result" data-testid="dispatch-result">
          <strong>{{ result.requestReference }}</strong> - {{ result.status }}
          <p v-if="result.reason">{{ result.reason }}</p>
          <p v-if="result.notes">{{ result.notes }}</p>
        </div>
      </section>

      <section class="card">
        <h2>Solicitudes recientes</h2>
        <button class="secondary" @click="loadRecent">Actualizar</button>
        <ul>
          <li v-for="item in recent" :key="item.requestReference">
            {{ item.requestReference }} - {{ item.status }} - {{ item.partCode }} x {{ item.quantity }}
          </li>
        </ul>
      </section>
    </template>
  </main>
</template>
