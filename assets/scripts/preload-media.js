/**
 * Preload below-the-fold images/videos before the user reaches them,
 * and warm media right before scroll-reveal plays.
 */
(function () {
    function absUrl(src) {
        if (!src) return '';
        try {
            return new URL(src, window.location.href).href;
        } catch (_) {
            return src;
        }
    }

    function warmImage(src) {
        const url = absUrl(src);
        if (!url || warmImage.cache.has(url)) return Promise.resolve();
        warmImage.cache.add(url);
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = img.onerror = () => resolve();
            img.src = url;
        });
    }
    warmImage.cache = new Set();

    function warmVideo(video) {
        if (!video || video.dataset.warmed === '1') return Promise.resolve();
        video.dataset.warmed = '1';

        // Already has enough data, or is actively playing (e.g. an autoplay
        // hero/categorias video): calling .load() here would reset it mid-
        // playback — a brief blank/black frame and a network re-fetch right
        // as the user scrolls. Nothing to warm; leave it alone.
        if (video.readyState >= 2 || !video.paused) {
            return Promise.resolve();
        }

        video.preload = 'auto';
        video.muted = true;
        try {
            // Kick the network without playing (play may still need user gesture on some browsers)
            video.load();
        } catch (_) { /* ignore */ }

        return new Promise((resolve) => {
            if (video.readyState >= 2) {
                resolve();
                return;
            }
            const done = () => {
                video.removeEventListener('loadeddata', done);
                video.removeEventListener('canplay', done);
                video.removeEventListener('error', done);
                resolve();
            };
            video.addEventListener('loadeddata', done, { once: true });
            video.addEventListener('canplay', done, { once: true });
            video.addEventListener('error', done, { once: true });
            // Don't block reveal forever
            setTimeout(done, 1200);
        });
    }

    function warmTree(root) {
        if (!root || root.nodeType !== 1) return Promise.resolve();

        const jobs = [];

        root.querySelectorAll('img').forEach((img) => {
            // Promote lazy images so the browser fetches them now
            if (img.getAttribute('loading') === 'lazy') {
                img.setAttribute('loading', 'eager');
            }
            const src = img.currentSrc || img.getAttribute('src');
            if (src) jobs.push(warmImage(src));
        });

        root.querySelectorAll('video').forEach((video) => {
            jobs.push(warmVideo(video));
            // Also prefetch <source> urls
            video.querySelectorAll('source').forEach((s) => {
                const src = s.getAttribute('src');
                if (src) {
                    // lightweight fetch to populate disk/http cache
                    fetch(absUrl(src), { mode: 'no-cors', credentials: 'omit' }).catch(() => {});
                }
            });
        });

        return Promise.all(jobs);
    }

    /** Prefetch whole bottom sections early after first paint */
    function prefetchBelowFold() {
        const sections = document.querySelectorAll(
            [
                '.categorias',
                '.conoce',
                '.propiedades',
                '.productos',
                '.showcase',
                '.encuentra',
                '.distribuidor',
                '.producto-presentacion',
                '.kids-flavors',
                '.kids-pack',
                '.footer'
            ].join(',')
        );
        sections.forEach((section) => {
            warmTree(section);
        });
    }

    /**
     * Observe sections far ahead of the viewport and warm their media
     * so by the time reveal slides them in, assets are already cached.
     */
    function watchApproaching() {
        const roots = document.querySelectorAll(
            'body > section, .categorias__item, .productos__card, .footer'
        );

        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    warmTree(entry.target);
                    io.unobserve(entry.target);
                });
            },
            {
                // Start loading ~1.5 viewports before the element is on screen
                root: null,
                rootMargin: '150% 0px 150% 0px',
                threshold: 0
            }
        );

        roots.forEach((el) => io.observe(el));
    }

    // Expose so reveal.js can await media before sliding in
    window.buiWarmMedia = warmTree;

    function start() {
        // Categories are above the fold on home — warm immediately on open
        const categorias = document.querySelector('.categorias');
        if (categorias) warmTree(categorias);

        // Then warm the rest of the page
        setTimeout(prefetchBelowFold, 400);
        watchApproaching();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }

    // After product cards inject from JSON, warm those images too
    window.addEventListener('load', () => {
        setTimeout(() => {
            document.querySelectorAll('#productosGrid img, .productos__card').forEach((el) => {
                warmTree(el);
            });
        }, 300);
    });
})();
