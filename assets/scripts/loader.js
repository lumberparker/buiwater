// Page loader — waits until loader video is almost finished, then dismisses
(function () {
    const VIDEO_COMPLETE_RATIO = 0.92; // hide when ~92% played
    const MAX_WAIT_MS = 20000;
    const FALLBACK_MIN_MS = 2500;

    let resourcesReady = false;
    let videoAlmostDone = false;
    let dismissed = false;
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
        }, 500);
    }

    function tryHide() {
        if (dismissed) return;
        // Wait for video nearly complete; resources can finish in parallel
        if (!videoAlmostDone) return;
        hideLoader();
    }

    function markVideoAlmostDone() {
        if (videoAlmostDone) return;
        videoAlmostDone = true;
        tryHide();
    }

    function markResourcesReady() {
        resourcesReady = true;
        // Resources no longer block dismiss; video progress does.
        // Kept in case we want hybrid logic later.
        void resourcesReady;
    }

    function setupLoaderVideo() {
        const video = document.querySelector('#page-loader .loader-video');
        if (!video) {
            // No video: fall back to min time
            setTimeout(markVideoAlmostDone, FALLBACK_MIN_MS);
            return;
        }

        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        // Play once through for the gate; don't loop while waiting
        video.loop = false;
        video.preload = 'auto';

        let armed = false;

        const armNearEnd = () => {
            if (armed) return;
            armed = true;

            const onProgress = () => {
                const d = video.duration;
                if (!d || !isFinite(d) || d <= 0) return;
                if (video.currentTime / d >= VIDEO_COMPLETE_RATIO) {
                    video.removeEventListener('timeupdate', onProgress);
                    markVideoAlmostDone();
                }
            };

            video.addEventListener('timeupdate', onProgress);
            video.addEventListener(
                'ended',
                () => {
                    video.removeEventListener('timeupdate', onProgress);
                    markVideoAlmostDone();
                },
                { once: true }
            );

            // If duration is known, also schedule a timer near the end as backup
            const scheduleFromDuration = () => {
                const d = video.duration;
                if (!d || !isFinite(d) || d <= 0) return;
                const ms = Math.max(0, d * VIDEO_COMPLETE_RATIO * 1000 - video.currentTime * 1000);
                setTimeout(markVideoAlmostDone, ms + 50);
            };

            if (video.duration && isFinite(video.duration)) {
                scheduleFromDuration();
            } else {
                video.addEventListener('loadedmetadata', scheduleFromDuration, { once: true });
            }
        };

        const play = () => {
            video.play().then(armNearEnd).catch(() => {
                // Autoplay blocked — still arm listeners and use fallback timer
                armNearEnd();
                setTimeout(markVideoAlmostDone, FALLBACK_MIN_MS);
            });
        };

        if (video.readyState >= 2) play();
        else {
            video.addEventListener('canplay', play, { once: true });
            video.addEventListener('loadeddata', play, { once: true });
            // Kick load
            try {
                video.load();
            } catch (_) { /* ignore */ }
        }
    }

    function checkResourcesLoaded() {
        if (document.readyState === 'complete') {
            markResourcesReady();
            return;
        }
        window.addEventListener('load', markResourcesReady, { once: true });
        setTimeout(markResourcesReady, MAX_WAIT_MS);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            injectProgress();
            setupLoaderVideo();
            checkResourcesLoaded();
        });
    } else {
        injectProgress();
        setupLoaderVideo();
        checkResourcesLoaded();
    }

    // Absolute safety net so the site never sticks on the loader
    setTimeout(() => {
        if (!dismissed) hideLoader();
    }, MAX_WAIT_MS);
})();
