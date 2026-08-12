// Page loader — home only; short, snappy, never blocks for many seconds
(function () {
    const path = (window.location.pathname || '').replace(/\/+$/, '');
    const file = path.split('/').pop() || '';
    const isHome = file === '' || file === 'index.html' || file === 'index.htm';
    if (!isHome) return;
    if (!document.getElementById('page-loader')) return;

    // Cap how long the loader can stay — main cause of "forever to load"
    const MAX_LOADER_MS = 4000;
    const MIN_LOADER_MS = 1200;
    // Prefer ending near the end of the video, but never past MAX
    const VIDEO_COMPLETE_RATIO = 0.9;

    let dismissed = false;
    let videoGateOpen = false;
    const startedAt = Date.now();

    document.body.classList.add('loading');

    function injectProgress() {
        const content = document.querySelector('#page-loader .loader-content');
        if (!content || content.querySelector('.loader-progress')) return;

        const track = document.createElement('div');
        track.className = 'loader-progress';
        track.setAttribute('aria-hidden', 'true');
        track.innerHTML = '<div class="loader-progress__bar"></div>';
        content.appendChild(track);
    }

    function hideLoader() {
        if (dismissed) return;
        dismissed = true;

        const loader = document.getElementById('page-loader');
        if (!loader) {
            document.body.classList.remove('loading');
            return;
        }

        loader.classList.add('hidden');
        document.body.classList.remove('loading');

        setTimeout(() => {
            if (loader.parentNode) loader.parentNode.removeChild(loader);
        }, 400);
    }

    function tryHide() {
        if (dismissed || !videoGateOpen) return;
        const elapsed = Date.now() - startedAt;
        if (elapsed < MIN_LOADER_MS) {
            setTimeout(hideLoader, MIN_LOADER_MS - elapsed);
        } else {
            hideLoader();
        }
    }

    function openVideoGate() {
        if (videoGateOpen) return;
        videoGateOpen = true;
        tryHide();
    }

    function setupLoaderVideo() {
        const video = document.querySelector('#page-loader .loader-video');

        // Hard cap — never block longer than this
        setTimeout(openVideoGate, MAX_LOADER_MS);

        if (!video) {
            setTimeout(openVideoGate, MIN_LOADER_MS);
            return;
        }

        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.loop = false;
        video.preload = 'auto';

        const onNearEnd = () => {
            const d = video.duration;
            if (d && isFinite(d) && d > 0 && video.currentTime / d >= VIDEO_COMPLETE_RATIO) {
                video.removeEventListener('timeupdate', onNearEnd);
                openVideoGate();
            }
        };

        video.addEventListener('timeupdate', onNearEnd);
        video.addEventListener('ended', openVideoGate, { once: true });

        video.addEventListener(
            'loadedmetadata',
            () => {
                const d = video.duration;
                if (!d || !isFinite(d)) return;
                // Schedule dismiss at 90% or MAX, whichever is sooner
                const targetMs = Math.min(d * VIDEO_COMPLETE_RATIO * 1000, MAX_LOADER_MS);
                setTimeout(openVideoGate, Math.max(0, targetMs));
            },
            { once: true }
        );

        const play = () => video.play().catch(() => openVideoGate());
        if (video.readyState >= 2) play();
        else {
            video.addEventListener('canplay', play, { once: true });
            try {
                video.load();
            } catch (_) { /* ignore */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            injectProgress();
            setupLoaderVideo();
        });
    } else {
        injectProgress();
        setupLoaderVideo();
    }
})();
