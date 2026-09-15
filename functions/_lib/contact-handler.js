// Shared logic for handling the site's form submissions, used by both
// deploy paths:
//   - Cloudflare Pages Functions (functions/api/contact.js)
//   - a plain Cloudflare Worker with static assets (worker.js), which is
//     what `wrangler deploy` uses when there's no Pages project — see
//     worker.js for why both exist.
//
// Required environment variables / secrets:
//   RESEND_API_KEY     — API key from https://resend.com
//   CONTACT_TO_EMAIL   — inbox that should receive submissions
//   CONTACT_FROM_EMAIL — sender address on a domain verified in Resend
//                        (e.g. "b'ui <formularios@buiwater.com>")

const FORM_LABELS = {
    contacto: "Formulario de contacto",
    distribuidor: "Solicitud de distribuidor"
};

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function buildEmailHtml(fields) {
    const rows = Object.entries(fields)
        .filter(([key]) => key !== "form_type" && key !== "website")
        .map(
            ([key, value]) =>
                `<tr><td style="padding:4px 12px 4px 0;color:#666;font-family:sans-serif;font-size:14px;vertical-align:top;">${escapeHtml(
                    key
                )}</td><td style="padding:4px 0;font-family:sans-serif;font-size:14px;">${escapeHtml(
                    value
                )}</td></tr>`
        )
        .join("");

    return `<table>${rows}</table>`;
}

export async function handleContactRequest(request, env) {
    let body;
    try {
        body = await request.json();
    } catch (error) {
        return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
    }

    // Honeypot: real visitors never see or fill this field.
    if (body.website) {
        return Response.json({ ok: true });
    }

    const formType = body.form_type === "distribuidor" ? "distribuidor" : "contacto";

    const requiredFields =
        formType === "contacto" ? ["nombre", "correo", "mensaje"] : ["nombre", "correo"];
    const missingField = requiredFields.some((field) => !body[field]);
    if (missingField) {
        return Response.json({ ok: false, error: "missing_fields" }, { status: 400 });
    }

    if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL) {
        return Response.json({ ok: false, error: "server_not_configured" }, { status: 500 });
    }

    const subject = `${FORM_LABELS[formType]} — ${body.nombre || "Sin nombre"}`;

    const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            from: env.CONTACT_FROM_EMAIL,
            to: env.CONTACT_TO_EMAIL,
            reply_to: body.correo,
            subject,
            html: buildEmailHtml(body)
        })
    });

    if (!resendResponse.ok) {
        return Response.json({ ok: false, error: "email_send_failed" }, { status: 502 });
    }

    return Response.json({ ok: true });
}
