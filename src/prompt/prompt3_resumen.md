/* =========================================================
  ┌────────────────────────────┐
  │  PROMT 3 RESUMEN           │
  └────────────────────────────┘
  ========================================================= */

Estoy refactorizando progresivamente una web Vanilla JS de documentación técnica para estándares de facturación electrónica. Quiero continuar desde el punto exacto en el que me quedé en otro chat.

CONTEXTO GENERAL
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

REGLAS IMPORTANTES
- No quiero teoría.
- No quiero pseudocódigo.
- No quiero ejemplos aislados.
- Quiero partir exactamente de mi código actual.
- Debes analizar los ficheros reales que te pase.
- No quiero rehacer componentes que ya funcionan.
- Quiero refactorización progresiva y verificable.
- Si hay errores, dime la línea o bloque exacto donde está el error y cómo modificarlo.
- Usa tabulación de 2 espacios.
- JavaScript Vanilla.
- Sin frameworks.
- Arquitectura modular pero actualmente con scripts globales mediante window.
- No usar hardcodes basados en rutas.
- No usar if/else gigantes por tipo.
- No usar switch enormes por tipo.
- Evitar dependencias circulares.
- Mantener compatibilidad futura con:
  - Validation
  - Extensions
  - Mapping
  - Documentation

ESTADO ACTUAL DE LA MIGRACIÓN

PASO 1 - config.js
config.js ya fue revisado.
Está bien porque SITE_CONFIG ya tiene cards con:
- group
- format
- dir
- id
- title_es/title_en
- description_es/description_en
- category

Se recomendó añadir en el futuro group: "Versions", pero aún no es obligatorio.

PASO 2 - app.js, router y factory
Ya se creó:
src/renderers/renderer-factory.js

Su responsabilidad:
- registrar renderers
- comprobar si existe un renderer
- devolver instancias de renderer

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

Ya se creó:
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
Al principio las tabs no funcionaban. Se solucionó añadiendo en BaseRenderer:
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

Y en InvoiceRenderer, dentro de render(), después de showLoading(card), se llamó a:
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

Problemas encontrados y solucionados:
1. No se renderizaban cards porque faltaba:
document.addEventListener(
  'DOMContentLoaded',
  init
);

2. Había una referencia a groupId/_slug que no hacía falta. Se eliminó y las cards empezaron a renderizar.

3. renderGrid debe generar cards con:
data-card-id="${esc(card.id)}"

Para que router.js pueda detectar el click.

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
Ya se creó:
src/renderers/invoice-renderer.js

Estado actual:
- InvoiceRenderer extiende BaseRenderer.
- Se registra con:
RendererFactory.registerRenderer('Invoice', InvoiceRenderer);
- Ya funciona:
  - Abren las cards Invoice.
  - Se abre el detalle.
  - Se renderiza contenido interno.
  - Funcionan las tabs:
    - descripcion
    - estructura
    - enumeraciones
    - ejemplo

Problemas encontrados y corregidos:
1. En versiones anteriores había HTML corrupto en renderExamples() y renderStructure(), con fragmentos tipo:
}" download>
o
)" target="_blank"

Esto era incorrecto. Deben existir etiquetas <a> completas, por ejemplo:
<a
  class="file-btn file-btn--primary"
  href="${this.escape(rawUrl(path))}"
  downloadbtn.viewGithub')}
</a>

2. En extractBlocks(), para campos simples había:
properties: { prop }

Eso era incorrecto porque genera un campo llamado literalmente "prop".
Debe ser:
properties: {
  [key]: prop
}

3. Las tabs no funcionaban porque faltaba bindTabs() en BaseRenderer y llamarlo nvoiceRenderer.

PASO 3.1 - schema-utils.js
Se creó:
src/utils/schema-utils.js

Se añadió al index.html:
src/utils/schema-utils.jsscript>

IMPORTANTE:
Hubo un error "SchemaUtils is not defined" porque faltaba esa línea en index.html. Al añadirla, volvió a funcionar.

schema-utils.js contiene actualmente funciones globales en:
window.SchemaUtils = {
  resolveRef,
  resolvePointer,
  trimSchema,
  extractEnums,
  getFieldType,
  getFieldConstraints
};

Funciones ya migradas correctamente desde InvoiceRenderer a SchemaUtils:
- extractEnums(schema)
- getFieldType(definition)
- getFieldConstraints(definition)

