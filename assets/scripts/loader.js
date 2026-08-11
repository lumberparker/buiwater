// Page loader — progress bar fills then empties at least once before dismiss
(function () {
    const MIN_CYCLE_MS = 1800; // one full fill → empty animation
    const MAX_WAIT_MS = 10000;
    const startedAt = Date.now();

    let resourcesReady = false;
    let dismissed = false;

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
        if (!resourcesReady || dismissed) return;

        const elapsed = Date.now() - startedAt;
        const remaining = MIN_CYCLE_MS - elapsed;

        if (remaining > 0) {
            setTimeout(hideLoader, remaining);
        } else {
            hideLoader();
        }
    }

    function markResourcesReady() {
        resourcesReady = true;
        tryHide();
    }

    function checkResourcesLoaded() {
        // Prefer window load (styles + critical assets). Don't block on every video forever.
        if (document.readyState === 'complete') {
            markResourcesReady();
            return;
        }

        window.addEventListener('load', markResourcesReady, { once: true });

        // If load is slow, still allow leave after max wait (cycle will have finished long ago)
        setTimeout(markResourcesReady, MAX_WAIT_MS);
    }

    // Start progress bar ASAP
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            injectProgress();
            checkResourcesLoaded();
        });
    } else {
        injectProgress();
        checkResourcesLoaded();
    }

    // Absolute safety net
    setTimeout(() => {
        if (document.getElementById('page-loader')) hideLoader();
    }, MAX_WAIT_MS + MIN_CYCLE_MS);
})();
