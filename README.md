# Live Pitch Shift

Real-time browser pitch shifter for microphone or test tone — built with plain HTML, CSS, and JavaScript.

[![Deploy to Cloudflare Pages](https://img.shields.io/badge/deploy-Cloudflare%20Pages-F38020?logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![Web Audio API](https://img.shields.io/badge/audio-Web%20Audio%20API-5b9cff)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## Overview

**Live Pitch Shift** is a single-page web app that pitch-shifts audio in real time using the Web Audio API and a custom `AudioWorklet` processor. Point it at your microphone for live voice/instrument processing, or use the built-in test oscillator to hear the effect without any input hardware.

The processor uses a **dual-tap overlap delay-line** algorithm — a classic granular approach that changes *musical pitch* (semitones) rather than applying a fixed **frequency shift** (Hz offset). That distinction matters: pitch shifting sounds like “higher or lower notes”; frequency shifting changes timbre in a more synthetic, ring-mod-like way. This app does the former.

Everything runs client-side. No backend, no build step, no npm install required for the app itself. Host it on [Cloudflare Pages](https://pages.cloudflare.com/) (or any static host) and it works over HTTPS.

---

## Features

### Input

- **Live microphone** — `getUserMedia` capture with echo cancellation / noise suppression disabled for cleaner raw input
- **Test tone mode** — internal oscillator so you can verify pitch shift without a mic
  - Waveforms: sine, square, sawtooth, triangle
  - Frequency range: 80 Hz – 2 kHz

### Pitch control

- **Semitone slider** — −24 to +24 semitones
- **Cent fine-tune** — ±100 cents for subtle adjustment
- **Quick presets** — −7 st, reset, +7 st
- **Live ratio display** — shows the effective playback ratio (e.g. ×1.414 for +5 st)

### Mix & monitoring

- **Output level** — adjustable shifted-signal gain (0–100%)
- **Status indicator** — idle / starting / active / error states

### Technical

- **AudioWorklet** processor for low-latency, off-main-thread DSP
- **Zero dependencies** in the runtime app (vanilla JS)
- **Static deploy** — Cloudflare Pages, GitHub Pages, Netlify, or any file host
- **Optional CI** — GitHub Actions workflow for automatic Cloudflare Pages deploy

---

## Quick start

### Local preview

Microphone access requires **HTTPS** or **`localhost`**.

```bash
cd live-pitch-shift
python3 -m http.server 3456
# open http://localhost:3456
```

Or with Node:

```bash
npx --yes serve .
```

1. Click **Start**
2. Try **Test tone** first — set +7 semitones and confirm the pitch rises
3. Switch to **Live microphone** (allow permission when prompted)
4. Use **headphones** to avoid feedback

### Deploy to Cloudflare Pages

| Method | Steps |
|--------|--------|
| **Git (recommended)** | Push to GitHub → Cloudflare Dashboard → Workers & Pages → Connect to Git → build output: `/` → no build command |
| **Wrangler CLI** | `wrangler pages deploy .` |
| **GitHub Actions** | Add `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` secrets; push to `main` |

See [wrangler.toml](./wrangler.toml) and [.github/workflows/deploy.yml](./.github/workflows/deploy.yml).

---

## How it works

```
Mic / Oscillator → MediaStreamSource / OscillatorNode
                        ↓
              AudioWorklet (pitch-shifter-processor)
                        ↓
                   GainNode → Speakers
```

The worklet maintains a ring buffer and two read heads crossfaded with a sine window. Read speed is scaled by the pitch ratio (`2^(semitones/12)`), which raises or lowers perceived pitch while overlap-smoothing artifacts.

---

## Project structure

```
live-pitch-shift/
├── index.html                    # App shell
├── css/style.css                 # UI styles
├── js/app.js                     # Audio graph & UI logic
├── js/pitch-shifter-processor.js # AudioWorklet DSP
├── wrangler.toml                 # Cloudflare Pages config
└── .github/workflows/deploy.yml  # Optional auto-deploy
```

---

## Roadmap

Planned and possible future improvements:

### Near term

- [ ] **Dry/wet mix** — blend original (dry) and shifted (wet) signals
- [ ] **Bypass toggle** — instant A/B compare with unprocessed input
- [ ] **Latency readout** — show approximate buffer + worklet delay in ms
- [ ] **Keyboard shortcuts** — start/stop, preset keys, fine-tune nudge

### Audio quality

- [ ] **Higher-quality algorithm** — WSOLA or phase-vocoder style shifter for cleaner vocals at extremes
- [ ] **Adjustable grain size** — trade latency vs. artifact reduction
- [ ] **Formant control** — optional formant preservation when shifting voice

### Input & output

- [ ] **Audio file upload** — pitch-shift a dropped WAV/MP3 sample (offline decode + playback)
- [ ] **Built-in sample library** — short bundled clips (voice, piano, drum loop) for quick demos
- [ ] **Record / download output** — capture shifted audio via `MediaRecorder`
- [ ] **MIDI note target** — snap shift amount to a chosen destination note

### UX & platform

- [ ] **Save / load presets** — `localStorage` for favorite shift settings
- [ ] **Visual tuner / pitch meter** — show input and output fundamental frequency
- [ ] **PWA support** — installable app, offline shell
- [ ] **Mobile layout pass** — larger touch targets, landscape-friendly controls
- [ ] **Dark / light theme toggle**

### DevOps

- [ ] **Live demo URL** — badge linking to Cloudflare Pages deployment

---

## Pitch shift vs frequency shift

| | Pitch shift (this app) | Frequency shift (not included) |
|---|------------------------|--------------------------------|
| **Effect** | Musical intervals (semitones) | Fixed Hz offset on all partials |
| **Timbre** | Largely recognizable source | Often metallic / “ring-mod” character |
| **Use case** | Harmonies, octaves, creative voice FX | Sci-fi vocals, dissonant textures |

---

## Contributing

Issues and pull requests are welcome. For larger changes (e.g. replacing the DSP core), open an issue first to discuss approach and latency goals.

---

## License

MIT — see [LICENSE](./LICENSE).
