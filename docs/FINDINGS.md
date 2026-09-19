# Hallazgos

Defectos y observaciones encontrados en la aplicación. No se corrigieron: el
ejercicio pide detectarlos y documentarlos, no arreglarlos.

Las credenciales se leen del `.env` local. No aparecen en este documento.

---

## F-01 · Una referencia repetida se despacha dos veces

| | |
|---|---|
| **Severidad** | Alta |
| **Dónde** | `backend/src/domain/dispatchService.js` |
| **Estado** | Abierto |
| **Prueba** | `backend/test/dispatchService.test.js`, prueba `no reprocesa una referencia ya despachada` (omitida) |

### La regla que no se cumple

El enunciado dice:

> Una `requestReference` ya procesada no debe provocar un segundo despacho ni
> descontar disponibilidad nuevamente. Si la misma referencia se recibe después
> con información diferente, debe preservarse el resultado original.

No se cumple ninguna de las dos partes.

### Cómo reproducirlo

Con el entorno recién levantado:

```bash
set -a && . ./.env && set +a
API=http://localhost:3000

TOKEN=$(curl -s -X POST "$API/api/session" -H 'content-type: application/json' \
  -d "{\"username\":\"$TEST_USERNAME\",\"password\":\"$TEST_PASSWORD\"}" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["accessToken"])')

# Disponibilidad antes
curl -s "$API/api/availability?centerId=CENTER-001&partCode=PART-BRAKE-01"

# Primera solicitud: cantidad 10
curl -s -X POST "$API/api/dispatch-requests" \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"requestReference":"REQ-DUP-001","centerId":"CENTER-001","partCode":"PART-BRAKE-01","quantity":10,"priority":"STANDARD"}'

# Misma referencia, ahora cantidad 20
curl -s -X POST "$API/api/dispatch-requests" \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"requestReference":"REQ-DUP-001","centerId":"CENTER-001","partCode":"PART-BRAKE-01","quantity":20,"priority":"CRITICAL"}'

# Qué quedó guardado
curl -s "$API/api/dispatch-requests/REQ-DUP-001" -H "authorization: Bearer $TOKEN"

# Disponibilidad después
curl -s "$API/api/availability?centerId=CENTER-001&partCode=PART-BRAKE-01"
```

### Lo que pasó

| Paso | Debería | Pasó |
|---|---|---|
| Disponibilidad antes | `5000` | `5000` |
| Primera solicitud | `201` autorizada | `201` autorizada |
| Segunda, misma referencia | Rechazarla o devolver la original | `201` — la procesó como nueva |
| Resultado guardado | cantidad `10`, `STANDARD` | cantidad `20`, `CRITICAL` |
| Disponibilidad después | `4990` | **`4970`** |

Se descontaron 30 unidades en lugar de 10.

### Por qué pasa

La función `create()` no revisa si la referencia ya existe antes de procesar.
Valida, descuenta y guarda encima del registro anterior.

### Por qué importa

Si el sistema cliente reintenta por un timeout, o alguien hace doble clic, se
despacha el repuesto dos veces y se descuenta inventario que nadie consumió.
El inventario del sistema deja de coincidir con el real.

### Cómo se arreglaría

Al principio de `create()`, si la referencia ya existe, devolver el resultado
guardado sin volver a procesar. Si los datos nuevos son distintos, responder con
un código que lo indique (por ejemplo `409`).

---

## Observaciones menores

### O-01 · `GET /api/availability` no pide credencial

Las otras tres operaciones de negocio sí piden sesión. Esta no. Muestra el
inventario por centro y repuesto a cualquiera.

El enunciado no aclara si debería pedirla, así que lo dejo como **duda a
confirmar con negocio**, no como defecto.

### O-02 · Los errores del cliente se registran como errores del servidor

Cuando llega un JSON mal formado, la aplicación escribe en el log
`Unhandled request error`. Pero es un error esperable del cliente, no una falla
del servidor. En producción eso genera ruido y puede disparar alertas sin motivo.

La respuesta al cliente sí está bien: `{"error":"invalid_json"}`, sin más datos.
