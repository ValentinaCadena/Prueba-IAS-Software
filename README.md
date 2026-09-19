# Solicitudes de despacho - Automatización de pruebas

Prueba técnica de automatización sobre una aplicación Node.js y Vue.js.

La aplicación es el sistema bajo prueba. Este repositorio agrega las pruebas, la
documentación y la evidencia de las ejecuciones.

## Qué hay acá

| Documento | Contiene |
|---|---|
| `docs/TEST_STRATEGY.md` | Riesgos priorizados, supuestos y qué quedó fuera |
| `docs/FINDINGS.md` | Defectos encontrados, con pasos para reproducirlos |
| `docs/DECISIONS.md` | Herramientas elegidas y descartadas, y por qué |
| `docs/LOAD_TEST.md` | Diseño, resultados e interpretación de la prueba de carga |
| `docs/AI_USAGE.md` | Dónde se usó IA, cómo se validó y qué se corrigió |

## Qué se automatizó

| Suite | Dónde | Pruebas |
|---|---|---|
| Unitarias backend | `backend/test/` | 10 |
| Integración backend | `backend/test/` | 5 |
| Unitarias y componente frontend | `frontend/test/` | 9 |
| Interfaz (navegador) | `e2e/tests/ui/` | 1 |
| Humo | `e2e/tests/smoke/` | 3 |
| Carga | `load/` | 2 escenarios |

Total: **28 pruebas**, una de ellas omitida a propósito (ver más abajo).

## Levantar el entorno

Se necesita Docker con `docker compose`.

```bash
./scripts/init-local-env.sh     # genera .env con la credencial local
docker compose up --build -d
```

Verificar:

```bash
curl http://localhost:3000/health     # {"status":"UP"}
open http://localhost:8080
```

| | URL |
|---|---|
| Aplicación web | `http://localhost:8080` |
| API | `http://localhost:3000` |

La credencial queda en `.env`, que Git ignora. Para verla de nuevo:

```bash
./scripts/show-local-credential.sh
```

Para apagar todo y reiniciar los datos (están en memoria):

```bash
docker compose down
```

También se puede correr sin Docker. Ver `docs/LOCAL_ENVIRONMENT.md`.

---

# Correr las pruebas

Hay dos grupos, según si necesitan la aplicación levantada o no.

## Grupo 1 · No necesitan nada levantado

Corren el código directamente, sin puertos ni contenedores. Son rápidas.

### Backend

```bash
cd backend
npm install     # solo la primera vez
npm test
```

| Archivo | Qué prueba |
|---|---|
| `validation.test.js` | Rango de cantidad, prioridad y campos obligatorios |
| `dispatchService.test.js` | Autorizar, rechazar, descontar inventario e idempotencia |
| `api.integration.test.js` | La API completa: ruta, login, validación y lógica juntos |

### Frontend

```bash
cd frontend
npm install     # solo la primera vez
npm test
```

| Archivo | Qué prueba |
|---|---|
| `validators.test.js` | La validación de cantidad del formulario |
| `App.test.js` | La vista sin sesión y el flujo de registro contra una API simulada |

### Un solo archivo

```bash
cd backend  && node --test test/api.integration.test.js
cd frontend && npx vitest run test/App.test.js
```

## Grupo 2 · Necesitan la aplicación levantada

Apuntan a una URL y reciben la configuración por variables de entorno.

### Interfaz y humo (Playwright)

Son dos suites separadas porque responden preguntas distintas:

| Suite | Responde | Cómo |
|---|---|---|
| Humo | ¿El entorno está disponible para empezar a validar? | Por API, en menos de 1 segundo |
| Interfaz | ¿El flujo del usuario funciona? | Con un navegador real |

Si humo falla, no tiene sentido correr las demás suites.

Primera vez:

```bash
cd e2e
npm install
npx playwright install chromium     # descarga el navegador
```

Ejecución:

```bash
cd e2e
npm run humo          # solo humo
npm run interfaz      # solo interfaz
npm test              # las dos
```

Ver el reporte de la última ejecución:

```bash
cd e2e && npx playwright show-report
```

### Carga (k6)

Mide si la consulta de disponibilidad aguanta 30 solicitudes por segundo, con
picos de 60. Dura 80 segundos.

```bash
brew install k6                 # solo la primera vez
k6 run load/availability.js     # con el entorno levantado
```

Los resultados y su interpretación están en `docs/LOAD_TEST.md`.

> La carga apunta a una ruta de solo lectura, así que no altera el inventario.

---

# Configuración

Todas las variables se leen del `.env` de la raíz. `.env.example` tiene la
plantilla, sin valores reales.

| Variable | Para qué | Si no se define |
|---|---|---|
| `TEST_USERNAME` | Usuario de la aplicación | Las pruebas fallan avisando qué falta |
| `TEST_PASSWORD` | Credencial de la aplicación | Las pruebas fallan avisando qué falta |
| `BASE_URL` | URL de la aplicación web | `http://localhost:8080` |
| `API_URL` | URL de la API | `http://localhost:3000` |
| `BACKEND_PORT` | Puerto de la API en Docker | `3000` |
| `FRONTEND_PORT` | Puerto de la web en Docker | `8080` |

## Cambiar de ambiente

Las suites no dependen de cómo se levante la aplicación, solo de la URL que
reciban. Cambiar de ambiente es cambiar una variable.

| Ambiente | API | Web | Cómo se levanta |
|---|---|---|---|
| Docker Compose | `:3000` | `:8080` | `docker compose up --build -d` |
| Node local | `:3000` | `:5173` | `npm start` y `npm run dev` |

Por ejemplo, contra el servidor de desarrollo de Vite:

```bash
cd e2e
BASE_URL=http://localhost:5173 npm test
```

---

# Cosas que conviene saber

## Hay una prueba omitida a propósito

Al correr las pruebas del backend verás esto:

```
﹣ no reprocesa una referencia ya despachada # Defecto F-01 (ver docs/FINDINGS.md)
```

Es un defecto encontrado en la aplicación. La prueba está escrita según lo que
**debería** pasar, no según lo que pasa hoy, y queda omitida para que la suite
siga en verde sin esconder el hallazgo.

Cuando se corrija el defecto, se quita el `skip` y la prueba pasa.

Los detalles están en `docs/FINDINGS.md`.

## Las trazas de Playwright guardan la contraseña

Se verificó: las trazas registran el texto que se escribe en los formularios,
incluido el campo de contraseña.

Por eso la configuración solo guarda evidencia cuando algo falla, no graba
video, y `test-results/` y `playwright-report/` están en el `.gitignore`.

Si se comparte evidencia, revisar antes las capturas y no adjuntar las trazas.

## Los datos están en memoria

Reiniciar el contenedor devuelve el inventario a los valores iniciales. Ver
`docs/TEST_DATA.md`.

Después de correr la carga o varias veces la interfaz, conviene reiniciar antes
de tomar evidencia:

```bash
docker compose down && docker compose up -d
```
