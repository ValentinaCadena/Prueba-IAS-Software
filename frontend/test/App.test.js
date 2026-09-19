// Pruebas del componente principal.
//
// El primer bloque monta la vista sin sesion: no usa la red, es una prueba
// unitaria de componente.
//
// El segundo bloque es de integracion: monta el componente real y lo hace
// conversar con una API simulada. Integra vista + estado + cliente HTTP contra
// un contrato controlado. No es humo porque no hay navegador ni backend real.
//
// Los campos se buscan por su etiqueta visible, igual que haria una persona,
// para no depender de detalles internos del componente.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import App from '../src/App.vue';

const RESULTADO_AUTORIZADO = {
  requestReference: 'REQ-001',
  centerId: 'CENTER-001',
  partCode: 'PART-BRAKE-01',
  quantity: 2,
  priority: 'STANDARD',
  notes: null,
  status: 'AUTHORIZED',
  reason: null
};

const respuestaOk = (datos) => ({ ok: true, json: async () => datos });
const respuestaError = (datos) => ({ ok: false, json: async () => datos });

// Reemplaza fetch por una version simulada que responde segun la peticion.
function simularApi(respuestaDelRegistro) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url, opciones = {}) => {
      if (url.endsWith('/api/session')) return respuestaOk({ accessToken: 'token-de-prueba' });
      if (opciones.method === 'POST') return respuestaDelRegistro;
      return respuestaOk({ items: [] }); // listado de solicitudes recientes
    })
  );
}

// Busca un campo del formulario por el texto de su etiqueta.
function campo(wrapper, etiqueta) {
  const label = wrapper.findAll('label').find((l) => l.text().startsWith(etiqueta));
  return label.find('input, select, textarea');
}

async function iniciarSesion(wrapper) {
  await campo(wrapper, 'Usuario').setValue('usuario-de-prueba');
  await campo(wrapper, 'Contraseña').setValue('clave-de-prueba');
  await wrapper.find('form').trigger('submit');
  await flushPromises();
}

async function registrarSolicitud(wrapper, { referencia = 'REQ-001', cantidad = '2', notas = '' } = {}) {
  await campo(wrapper, 'Referencia').setValue(referencia);
  await campo(wrapper, 'Cantidad').setValue(cantidad);
  if (notas) await campo(wrapper, 'Notas').setValue(notas);
  await wrapper.find('form').trigger('submit');
  await flushPromises();
}

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('vista sin sesion', () => {
  it('muestra el formulario de acceso', () => {
    const wrapper = mount(App);

    expect(wrapper.text()).toContain('Acceso');
    expect(campo(wrapper, 'Usuario').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('Nueva solicitud');
  });
});

describe('registro de una solicitud con la API simulada', () => {
  it('muestra el resultado devuelto por la API', async () => {
    simularApi(respuestaOk(RESULTADO_AUTORIZADO));
    const wrapper = mount(App);

    await iniciarSesion(wrapper);
    await registrarSolicitud(wrapper);

    const resultado = wrapper.get('[data-testid="dispatch-result"]');
    expect(resultado.text()).toContain('REQ-001');
    expect(resultado.text()).toContain('AUTHORIZED');
  });

  it('no envia la solicitud si la cantidad esta fuera de rango', async () => {
    simularApi(respuestaOk(RESULTADO_AUTORIZADO));
    const wrapper = mount(App);
    await iniciarSesion(wrapper);
    const peticionesPrevias = fetch.mock.calls.length;

    await registrarSolicitud(wrapper, { cantidad: '99' });

    expect(fetch.mock.calls.length).toBe(peticionesPrevias);
    expect(wrapper.text()).toContain('Revisa los datos de la solicitud.');
  });

  it('muestra un mensaje cuando la API rechaza la solicitud', async () => {
    simularApi(respuestaError({ error: 'invalid_request' }));
    const wrapper = mount(App);

    await iniciarSesion(wrapper);
    await registrarSolicitud(wrapper);

    expect(wrapper.find('[data-testid="dispatch-result"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('invalid_request');
  });

  it('muestra las notas como texto y no las interpreta como HTML', async () => {
    // Confirma que la vista escapa la entrada del usuario (riesgo R6).
    const notaMaliciosa = '<img src=x onerror="alert(1)">';
    simularApi(respuestaOk({ ...RESULTADO_AUTORIZADO, notes: notaMaliciosa }));
    const wrapper = mount(App);

    await iniciarSesion(wrapper);
    await registrarSolicitud(wrapper, { notas: notaMaliciosa });

    expect(wrapper.find('img').exists()).toBe(false);
    expect(wrapper.get('[data-testid="dispatch-result"]').text()).toContain(notaMaliciosa);
  });
});
