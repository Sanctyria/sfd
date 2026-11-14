# Hostinger VPS deployment

Run the SvelteKit frontend on the VPS with Node.js and PM2. Keep the community API on Render. Your existing Dockerized Caddy remains the public HTTPS entry point and reverse-proxies the site to the frontend process. The frontend's same-origin `/api/community/*` proxy forwards API calls and signed payment webhooks to Render.

## Initial frontend deployment

1. Make sure Node.js 22.12+, Git, and PM2 are installed on the VPS. Clone the **Web-Svelte repository** using your normal deployment user and enter the repo:

   ```sh
   git clone <Web-Svelte-repository-URL> /path/to/Web-Svelte
   cd /path/to/Web-Svelte
   npm ci
   npm run build
   ```

   The build creates a standalone Node server in `build/` and static files in `build/client/`. Create the root `.env` with `cp deploy/hostinger/web.env.example .env`, then set the production values there. Keep `.env` private and do not commit it.

2. Start the server under PM2, replacing the Render URL with your actual backend service origin (scheme and hostname only; don't append `/api/v1`):

   ```sh
   pm2 start npm --name sanctyria-web -- run start
   pm2 save
   pm2 startup
   ```

   `npm run start` reads the root `.env` file, including `PORT=3009`. Run the `pm2 startup` command it prints, then run `pm2 save` again. PM2 will restore this process after a reboot. Set `HOST` in `.env` to the host address reachable by the Caddy container; ensure port 3009 is blocked from the public internet by your VPS firewall/security group and is reachable only from your Docker/Caddy setup. If `sanctyria-web` is already managed by PM2 with the old direct `build/index.js` command, delete that PM2 entry before starting it with the command above so it uses the new start command.

3. Configure your existing Caddy Docker setup to reach the host's port 3009. For a Compose-managed Caddy container, a common setup is to add this under the Caddy service and recreate it:

   ```yaml
   extra_hosts:
     - 'host.docker.internal:host-gateway'
   ```

   Then add/update the site's existing Caddy route to use:

   ```caddyfile
   reverse_proxy host.docker.internal:3009
   ```

   Keep your existing Caddyfile structure, TLS settings, Docker networks, and routes for other services. Validate/reload Caddy using your existing process. The exact host address and firewall rule depend on your Docker network and VPS firewall; verify the Caddy container can reach port 3009 before switching the domain.

## Render backend configuration

- Continue deploying the Backend repository to Render as you do now. Set its production `WEB_ORIGIN` to `https://sanctyria.com`, and configure its database, Turnstile keys, and payment-provider secrets in Render's environment settings. Ensure migration `0018_auth_abuse_and_payment_events.sql` has been applied to the production database.
- The frontend requires `COMMUNITY_BACKEND_URL` at runtime. It must be the Render service origin only, e.g. `https://sanctyria-api.onrender.com`. Do not put backend secrets in the frontend environment.
- Stripe and PayPal webhook URLs remain `https://sanctyria.com/api/community/webhooks/stripe` and `https://sanctyria.com/api/community/webhooks/paypal`. The website proxies their raw request bodies and signature headers to Render for verification.

## Publishing frontend updates

After pushing changes to the Web-Svelte repository:

```sh
cd /path/to/Web-Svelte
git pull --ff-only
npm ci
npm run build
pm2 restart sanctyria-web
```

`npm ci` and `npm run build` run as your deployment user. `pm2 restart sanctyria-web` reuses the saved PM2 environment. Deploy backend changes to Render separately. Git pushes do not automatically update the VPS unless you add a CI/CD deploy workflow.

## Resource and proxy notes

- The homepage delays its 3.1 MB background video until the browser is idle and skips it for reduced-motion, Save-Data, and slow 2G. Music is off by default and loads only when enabled.
- UI character images use WebP alternatives: about 0.85 MB total instead of 11.24 MB of PNGs (about 92% less image transfer); the original PNGs remain available.
- Caddy can serve SvelteKit's fingerprinted `/_app/immutable/` assets and `/assets/` files directly from `build/client/` with long-lived cache headers, or proxy all requests to SvelteKit. Do not cache authenticated HTML, API responses, donations, or webhook routes.
- If Cloudflare's orange-cloud proxy is enabled, configure the Dockerized Caddy to trust only Cloudflare's current proxy ranges and restrict origin access accordingly before relying on forwarded client IPs. Otherwise Caddy sees Cloudflare IPs, which can make IP-based rate limits ineffective. Do not blindly trust `CF-Connecting-IP` from public clients.
- Community realtime events use server-sent events through the SvelteKit proxy. Keep one frontend process and one backend instance for this setup.
- Check the app with `pm2 status`, `pm2 logs sanctyria-web`, and the public site. Verify `/`, `/donate`, signup/login with Turnstile, payment-provider sandbox checkout, and signed test webhooks. Since the API is on Render, check its health/readiness endpoints using the Render service URL.
