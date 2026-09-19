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

Apuntan a una URL y reciben configuracion externa. Aun no implementadas:
automatizacion de interfaz, humo y carga.

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
