# Contributing to ChainIntel Terminal

Thank you for your interest in contributing to ChainIntel Terminal.

## Development Setup

1. Clone the repository
2. Serve locally: `npx serve . -l 3000`
3. Open `http://localhost:3000` in your browser

## Branch Strategy

- `main` — Production. Deployed to chainintelterminal.com via Vercel.
- `develop` — Integration branch for upcoming features.
- `feature/*` — Individual feature branches off `develop`.
- `hotfix/*` — Critical fixes branched from `main`.

## Pull Request Process

1. Create a feature branch from `develop`
2. Make your changes with clear, atomic commits
3. Ensure all JavaScript validates: `node -e "new Function(...)"`
4. Test all 12 tabs and the tour walkthrough
5. Open a PR against `develop` with a clear description
6. Request review from @SMQKEDQG

## Code Standards

- **No build tools** — this is a single-file HTML application by design
- **JetBrains Mono** for data/numbers, **Inter** for UI labels
- **CSS variables** — use the design system tokens (see README)
- **No external JS frameworks** — vanilla JS only
- Validate JS before committing: avoid apostrophes in single-quoted strings

## Reporting Issues

Open an issue with:
- Browser and version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
