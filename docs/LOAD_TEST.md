# Prueba de carga

## Qué se quería saber

El negocio espera que la consulta de disponibilidad aguante **30 solicitudes por
segundo**, con picos de **60 por segundo**. La prueba mide si eso se cumple.

## Cómo se diseñó

**Ruta elegida:** `GET /api/availability` con `CENTER-LOAD / PART-LOAD-01`.

Tres razones:

- Es de solo lectura, así que la prueba se puede repetir sin ensuciar el entorno.
- Es la ruta de la que habla el requisito.
- Ese dato viene con 100.000 unidades sembradas justamente para esto.

**Forma de generar la carga:** tasa de llegadas fija (`constant-arrival-rate`).

Se mandan 30 peticiones por segundo pase lo que pase, sin esperar a que las
anteriores terminen. Es como funciona la realidad: los centros consultan cuando
lo necesitan.

La alternativa (un número fijo de usuarios que esperan su turno) mediría otra
cosa: cuántas peticiones alcanza a hacer el sistema, no si aguanta el ritmo pedido.

**Los dos escenarios:**

| Escenario | Tasa | Dura | Empieza |
|---|---|---|---|
| Sostenida | 30 por segundo | 60 s | al inicio |
| Pico | 60 por segundo | 20 s | en el segundo 60 |

Total: **80 segundos**. El límite del ejercicio son 2 minutos.

Clientes usados: **40**. El límite son 50.

**Criterios definidos antes de ejecutar:**

| Criterio | Valor |
|---|---|
| Errores | menos del 1% |
| 95% de las respuestas | bajo 200 ms |

Se definen antes para no acomodar la meta al resultado.

## Qué salió

Ejecutado sobre Docker Compose en un equipo local, con k6 en la misma máquina.

| Métrica | Resultado | Objetivo |
|---|---|---|
| Peticiones totales | 3001 | — |
| Tasa sostenida lograda | **30.00 por segundo** | 30 ✅ |
| Tasa en pico lograda | **60.00 por segundo** | 60 ✅ |
| Peticiones descartadas | **0** | — |
| Errores | **0%** (0 de 3001) | < 1% ✅ |
| Verificaciones exitosas | 100% (6002 de 6002) | — |
| Mitad de las respuestas | bajo 1.92 ms | — |
| 95% de las respuestas | **bajo 2.7 ms** | < 200 ms ✅ |
| La más lenta de todas | 9.86 ms | — |

Los dos criterios se cumplieron:

```
✓ 'p(95)<200'   p(95)=2.7ms
✓ 'rate<0.01'   rate=0.00%
```

## Qué se puede concluir

**Lo que sí:**

- El servicio mantuvo exactamente la tasa pedida en los dos escenarios.
- Cero peticiones descartadas significa que nunca se quedó atrás: la tasa se
  cumplió, no se aproximó.
- No hubo ni un error en 3001 peticiones.
- Los tiempos se mantuvieron estables durante el pico. Incluso la respuesta más
  lenta tardó 10 ms, así que no hay casos malos escondidos.

**Lo que no, y es importante decirlo:**

- **No se encontró el punto de quiebre.** Sabemos que aguanta 60 por segundo.
  No sabemos si se rompe en 200 o en 2000. El margen fue tan grande que la carga
  nunca fue el límite.
- **Este entorno no se parece a producción.** Los datos están en memoria, no en
  una base de datos. Consultar disponibilidad es buscar en un diccionario: no hay
  disco ni red hacia otra máquina, que es lo que suele volverse lento de verdad.
- **k6 y el servicio comparten el mismo computador.** A estas tasas no afecta,
  pero a tasas altas estaríamos midiendo el equipo, no el servicio.
- **Solo se midió lectura.** No se probó qué pasa con muchas escrituras a la vez.

**En resumen:** el requisito se cumple con amplio margen en el entorno local,
para la operación de lectura. No es extrapolable a producción.

## Cómo se extendería

Los límites del ejercicio (2 minutos, 50 clientes) mantienen la prueba corta y
comparable, pero no alcanzan para caracterizar el servicio. Con un ambiente
dedicado haría:

1. **Buscar el punto de quiebre**, subiendo la tasa poco a poco hasta que los
   tiempos se degraden o aparezcan peticiones descartadas.
2. **Sostener la carga 30 o 60 minutos**, para ver si hay fugas de memoria o
   degradación lenta. En 80 segundos eso no se nota.
3. **Incluir las escrituras**, en una proporción parecida a la real.
4. **Mirar el servicio por dentro**: uso de procesador y memoria, no solo los
   tiempos que ve el cliente.

## Cómo repetirla

Con el entorno levantado:

```bash
k6 run load/availability.js
```

Contra otra URL:

```bash
API_URL=http://otro-host:3000 k6 run load/availability.js
```
