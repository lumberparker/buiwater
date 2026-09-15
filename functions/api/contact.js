// Cloudflare Pages Function — POST /api/contact
// Only used if this project is deployed as a Pages project (not a plain
// Worker). See worker.js for the path that actually runs when deployed
// via `wrangler deploy`.
import { handleContactRequest } from "../_lib/contact-handler.js";

export async function onRequestPost(context) {
    return handleContactRequest(context.request, context.env);
}
