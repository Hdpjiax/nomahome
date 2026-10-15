# Deployment Guide

## Phase 10: Production Setup

### GitHub

1. Enable Dependabot: Settings → Code security & analysis → Dependabot
2. Enable secret scanning: Settings → Code security & analysis
3. Enable CodeQL: Settings → Code security & analysis → CodeQL
4. Install GitHub integration in Supabase and Vercel projects

### Supabase

1. Create production database backup strategy
2. Configure row-level security (RLS) on all tables
3. Set up webhooks for payment provider

### Vercel

1. Link GitHub repository
2. Configure environment variables (see .env.example)
3. Set preview deployment for pull requests
4. Enable analytics

### Monitoring

- Monitor Lighthouse scores in CI
- Track Core Web Vitals
- Review security headers in production

For detailed steps, see INSTRUCCION.md phase 10.
