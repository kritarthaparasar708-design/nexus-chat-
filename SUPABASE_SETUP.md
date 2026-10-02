# Nexus Chat Supabase setup

## Environment

Copy `.env.example` to `.env.local` for local development and set:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

Use only the project's public anon/publishable key in the browser. Never add a service-role key to Vite environment variables or frontend code. Configure the same two variables in Vercel for each deployment environment.

## Database

Apply `supabase/migrations/20261002000000_nexus_chat_backend.sql` to the Supabase project using the Supabase CLI (`supabase db push`) or SQL Editor. The migration creates the profiles, conversations, conversation_members, and messages tables, their indexes and RLS policies, the public avatars bucket, the direct-conversation RPC, and Realtime publication membership.

## Supabase Auth

1. Enable email/password sign-in and email confirmation in Supabase Auth.
2. Set the Supabase Site URL to the deployed app origin. Add the local development origin shown by `npm run dev` and the deployed origin to the Redirect URLs allowlist. The app sends confirmation links to `/verify` and reset links to `/reset-password`.
3. To support phone verification and phone/password login, enable the Phone provider and configure a working SMS provider (for example, Twilio) and its credentials in Supabase. This app first creates the account with email/password, then attaches and verifies the submitted E.164 phone number after email confirmation. The profile setup is only available after both confirmation steps.
4. Ensure the configured phone provider supports Supabase phone-change OTPs. If SMS is not configured, the app will report the provider error and will not claim the phone was verified.

Password reset uses Supabase's email recovery flow. Supabase must allow the `/reset-password` redirect. If a recovery link expires, the page lets the user request another one.

## Validation

After setting environment variables and applying the migration, create two distinct test accounts with separate verified emails and phone numbers. Verify profile creation, search, direct conversation creation, sending/realtime delivery, persistence after refresh, and username collision behavior. The repository does not contain a Supabase project URL/key or test account credentials, so those live integration checks must be performed against the configured project.
