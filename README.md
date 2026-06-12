# Supabase Multi-Keep-Alive

This repository runs a simple Node.js application designed to prevent multiple Supabase projects on the free tier from being paused due to inactivity.

## Setup Instructions

1. Create a `keep_alive` table in each of your Supabase projects using this SQL command:
   ```sql
   create table keep_alive (
     id uuid primary key,
     created_at timestamp with time zone default timezone('utc'::text, now()) not null
   );
