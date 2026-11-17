## Respuesta XML

### ¿Es para mí?

Es el mensaje que Generix devuelve **tras recibir cada envío de facturas**. Te dice si el fichero se ha aceptado o rechazado y, si hay errores, cuáles y dónde.
Este estándar describe ese mensaje en **XML**. Si trabajas con JSON, consulta **Respuesta JSON**.

---

### Dónde encaja en el flujo

```
Tu sistema ──Factura──▶ Generix ──Respuesta──▶ Tu sistema
                              └─Estados (1..n)──▶ Tu sistema
```

- **Cuándo llega:** una vez por cada envío de facturas.
- **Qué hacer:** si es un rechazo, corrige los errores indicados y vuelve a enviar.

---

### Resultados posibles

| Resultado | Significado | Qué hacer |
|---|---|---|
| Aceptado | El envío es válido | Nada; espera los Estados |
| Rechazado | El envío tiene errores | Corrige y reenvía |

<!-- REVISAR: confirmar los valores reales del campo de resultado y añadir los códigos de error habituales -->

---

### Cómo empezar

1. **Descarga el schema** (XSD) en *Ejemplos y schemas* para preparar tu sistema a recibir este mensaje.
2. **Revisa el ejemplo** de la misma pestaña: muestra un mensaje real completo.
3. **Relaciona cada mensaje con su factura** usando los identificadores que incluye (ver pestaña **Estructura**).

---

### Reglas que conviene conocer

| Tema | Regla |
|---|---|
| Fechas y horas | Formato `AAAA-MM-DDThh:mm:ss` |
| Países | Código de 2 letras (ISO 3166-1), p. ej. `ES` |
| Monedas | Código de 3 letras (ISO 4217), p. ej. `EUR` |
| Idiomas | Código de 2 letras (ISO 639-1), p. ej. `es` |
| Listas de valores | Solo se admiten los valores de la pestaña **Enumeraciones** |

---

### Qué encontrarás en cada pestaña

| Pestaña | Para qué sirve |
|---|---|
| **Descripción** | Esta guía |
| **Estructura** | Todos los bloques y campos: tipo, obligatoriedad y restricciones. Pulsa 🔗 para saltar a un tipo |
| **Enumeraciones** | Valores admitidos en cada lista, con su significado y dónde se usan |
| **Ejemplos y schemas** | Ficheros de ejemplo y schema para descargar |

---

### Versiones

Trabaja siempre con la **versión vigente** del schema. Las anteriores están en **Recursos › Versiones de esquemas**.
<!-- REVISAR: versión vigente y fecha -->

### ¿Dudas?

Contacta con tu interlocutor de Generix Spain adjuntando el **mensaje recibido** y el **número de factura** afectado.
