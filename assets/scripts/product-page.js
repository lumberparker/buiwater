/**
 * Product detail page: presentations filled from JSON.
 *
 * Hierarchy:
 *   productos[] → presentaciones[] → atributos { imagen, parrafos, specs, ... }
 *
 * Rules:
 *   - 0 presentaciones (e.g. Kids) → hide tabs, leave static HTML as-is
 *   - 1 presentación (e.g. Gasificada Vidrio) → hide tabs, render that one
 *   - 2+ presentaciones → build tabs and switch content
 *
 * Image path: atributos.imagen is the file name under assets/images/
 *
 * Mark page with data-product="agua-natural" on <body>.
 */
(function () {
    const DATA_URL = 'assets/product-presentations.json';
    const IMAGE_BASE = 'assets/images/';

    function getProductSlug() {
        const fromBody = document.body && document.body.dataset.product;
        if (fromBody) return fromBody;

        const section = document.querySelector('.producto-presentacion[data-product]');
        if (section && section.dataset.product) return section.dataset.product;

        const path = (window.location.pathname || '').split('/').pop() || '';
        return path.replace(/\.html$/i, '') || null;
    }

    function imageUrl(fileName) {
        if (!fileName) return '';
        if (/^https?:\/\//i.test(fileName) || fileName.startsWith('assets/')) {
            return fileName;
        }
        return IMAGE_BASE + fileName.replace(/^\//, '');
    }

    function setActiveTab(tabsRoot, activeId) {
        if (!tabsRoot) return;
        tabsRoot.querySelectorAll('.producto-tabs__tab').forEach((btn) => {
            const isActive = btn.dataset.presentation === activeId;
            btn.classList.toggle('is-active', isActive);
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
    }

    function hideTabs(tabsRoot) {
        if (!tabsRoot) return;
        tabsRoot.hidden = true;
        tabsRoot.classList.add('is-empty');
        tabsRoot.setAttribute('aria-hidden', 'true');
        tabsRoot.innerHTML = '';
    }

    function showTabsShell(tabsRoot) {
        if (!tabsRoot) return;
        tabsRoot.hidden = false;
        tabsRoot.classList.remove('is-empty');
        tabsRoot.removeAttribute('aria-hidden');
    }

    function renderPresentation(root, presentacion) {
        if (!root || !presentacion) return;

        const attrs = presentacion.atributos || {};
        const circle = root.querySelector('.producto-presentacion__circle');
        const image = root.querySelector('.producto-presentacion__image');
        const title = root.querySelector('.producto-presentacion__title');
        const paragraphsHost = root.querySelector('[data-presentacion-paragraphs]');
        const specsHost = root.querySelector('[data-presentacion-specs]');
        const note = root.querySelector('.producto-presentacion__note');

        const color = attrs.circleColor || '#dceef8';
        const media = root.querySelector('.producto-presentacion__media, .producto-presentacion__image-wrap');

        // circleColor applies ONLY to the disc behind the bottle — never the outer media box
        if (media) {
            media.style.background = 'transparent';
            media.style.backgroundColor = 'transparent';
        }

        if (circle) {
            circle.style.backgroundColor = color;
        } else if (media) {
            // Legacy .image-wrap::before circle only
            media.style.setProperty('--presentacion-circle', color);
        }

        if (image) {
            const src = imageUrl(attrs.imagen);
            if (src) image.src = src;
            if (attrs.imagenAlt) image.alt = attrs.imagenAlt;
        }

        if (title) {
            title.innerHTML = attrs.tituloHtml || presentacion.nombre || '';
        }

        if (paragraphsHost) {
            const paragraphs = attrs.parrafos || [];
            if (paragraphs.length) {
                paragraphsHost.innerHTML = paragraphs
                    .map((p) => `<p class="producto-presentacion__paragraph">${p}</p>`)
                    .join('');
                paragraphsHost.hidden = false;
            } else {
                paragraphsHost.innerHTML = '';
                paragraphsHost.hidden = true;
            }
        }

        if (specsHost) {
            const specs = attrs.specs || [];
            if (specs.length) {
                specsHost.innerHTML = specs
                    .map(
                        (spec) => `
                    <div>
                        <p class="producto-presentacion__spec-label">${spec.label || ''}</p>
                        <p class="producto-presentacion__spec-value">${spec.value || ''}</p>
                    </div>`
                    )
                    .join('');
                specsHost.hidden = false;
            } else {
                specsHost.innerHTML = '';
                specsHost.hidden = true;
            }
        }

        if (note) {
            if (attrs.nota) {
                note.textContent = attrs.nota;
                note.hidden = false;
            } else {
                note.textContent = '';
                note.hidden = true;
            }
        }

        root.dataset.activePresentation = presentacion.id || '';
    }

    function buildTabs(tabsRoot, presentaciones, onSelect) {
        if (!tabsRoot) return;

        showTabsShell(tabsRoot);
        tabsRoot.setAttribute('role', 'tablist');
        tabsRoot.innerHTML = presentaciones
            .map(
                (p, index) => `
            <button
                type="button"
                class="producto-tabs__tab${index === 0 ? ' is-active' : ''}"
                role="tab"
                data-presentation="${p.id}"
                aria-selected="${index === 0 ? 'true' : 'false'}"
            >${p.nombre}</button>`
            )
            .join('');

        tabsRoot.querySelectorAll('.producto-tabs__tab').forEach((btn) => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.presentation;
                const presentacion = presentaciones.find((p) => p.id === id);
                if (!presentacion) return;
                setActiveTab(tabsRoot, id);
                onSelect(presentacion);
            });
        });
    }

    function findProduct(data, slug) {
        if (!data) return null;
        // New shape: { productos: [ ... ] }
        if (Array.isArray(data.productos)) {
            return data.productos.find((p) => p.id === slug) || null;
        }
        // Legacy shape: { "agua-natural": { presentations: [...] } }
        if (data[slug]) {
            const legacy = data[slug];
            return {
                id: slug,
                nombre: legacy.title,
                presentaciones: (legacy.presentations || []).map((p) => ({
                    id: p.id,
                    nombre: p.tabLabel || p.id,
                    atributos: {
                        imagen: p.image,
                        imagenAlt: p.imageAlt,
                        circleColor: p.circleColor,
                        tituloHtml: p.titleHtml,
                        parrafos: p.paragraphs || [],
                        specs: p.specs || [],
                        nota: p.note || ''
                    }
                }))
            };
        }
        return null;
    }

    async function init() {
        const slug = getProductSlug();
        const section = document.querySelector('.producto-presentacion');
        const tabsRoot = document.querySelector('.producto-tabs');

        if (!slug || !section) return;

        try {
            const response = await fetch(DATA_URL);
            if (!response.ok) throw new Error(`Failed to load ${DATA_URL}`);
            const data = await response.json();
            const product = findProduct(data, slug);

            if (!product) {
                console.warn('No product found in JSON for:', slug);
                return;
            }

            const titleEl = document.querySelector('.producto-titlebar__title');
            if (titleEl && product.nombre) {
                titleEl.textContent = product.nombre;
            }

            const presentaciones = Array.isArray(product.presentaciones)
                ? product.presentaciones
                : [];

            // Kids (and any product with no presentations): no tabs, keep page static
            if (presentaciones.length === 0) {
                hideTabs(tabsRoot);
                return;
            }

            const show = (presentacion) => renderPresentation(section, presentacion);

            // One presentation (Gasificada): render it, hide tabs
            if (presentaciones.length === 1) {
                hideTabs(tabsRoot);
                show(presentaciones[0]);
                return;
            }

            // Two or more (Natural, Infusiones): tabs + switcher
            if (tabsRoot) {
                buildTabs(tabsRoot, presentaciones, show);
            }
            show(presentaciones[0]);
        } catch (error) {
            console.error('Product presentation init failed:', error);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
