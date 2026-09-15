// Entry point for `wrangler deploy` (Cloudflare Worker + static assets).
// This is the deploy path actually used when the Cloudflare Git
// integration runs `npx wrangler deploy` with no Pages project — static
// files are served through the ASSETS binding, and this worker only
// intercepts the form-submission endpoint.
import { handleContactRequest } from "./functions/_lib/contact-handler.js";

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname === "/api/contact" && request.method === "POST") {
            return handleContactRequest(request, env);
        }

        return env.ASSETS.fetch(request);
    }
};
