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

## Pruebas existentes

El repositorio contiene pruebas unitarias minimas de referencia. El alcance de la evaluacion requiere que el candidato amplie la estrategia de pruebas, incluyendo unitarias, integracion, automatizacion de interfaz en navegador, humo y carga segun el documento de la prueba.

No se incluyen ejemplos resueltos de pruebas de integracion, automatizacion de interfaz, humo o carga. Tampoco se instala una herramienta de automatizacion de navegador: su seleccion forma parte de las decisiones del candidato.

## Flujo web disponible

La interfaz permite iniciar sesion, registrar una solicitud de despacho y observar el resultado, ademas de consultar solicitudes recientes. Este flujo puede utilizarse como base para la automatizacion de interfaz solicitada en la prueba.

## Datos de prueba

Consulta `docs/TEST_DATA.md`.

## Importante

La aplicacion es el sistema bajo prueba. No se espera que el candidato desarrolle nuevas funcionalidades de negocio. Los defectos que encuentre pueden documentarse con evidencia reproducible; no es obligatorio corregirlos.
