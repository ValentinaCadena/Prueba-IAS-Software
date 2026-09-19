# Decisiones técnicas

Qué se eligió, qué se descartó y por qué.

## Regla general

No meter una herramienta nueva si el proyecto ya trae una que sirve. Cada
dependencia agregada tiene que ganarse el puesto.

Resultado: solo se agregaron **tres** (`supertest`, `@playwright/test` y
`dotenv`), más k6 que se instala en el equipo y no va al repositorio.

## Herramientas

| Nivel | Elegido | Descartado | Por qué |
|---|---|---|---|
| Unitarias backend | `node --test` | Jest, Vitest | Ya venía configurado. Jest habría traído cientos de paquetes para hacer lo mismo |
| Integración backend | `supertest` | `fetch` + `app.listen(0)` | Sin supertest habría que abrir y cerrar un servidor en cada prueba. Una dependencia a cambio de mucho menos ruido |
| Frontend | `vitest` + `@vue/test-utils` | — | Ya venían en el proyecto |
| API simulada en frontend | Reemplazar `fetch` | MSW | El componente llama a `fetch` directo. MSW interceptaría en el mismo punto, pero sumando una dependencia |
| Interfaz | Playwright | Cypress, Selenium | Espera automática (evita los `sleep`), trazas para diagnosticar fallos, y configuración por variables de entorno incluida |
| Humo | Playwright, suite aparte | Otra herramienta | Reutilizar lo que ya está configurado. Se separan por carpeta y comando |
| Carga | k6 | Artillery, JMeter | Sabe trabajar con tasa de llegadas, que es como está escrito el requisito |

### k6 nativo, no en Docker

En macOS un contenedor no ve el `localhost` de la máquina. Habría que usar
`host.docker.internal`. Instalarlo con `brew` evita el problema y no mete la red
de Docker entre el medidor y el servicio.

## Decisiones sobre las pruebas

### Suite corta a propósito

El enunciado dice que no se evalúa por cantidad de pruebas. Se priorizaron los
casos que expresan una regla del enunciado. Lo que quedó fuera está listado en
`TEST_STRATEGY.md` con el motivo.

### El defecto queda como prueba omitida

La prueba del defecto F-01 está escrita según **lo que debería pasar**, no según
lo que la aplicación hace hoy. Queda omitida con el motivo visible.

- Si se escribiera al revés, el defecto quedaría convertido en la regla oficial.
- Si se dejara fallando, la suite no serviría como semáforo.
- Así la suite queda en verde y el hallazgo igual se ve al ejecutarla.

Cuando se corrija el defecto, basta quitar el `skip`.

### Los elementos se buscan por su etiqueta

Tanto en las pruebas de componente como en Playwright, los campos se buscan por
el texto que ve el usuario, no por clases de CSS ni por posición.

Si alguien reordena el formulario o cambia una clase, la prueba sigue pasando.
Si desaparece la etiqueta, falla — y debe fallar, porque el usuario tampoco
sabría qué llenar.

### Las referencias se generan en cada corrida

Las pruebas que tocan el entorno real usan `Date.now()` para armar la referencia.
Así se pueden repetir sin limpiar datos ni chocar con corridas anteriores.

### Las credenciales nunca están en el código

| Dónde | Cómo |
|---|---|
| Integración backend | Se inventan y se inyectan en `createApp()` |
| Frontend | La API está simulada, no hay login real |
| Interfaz y humo | Se leen del `.env` de la raíz, que no se versiona |

## Manejo de la evidencia

Las trazas de Playwright guardan **el texto que se escribe en los formularios,
incluida la contraseña**. Se verificó abriendo una traza.

Por eso:

- `trace: 'retain-on-failure'` — solo se guarda si algo falla.
- `video: 'off'` — no se graba nada.
- `test-results/` y `playwright-report/` están en `.gitignore` desde antes de la
  primera ejecución.

## Lo que no se hizo

- **No se corrigió el defecto F-01.** El enunciado dice que no es obligatorio y
  que el foco es documentarlo.
- **No se modificó la aplicación.** Ni siquiera para agregar identificadores de
  prueba: se usó el `data-testid` que ya traía y, para el resto, las etiquetas.
- **No se agregó un `package.json` en la raíz** para correr todo con un comando.
  Habría sido comodidad a cambio de un archivo más. Los comandos están en el
  README.
