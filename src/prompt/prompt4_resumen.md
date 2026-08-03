/* =========================================================
  ┌────────────────────────────┐
  │  PROMT 4 RESUMEN           │
  └────────────────────────────┘
  ========================================================= */

Estoy refactorizando progresivamente una web Vanilla JS de documentación técnica para estándares de facturación electrónica. Quiero continuar desde el punto exacto en el que me quedé en otro chat.

IMPORTANTE SOBRE CÓMO QUIERO QUE ME RESPONDAS

Quiero respuestas más breves, directas y accionables.

No repitas continuamente el mismo análisis, contexto o explicación en cada respuesta.
No vuelvas a explicarme una y otra vez la arquitectura si ya está clara.
No me des teoría salvo que sea imprescindible para entender un error concreto.
No me des opciones largas si hay una solución clara.

FORMATO OBLIGATORIO DE RESPUESTA

Al inicio de cada respuesta quiero siempre este formato:

ESTATUS ACTUAL
- OK:
  - Qué está confirmado que funciona.
- PENDIENTE:
  - Qué falta resolver ahora.
- PRÓXIMO PASO:
  - Acción concreta siguiente.

Después quiero:

CAMBIO A REALIZAR
- Fichero:
  ruta exacta del fichero.
- Bloque a buscar:
  código exacto o método donde tengo que tocar.
- Sustituir por:
  código exacto que debo pegar.
- Qué probar:
  pasos concretos de verificación.

Si hay error:
- dime el error exacto
- dime la causa probable
- dime el fichero exacto
- dime el bloque exacto a modificar
- dame el código exacto corregido

Si algo ya está OK:
- dilo claramente y no lo vuelvas a explicar en detalle en cada respuesta.

Si necesito compartirte un fichero:
- dime exactamente qué fichero o método necesitas.
- No me pidas el proyecto entero.
- No asumas que existe algo si no te lo he pasado.

REGLAS DE CÓDIGO

- Usa tabulación de 2 espacios.
- JavaScript Vanilla.
- Sin frameworks.
- Arquitectura modular, pero actualmente con scripts globales mediante window.
- No usar hardcodes basados en rutas.
- No usar if/else gigantes por tipo.
- No usar switch enormes por tipo.
- Evitar dependencias circulares.
- No usar "...".
- No omitir funciones cuando me des un fichero completo.
- Si me das código completo, debe estar listo para copiar y pegar.
- Si solo necesito modificar un bloque, dame solo el bloque necesario.

MI PREFERENCIA DE RESPUESTA

Prefiero este estilo:

ESTATUS ACTUAL
- OK:
  - ResponseRenderer ya entra.
  - GithubService ya carga assets.
- PENDIENTE:
  - El front sigue en Cargando porque no se ejecuta renderDescription/renderStructure.
- PRÓXIMO PASO:
  - Añadir los métodos de renderizado reales en response-renderer.js.

CAMBIO A REALIZAR
- Fichero:
  src/renderers/response-renderer.js

- Sustituye este bloque:
  ...

- Por este bloque:
  ...

- Prueba:
  1. Ctrl + F5
  2. Abrir #response-json
  3. Revisar consola
  4. Confirmar si desaparece Cargando

CONTEXTO GENERAL DEL PROYECTO

Estoy desarrollando una web de documentación técnica para estándares de facturación electrónica. La aplicación renderiza documentación y schemas JSON/XML/UBL basándose en una estructura de carpetas y en SITE_CONFIG.

La estructura funcional de documentación es:
- Invoice
- Response
- Status
- Versions

Cada grupo puede tener formatos:
- JSON
- XML
- UBL

Objetivo final:
Pasar de una arquitectura donde el renderizado depende principalmente del formato:
- JSON
- XML
- UBL

a una arquitectura donde dependa del tipo funcional:
- Invoice
- Response
- Status
- Versions

Cada grupo tendrá renderer propio:

renderers/
├── renderer-factory.js
├── base-renderer.js
├── invoice-renderer.js
├── response-renderer.js
├── status-renderer.js
└── versions-renderer.js

La fuente única de verdad debe seguir siendo:

SITE_CONFIG.sections[].cards[]

Cada card tiene estructura similar:

