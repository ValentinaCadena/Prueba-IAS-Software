# Entorno local

## Opcion A - Docker Compose (recomendada)

1. Ejecutar `./scripts/init-local-env.sh`.
2. Ejecutar `docker compose up --build -d`.
3. Verificar `http://localhost:3000/health`.
4. Abrir `http://localhost:8080`.

Las URLs base y las credenciales utilizadas por las automatizaciones deben configurarse externamente. El archivo `.env` local no debe agregarse al repositorio.

## Opcion B - Ejecucion con Node.js

Backend:

```bash
cd backend
npm install
TEST_USERNAME=candidate TEST_PASSWORD=<valor-local> npm start
```

Frontend:

```bash
cd frontend
npm install
VITE_API_BASE_URL=http://localhost:3000 npm run dev
```

La aplicacion web queda normalmente en `http://localhost:5173` cuando se usa el servidor de desarrollo.

## Reinicio de datos

El backend utiliza datos en memoria. Reiniciar el proceso o el contenedor devuelve el sistema a los datos semilla.

## Consideraciones para automatizacion

El backend separa la construccion de la aplicacion del inicio del proceso servidor. El repositorio no prescribe la herramienta ni la estrategia que debe utilizarse para las pruebas; el candidato debe decidir el alcance apropiado de cada nivel.

La aplicacion web es accesible desde un navegador en la URL indicada. La herramienta elegida para automatizar la interfaz debe recibir la URL y las credenciales mediante configuracion externa. El starter no incluye Playwright, Cypress ni otra herramienta analoga como dependencia preinstalada.

No se requiere ejecutar la herramienta de navegador dentro de Docker. El candidato puede ejecutarla desde su equipo contra la aplicacion levantada con Docker Compose o contra la ejecucion local con Node.js.
