# Entorno base - Solicitudes de despacho

Repositorio base para la prueba tecnica de automatizacion sobre una aplicacion Node.js y Vue.js.

## Requisito recomendado

- Docker con soporte para `docker compose`.

No es necesario instalar Node.js localmente para levantar la aplicacion.

## Levantar el entorno

```bash
./scripts/init-local-env.sh
docker compose up --build -d
```

URLs locales:

- Aplicacion web: `http://localhost:8080`
- API: `http://localhost:3000`
- Salud: `http://localhost:3000/health`

La credencial se genera en `.env`, archivo ignorado por Git. Para consultarla nuevamente:

```bash
./scripts/show-local-credential.sh
```

Las URLs base, las credenciales y los datos variables utilizados por las automatizaciones deben configurarse externamente.

## Detener / reiniciar

```bash
docker compose down
docker compose up -d
```

Para reiniciar completamente el estado en memoria:

```bash
docker compose down
docker compose up --build -d
```

## Ejecucion sin Docker

Tambien es posible ejecutar backend y frontend con Node.js instalado. Consulta `docs/LOCAL_ENVIRONMENT.md`.

## Pruebas

Las pruebas se agrupan en dos familias segun si necesitan o no la aplicacion desplegada.
La distincion importa: determina que hay que levantar antes de ejecutarlas.

### Familia A - No requieren entorno levantado

Instancian el codigo directamente en el proceso de pruebas, sin puertos ni contenedores.
Son rapidas y determinsticas, y se pueden ejecutar en cualquier momento.

**Backend** (`node --test`, sin configuracion adicional):

| Suite | Archivo | Que valida |
|---|---|---|
| Unitarias - validacion | `backend/test/validation.test.js` | Rango de cantidad, prioridad y campos obligatorios |
| Unitarias - dominio | `backend/test/dispatchService.test.js` | Autorizacion, rechazo, descuento de disponibilidad e idempotencia |
| Integracion - API | `backend/test/api.integration.test.js` | Ruta HTTP + autenticacion + validacion + dominio trabajando juntos |

```bash
cd backend
npm install     # solo la primera vez
npm test
```

**Frontend** (`vitest` con `jsdom`, ya incluidos en el proyecto):

| Suite | Archivo | Que valida |
|---|---|---|
| Unitarias - validacion | `frontend/test/validators.test.js` | Rango de cantidad aceptado por el formulario |
| Componente e integracion | `frontend/test/App.test.js` | Vista sin sesion, y el flujo de registro contra una API simulada |

```bash
cd frontend
npm install     # solo la primera vez
npm test
```

Para ejecutar un solo archivo:

```bash
cd backend  && node --test test/api.integration.test.js
cd frontend && npx vitest run test/App.test.js
```

### Familia B - Requieren un entorno desplegado

Apuntan a una URL real y reciben la configuracion por variables de entorno.

Ambas viven en la carpeta `e2e/` y usan Playwright. Son suites separadas porque
responden preguntas distintas:

| Suite | Archivo | Responde a | Duracion |
|---|---|---|---|
| Humo | `e2e/tests/smoke/smoke.spec.js` | "El entorno esta disponible para empezar a validar?" | < 1s |
| Interfaz | `e2e/tests/ui/dispatch-flow.spec.js` | "El flujo del usuario funciona de punta a punta?" | < 1s |

La de humo comprueba tres cosas: que la API responda, que la web cargue, y que
la operacion critica (registrar y consultar una solicitud) funcione. Lo hace por
API, sin recorrer la interfaz, para terminar en segundos. Si falla, no tiene
sentido ejecutar el resto de las suites.

Requieren la aplicacion levantada. Primera vez:

```bash
cd e2e
npm install
npx playwright install chromium   # descarga el navegador
```

Ejecucion:

```bash
cd e2e
npm run humo        # solo la suite de humo
npm run interfaz    # solo la automatizacion de interfaz
npm test            # ambas
```

Variables que usan, leidas del `.env` de la raiz:

| Variable | Para que | Si no se define |
|---|---|---|
| `BASE_URL` | URL de la aplicacion web | `http://localhost:8080` |
| `API_URL` | URL de la API | `http://localhost:3000` |
| `TEST_USERNAME` | Usuario del formulario de acceso | Las pruebas fallan con un mensaje explicito |
| `TEST_PASSWORD` | Credencial del formulario de acceso | Las pruebas fallan con un mensaje explicito |

Para ejecutarlas contra el servidor de desarrollo de Vite en vez de Docker:

```bash
cd e2e
BASE_URL=http://localhost:5173 npm test
```

Ver el reporte detallado de la ultima ejecucion:

```bash
cd e2e
npx playwright show-report
```

Pendiente: carga.

### Evidencia de las ejecuciones y datos sensibles

Playwright registra en sus trazas **el texto escrito en los formularios, incluida
la credencial**. Por eso la configuracion solo guarda evidencia cuando una prueba
falla (`trace: 'retain-on-failure'`), no graba video, y las carpetas
`test-results/` y `playwright-report/` estan ignoradas por Git.

Si se comparte evidencia de una ejecucion, deben revisarse antes las capturas y
no adjuntarse las trazas sin depurar.

### Ambientes disponibles

Las suites de la familia B no dependen de como se levante la aplicacion, solo de
las URLs que reciban. Cambiar de ambiente significa cambiar variables, no codigo.

| Ambiente | API | Aplicacion web | Como se levanta |
|---|---|---|---|
| Docker Compose | `http://localhost:3000` | `http://localhost:8080` | `docker compose up --build -d` |
| Node local | `http://localhost:3000` | `http://localhost:5173` | `npm start` y `npm run dev` |

Los puertos de Docker se pueden cambiar con `BACKEND_PORT` y `FRONTEND_PORT` en `.env`.

### Sobre las pruebas omitidas

La suite reporta pruebas omitidas (`﹣`) con el motivo al lado. Corresponden a
defectos detectados y documentados en `docs/FINDINGS.md`: expresan el
comportamiento esperado segun las reglas de negocio, no el actual. Se mantienen
omitidas para que la suite siga siendo ejecutable en verde sin ocultar el hallazgo.
Al corregir el defecto en la aplicacion, basta con quitar la opcion `skip`.

```
﹣ no reprocesa una referencia ya despachada # Defecto F-01: no hay guarda de idempotencia (ver docs/FINDINGS.md)
```

## Flujo web disponible

La interfaz permite iniciar sesion, registrar una solicitud de despacho y observar el resultado, ademas de consultar solicitudes recientes. Este flujo puede utilizarse como base para la automatizacion de interfaz solicitada en la prueba.

## Datos de prueba

Consulta `docs/TEST_DATA.md`.

## Importante

La aplicacion es el sistema bajo prueba. No se espera que el candidato desarrolle nuevas funcionalidades de negocio. Los defectos que encuentre pueden documentarse con evidencia reproducible; no es obligatorio corregirlos.
