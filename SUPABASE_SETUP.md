# Nexus Chat Supabase setup

## Environment

Copy `.env.example` to `.env.local` for local development and set:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

Use only the project's public anon/publishable key in the browser. Never add a service-role key to Vite environment variables or frontend code. Configure the same two variables in Vercel for each deployment environment.

## Database

Apply all migrations in `supabase/migrations` to the Supabase project using the Supabase CLI (`supabase db push`) or SQL Editor. The initial migration creates the profiles, conversations, conversation_members, and messages tables, their indexes and RLS policies, the public avatars bucket, the direct-conversation RPC, and Realtime publication membership. The follow-up migration makes email confirmation the only verification requirement for database access.

## Supabase Auth

1. Enable email/password sign-in and keep email confirmation enabled in Supabase Auth. Email confirmation is required before an account can access Nexus Chat.
2. Set the Supabase Site URL to the deployed app origin. Add the local development origin shown by `npm run dev` and the deployed origin to the Redirect URLs allowlist. The app sends confirmation links to `/verify` and reset links to `/reset-password`.
3. Phone numbers are optional. The Phone provider, Twilio, and any SMS provider are not required by the app.

Password reset uses Supabase's email recovery flow. Supabase must allow the `/reset-password` redirect. If a recovery link expires, the page lets the user request another one.

## Validation

After setting environment variables and applying all migrations, create test accounts with verified email addresses, including accounts with no phone number. Verify profile creation, search, direct conversation creation, sending/realtime delivery, persistence after refresh, and username collision behavior. The repository does not contain a Supabase project URL/key or test account credentials, so those live integration checks must be performed against the configured project.
