/**
 * Scroll-triggered section / element entrances from varied directions.
 * Auto-wires main page sections + key children. Safe to load on every page.
 */
(function () {
    const SECTION_DIRS = ['up', 'left', 'right', 'scale', 'up', 'right', 'left', 'fade'];

    function prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function mark(el, direction, delay) {
        if (!el) return;
        // Allow pre-marked HTML (e.g. categorias cards) to register without double-classing
        if (el.dataset.revealReady === '1') return;
        el.classList.add('reveal');
        if (direction && !el.className.includes('reveal--')) {
            el.classList.add(`reveal--${direction}`);
        } else if (direction && ![...el.classList].some((c) => c.startsWith('reveal--'))) {
            el.classList.add(`reveal--${direction}`);
        }
        el.classList.remove('is-inview');
        if (typeof delay === 'number' && delay > 0 && !el.style.getPropertyValue('--reveal-delay')) {
            el.style.setProperty('--reveal-delay', `${delay}s`);
        }
        el.dataset.revealReady = '1';
    }

    function wireSpecialSections(section) {
        // Categorias: always visible on open (no scroll reveal)
        if (section.classList.contains('categorias')) {
            section.querySelectorAll('.categorias__item').forEach((card) => {
                card.classList.remove(
                    'reveal',
                    'reveal--up',
                    'reveal--left',
                    'reveal--right',
                    'reveal--scale',
                    'reveal--down',
                    'reveal--fade',
                    'is-inview'
                );
                card.style.removeProperty('--reveal-delay');
                card.removeAttribute('data-reveal-scroll-only');
                delete card.dataset.revealScrollOnly;
                delete card.dataset.revealReady;
            });
            return true;
        }

        // Conoce: text from left, image from right
        if (section.classList.contains('conoce')) {
            const text = section.querySelector('.conoce__content_text');
            const image = section.querySelector('.conoce__content-image');
            mark(text, 'left', 0);
            mark(image, 'right', 0.12);
            return true;
        }

        // Propiedades: image left, copy right
        if (section.classList.contains('propiedades')) {
            mark(section.querySelector('.propiedades__image-wrap, .propiedades__imagen'), 'left', 0);
            mark(section.querySelector('.propiedades__content'), 'right', 0.1);
            return true;
        }

        // Productos: header + cta only (avoid animating the heavy carousel grid shell)
        if (section.classList.contains('productos')) {
            mark(section.querySelector('.productos__header'), 'up', 0);
            mark(section.querySelector('.productos__cta'), 'up-soft', 0.1);
            return true;
        }

        // Showcase / manifiesto: title only (video stays put — cheaper on scroll)
        if (section.classList.contains('showcase') || section.classList.contains('manifiesto')) {
            mark(section.querySelector('.showcase__title, .manifiesto__title, .showcase__content, .manifiesto__content'), 'up-soft', 0.05);
            return true;
        }

        // Encuentra / producto-encuentra: title then logos
        if (section.classList.contains('encuentra') || section.classList.contains('producto-encuentra')) {
            mark(section.querySelector('.encuentra__title, .producto-encuentra__title'), 'up', 0);
            section
                .querySelectorAll('.encuentra__logo, .producto-encuentra__logo')
                .forEach((logo, i) => mark(logo, 'up', 0.08 + i * 0.06));
            return true;
        }

        // Distribuidor banner
        if (section.classList.contains('distribuidor')) {
            mark(section.querySelector('.distribuidor__text'), 'left', 0);
            mark(section.querySelector('.distribuidor__button'), 'right', 0.1);
            return true;
        }

        // Kids page
        if (section.classList.contains('kids-intro')) {
            mark(section.querySelector('.kids-intro__title'), 'left', 0);
            mark(section.querySelector('.kids-intro__benefits'), 'right', 0.1);
            return true;
        }
        if (section.classList.contains('kids-flavors')) {
            section.querySelectorAll('.kids-flavor').forEach((el, i) => mark(el, 'up', i * 0.12));
            return true;
        }
        if (section.classList.contains('kids-pack')) {
            mark(section.querySelector('.kids-pack__content'), 'left', 0);
            mark(section.querySelector('.kids-pack__media'), 'right', 0.12);
            return true;
        }

        // Product detail
        if (section.classList.contains('producto-presentacion')) {
            mark(section.querySelector('.producto-presentacion__media, .producto-presentacion__image-wrap'), 'left', 0);
            mark(section.querySelector('.producto-presentacion__content'), 'right', 0.12);
            return true;
        }

        // Sobre page blocks
        if (section.classList.contains('sobre-origen') || section.classList.contains('sobre-historia')) {
            mark(section, 'up', 0);
            return true;
        }

        return false;
    }

    function collectTargets() {
        const nodes = [];

        // Main sections under body (skip fixed header / loader)
        document.querySelectorAll('body > section').forEach((section, index) => {
            if (section.classList.contains('page-loader')) return;

            // Never transform full-bleed marquee / continuous strips (scroll jank)
            if (section.classList.contains('marquee') || section.classList.contains('tagline')) {
                return;
            }

            // Hero: load entrance, not scroll
            if (section.classList.contains('hero') || section.classList.contains('producto-hero') || section.classList.contains('kids-hero') || section.classList.contains('sobre-hero')) {
                const content =
                    section.querySelector('.hero__content, .producto-titlebar, .kids-intro') || section;
                // animate hero content on load separately
                if (section.classList.contains('hero')) {
                    const heroContent = section.querySelector('.hero__content');
                    if (heroContent) {
                        heroContent.classList.add('reveal', 'reveal--hero-load');
                        nodes.push(heroContent);
                    }
                } else {
                    mark(section, 'fade', 0);
                    nodes.push(section);
                }
                return;
            }

            const handled = wireSpecialSections(section);
            if (handled) {
                // Only animate wired children (not the whole section shell too)
                section.querySelectorAll('.reveal').forEach((el) => nodes.push(el));
                return;
            }

            // Generic section entrance, alternating directions
            mark(section, SECTION_DIRS[index % SECTION_DIRS.length], 0);
            nodes.push(section);
        });

        // Footer
        const footer = document.querySelector('body > footer.footer, footer.footer');
        if (footer) {
            mark(footer, 'up', 0);
            nodes.push(footer);
        }

        // Explicit opt-in
        document.querySelectorAll('[data-reveal]').forEach((el) => {
            const dir = el.getAttribute('data-reveal') || 'up';
            const delay = parseFloat(el.getAttribute('data-reveal-delay') || '0') || 0;
            mark(el, dir, delay);
            nodes.push(el);
        });

        // Unique list
        return Array.from(new Set(nodes));
    }

    function init() {
        const targets = collectTargets();
        if (!targets.length) return;

        if (prefersReducedMotion()) {
            targets.forEach((el) => el.classList.add('is-inview'));
            return;
        }

        // Hero load animation immediately
        targets.forEach((el) => {
            if (el.classList.contains('reveal--hero-load')) {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => el.classList.add('is-inview'));
                });
            }
        });

        /*
          Expand the "viewport" downward so elements start entering as they
          approach the bottom of the screen — scroll feels continuous instead
          of empty space until a late reveal.
        */
        // Queue class toggles so we never do style work inside the scroll frame
        let pending = [];
        let flushScheduled = false;

        function flushReveals() {
            flushScheduled = false;
            const batch = pending;
            pending = [];
            batch.forEach((el) => el.classList.add('is-inview'));
        }

        function scheduleReveal(el) {
            pending.push(el);
            if (flushScheduled) return;
            flushScheduled = true;
            requestAnimationFrame(flushReveals);
        }

        async function revealWhenReady(el) {
            // Warm images/videos inside the element so the slide-in isn't empty
            if (typeof window.buiWarmMedia === 'function') {
                try {
                    await Promise.race([
                        window.buiWarmMedia(el),
                        new Promise((r) => setTimeout(r, 400)) // never stall scroll long
                    ]);
                } catch (_) { /* ignore */ }
            }
            scheduleReveal(el);
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    observer.unobserve(entry.target);
                    revealWhenReady(entry.target);
                });
            },
            {
                root: null,
                // Start a bit before fully on screen so the slower 1.15s motion is visible
                rootMargin: '0px 0px 10% 0px',
                threshold: 0.08
            }
        );

        targets.forEach((el) => {
            if (el.classList.contains('reveal--hero-load')) return;
            // Categories stay visible from open — never observe them
            if (el.classList.contains('categorias__item') || el.closest('.categorias')) return;
            observer.observe(el);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Re-run lightly after dynamic product cards inject (home carousel)
    window.addEventListener('load', () => {
        setTimeout(() => {
            document.querySelectorAll('.productos__card').forEach((card, i) => {
                if (card.dataset.revealReady === '1') return;
                card.classList.add('reveal', 'reveal--up');
                card.style.setProperty('--reveal-delay', `${(i % 6) * 0.06}s`);
                card.dataset.revealReady = '1';
                // observe
                const obs = new IntersectionObserver(
                    (entries) => {
                        entries.forEach((e) => {
                            if (e.isIntersecting) {
                                e.target.classList.add('is-inview');
                                obs.unobserve(e.target);
                            }
                        });
                    },
                    { threshold: 0.1 }
                );
                if (!prefersReducedMotion()) obs.observe(card);
                else card.classList.add('is-inview');
            });
        }, 600);
    });
})();
