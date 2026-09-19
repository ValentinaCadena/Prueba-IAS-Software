# Estrategia de pruebas

Que se decidio probar, con que criterio, y que quedo fuera.

## Como prioricé

Antes de escribir pruebas leí el código de la aplicación. Eso sirvió para dos cosas:

- Confirmar un defecto real (F-01).
- Descartar dos riesgos que a primera vista parecían importantes pero no lo son.

Prioricé por **impacto en el negocio**, no por cobertura. Son despachos de
repuestos para vehículos parados: un despacho duplicado cuesta dinero.

## Riesgos

| ID | Riesgo | Resultado | Donde se prueba |
|---|---|---|---|
| R1 | Una referencia repetida se despacha dos veces | **Defecto confirmado** (F-01) | Unitaria backend |
| R2 | Entradas inválidas mal validadas | Correcto. Se fijan los bordes | Unitaria backend y frontend |
| R3 | Operaciones accesibles sin credencial | Correcto, salvo una ruta (O-01) | Integración |
| R4 | Errores que exponen datos internos | Correcto. Se fija el contrato | Integración |
| R5 | La consulta de disponibilidad no aguanta la carga | Aguanta con holgura | Carga (k6) |
| R6 | ~~XSS en el campo de notas~~ | **Descartado** | Confirmado en componente |
| R7 | ~~Dos solicitudes simultáneas venden lo mismo~~ | **Descartado** | No automatizado |

### Por qué descarté R6 (XSS)

La vista muestra las notas con `{{ }}`, que escapa el HTML automáticamente.
No se usa `v-html` en ninguna parte.

Aun así dejé una prueba que lo confirma. Si alguien cambiara la vista a `v-html`,
esa prueba falla.

### Por qué descarté R7 (sobreventa)

El código que descuenta inventario no tiene pausas en el medio. Node atiende
una petición completa antes de pasar a la siguiente, así que dos peticiones no
pueden entrelazarse ahí.

No lo automaticé porque confirmaría algo que ya se ve leyendo el código.

## Supuestos

**1. `GET /api/availability` sin credencial es intencional.**
El enunciado no dice que deba pedir sesión. Lo anoté como observación (O-01)
para confirmarlo con negocio, no como defecto.

**2. El estado se reinicia entre ejecuciones.**
Los datos están en memoria. Las pruebas que dependen de un número exacto crean
su propia instancia. Las que corren contra el entorno usan referencias nuevas
en cada corrida.

**3. La credencial es local y no se versiona.**
Se genera con `scripts/init-local-env.sh`. Las pruebas de integración usan
credenciales inventadas, así que no hay secretos en el código.

**4. No se puede agotar el inventario desde la API.**
El máximo por solicitud es 50 y el dato más bajo tiene 2500 unidades. El caso
de "sin disponibilidad" se prueba con un centro que no existe.

## Qué prueba cada nivel

| Nivel | Qué responde | Necesita la app levantada |
|---|---|---|
| Unitaria backend | ¿Las reglas están bien escritas? | No |
| Integración backend | ¿La API hace lo que promete? | No |
| Unitaria frontend | ¿La validación del formulario funciona? | No |
| Componente frontend | ¿La vista muestra lo correcto? | No |
| Interfaz | ¿El flujo del usuario funciona? | Sí |
| Humo | ¿El entorno está disponible? | Sí |
| Carga | ¿Aguanta el volumen esperado? | Sí |

## Qué dejé fuera y por qué

La suite se mantuvo corta a propósito. El enunciado dice que no se evalúa por
cantidad de pruebas. Prioricé los casos que expresan una regla del enunciado
sobre los que exploran combinaciones de valores.

| Lo que falta | Por qué | Cómo lo haría |
|---|---|---|
| Más tipos inválidos en `quantity` (`null`, `"10"`) | Ya cubrí los bordes del rango, que son los que expresan la regla | Una lista de valores inválidos en `validation.test.js` |
| Autenticación en cada ruta protegida | La probé en una. El middleware es compartido | Una prueba por ruta, igual a la que ya existe |
| Sobreventa con peticiones simultáneas | El código descarta el riesgo | Varias peticiones a la vez verificando el descuento total |
| JSON malformado y cuerpo muy grande | Riesgo bajo, la respuesta ya es controlada | Enviar un cuerpo cortado y otro de más de 32kb |
| Punto de quiebre bajo carga | El límite del ejercicio son 2 minutos | Subir la tasa hasta que se degrade (ver `LOAD_TEST.md`) |
