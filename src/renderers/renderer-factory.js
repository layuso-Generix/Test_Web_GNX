/* =========================================================
  ┌─────────────────────────────────────────────────────┐
  |  Responsabilidad:                                   │
  |  - Registrar renderizadores                         │
  |  - Obtener renderizadores                           │
  |  - Crear instancias de renderizadores               │
  |                                                     │
  |  NO contiene lógica de negocio.                     │
  |  NO conoce Invoice, Response, Status o Versions.    │
  └─────────────────────────────────────────────────────┘
========================================================= */

class RendererFactory {

    static _registry = new Map();

    /**
     * Registra un renderer.
     *
     * Ejemplo:
     * RendererFactory.registerRenderer(
     *   'Invoice',
     *   InvoiceRenderer
     * );
     */
    static registerRenderer(group, RendererClass) {

        if (!group) {
            throw new Error(
                'RendererFactory: group is required'
            );
        }

        if (!RendererClass) {
            throw new Error(
                `RendererFactory: renderer class is required for "${group}"`
            );
        }

        this._registry.set(
            String(group).toLowerCase(),
            RendererClass
        );
    }

    /**
     * Devuelve true si existe renderer.
     */
    static hasRenderer(group) {

        if (!group) {
            return false;
        }

        return this._registry.has(
            String(group).toLowerCase()
        );
    }

    /**
     * Devuelve la clase registrada.
     */
    static getRenderer(group) {

        if (!group) {
            return null;
        }

        return this._registry.get(
            String(group).toLowerCase()
        ) || null;
    }

    /**
     * Crea una instancia del renderer.
     */
    static create(group) {

        const RendererClass =
            this.getRenderer(group);

        if (!RendererClass) {

            const available =
                Array.from(this._registry.keys())
                    .join(', ');

            throw new Error(
                `RendererFactory: no renderer registered for "${group}". Registered renderers: ${available}`
            );
        }

        return new RendererClass();
    }

    /**
     * Devuelve lista de renderers registrados.
     */
    static list() {

        return Array.from(
            this._registry.keys()
        );
    }

    /**
     * Elimina un renderer.
     */
    static unregisterRenderer(group) {

        if (!group) {
            return;
        }

        this._registry.delete(
            String(group).toLowerCase()
        );
    }

    /**
     * Limpia todos los registros.
     * Útil para tests.
     */
    static clear() {

        this._registry.clear();
    }
}

/* =========================================================
   Exposición global
   ========================================================= */

window.RendererFactory = RendererFactory;