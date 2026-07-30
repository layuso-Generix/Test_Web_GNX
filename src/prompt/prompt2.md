/* =========================================================
  ┌────────────────────────────┐
  │  PROMT 2                   │
  └────────────────────────────┘
  ========================================================= */

  Siguiendo la arquitectura de renderizadores que me has propuesto en tu primera respuesta, voy a compartirte los ficheros actuales de mi proyecto para que me ayudes a realizar una refactorización progresiva sin romper el funcionamiento existente.
IMPORTANTE:
- No quiero una solución teórica.
- No quiero pseudocódigo.
- No quiero ejemplos aislados.
- Quiero partir exactamente de mi código actual.
- Debes analizar los ficheros que te proporcione y reutilizar todo lo que sea válido.
- No quiero rehacer componentes que ya funcionan.
- El objetivo es evolucionar la aplicación actual hacia la nueva arquitectura de renderizadores especializados.
## Objetivo final
Quiero pasar de una arquitectura donde el renderizado depende principalmente del formato:
- JSON
- XML
- UBL
a una arquitectura donde dependa del tipo funcional:
- Invoice
- Response
- Status
- Versions
Cada tipo tendrá:
- Layout propio
- Componentes propios
- Lógica propia de renderizado
- Posibilidad de evolucionar independientemente
## Lo que necesito de ti
A medida que te comparta cada fichero:
- config.js
- app.js
- router.js
- file-viewer.js
- markdown-loader.js
- i18n.js
- index.html
- style.css
quiero que analices el código real y me indiques exactamente:
### 1. Qué responsabilidad tiene actualmente
Explica brevemente (no mas de 2lineas):
- Qué hace el fichero.
- Qué partes deben mantenerse.
- Qué partes deberían moverse a otro módulo.
### 2. Qué cambios debo realizar
Indícame:
- Líneas que sobran.
- Funciones que sobran.
- Funciones que deben modificarse.
- Funciones que deben extraerse.
### 3. Cómo debe quedar el fichero
Quiero ver:
- La estructura final recomendada.
- Las nuevas funciones.
- Las funciones eliminadas.
- Las funciones que permanecen.
### 4. Qué archivos nuevos debo crear
Por ejemplo:
renderers/
├── invoice-renderer.js
├── response-renderer.js
├── status-renderer.js
├── versions-renderer.js
├── renderer-factory.js
└── base-renderer.js
Indícame:
- Cuándo crear cada archivo.
- Qué contenido va dentro.
- Qué dependencias tendrá.
### 5. Orden exacto de implementación
No quiero recibir todos los cambios de golpe.
Quiero un plan paso a paso.
Por ejemplo:
PASO 1
- Modificar app.js
- Crear renderer-factory.js
PASO 2
- Crear base-renderer.js
PASO 3
- Extraer InvoiceRenderer
PASO 4
- Extraer ResponseRenderer
etc.
Cada paso debe ser pequeño y verificable para asegurar que la web sigue funcionando después de cada modificación.
### 6. Generación de código real
Cuando lleguemos a un paso concreto:
- Genera el código completo.
- No generes fragmentos.
- No utilices "...".
- No omitas funciones.
- No uses pseudocódigo.
Quiero el contenido completo del fichero listo para copiar y pegar.
### 7. Restricciones técnicas
Debes respetar:
- JavaScript Vanilla (sin frameworks)
- Arquitectura modular ES6
- Configuración basada en SITE_CONFIG
- Navegación actual
- Sistema de idiomas actual
- Sistema de carga markdown actual
- Compatibilidad futura con:
- Validation
- Extensions
- Mapping
- Documentation
### 8. Principios de diseño
La refactorización debe seguir:
- SOLID
- DRY
- Single Responsibility Principle
- Open/Closed Principle
- Separation of Concerns
Y especialmente:
- Evitar hardcodes
- Evitar if/else gigantes
- Evitar switch enormes por tipo
- Evitar dependencias circulares
### 9. Resultado esperado
Al finalizar la refactorización quiero poder añadir una nueva categoría simplemente añadiendo:
{
group: "Validation",
format: "JSON",
dir: "..."
}
y registrando un nuevo renderer:
registerRenderer("Validation", ValidationRenderer);
sin modificar el resto de la aplicación.
A partir de ahora voy a compartirte mis ficheros uno a uno.
Para cada fichero:
1. Analízalo.
2. Explícame su función actual.
3. Indica qué debe cambiar.
4. Indica en qué paso de la migración estamos.
5. Devuélveme el código completo actualizado listo para copiar y pegar cuando sea necesario.
Espera siempre al siguiente fichero antes de continuar con el siguiente paso.
