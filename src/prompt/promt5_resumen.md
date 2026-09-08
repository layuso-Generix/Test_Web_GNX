/* =========================================================
┌───────────────────────────────────────────────┐
│  PROMPT 5 RESUMEN 07/09/2026                  │
│  Refactorización Web E-Invoicing              │
└───────────────────────────────────────────────┘
========================================================= */

# FUNCIÓN DE ESTE PROMPT

Este documento permite retomar el proyecto en un chat nuevo sin reconstruir el contexto desde cero.

Al comenzar un chat nuevo, debes usar este contenido como contexto inicial y crear inmediatamente una Page lateral llamada:

`Estado Refactorización Web E-Invoicing`

La Page será la fuente de verdad permanente del proyecto y deberá mantenerse visible junto al chat.

---

# MODO DE TRABAJO OBLIGATORIO

## 1. Crear o recuperar la Page de estado

Al iniciar un chat nuevo:

1. Crea una Page lateral llamada `Estado Refactorización Web E-Invoicing`.
2. Copia en ella el estado del proyecto incluido en este prompt.
3. No vuelques el estado completo en el chat.
4. Usa el chat únicamente para resolver la tarea técnica actual.

Si la Page ya existe:

1. Consúltala antes de proponer cambios.
2. No crees una segunda Page.
3. Actualiza la Page existente.

## 2. Cuándo actualizar la Page

Actualiza la Page únicamente cuando ocurra uno de estos casos:

- Se completa una funcionalidad.
- Se cierra un renderer o una pestaña.
- Se crea o extrae un componente compartido.
- Cambia el objetivo activo.
- Se descubre un bloqueo o dependencia relevante.
- Una tarea pasa de Pendiente a En curso o a Completada.
- Se toma una decisión arquitectónica que deba mantenerse.

No actualices la Page por pruebas pequeñas, errores transitorios o cambios sin validar.

## 3. Cómo actualizar la Page

Cada actualización debe conservar el contenido anterior que siga siendo válido.

Mover las tareas entre:

- `✅ Completado`
- `🔄 En curso`
- `⏳ Pendiente`
- `🚫 Aparcado / No tocar`

Actualizar también:

- Progreso general.
- Objetivo actual.
- Siguiente acción concreta.
- Decisiones arquitectónicas, si han cambiado.

## 4. No repetir la Page en el chat

No mostrar un resumen completo del proyecto antes de cada respuesta.

En el chat indicar únicamente, cuando sea útil:

- Fichero que se modifica.
- Función o bloque exacto.
- Código listo para copiar y pegar.
- Prueba concreta que debe realizarse.

Solo mencionar el estado global cuando haya cambiado o cuando el usuario lo solicite.

---

# FORMA DE RESPONDER

Quiero respuestas:

- Breves y directas.
- Accionables.
- Sin repetir análisis ya cerrado.
- Con el fichero exacto que debe modificarse.
- Con la función o bloque exacto.
- Con código listo para copiar y pegar.
- Con una única prueba concreta después del cambio.

No quiero:

- Teoría innecesaria.
- Resúmenes largos repetitivos.
- Pseudocódigo si ya existe código real.
- Reescribir funcionalidades que ya funcionan.
- Pedir varios ficheros a la vez si basta con uno.
- Volver a investigar tareas marcadas como completadas, salvo que aparezca una regresión.

---

# REGLA DE MIGRACIÓN

Este proyecto migra una web que ya funciona en producción.

Antes de crear una funcionalidad:

1. Revisar cómo funciona en producción.
2. Revisar si ya existe en `InvoiceRenderer`.
3. Revisar si ya existe en `Components`.
4. Revisar si ya existe en `Utils`.
5. Revisar si ya existe en `Services`.
6. Reutilizar y adaptar antes de crear.
7. Evitar duplicación entre renderers.

No asumir que una funcionalidad debe desarrollarse desde cero.

---

# OBJETIVO DEL PROYECTO

Migrar una web documental de facturación electrónica basada en múltiples HTML independientes:

```text
invoice-json.html
invoice-xml.html
response-json.html
response-xml.html
status-json.html
status-xml.html
```

a una arquitectura modular:

```text
src/
├── app.js
├── config/
├── router/
├── services/
├── renderers/
├── components/
├── utils/
└── styles/
```

Manteniendo la funcionalidad existente para JSON y XML/XSD y mejorando arquitectura, seguridad, mantenibilidad y reutilización.

---

# ESTADO PARA CREAR LA PAGE

## Progreso

- **Arquitectura base:** completada.
- **InvoiceRenderer:** completado.
- **ResponseRenderer:** en curso.
- **StatusRenderer:** pendiente de revisión.
- **VersionsRenderer:** pendiente de revisión.
- **Limpieza legacy:** aparcada hasta validar dependencias.

## ✅ Completado

### Arquitectura base

- `RendererFactory` implementado y genérico.
- `BaseRenderer` implementado.
- Router hash operativo.
- `openCard()` crea el renderer con `RendererFactory.create(card.group)`.
- Renderers autorregistrados por grupo funcional.
- `GithubService`, `SchemaUtils` y `XsdUtils` extraídos.

### InvoiceRenderer

**Estado: cerrado.**

#### JSON

