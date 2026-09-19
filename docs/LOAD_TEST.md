# Prueba de carga - Consulta de disponibilidad

## Objetivo

El negocio espera que `GET /api/availability` sostenga aproximadamente
**30 solicitudes por segundo**, con picos breves cercanos a **60 por segundo**.
Esta prueba evalua ese comportamiento en el entorno local.

## Diseno del experimento

**Ruta elegida:** `GET /api/availability?centerId=CENTER-LOAD&partCode=PART-LOAD-01`

Es de solo lectura: no modifica inventario, asi que la prueba se puede repetir
sin ensuciar el estado del entorno. El par `CENTER-LOAD / PART-LOAD-01` viene
sembrado con 100000 unidades justamente para este uso.

**Modelo de carga:** `constant-arrival-rate` (modelo abierto).

El requisito esta expresado en solicitudes por segundo, asi que se mide una tasa
de llegadas fija, independiente de lo que tarde el servicio. Un modelo cerrado
de usuarios concurrentes responderia otra pregunta -cuantas peticiones alcanza a
hacer el sistema- y no permitiria afirmar si sostiene la tasa pedida.

| Escenario | Tasa | Duracion | Inicio |
|---|---|---|---|
| Sostenida | 30 req/s | 60 s | 0 s |
| Pico | 60 req/s | 20 s | 60 s |

**Duracion total: 80 segundos.** Dentro del limite de 2 minutos del enunciado.

**Clientes concurrentes:** 20 reservados por escenario, maximo 50. Los escenarios
no se solapan. El maximo observado fue **40 clientes reservados**, sin necesidad
de escalar, dentro del limite de 50.

**Criterios de aceptacion declarados antes de ejecutar:**

| Umbral | Valor | Razon |
|---|---|---|
| `http_req_failed` | < 1% | Tasa de errores tecnicos aceptable |
| `http_req_duration p(95)` | < 200 ms | Tiempo de respuesta razonable para una consulta de lectura |

## Resultados obtenidos

Ejecucion sobre Docker Compose en equipo local (Apple Silicon), con k6 corriendo
en la misma maquina que el servicio.

| Metrica | Valor |
|---|---|
| Peticiones totales | 3001 |
| Tasa alcanzada - sostenida | **30.00 req/s** (objetivo: 30) |
| Tasa alcanzada - pico | **60.00 req/s** (objetivo: 60) |
| Iteraciones descartadas | **0** |
| Errores tecnicos | **0.00%** (0 de 3001) |
| Verificaciones exitosas | 100% (6002 de 6002) |
| Tiempo de respuesta - mediana | 1.92 ms |
| Tiempo de respuesta - p(90) | 2.56 ms |
| Tiempo de respuesta - p(95) | **2.70 ms** |
| Tiempo de respuesta - maximo | 9.86 ms |

Ambos umbrales se cumplieron:

```
✓ 'p(95)<200'   p(95)=2.7ms
✓ 'rate<0.01'   rate=0.00%
```

## Interpretacion

**Lo que si se puede afirmar:**

1. El servicio **sostuvo exactamente la tasa solicitada** en ambos escenarios.
   Cero iteraciones descartadas significa que k6 nunca se quedo sin clientes
   disponibles para mantener el ritmo: la tasa objetivo se cumplio, no se
   aproximo.
2. **No hubo errores tecnicos** ni respuestas invalidas en 3001 peticiones.
3. El tiempo de respuesta se mantuvo **estable durante el pico**. El p(95) de
   2.7 ms esta 74 veces por debajo del umbral declarado, y el maximo absoluto
   (9.86 ms) no muestra picos de latencia que sugieran encolamiento.

**Lo que NO se puede afirmar, y es importante decirlo:**

1. **No se encontro el punto de quiebre.** La prueba demuestra que el servicio
   soporta 60 req/s con holgura, pero no dice donde empieza a degradarse. El
   margen es tan amplio que la carga aplicada nunca fue el factor limitante.
2. **El entorno no es representativo de produccion.** El servicio corre en un
   unico proceso de Node, con los datos en memoria y sin base de datos. La
   operacion medida es una busqueda en un `Map` y una serializacion a JSON: no
   hay entrada/salida, que suele ser el verdadero cuello de botella.
3. **k6 y el servicio compiten por el mismo procesador.** A estas tasas no es
   significativo, pero invalidaria mediciones a tasas mucho mas altas.
4. **No se midio el comportamiento con escritura concurrente.** Solo se ejercito
   la ruta de lectura.

**Conclusion:** el requisito de negocio se cumple con amplio margen en el entorno
local, para la operacion de lectura evaluada. Ese resultado **no es extrapolable**
a produccion, donde la persistencia real cambiaria por completo el perfil de
tiempos.

## Como se extenderia en un ambiente dedicado

Los limites del ejercicio (2 minutos, 50 clientes) mantienen la prueba
comparable entre candidatos, pero impiden caracterizar el servicio. En un
ambiente dedicado, con el servicio y el generador de carga en maquinas
separadas, el siguiente paso seria:

1. **Buscar el punto de quiebre** con un escenario `ramping-arrival-rate` que
   suba la tasa progresivamente hasta que los tiempos se degraden o aparezcan
   iteraciones descartadas. Eso da la capacidad real, no solo la conformidad.
2. **Sostener la carga mas tiempo** (30 a 60 minutos) para detectar fugas de
   memoria o degradacion progresiva, invisibles en 80 segundos.
3. **Incluir la ruta de escritura** (`POST /api/dispatch-requests`) en una
   proporcion realista respecto a las lecturas.
4. **Observar el servicio desde adentro**: uso de CPU y memoria, no solo los
   tiempos vistos por el cliente.

## Como reproducir

Con el entorno levantado (`docker compose up --build -d`):

```bash
k6 run load/availability.js
```

Contra otra URL:

```bash
API_URL=http://otro-host:3000 k6 run load/availability.js
```
