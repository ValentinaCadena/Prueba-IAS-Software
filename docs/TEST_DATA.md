# Datos estables de prueba

Los siguientes datos se cargan cada vez que inicia el backend:

| centerId | partCode | disponibilidad inicial | uso sugerido |
|---|---|---:|---|
| CENTER-001 | PART-BRAKE-01 | 5000 | Flujos funcionales, integracion, interfaz y humo |
| CENTER-001 | PART-FILTER-01 | 3000 | Casos alternos |
| CENTER-002 | PART-BRAKE-01 | 2500 | Casos por centro |
| CENTER-LOAD | PART-LOAD-01 | 100000 | Consulta de disponibilidad bajo carga |

Consideraciones:

- `requestReference` debe ser unica por solicitud nueva. Para ejecuciones repetibles se recomienda generarla dinamicamente desde la automatizacion.
- Para validar el comportamiento de una referencia repetida, reutiliza deliberadamente el mismo valor.
- El flujo web permite autenticarse, registrar una solicitud y observar el resultado. Para automatizacion de interfaz, utiliza referencias dinamicas y evita depender del estado dejado por una ejecucion anterior.
- La carga debe dirigirse preferiblemente a la consulta de disponibilidad de `CENTER-LOAD / PART-LOAD-01`, que no modifica el estado.
- Reiniciar el backend restablece el estado inicial.