{
  id: 'invoice-json',
  group: 'Invoice',
  format: 'JSON',
  dir: 'E-invoicing/Standard/Invoice/Json',
  title_es: 'Factura JSON',
  title_en: 'Invoice JSON',
  description_es: '...',
  description_en: '...',
  category: 'Standard'
}

Algunas cards antiguas pueden tener también:

folder: 'Response / Json'

Por compatibilidad temporal, si en un renderer hace falta obtener la ruta, usar:

card.dir || card.folder

ESTADO ACTUAL DE LA MIGRACIÓN

PASO 1 - config.js

config.js ya fue revisado.
SITE_CONFIG ya tiene cards con:
- group
- format
- dir
- id
- title_es/title_en
- description_es/description_en
- category

PASO 2 - renderer-factory.js

Ya existe:

src/renderers/renderer-factory.js

Tiene métodos tipo:
- registerRenderer(group, RendererClass)
- hasRenderer(group)
- getRenderer(group)
- create(group)
- list()
- unregisterRenderer(group)
- clear()

Expone:

window.RendererFactory = RendererFactory;

PASO 2 - base-renderer.js

Ya existe:

src/renderers/base-renderer.js

Responsabilidades:
- showDetailView()
- clearView()
- showLoading(card)
- setHeader(card, schema)
- renderBadge(value, cssClass)
- activateTab(tabName)
- bindTabs()
- renderError(error)
- getCardTitle(card)
- getCardDescription(card)
- escape(value)
- getElement(id)
- setHTML(id, html)
- setText(id, text)

IMPORTANTE:
Las tabs no funcionaban al principio. Se corrigió con:

bindTabs() {
  document
    .querySelectorAll('.tab-btn')
    .forEach(button => {
      button.onclick = () => {
        const tabName = button.dataset.tab;

        if (!tabName) {
          return;
        }

        this.activateTab(tabName);
      };
    });
}

Y en los renderers, dentro de render(), después de showLoading(card), se llama a:

this.bindTabs();

PASO 2 - app.js

app.js se limpió bastante.
Ahora conserva:
- _VIEWS
- _currentSection
- variables legacy temporales:
  - _schemaRaw
  - _examples
  - _respSchemas
  - _respSections
- showView(id)
- showIndex()
- showDetail()
- showValidacion()
- getSectionGroups()
- getAllCards()
- findCardById(id)
- renderGrid(sections)
- init()
- localizedSectionTitle(s)
- localizedSectionDesc(s)
- openCard(cardId)
- window exports

Problemas ya solucionados:
1. No se renderizaban cards porque faltaba:

document.addEventListener(
  'DOMContentLoaded',
  init
);

2. Había una referencia a groupId/_slug que no hacía falta. Se eliminó y las cards empezaron a renderizar.

3. renderGrid debe generar cards con:

data-card-id="${esc(card.id)}"

PASO 2 - router.js

router.js se sustituyó por una versión que:
- lee location.hash
- llama a showIndex() para home/index/vacío
- llama a showValidacion() para validator/validacion
- busca card con findCardById(route)
- llama a openCard(card.id)
- escucha clicks en [data-card-id]
- expone:

window.initRouter = initRouter;
window.handleRoute = handleRoute;

PASO 3 - InvoiceRenderer

Ya existe:

src/renderers/invoice-renderer.js

Estado actual:
- InvoiceRenderer extiende BaseRenderer.
- Se registra con:

RendererFactory.registerRenderer('Invoice', InvoiceRenderer);

- Funciona:
  - abre las cards Invoice
  - abre el detalle
  - renderiza contenido interno
  - funcionan las tabs:
    - descripcion
    - estructura
    - enumeraciones
    - ejemplo

PASO 3.1 - SchemaUtils

Ya existe:

src/utils/schema-utils.js

Se añadió al index.html:

src/utils/schema-utils.jsscript>

Expone:

window.SchemaUtils = {
  resolveRef,
  resolvePointer,
  trimSchema,
  extractEnums,
  getFieldType,
  getFieldConstraints
};

Ya se migraron desde InvoiceRenderer:
- extractEnums(schema)
- getFieldType(definition)
- getFieldConstraints(definition)
- resolveRef()
- trimSchema()