- Descripción.
- Estructura y navegación lateral.
- Enumeraciones.
- Ejemplos.

#### XML/XSD

- Descripción preparada para consumir `xs:documentation`.
- Estructura mediante `renderStructureXsd()`.
- Bloques mediante `buildXsdTypeBlock()`.
- Tablas de campos mediante `buildXsdFieldTable()`.
- Enumeraciones detectadas automáticamente.
- Snippet XSD original.
- Valores admitidos.
- Referencias “Usado en” obtenidas del esquema.
- Navegación lateral.
- Ejemplos XML.

### Enumeraciones

- `XsdUtils.extractEnums()` identifica automáticamente los `simpleType` con `enumeration`.
- `XsdUtils.getEnumUsage()` obtiene dónde se usa cada enumeración.
- JSON y XSD generan modelos compatibles.
- En JSON se usa `enumItem.defName || enumItem.field` como clave documental.
- Enumeraciones JSON deduplicadas por `item.defName || item.field`.
- `enum-descriptions.js` separado del renderer.
- Nuevo modelo documental basado en `values`.
- `enum-utils.js` incluye `getEnumInfo()` y `buildEnumRows()`.
- `usedIn` ya no se mantiene manualmente en `enum-descriptions.js`.

### Ejemplos

- Descargar.
- Abrir en GitHub.
- Mostrar y ocultar contenido.
- Soporte JSON y XML.
- Uso temporal de `window._examples` por compatibilidad.

### Componentes compartidos

#### `src/components/example-viewer.js`

- `downloadBlob()`
- `downloadExample()`
- `toggleExampleCode()`
- `renderJsonMinimap()`

#### `src/components/sidebar-navigation.js`

- `scrollToBlock()`

Estas funciones no deben volver a los renderers.

## 🔄 En curso

### ResponseRenderer

**Objetivo actual:** conseguir para XML/XSD el mismo comportamiento validado en InvoiceRenderer, manteniendo JSON operativo.

Orden de trabajo:

1. Revisar `render()` y el paso de `schemaRaw`.
2. Adaptar descripción XML/XSD.
3. Adaptar estructura XML/XSD.
4. Adaptar enumeraciones XML/XSD.
5. Adaptar ejemplos XML.
6. Reutilizar `XsdUtils`, `example-viewer.js`, `sidebar-navigation.js` y utilidades de enums.
7. Validar JSON y XML/XSD.

### `enum-descriptions.js`

La migración completa queda aparcada temporalmente.

Nuevo formato:

```js
EnumName: {
  title: '...',
  esp: '...',
  eng: '...',
  values: {
    CODE: {esp: '...', eng: '...'}
  }
}
```

No incluir `usedIn`, porque se obtiene directamente de los esquemas.

## ⏳ Pendiente

### StatusRenderer

- Comparar con InvoiceRenderer.
- Confirmar paridad JSON y XML/XSD.
- Reutilizar componentes y utilidades existentes.

### VersionsRenderer

- Revisar el estado funcional real.
- Confirmar si necesita adaptación adicional.

### Limpieza técnica

- Reducir dependencias de `window._examples`.
- Revisar duplicación entre InvoiceRenderer, ResponseRenderer y StatusRenderer.
- Completar `enum-descriptions.js`.
- Valorar un renderer común de enumeraciones si elimina duplicación sin perder claridad.

## 🚫 Aparcado: dependencias legacy

```text
js/
├── file-viewer.js
├── i18n.js
├── markdown-loader.js
└── validator.js
```

No mover ni eliminar hasta realizar un inventario de dependencias.

Al retirar anteriormente estos ficheros, `applyStaticI18n()` dejó de estar disponible y la inicialización se detuvo antes de renderizar las cards.

---

# DECISIONES ARQUITECTÓNICAS

1. No convertir XSD a JSON Schema.
2. JSON y XSD pueden usar extractores diferentes y producir modelos compatibles cuando comparten presentación.
3. La documentación funcional de enums vive en `enum-descriptions.js`.
4. Tipos, valores y referencias de uso se obtienen de los esquemas.
5. Los renderers generan las vistas de cada dominio funcional.
6. Las interacciones DOM reutilizables viven en `components/`.
7. La lógica pura vive en `utils/`.
8. Los servicios de carga y descarga viven en `services/`.
9. Reutilizar InvoiceRenderer antes de crear código en ResponseRenderer o StatusRenderer.

---

# SIGUIENTE ACCIÓN

Revisar en `response-renderer.js`:

```js
async render({ card })
```

y:

```js
renderStructure(...)
```

Objetivo: identificar qué soporte XML/XSD puede reutilizarse desde InvoiceRenderer sin duplicar lógica.

---

# INSTRUCCIÓN FINAL PARA UN CHAT NUEVO

Al recibir este prompt:

1. Crea inmediatamente la Page lateral `Estado Refactorización Web E-Invoicing` usando la sección “Estado para crear la Page”.
2. No reproduzcas todo el estado en el chat.
3. Confirma brevemente que la Page de seguimiento está preparada.
4. Continúa desde “Siguiente acción”.
5. Actualiza la Page únicamente cuando se alcance un hito, cambie la prioridad o aparezca un bloqueo relevante.
6. Mantén las respuestas concisas, técnicas y listas para aplicar.
