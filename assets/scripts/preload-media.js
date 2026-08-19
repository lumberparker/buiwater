/**
 * Warm images just ahead of the viewport. Play below-the-fold videos only
 * when they are about to be seen. Waits for the home loader so we don't
 * steal bandwidth from the bottle clip.
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

    function warmTree(root) {
        if (!root || root.nodeType !== 1) return Promise.resolve();
        const jobs = [];
        root.querySelectorAll('img').forEach((img) => {
            const src = img.currentSrc || img.getAttribute('src');
            if (src) jobs.push(warmImage(src));
        });
        return Promise.all(jobs);
    }

    window.buiWarmMedia = (root) => warmTree(root);

    function bindInViewPlayback() {
        const videos = document.querySelectorAll('.showcase__video, .manifiesto__video');
        if (!videos.length) return;

        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const video = entry.target;
                    if (entry.isIntersecting) {
                        video.muted = true;
                        video.loop = true;
                        video.playsInline = true;
                        video.play().catch(() => {});
                    } else {
                        video.pause();
                    }
                });
            },
            { rootMargin: '20% 0px', threshold: 0.15 }
        );

        videos.forEach((video) => io.observe(video));
    }

    function start() {
        const categorias = document.querySelector('.categorias');
        if (categorias) warmTree(categorias);

        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    warmTree(entry.target);
                    io.unobserve(entry.target);
                });
            },
            { root: null, rootMargin: '40% 0px', threshold: 0 }
        );

        document
            .querySelectorAll(
                '.conoce, .propiedades, .productos, .showcase, .encuentra, .producto-presentacion, .kids-flavors, .kids-pack, .footer'
            )
            .forEach((el) => io.observe(el));

        bindInViewPlayback();
    }

    function whenPageReady(fn) {
        let started = false;
        const once = () => {
            if (started) return;
            started = true;
            fn();
        };
        const run = () => {
            if (document.body.classList.contains('loading')) {
                window.addEventListener('bui-loader-done', once, { once: true });
                setTimeout(once, 5500);
            } else {
                once();
            }
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', run);
        } else {
            run();
        }
    }

    whenPageReady(start);

    window.addEventListener('load', () => {
        setTimeout(() => {
            document.querySelectorAll('#productosGrid img').forEach((img) => {
                const src = img.currentSrc || img.getAttribute('src');
                if (src) warmImage(src);
            });
        }, 500);
    });
})();
