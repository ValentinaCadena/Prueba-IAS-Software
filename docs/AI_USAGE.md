## Uso de Inteligencia Artificial

Se utilizó **Claude (Claude Code)** como herramienta de apoyo durante el desarrollo del ejercicio.

### Uso de IA

| Etapa | Uso de Claude |
|---|---|
| Entendimiento | Apoyo para interpretar el alcance, resolver dudas y revisar el enfoque de pruebas. |
| Instalación y configuración | Apoyo en la instalación de dependencias, herramientas y configuración necesaria para ejecutar el proyecto y las pruebas. |
| Backend | Apoyo en la estructuración y revisión de algunas pruebas unitarias. |
| Frontend | Apoyo en la revisión de algunas pruebas unitarias y resolución de dudas sobre su funcionamiento. |
| k6 | Apoyo puntual en la configuración y ejecución de las pruebas de carga. |
| Documentación | Apoyo en la organización, redacción y revisión del README y demás documentación. |

### Validación

La IA se utilizó como apoyo y sus sugerencias fueron validadas mediante la ejecución de las pruebas y la revisión del comportamiento real de la aplicación.

Las decisiones sobre la estrategia de pruebas, selección de escenarios, análisis de resultados, identificación de hallazgos y alcance fueron realizadas por mí.

El defecto **F-01** fue reproducido manualmente con `curl` antes de ser automatizado, verificando los resultados directamente contra el entorno.

También se ejecutaron escenarios negativos para comprobar que las pruebas fueran capaces de detectar fallos y no únicamente casos exitosos.

### Seguridad

- No se compartieron credenciales con Claude.
- El archivo `.env` no fue abierto ni enviado a la herramienta.
- Las credenciales se manejaron mediante variables de entorno.
- Se verificó que `.env` permaneciera incluido en `.gitignore`.
- Se revisó el manejo de evidencias de Playwright para evitar exponer información sensible.
- Antes de los commits se verificó que no se incluyeran credenciales ni información sensible.

### Participación

Claude fue utilizado como **herramienta de apoyo, consulta y revisión**, incluyendo instalaciones, configuración, resolución de dudas técnicas, algunas pruebas y documentación.

La **implementación final, ejecuciones, validación de resultados, análisis y decisiones técnicas** fueron realizadas por mí.