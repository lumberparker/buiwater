// Home page loader. Plays the bottle clip as an image (WebP/GIF), then
// gets out of the way. Images are not gated by mobile autoplay rules.
// Never blocks on other media. Always dismisses — even if the image stalls.
(function () {
    const loader = document.getElementById('page-loader');
    if (!loader) return;

    const MAX_LOADER_MS = 4000;
    const MIN_LOADER_MS = 1100;
    const SAFETY_MS = 5000;

    let dismissed = false;
    const startedAt = Date.now();

    document.body.classList.add('loading');

    function competingVideos() {
        return Array.from(document.querySelectorAll('video')).filter(
            (v) => !v.classList.contains('loader-video')
        );
    }

    function holdCompetingMedia() {
        competingVideos().forEach((video) => {
            video.dataset.buiLoaderHold = '1';
            video.autoplay = false;
            video.removeAttribute('autoplay');
            if (video.preload !== 'none') video.preload = 'none';
            try {
                video.pause();
            } catch (_) { /* ignore */ }
        });
    }

    function releaseHero() {
        const hero = document.querySelector('.hero__video');
        if (!hero) return;
        hero.muted = true;
        hero.defaultMuted = true;
        hero.loop = true;
        hero.playsInline = true;
        hero.preload = 'auto';
        hero.play().catch(() => {});
    }

    function hideLoader() {
        if (dismissed) return;
        dismissed = true;

        loader.classList.add('hidden');
        document.body.classList.remove('loading');
        releaseHero();
        window.dispatchEvent(new Event('bui-loader-done'));

        setTimeout(() => {
            if (loader.parentNode) loader.parentNode.removeChild(loader);
        }, 400);
    }

    function hideWhenReady() {
        if (dismissed) return;
        const elapsed = Date.now() - startedAt;
        if (elapsed < MIN_LOADER_MS) {
            setTimeout(hideLoader, MIN_LOADER_MS - elapsed);
        } else {
            hideLoader();
        }
    }

    function injectProgress() {
        const content = loader.querySelector('.loader-content');
        if (!content || content.querySelector('.loader-progress')) return;

        const track = document.createElement('div');
        track.className = 'loader-progress';
        track.setAttribute('aria-hidden', 'true');
        track.innerHTML = '<div class="loader-progress__bar"></div>';
        content.appendChild(track);
    }

    function setupLoader() {
        holdCompetingMedia();
        injectProgress();

        setTimeout(hideWhenReady, MAX_LOADER_MS);
        setTimeout(hideLoader, SAFETY_MS);

        const img = loader.querySelector('.loader-gif');
        if (!img) {
            setTimeout(hideWhenReady, MIN_LOADER_MS);
            return;
        }

        img.addEventListener('error', hideWhenReady, { once: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupLoader);
    } else {
        setupLoader();
    }
})();
