# ⬡ ChainIntel Terminal

**The Bloomberg Terminal for Digital Assets — AI-Native, Real-Time, Built for the Next Era of Finance.**

[![Live](https://img.shields.io/badge/Live-chainintelterminal.com-00d4aa?style=flat-square)](https://chainintelterminal.com)
[![Version](https://img.shields.io/badge/Version-5.17-3b82f6?style=flat-square)](#changelog)
[![License](https://img.shields.io/badge/License-MIT-f0c040?style=flat-square)](LICENSE)
[![Perplexity Build](https://img.shields.io/badge/Perplexity-Billion%20Dollar%20Build%202026-blueviolet?style=flat-square)](https://sonar.perplexity.ai/build)

---

## Overview

ChainIntel Terminal is an AI-native digital asset intelligence platform that replaces 9+ fragmented crypto tools with a single, unified terminal. Built for institutional investors, fund managers, and serious traders who need Bloomberg-grade intelligence for digital assets — without Bloomberg's $25,000/year price tag.

### The Problem

Bloomberg Terminal charges $25,200/year and barely covers crypto. Professional crypto investors are forced to juggle 9+ tools (CoinGecko, Glassnode, DeFiLlama, LunarCrush, CryptoQuant, DeBank, Messari, Dune, Nansen) to get a complete market picture. That's $15,000–$40,000/year in subscriptions, hours of tab-switching, and zero AI intelligence.

### The Solution

One terminal. 89 data sources. AI-powered intelligence. $49/month.

---

## Features

### 12 Intelligence Modules

| Module | Description |
|--------|-------------|
| **Overview** | AI morning brief, Fear & Greed, ETF flows, market KPIs |
| **Markets** | Top 100 assets with live CoinGecko prices, sparklines, signals |
| **On-Chain** | MVRV, exchange flows, LTH supply, hash rate, BTC/ETH health |
| **DeFi** | TVL, yield farming, stablecoin supply, protocol analytics |
| **ETF & Institutional** | BlackRock IBIT, Fidelity, ARK, Grayscale daily flow data |
| **Regulation** | SEC, CFTC, MiCA, CLARITY Act, stablecoin legislation tracker |
| **ISO 20022** | 8 institutional-grade assets with adoption scores |
| **Sentiment** | Social sentiment, developer activity, LunarCrush, GitHub, Reddit |
| **Derivatives** | Funding rates, open interest, liquidations, basis trades |
| **Whale Alerts** | $10M+ on-chain transactions with ChainScore™ ratings |
| **Portfolio** | Track holdings with live P&L and personalized AI briefs |
| **Pricing** | Free, Pro ($49/mo), Enterprise ($499/mo) |

### AI Features

- **ASK CI** — Natural language queries: "Why is ETH down?", "Best ISO 20022 play?", "Explain MVRV"
- **AI Morning Brief** — Daily market intelligence summary with bull/bear/catalyst signals
- **AI Context Strips** — Every tab has an AI-generated context bar explaining key signals
- **ChainScore™** — Proprietary composite score for on-chain health + regulatory + momentum
- **Proactive Alerts** — AI monitors 89 sources and surfaces anomalies before you ask

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Vanilla HTML/CSS/JS (single-file architecture) |
| **Fonts** | JetBrains Mono (data), Inter (UI) |
| **Live Data** | CoinGecko API (prices), CryptoCompare (charts) |
| **AI Backend** | Supabase Edge Functions (planned) |
| **Auth** | Supabase Auth (planned) |
| **Payments** | Stripe (Pro: $49/mo, Enterprise: $499/mo) |
| **Hosting** | Vercel (auto-deploy from `main`) |
| **Domain** | chainintelterminal.com |
| **Entity** | ChainIntel Inc. — Wyoming LLC |

## Design System

```
Backgrounds:  --bg:#080d16  --s1:#0d1420  --s2:#111d2e  --s3:#162338  --s4:#1c2d45
Borders:      --b1:#1a2d42  --b2:#1f3550  --b3:#254060
Text:         --text:#e4eaf4  --text2:#94b3d0  --muted:#4a6a8c
Accents:      --cyan:#00d4aa  --blue:#3b82f6  --gold:#f0c040  --green:#10b981  --red:#ef4444
Fonts:        JetBrains Mono (monospace data), Inter (UI)
```

---

## Getting Started

```bash
# Clone
git clone https://github.com/chainintel/chainintel-terminal.git
cd chainintel-terminal

# Serve locally
npx serve . -l 3000

# Open
open http://localhost:3000
```

No build step. No dependencies. No framework. Just open `index.html`.

---

## Project Structure

```
chainintel-terminal/
├── index.html                  # Main terminal application (single-file)
├── deck.html                   # 14-slide investor pitch deck
├── why-chainintel.html         # Bloomberg comparison / value proposition
├── promo.html                  # Promotional video page
├── changelog.html              # Version history
├── chainscore-methodology.html # ChainScore™ methodology documentation
├── og-image.png                # Open Graph social preview image
├── README.md
├── LICENSE
├── SECURITY.md
├── CONTRIBUTING.md
└── .gitignore
```

---

## Business Model

| Tier | Price | Target |
|------|-------|--------|
| **Free** | $0/mo | Retail investors, browsing |
| **Pro** | $49/mo | Active traders, fund analysts |
| **Enterprise** | $499/mo | Institutions, fund managers, desks |

**Conservative projections:**
- 10,100 paid users (Year 3) → $59.3M ARR
- 20x revenue multiple → $1.19B valuation

---

## Competition Entry

**Perplexity Billion Dollar Build 2026**
- Registrations: April 14, 2026
- Submissions: June 2, 2026
- Finals: June 9, 2026 (Top 10 present)
- Prize: Up to $1M investment from Perplexity Fund + up to $1M in Computer credits
- Judging: Technological Implementation, Design, Potential Impact, Quality of Idea

---

## Changelog

See [changelog.html](https://chainintelterminal.com/changelog.html) for full version history.

### v5.17 (Current)
- Bulletproof tab navigation with inline onclick handlers
- "How to Read Dashboard" guide moved to top of Overview
- Feature walkthrough tour fully functional with correct anchors
- Hexagonal network logo with pulse animation
- Typography/readability improvements across all panels
- 14-slide pitch deck with $1B business case
- Full "Why ChainIntel" Bloomberg comparison page

---

## Author

Built by the ChainIntel team.
- ChainIntel Inc. — Wyoming LLC

---

## License

MIT — see [LICENSE](LICENSE) for details.
