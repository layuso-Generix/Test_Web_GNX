/* =========================================================
  base-renderer.js — Clase base para renderizadores en la web de E-Invoicing

  ┌─────────────────────────────────────────────────────┐
  |  Clase base para todos los renderizadores.          |
  |                                                     │
  |  Responsabilidades:                                 |
  |  - Mostrar la vista de detalle.                     |
  |  - Limpiar contenedores.                            |
  |  - Configurar cabecera.                             |
  |  - Gestionar estados de carga.                      |
  |  - Gestionar errores comunes.                       |
  |                                                     │
  |  NO contiene lógica específica de:                  |
  |  - Invoice                                          |
  |  - Response                                         |
  |  - Status                                           |
  |  - Versions                                         |
  └─────────────────────────────────────────────────────┘
   ========================================================= */

class BaseRenderer {

    constructor() {
        this.card = null;
    }

    /* =====================================================
      Entrada común
    ===================================================== */

    async render({ card }) {
        throw new Error(
            `${this.constructor.name} must implement render()`
        );
    }

    /* =====================================================
       Vista principal detalle
       ===================================================== */

    showDetailView() {

        if (typeof showDetail === 'function') {
            showDetail();
        }
    }

    /* =====================================================
       Reset general
       ===================================================== */

    clearView() {

        const containers = [
            'detailTitle',
            'detailDescription',
            'detailBadges',
            'desc-body',
            'estructura-body',
            'enumeraciones-body',
            'ejemplo-inner',
            'snav-btns-estructura',
            'snav-btns-enumeraciones'
        ];

        containers.forEach(id => {

            const element =
                document.getElementById(id);

            if (!element) {
                return;
            }

            if (
                id === 'detailTitle' ||
                id === 'detailDescription'
            ) {
                element.textContent = '';
                return;
            }

            element.innerHTML = '';
        });
    }

    /* =====================================================
       Estado de carga
       ===================================================== */

    showLoading(card) {

        this.showDetailView();
        this.clearView();

        const title =
            document.getElementById('detailTitle');

        const breadcrumb =
            document.getElementById('d-breadcrumb-name');

        const description =
            document.getElementById('detailDescription');

        if (title) {
            title.textContent =
                typeof t === 'function'
                    ? t('loading')
                    : 'Loading...';
        }

        if (breadcrumb) {
            breadcrumb.textContent =
                this.getCardTitle(card);
        }

        if (description) {
            description.textContent = '';
        }

        [
            'desc-body',
            'estructura-body',
            'enumeraciones-body',
            'ejemplo-inner'
        ].forEach(id => {

            const el =
                document.getElementById(id);

            if (!el) {
                return;
            }

            el.innerHTML = `
                <p style="color:var(--gray-500)">
                    ${
                        typeof t === 'function'
                            ? t('loading')
                            : 'Loading...'
                    }
                </p>
            `;
        });
    }

    /* =====================================================
       Cabecera
       ===================================================== */

    setHeader(card, schema = {}) {

        this.card = card;

        const title =
            document.getElementById('detailTitle');

        const description =
            document.getElementById('detailDescription');

        const badges =
            document.getElementById('detailBadges');

        const breadcrumb =
            document.getElementById('d-breadcrumb-name');

        const finalTitle =
            schema.title ||
            this.getCardTitle(card);

        const finalDescription =
            schema['x-cyc-author'] ||
            schema.description ||
            this.getCardDescription(card);

        document.title =
            `Generix · ${finalTitle} · Developer Documentation`;

        if (title) {
            title.textContent = finalTitle;
        }

        if (breadcrumb) {
            breadcrumb.textContent =
                this.getCardTitle(card);
        }

        if (description) {
            description.textContent =
                finalDescription || '';
        }

        if (badges) {

            badges.innerHTML = [
                this.renderBadge(
                    card.group,
                    card.group
                ),
                this.renderBadge(
                    card.category,
                    'category'
                ),
                this.renderBadge(
                    card.format,
                    card.format
                )
            ]
            .filter(Boolean)
            .join('');
        }
    }

    /* =====================================================
       Badges
       ===================================================== */

    renderBadge(value, cssClass) {

        if (!value) {
            return '';
        }

        return `
            <span class="method-badge ${this.escape(cssClass)}">
                ${this.escape(value)}
            </span>
        `;
    }

    /* =====================================================
       Navegación tabs
       ===================================================== */

    activateTab(tabName) {

        document
            .querySelectorAll('.tab-btn')
            .forEach(button => {

                button.classList.toggle(
                    'active',
                    button.dataset.tab === tabName
                );
            });

        document
            .querySelectorAll('.tab-panel')
            .forEach(panel => {

                panel.classList.toggle(
                    'active',
                    panel.id === `tab-${tabName}`
                );
            });
    }

    /* =====================================================
       Error común
       ===================================================== */

    renderError(error) {

        console.error(error);

        const title =
            document.getElementById('detailTitle');

        const description =
            document.getElementById('detailDescription');

        const body =
            document.getElementById('desc-body');

        if (title) {
            title.textContent =
                typeof t === 'function'
                    ? t('detail.errorLoad')
                    : 'Load error';
        }

        if (description) {
            description.textContent =
                error.message || '';
        }

        if (body) {
            body.innerHTML = `
                <div class="highlight-box">
                    <strong>
                        ${
                            typeof t === 'function'
                                ? t('detail.errorLoad')
                                : 'Load error'
                        }
                    </strong>
                    <br>
                    ${this.escape(error.message || '')}
                </div>
            `;
        }
    }

    /* =====================================================
       Helpers Card
       ===================================================== */

    getCardTitle(card) {

        if (!card) {
            return '';
        }

        if (
            typeof localizedSectionTitle ===
            'function'
        ) {
            return localizedSectionTitle(card);
        }

        return (
            card.title_es ||
            card.title_en ||
            card.title ||
            card.id ||
            ''
        );
    }

    getCardDescription(card) {

        if (!card) {
            return '';
        }

        if (
            typeof localizedSectionDesc ===
            'function'
        ) {
            return localizedSectionDesc(card);
        }

        return (
            card.description_es ||
            card.description_en ||
            card.description ||
            ''
        );
    }

    /* =====================================================
       Escape seguro
       ===================================================== */

    escape(value) {

        if (value == null) {
            return '';
        }

        if (
            typeof esc === 'function'
        ) {
            return esc(value);
        }

        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /* =====================================================
       Utilidades DOM
       ===================================================== */

    getElement(id) {

        return document.getElementById(id);
    }

    setHTML(id, html) {

        const element =
            document.getElementById(id);

        if (element) {
            element.innerHTML = html;
        }
    }

    setText(id, text) {

        const element =
            document.getElementById(id);

        if (element) {
            element.textContent = text;
        }
    }
}

/* =========================================================
   Exposición global
   ========================================================= */

window.BaseRenderer = BaseRenderer;