## Estados JSON

### ¿Es para mí?

Son los mensajes que Generix envía **cada vez que cambia la situación de una factura** después de aceptarla. Permiten seguir la factura hasta su estado final.
Este estándar describe ese mensaje en **JSON**. Si trabajas con XML, consulta **Estados XML**.

---

### Dónde encaja en el flujo

```
Tu sistema ──Factura──▶ Generix ──Respuesta──▶ Tu sistema
                              └─Estados (1..n)──▶ Tu sistema
```

- **Cuándo llega:** cada vez que la factura cambia de estado, así que puede haber varios por factura.
- **Qué hacer:** actualiza el estado de la factura en tu sistema con el último recibido.

---

### Estados posibles

Los valores admitidos y su significado están en la pestaña **Enumeraciones**.

<!-- REVISAR: añadir aquí la tabla Estado | Significado | ¿Es final? y el orden habitual del ciclo de vida -->

---

### Cómo empezar

1. **Descarga el schema** (JSON Schema) en *Ejemplos y schemas* para preparar tu sistema a recibir este mensaje.
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
