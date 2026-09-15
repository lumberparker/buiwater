// Submits the contact and distributor forms to a Cloudflare Pages
// Function (functions/api/contact.js) via fetch, so the page never
// reloads and the sliding distributor panel doesn't lose its position.
(function () {
    function setStatus(form, state, message) {
        const status = form.querySelector('.sobre-distribuidor__status');
        if (!status) return;
        status.textContent = message;
        status.dataset.state = state;
    }

    function handleSubmit(event) {
        const form = event.target;
        if (!form.matches('.sobre-distribuidor__form')) return;
        event.preventDefault();

        const submitButton = form.querySelector('.sobre-distribuidor__submit');
        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());
        payload.form_type = form.dataset.formType || 'contacto';

        setStatus(form, '', '');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.dataset.originalText = submitButton.textContent;
            submitButton.textContent = 'ENVIANDO...';
        }

        fetch(form.getAttribute('action') || '/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then((response) => response.json().catch(() => ({})).then((data) => ({ ok: response.ok, data })))
            .then(({ ok, data }) => {
                if (ok && data.ok !== false) {
                    form.reset();
                    setStatus(form, 'ok', '¡Gracias! Tu mensaje fue enviado.');
                } else {
                    setStatus(form, 'error', 'No pudimos enviar tu mensaje. Intenta de nuevo.');
                }
            })
            .catch(() => {
                setStatus(form, 'error', 'No pudimos enviar tu mensaje. Intenta de nuevo.');
            })
            .finally(() => {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = submitButton.dataset.originalText || 'ENVIAR';
                }
            });
    }

    document.addEventListener('submit', handleSubmit);
})();
