/**
 * Gentle media warming — images only early; videos only when near the viewport.
 * Avoids saturating the network on first open (which made the home feel stuck).
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

        // Don't reset playing / already-buffered videos
        if (video.readyState >= 2 || !video.paused) {
            return Promise.resolve();
        }

        // Only ask for metadata/early frames — full file loads when playing
        if (video.preload === 'none') {
            video.preload = 'metadata';
        }
        video.muted = true;
        return Promise.resolve();
    }

    function warmTree(root, { videos = false } = {}) {
        if (!root || root.nodeType !== 1) return Promise.resolve();

        const jobs = [];

        root.querySelectorAll('img').forEach((img) => {
            const src = img.currentSrc || img.getAttribute('src');
            if (src) jobs.push(warmImage(src));
        });

        if (videos) {
            root.querySelectorAll('video').forEach((video) => {
                jobs.push(warmVideo(video));
            });
        }

        return Promise.all(jobs);
    }

    window.buiWarmMedia = (root) => warmTree(root, { videos: true });

    function start() {
        // Images in categorias only (above the fold on home) — no bulk video download
        const categorias = document.querySelector('.categorias');
        if (categorias) {
            warmTree(categorias, { videos: false });
        }

        // Warm images (not full videos) a bit ahead of scroll
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    // Videos only when closer; images further out
                    const isClose = entry.intersectionRatio > 0 || true;
                    warmTree(entry.target, { videos: isClose });
                    io.unobserve(entry.target);
                });
            },
            {
                root: null,
                rootMargin: '40% 0px',
                threshold: 0
            }
        );

        document
            .querySelectorAll(
                '.conoce, .propiedades, .productos, .showcase, .encuentra, .producto-presentacion, .kids-flavors, .kids-pack, .footer'
            )
            .forEach((el) => io.observe(el));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }

    window.addEventListener('load', () => {
        setTimeout(() => {
            document.querySelectorAll('#productosGrid img').forEach((img) => {
                const src = img.currentSrc || img.getAttribute('src');
                if (src) warmImage(src);
            });
        }, 500);
    });
})();
