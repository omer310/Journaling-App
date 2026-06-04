# MongoDB + Clerk Setup

Set these values in `web/.env.local` for local development and in Netlify environment variables for production.

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

MONGODB_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=soul_pages

NEXT_PUBLIC_ADMIN_PASSWORD=change-this-admin-password
```

## Import Existing Supabase Journals

Export your old `journal_entries` rows as JSON, then run:

```powershell
$env:MONGODB_URI="your MongoDB URI"
$env:MONGODB_DB="soul_pages"
$env:CLERK_USER_ID="user_xxx from Clerk"
$env:LEGACY_USER_ID="old Supabase auth.users id, if entries are encrypted"
npm run import:journals -- path\to\journal_entries.json
```

`LEGACY_USER_ID` matters if the exported `title` and `content` values are encrypted. Existing entries were encrypted with the old Supabase user id, while new entries use the Clerk user id.
