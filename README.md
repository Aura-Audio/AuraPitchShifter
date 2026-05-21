# Live Pitch Shift

Single-page web app: real-time **pitch shifting** (not frequency shifting) for live microphone input or a built-in test tone.

## Features

- Live mic input with low-latency Web Audio processing
- Test mode: oscillator (sine / square / saw / triangle) at adjustable frequency
- Semitone + cent controls, quick ±7 st presets
- Runs entirely in the browser (HTML / CSS / JS + AudioWorklet)

## Local preview

Browsers require HTTPS or `localhost` for microphone access.

```bash
npx --yes serve .
# open http://localhost:3000
```

## Deploy to Cloudflare Pages

### Option A — Git integration (recommended)

1. Push this repo to GitHub or GitLab.
2. In [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Select the repository.
4. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/` (repository root)
5. Deploy. Every push to the production branch redeploys automatically.

### Option B — Wrangler CLI

```bash
npm i -g wrangler
wrangler pages project create live-pitch-shift
wrangler pages deploy .
```

### Option C — GitHub Actions

Add repository secrets:

- `CLOUDFLARE_API_TOKEN` — token with **Cloudflare Pages Edit** permission
- `CLOUDFLARE_ACCOUNT_ID` — from Cloudflare dashboard URL

Push to `main`; `.github/workflows/deploy.yml` deploys on each push.

## Pitch shift vs frequency shift

**Pitch shift** changes perceived musical pitch (semitones) while keeping duration roughly stable via overlapping delay grains.

**Frequency shift** adds a fixed Hz offset to every component, which changes timbre in a “ring-mod” way. This app does not do that.
