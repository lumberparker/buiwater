// Home page loader. Plays the bottle clip, then gets out of the way.
// Never blocks on other media. Always dismisses — even if the video stalls.
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
            // Stop in-flight fetches so the loader clip gets the pipe
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

    function setupLoaderVideo() {
        holdCompetingMedia();
        injectProgress();

        // Soft cap (respects MIN) and a hard safety net that always dismisses
        setTimeout(hideWhenReady, MAX_LOADER_MS);
        setTimeout(hideLoader, SAFETY_MS);

        const video = loader.querySelector('.loader-video');
        if (!video) {
            setTimeout(hideWhenReady, MIN_LOADER_MS);
            return;
        }

        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.loop = false;
        // Do NOT call video.load() — it aborts the preload already in flight.

        video.addEventListener('ended', hideWhenReady, { once: true });
        video.addEventListener('error', hideWhenReady, { once: true });
        video.addEventListener(
            'stalled',
            () => {
                setTimeout(() => {
                    if (!dismissed && video.readyState < 3) hideWhenReady();
                }, 1200);
            },
            { once: true }
        );

        const tryPlay = () => {
            video.play().catch(hideWhenReady);
        };

        if (video.readyState >= 2) tryPlay();
        else video.addEventListener('canplay', tryPlay, { once: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupLoaderVideo);
    } else {
        setupLoaderVideo();
    }
})();
