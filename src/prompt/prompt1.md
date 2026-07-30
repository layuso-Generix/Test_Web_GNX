/* =========================================================
  ┌────────────────────────────┐
  │  PROMT 1                   │
  └────────────────────────────┘
  ========================================================= */

  Estoy desarrollando una web de documentación técnica para estándares de facturación electrónica. La aplicación renderiza automáticamente documentación y esquemas JSON, XML y UBL basándose en una estructura de carpetas y un fichero de configuración JavaScript.
## Contexto
La estructura actual contiene distintos tipos de artefactos:
- Invoice
- Response
- Status
- Versions
Cada uno dispone de formatos:
- JSON
- XML
- UBL
Actualmente el renderizado es genérico para todos los tipos, pero necesito que cada grupo tenga una lógica de presentación completamente diferente.
## Estructura actual
La documentación se organiza así:
E-invoicing/
└── Standard/
├── Invoice/
│ ├── Json/
│ ├── Xml/
│ └── UBL/
│
├── Response/
│ ├── Json/
│ ├── Xml/
│ └── UBL/
│
├── Status/
│ ├── Json/
│ ├── Xml/
│ └── UBL/
│
└── Versions/
├── Json/
└── Xml/
La navegación se genera dinámicamente desde SITE_CONFIG, donde cada card contiene propiedades como:
{
group: 'Invoice',
format: 'JSON',
dir: 'E-invoicing/Standard/Invoice/Json'
}
## Objetivo
Necesito refactorizar la aplicación para que el renderizado no dependa únicamente del formato JSON, XML o UBL, sino también del tipo funcional:
- Invoice
- Response
- Status
- Versions
Cada tipo tendrá componentes, layouts y lógica independientes.
## Requisitos
### 1. Arquitectura basada en renderizadores
Crear un sistema modular tipo:
renderers/
├── invoice-renderer.js
├── response-renderer.js
├── status-renderer.js
├── versions-renderer.js
└── renderer-factory.js
El sistema debe detectar automáticamente el valor de:
card.group
y cargar el renderer correspondiente.
Ejemplo:
Invoice -> InvoiceRenderer
Response -> ResponseRenderer
Status -> StatusRenderer
Versions -> VersionsRenderer
### 2. Invoice Renderer
Para Invoice necesito una vista rica que incluya:
- Readme ES
- Readme EN
- Schema principal
- Archivos de ejemplo
- Descargas
- Vista previa formateada del schema
- Navegación por secciones del schema
- Árbol de propiedades
- Búsqueda de campos
La página debe parecer documentación técnica moderna similar a:
- Swagger
- Redoc
- Microsoft Docs
### 3. Response Renderer
Las respuestas son diferentes de las facturas.
Necesito mostrar:
- Códigos de respuesta
- Ejemplos correctos
- Ejemplos erróneos
- Posibles errores
- Estructura de respuesta
No debe utilizar el mismo layout que Invoice.
### 4. Status Renderer
Los estados representan ciclos de vida.
Necesito mostrar:
- Lista de estados
- Transiciones
- Flujo visual
- Timeline
- Estados permitidos
- Estados finales
Si es posible, generar automáticamente diagramas visuales a partir del schema.
### 5. Versions Renderer
Necesito una pantalla especializada para comparar versiones.
Ejemplo:
1.0
↓
1.1
↓
2.0
Debe mostrar:
- Historial de versiones
- Cambios detectados
- Campos añadidos
- Campos eliminados
- Campos modificados
Tipo changelog técnico.
### 6. Compatibilidad futura
La solución debe permitir añadir fácilmente nuevos grupos:
{
group: 'Validation'
}
{
group: 'Extensions'
}
{
group: 'Mappings'
}
sin modificar el núcleo de la aplicación.
Debe seguir un patrón:
registerRenderer(group, renderer)
o similar.
### 7. Cambios necesarios
Analiza la estructura actual:
- CONFIG
- SITE_CONFIG
- app.js
- router.js
- file-viewer.js
- markdown-loader.js
y propón:
1. Nueva arquitectura.
2. Archivos nuevos a crear.
3. Archivos existentes a modificar.
4. Responsabilidades de cada módulo.
5. Flujo completo desde que el usuario hace clic en una card hasta que se renderiza el contenido.
6. Código ejemplo de un Renderer Factory.
7. Código ejemplo de InvoiceRenderer y StatusRenderer.
La solución debe seguir principios:
- SOLID
- Modular
- Escalable
- Fácil mantenimiento
- Separación clara entre datos, navegación y presentación.
Además, evita lógica basada en rutas hardcodeadas y utiliza únicamente la información existente en:
SITE_CONFIG.sections[].cards[]
como fuente única de verdad.