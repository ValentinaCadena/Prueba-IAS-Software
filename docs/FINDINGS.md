# Hallazgos

Defectos y observaciones detectados sobre la aplicacion base. No se corrigieron:
el alcance del ejercicio es detectarlos, documentarlos con evidencia reproducible
y dejarlos cubiertos por pruebas.

Las credenciales se leen del archivo `.env` local mediante variables de entorno y
no aparecen en este documento ni en la evidencia.

---

## F-01 - Una referencia ya procesada se vuelve a despachar

| | |
|---|---|
| **Severidad** | Alta |
| **Componente** | `backend/src/domain/dispatchService.js` |
| **Estado** | Abierto - no corregido |
| **Cobertura** | `backend/test/dispatchService.test.js`, prueba `no reprocesa una referencia ya despachada` (omitida a proposito) |

### Regla incumplida

> Una `requestReference` ya procesada no debe provocar un segundo despacho ni
> descontar disponibilidad nuevamente. Si la misma referencia se recibe despues
> con informacion diferente, la situacion debe manejarse de forma controlada y
> debe preservarse el resultado original.
>
> — Enunciado, seccion 3

Se incumplen las dos mitades de la regla: hay segundo despacho y el resultado
original se pierde.

### Reproduccion

Con el backend levantado en `http://localhost:3000` y el estado recien
reiniciado:

```bash
set -a && . ./.env && set +a
API=http://localhost:3000

TOKEN=$(curl -s -X POST "$API/api/session" -H 'content-type: application/json' \
  -d "{\"username\":\"$TEST_USERNAME\",\"password\":\"$TEST_PASSWORD\"}" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["accessToken"])')

# 1. Disponibilidad inicial
curl -s "$API/api/availability?centerId=CENTER-001&partCode=PART-BRAKE-01"

# 2. Primera solicitud: cantidad 10, STANDARD
curl -s -X POST "$API/api/dispatch-requests" \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"requestReference":"REQ-DUP-001","centerId":"CENTER-001","partCode":"PART-BRAKE-01","quantity":10,"priority":"STANDARD"}'

# 3. MISMA referencia, datos diferentes: cantidad 20, CRITICAL
curl -s -X POST "$API/api/dispatch-requests" \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"requestReference":"REQ-DUP-001","centerId":"CENTER-001","partCode":"PART-BRAKE-01","quantity":20,"priority":"CRITICAL"}'

# 4. Resultado almacenado
curl -s "$API/api/dispatch-requests/REQ-DUP-001" -H "authorization: Bearer $TOKEN"

# 5. Disponibilidad final
curl -s "$API/api/availability?centerId=CENTER-001&partCode=PART-BRAKE-01"
```

### Evidencia obtenida

| Paso | Esperado | Obtenido |
|---|---|---|
| 1. Disponibilidad inicial | `5000` | `5000` |
| 2. Primera solicitud | `201` AUTHORIZED | `201` AUTHORIZED |
| 3. Segunda solicitud, misma referencia | Manejo controlado, sin nuevo despacho | `201` AUTHORIZED - se proceso como nueva |
| 4. Resultado almacenado | cantidad `10`, prioridad `STANDARD` | cantidad `20`, prioridad `CRITICAL` |
| 5. Disponibilidad final | `4990` | **`4970`** |

Se descontaron 30 unidades donde correspondian 10.

### Causa raiz

`createDispatchService().create()` no consulta si la referencia ya fue procesada
antes de ejecutar la logica de despacho. No existe ninguna guarda equivalente a
`if (requests.has(input.requestReference))`: valida, descuenta disponibilidad y
sobreescribe el registro con `requests.set(...)`.

### Impacto de negocio

Un reintento del sistema cliente -por timeout, reenvio automatico o doble clic-
genera un segundo despacho fisico del repuesto y descuenta inventario que no se
consumio. El inventario registrado deja de coincidir con el real, y el resultado
consultado posteriormente no corresponde a la operacion que se autorizo.

### Sugerencia de correccion

Al inicio de `create()`, si la referencia ya existe, devolver el resultado
original sin reprocesar. Cuando los datos recibidos difieran del registro
original, responder con un codigo que lo indique de forma explicita (por ejemplo
`409 Conflict`) conservando el resultado original.

---

## Observaciones menores

### O-01 - `GET /api/availability` no exige autenticacion

A diferencia del resto de operaciones de negocio, esta ruta no aplica el
middleware de autenticacion (`backend/src/app.js`). Expone niveles de inventario
por centro y repuesto sin sesion.

El enunciado no define si esta ruta deberia requerir credencial, por lo que se
documenta como **supuesto pendiente de confirmacion** y no como defecto. No se
automatizo: confirmarlo con el area de negocio es previo a decidir si el
comportamiento correcto es exigir sesion o mantenerla abierta.

### O-02 - Errores de cliente se registran como errores no controlados

El manejador global de errores escribe `console.error('Unhandled request error', ...)`
tambien para un JSON malformado, que es un error esperable del consumidor (400).
En operacion esto genera ruido en los registros y puede disparar alertas por una
causa que no lo amerita.

La respuesta al cliente si es correcta: `{"error":"invalid_json"}`, sin traza ni
detalles internos.