Ya he modificado InvoiceRenderer para usar:
const type = SchemaUtils.getFieldType(raw);
const constraints = SchemaUtils.getFieldConstraints(raw);
const enums = SchemaUtils.extractEnums(schema);

Y ya eliminé de invoice-renderer.js las funciones locales:
- extractEnums()
- getFieldType()
- getFieldConstraints()

Esto funciona correctamente.

DESCUBRIMIENTO IMPORTANTE RECIENTE
En el paso siguiente se sugirió mover también:
- resolveRef()
- resolvePointer()
- trimSchema()

Pero al revisar invoice-renderer.js descubrí que:
- resolvePointer() existe en invoice-renderer.js pero NO se llama en ningún sitio dentro de invoice-renderer.js actual.

Por tanto:
- No debo migrar resolvePointer desde InvoiceRenderer si no se usa allí.
- resolvePointer sí puede quedarse en SchemaUtils porque lo usa SchemaUtils.extractEnums() internamente.
- Si en InvoiceRenderer queda una función local resolvePointer sin uso, se puede eliminar directamente del renderer, siempre que no haya llamadas a this.resolvePointer(...).

SIGUIENTE PASO ESPERADO
Quiero continuar desde aquí.

El siguiente paso lógico es limpiar InvoiceRenderer de forma segura:
1. Revisar invoice-renderer.js actual.
2. Confirmar qué funciones locales siguen existiendo:
   - resolveRef()
   - resolvePointer()
   - trimSchema()
   - extractBlocks()
   - buildFieldTable()
   - listFolder()
   - getDirectoryAssets()
3. Identificar cuáles se usan realmente.
4. Migrar de una en una solo las que proceda.
5. No mover todo de golpe.
6. Probar después de cada cambio.

RECOMENDACIÓN ACTUAL
No crear todavía ResponseRenderer hasta dejar InvoiceRenderer más limpio.

Orden recomendado:
PASO 3.1.7
- Revisar invoice-renderer.js real.
- Buscar llamadas:
  this.resolveRef(
  this.resolvePointer(
  this.trimSchema(
  this.extractBlocks(
  this.buildFieldTable(
- Si resolvePointer no se llama, eliminarlo de InvoiceRenderer.
- Mantener SchemaUtils.resolvePointer porque SchemaUtils.extractEnums lo puede usar internamente.
- Si trimSchema se usa, cambiar poco a poco:
  this.trimSchema(...)
  por:
  SchemaUtils.trimSchema(...)
- Si resolveRef se usa, cambiar poco a poco:
  this.resolveRef(...)
  por:
  SchemaUtils.resolveRef(...)
- Probar después de cada cambio.
- Solo después eliminar funciones locales del renderer.

PASO 3.2
Crear:
src/services/github-service.js

Mover desde InvoiceRenderer:
- listFolder(folder)
- getDirectoryAssets(folder)

Pero NO hacerlo hasta que SchemaUtils esté estable.

PASO 3.3
Limpiar InvoiceRenderer.

PASO 4
Crear ResponseRenderer usando ya:
- BaseRenderer
- RendererFactory
- SchemaUtils
- GitHubService cuando exista

OBJETIVO FINAL
Poder añadir una nueva card:
{
  group: "Validation",
  format: "JSON",
  dir: "..."
}

y simplemente registrar:
RendererFactory.registerRenderer("Validation", ValidationRenderer);

sin modificar app.js, router.js ni el núcleo de la aplicación.

FORMA DE TRABAJO QUE QUIERO
Para cada fichero que comparta:
1. Analízalo.
2. Dime responsabilidad actual en máximo 2 líneas.
3. Dime errores exactos por bloque o línea.
4. Dime qué modificar.
5. Dame código completo solo cuando sea necesario.
6. No uses "...".
7. No omitas funciones.
8. Usa tabulación de 2 espacios.
9. Respeta mi código actual y no rehagas lo que ya funciona.
10. Si te digo que algo no existe en mi fichero, no asumas que existe. Pídeme el método o fichero real.

CONTINUAR AHORA
Quiero continuar con:
- revisión de invoice-renderer.js actual
- limpieza de funciones restantes
- especial atención a que resolvePointer no se usa en invoice-renderer.js y no debe tratarse como si sí se usara.