Confirmado:
- no quedan llamadas a this.resolveRef(...)
- no quedan llamadas a this.trimSchema(...)
- resolvePointer() no se usa en InvoiceRenderer y se eliminó del renderer
- SchemaUtils.resolvePointer se mantiene porque puede usarse internamente por SchemaUtils.extractEnums()

PASO 3.2 - GithubService

Ya existe:

src/services/github-service.js

Se añadió al index.html antes de los renderers:

src/services/github-service.jsscript>

IMPORTANTE:
Hubo una confusión porque GithubService como clase y window.GithubService como instancia provocaban que:

GithubService.getDirectoryAssets is not a function

Solución aplicada:
desde los renderers se llama usando:

window.GithubService.getDirectoryAssets(...)

GithubService expone:
- listFolder(folder)
- getDirectoryAssets(folder)

Confirmado:
- GithubService funciona
- se eliminaron de InvoiceRenderer:
  - listFolder()
  - getDirectoryAssets()

PASO 4 - ResponseRenderer

Ya existe:

src/renderers/response-renderer.js

Se añadió al index.html después de invoice-renderer.js:

src/renderers/response-renderer.jsscript>

Se registró:

RendererFactory.registerRenderer(
  'Response',
  ResponseRenderer
);

Problemas ya encontrados y solucionados:
1. ResponseRenderer entraba correctamente pero se quedaba en "Cargando..." porque solo hacía:
showLoading()
getDirectoryAssets()
console.log(assets)
y no renderizaba nada.

2. ResponseRenderer recibía a veces:

{ card: {...} }

en vez de la card directamente.
Por eso se usa:

const card = cardData.card || cardData;

3. En consola se confirmó:

[ResponseRenderer] render: response-json
[ResponseRenderer] assets:
{
  schemas: Array(1),
  examples: Array(0),
  readmes: {...},
  others: Array(1)
}

4. Se detectó que algunas cards Response tienen:

dir: 'E-invoicing/Standard/Response/Json'

y también:

folder: 'Response / Json'

Para evitar errores, usar:

card.dir || card.folder

ESTADO ACTUAL EXACTO

Estoy sustituyendo response-renderer.js por una versión completa basada en los métodos reales de invoice-renderer.js, pero adaptada a Response.

El nuevo response-renderer.js debe incluir:
- constructor()
- async render(cardData)
- resetState()
- exposeLegacyState()
- buildSchemasData(files, results)
- buildExamplesData(files, results)
- renderDescription(schema, readmeText, examplesData, card)
- renderStructure(schema, card, schemaFileName, schemaPath)
- extractBlocks(schema, definitions)
- buildFieldTable(schema)
- renderEnumerations(schema)
- renderExamples(examples, card)
- localFilePath(card, fileNameOrPath)
- getExtension(name)
- getRawUrl(path)

IMPORTANTE:
En invoice-renderer.js actual hay algunos fragmentos corruptos heredados en links, por ejemplo:

}" target="_blank"
}" download

No copiarlos tal cual.
En response-renderer.js se están corrigiendo usando:

this.getRawUrl(path)

y enlaces completos.

OBJETIVO DEL SIGUIENTE CHAT

Quiero continuar desde aquí.

Primero revisar si el nuevo response-renderer.js funciona al abrir:

#response-json

Si hay error:
- analizar consola
- decir exactamente qué bloque modificar
- no rehacer toda la arquitectura

Si funciona:
- validar ResponseRenderer terminado
- revisar si conviene extraer lógica común entre InvoiceRenderer y ResponseRenderer
- no extraer todavía si no es necesario
- siguiente paso probable:
  PASO 5 - preparar StatusRenderer o limpiar duplicidad común progresivamente

QUÉ QUIERO QUE HAGAS AL INICIO DEL NUEVO CHAT

Primero respóndeme con:

ESTATUS ACTUAL
- OK:
- PENDIENTE:
- PRÓXIMO PASO:

Luego espera a que te pase el resultado de consola o el fichero que toque.

NO QUIERO
- Resúmenes largos repetidos.
- Repetición del contexto en cada respuesta.
- Explicaciones genéricas.
- Varias alternativas si hay una acción clara.
- Que me pidas confirmación para pasos evidentes.

SÍ QUIERO
- Código exacto.
- Fichero exacto.
- Bloque exacto.
- Qué probar después.
- Qué está OK y qué queda pendiente.