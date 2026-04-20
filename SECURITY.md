# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| v5.18+  | ✅ Active |
| < v5.18 | ❌ EOL    |

## Reporting a Vulnerability

If you discover a security vulnerability in ChainIntel Terminal, **do not open a public issue.**

Email **security@chainintelterminal.com** with:

1. A description of the vulnerability
2. Steps to reproduce
3. Potential impact assessment
4. Suggested fix (if any)

We aim to acknowledge reports within **48 hours** and issue a patch within **7 days** for critical issues.

## Security Practices

### Environment Variables

All secrets are stored as **sensitive environment variables** in Vercel, meaning they are:

- Encrypted at rest
- Not readable via the Vercel REST API after creation
- Not exposed in build logs or preview deployments

See `.env.example` for the full list of required variables and their descriptions.

**Rules for contributors:**

- Never commit real API keys, tokens, or secrets to the repository
- Never log environment variables in application code
- Always use `process.env` to access secrets server-side
- Client-side variables must use the `NEXT_PUBLIC_` prefix and contain **only** public, non-sensitive values
- Mark all new secrets as **sensitive** when adding them to Vercel

### Database (Supabase)

- Row Level Security (RLS) is enabled on all tables
- INSERT policies require the `authenticated` role — anonymous inserts are blocked
- Views use `security_invoker` (not `security_definer`) to enforce the querying user's permissions
- All database functions have an explicit `search_path` set to prevent path manipulation
- The `service_role` key is only used server-side in API routes — never exposed to the client

### Authentication

- Supabase Auth handles all user authentication
- Leaked password protection via HaveIBeenPwned should be enabled in project settings
- JWT tokens are validated server-side before granting access to protected resources

### Payments (Stripe)

- Stripe secret key is stored as a sensitive environment variable — never client-side
- Webhook signatures are verified using `STRIPE_WEBHOOK_SECRET` before processing events
- All payment links use Stripe-hosted checkout — no card data touches our servers

### Deployment

- Production deployments require the `main` branch
- Vercel Deployment Protection is set to Standard
- All preview deployments are access-controlled
- The GitHub repository is the single source of truth — no direct edits on Vercel

### Incident Response

In the event of a security incident:

1. Rotate all affected credentials immediately
2. Re-add rotated credentials as **sensitive** in Vercel
3. Redeploy to production
4. Audit Supabase API and auth logs for unauthorized access
5. Review GitHub events for unauthorized commits or deploys
6. Tag the recovery state for auditability (e.g., `v5.18-security-hardened`)

## Dependency Management

- Dependencies are reviewed before adding to the project
- `npm audit` should be run regularly to check for known vulnerabilities
- Critical security patches should be applied within 24 hours of disclosure
