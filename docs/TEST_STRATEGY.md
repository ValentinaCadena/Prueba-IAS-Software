# Estrategia de pruebas

Analisis previo a la automatizacion: que riesgos se priorizaron, con que criterio,
que supuestos se asumieron y que nivel de prueba cubre cada riesgo.

## Criterio de priorizacion

Se priorizo por **impacto de negocio**, no por cobertura. El escenario describe
despachos de repuestos criticos para vehiculos inmovilizados, donde un despacho
duplicado o un inventario descuadrado tienen costo operativo directo.

El analisis partio de leer el codigo de la aplicacion antes de escribir pruebas.
Eso permitio descartar dos riesgos que en un analisis superficial parecerian
relevantes, y concentrar el esfuerzo donde si hay exposicion real.

## Riesgos identificados

| ID | Riesgo | Estado tras el analisis | Nivel que lo cubre |
|---|---|---|---|
| R1 | Una `requestReference` repetida provoca un segundo despacho | **Defecto confirmado** (F-01) | Unitaria + integracion + interfaz |
| R2 | Entradas invalidas aceptadas o mal reportadas | Validacion correcta; se fijan los bordes | Unitaria backend + frontend |
| R3 | Operaciones de negocio accesibles sin credencial | Correcto salvo una ruta (O-01) | Integracion + humo |
| R4 | Respuestas de error que exponen detalles internos | Correcto; se fija el contrato | Integracion |
| R5 | Degradacion de la consulta de disponibilidad bajo carga | Sin medir | Carga |
| R6 | ~~XSS almacenado via `notes`~~ | **Descartado** - ver abajo | Confirmado en prueba de componente |
| R7 | ~~Sobreventa por solicitudes concurrentes~~ | **Descartado** - ver abajo | No automatizado (ver alcance no cubierto) |

### Por que se descarto R6

La vista renderiza `notes` con interpolacion de texto (`{{ }}`), que escapa HTML
por defecto. No se usa `v-html` en ningun punto de la aplicacion, por lo que un
payload en `notes` se muestra como texto, no se ejecuta.

No se elimina del alcance: en el bloque de frontend se incluye una prueba que
**confirma el escapado**, de modo que si alguien cambiara la vista a `v-html` la
suite lo detecte.

### Por que se descarto R7

El manejador de `POST /api/dispatch-requests` invoca al dominio de forma
sincrona, sin operaciones asincronas entre la consulta de disponibilidad y el
descuento. El modelo de ejecucion de Node procesa cada manejador hasta el final
antes de atender el siguiente, por lo que no existe una ventana de
"consultar y luego descontar" explotable entre peticiones concurrentes.

Al no haber exposicion real, se prioriza no invertir tiempo de automatizacion
aqui. Queda registrado en el alcance no cubierto como verificacion opcional.

## Supuestos

1. **`GET /api/availability` sin autenticacion es intencional.** El contrato del
   enunciado no indica que requiera sesion. Se documenta como observacion (O-01)
   y se fija el comportamiento actual con una prueba, en lugar de reportarlo como
   defecto.
2. **El estado en memoria se reinicia entre ejecuciones.** Las pruebas que
   dependen de disponibilidad concreta construyen su propia instancia del
   servicio; las que corren contra el entorno desplegado usan referencias
   generadas dinamicamente para no depender de ejecuciones anteriores.
3. **La credencial local es de un solo uso y no se versiona.** Se genera con
   `scripts/init-local-env.sh` en `.env`, ignorado por Git. Las pruebas de
   integracion inyectan sus propias credenciales, por lo que ningun secreto real
   aparece en el codigo de pruebas.
4. **El camino de rechazo por falta de disponibilidad no es alcanzable end-to-end.**
   La cantidad maxima por solicitud es 50 y la semilla mas baja tiene 2500
   unidades, por lo que agotar el inventario via API exigiria decenas de
   peticiones. Ese camino se cubre en pruebas unitarias usando una combinacion
   centro/repuesto inexistente, que reporta disponibilidad cero.

## Que valida cada nivel

| Nivel | Proposito | Aislamiento |
|---|---|---|
| Unitaria backend | Reglas de validacion y logica de despacho, campo por campo y caso por caso | Sin HTTP ni red; cada prueba instancia su propio servicio |
| Integracion backend | Que el contrato HTTP publicado coincida con el comportamiento del dominio | Aplicacion en proceso, sin puertos ni contenedores |
| Unitaria frontend | Logica de validacion y comportamiento observable de la vista | Sin red; API simulada |
| Integracion frontend | Componente, estado y cliente HTTP contra un contrato controlado | Sin navegador ni backend real |
| Interfaz | Un flujo de usuario completo sobre la aplicacion desplegada | Entorno real; datos generados por ejecucion |
| Humo | Decidir rapidamente si el entorno esta disponible para validar | Entorno real; sin aserciones de negocio profundas |
| Carga | Comportamiento de la consulta de disponibilidad ante una tasa de llegadas dada | Entorno real; ruta que no muta estado |

## Alcance no cubierto y por que

La suite se mantuvo deliberadamente acotada. El enunciado indica que no se evalua
por cantidad de pruebas sino por la calidad de las decisiones, asi que se
priorizaron los casos que **expresan una regla del enunciado** por encima de los
que exploran el espacio de valores posibles.

Lo que quedo fuera, en orden de prioridad si hubiera mas tiempo:

| Caso no cubierto | Por que se dejo fuera | Como se validaria |
|---|---|---|
| Bordes de tipo en `quantity` (`null`, `"10"`, ausente) | Se cubrieron los bordes del rango (0, 51, decimal), que son los que expresan la regla de negocio. Los de tipo son menos probables desde un cliente que serializa JSON | Ampliar `validation.test.js` con una tabla de valores invalidos |
| Autenticacion ruta por ruta | Se verifico en una ruta. El middleware es compartido, pero una ruta podria quedar sin conectarlo, que es justamente lo observado en O-01 | Una prueba por ruta protegida que afirme 401 sin credencial |
| Sobreventa con peticiones concurrentes (R7) | El analisis del codigo descarta la exposicion; automatizarlo confirmaria algo ya demostrado por inspeccion | Varias peticiones simultaneas verificando que el descuento sea la suma exacta |
| JSON malformado y limite de tamano del cuerpo | Riesgo bajo: la respuesta ya es controlada y no expone trazas | Enviar un cuerpo truncado y uno mayor a 32kb, verificando 400 y 413 |
| Rechazo por agotamiento real de inventario | No alcanzable end-to-end: maximo 50 por solicitud contra semillas de 2500+ (ver supuesto 4) | Sembrar un dato con disponibilidad baja, o cubrirlo solo a nivel unitario como se hizo |

## Estado de la implementacion

| Bloque | Estado |
|---|---|
| Unitarias backend | Implementado |
| Integracion backend | Implementado |
| Unitarias frontend | Implementado |
| Integracion frontend | Implementado |
| Automatizacion de interfaz | Implementado |
| Humo | Pendiente |
| Carga | Pendiente |
