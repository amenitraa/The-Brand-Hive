# Brand Tasks — Team Marketing Task Manager

A collaborative task management app for your brand marketing team, built to deploy on Netlify with Supabase as the backend.

## Team Members
Amanda · Amenitra · Vivi · Kate · Grace · Shannon

---

## 🚀 Deployment on Netlify

1. Push this folder to a GitHub (or GitLab/Bitbucket) repository
2. Log in to [netlify.com](https://netlify.com) and click **Add new site → Import an existing project**
3. Connect your repo — Netlify will auto-detect settings
4. Set environment or inline config (see Supabase section below)
5. Click **Deploy site**

No build step needed — this is a pure HTML/JS/CSS app.

---

## 🗄️ Supabase Setup (Required for shared team data)

### 1. Create a Supabase project
- Go to [supabase.com](https://supabase.com) and create a free account
- Click **New Project**, name it "brand-tasks"

### 2. Create the database tables

In your Supabase dashboard, go to **SQL Editor** and run:

```sql
-- Tasks table
create table tasks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  assignee text,
  due_date date,
  priority text check (priority in ('critical', 'high', 'medium', 'low')),
  status text default 'not-started' check (status in ('not-started', 'in-progress', 'done', 'on-hold', 'need-support')),
  project text check (project in ('industry', 'account', 'planning', 'brand-advocacy', 'activation', 'campaign-review', 'web', 'ai')),
  notes text,
  completed boolean default false,
  attachments jsonb default '[]',
  created_at timestamptz default now()
);

-- Comments table
create table comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  author text not null,
  text text not null,
  created_at timestamptz default now()
);

-- Enable Row Level Security (allow all for now — add auth later)
alter table tasks enable row level security;
alter table comments enable row level security;

create policy "Allow all" on tasks for all using (true) with check (true);
create policy "Allow all" on comments for all using (true) with check (true);

-- Enable realtime
alter publication supabase_realtime add table tasks;
```

### 3. Get your API keys
- In Supabase dashboard go to **Project Settings → API**
- Copy **Project URL** and **anon/public key**

### 4. Add keys to your app

Edit `src/lib/supabase.js` and replace:
```js
export const SUPABASE_URL = 'YOUR_SUPABASE_URL';
export const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

**Or** (recommended for Netlify): Add as environment variables in Netlify dashboard under **Site Configuration → Environment Variables**:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Then in `supabase.js` use:
```js
export const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
```

---

## 🔔 Browser Notifications

Click the bell icon (top right) to enable browser push notifications. You'll get reminders for tasks due today or tomorrow that are assigned to you.

---

## 📋 Features

- **Table view** — full task list with sorting, filtering, multi-select bulk actions
- **Calendar view** — tasks plotted by due date, color-coded by team member
- **My Tasks** — filtered view of just your tasks
- **Per-member views** — click any team member in the sidebar
- **Task modal** — create/edit with all fields + file attachments + comments
- **Comments** — great for OOO notes and async reminders
- **Bulk actions** — multi-select to update status, priority, or delete
- **Grouping** — group by status, project, priority, or assignee
- **Search + filters** — search by name, filter by status/priority/project
- **Real-time sync** — changes appear live for all teammates (requires Supabase)

---

## 🎨 Customization

- **Add/remove team members**: Edit `MEMBERS` array in `src/lib/helpers.js`
- **Change colors**: Edit `MEMBER_COLORS` in `src/lib/helpers.js`
- **Add projects**: Edit `PROJECTS` array in `src/lib/helpers.js` (and update the SQL check constraint)
- **Theme**: All colors are CSS variables in `src/styles/main.css` under `:root`
