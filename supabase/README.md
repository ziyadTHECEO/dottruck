# Supabase Setup

## Run the schema

1. Go to your Supabase dashboard → SQL Editor
2. Paste the full contents of `schema.sql`
3. Click "Run"
4. Verify in Table Editor that 7 tables were created:
   - users
   - transporteur_profiles
   - charges
   - matchings
   - messages
   - ratings
   - notifications

## Enable Realtime

1. Go to Database → Replication
2. Enable realtime for tables: `messages`, `notifications`

## Seed data (optional)

Run `seed.sql` in SQL Editor to populate demo data.
