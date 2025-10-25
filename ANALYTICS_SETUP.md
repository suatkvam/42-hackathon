# 📊 Analytics Setup Guide

SuiTree now includes **hybrid analytics** powered by Supabase! Track link clicks, view statistics, and analyze your profile performance.

## 🚀 Quick Setup (5 minutes)

### 1. Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub/Google
4. Create a new project
   - Enter project name (e.g., "suitree-analytics")
   - Set database password (save it!)
   - Choose region (closest to you)
   - Click "Create new project"

### 2. Create Database Table
1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New Query"
3. Paste this SQL:

```sql
-- Create link_clicks table
CREATE TABLE link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id TEXT NOT NULL,
  link_label TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  referrer TEXT
);

-- Create index for faster queries
CREATE INDEX idx_profile_clicks ON link_clicks(profile_id);
CREATE INDEX idx_timestamp ON link_clicks(timestamp DESC);

-- Enable Row Level Security (optional - for future auth)
ALTER TABLE link_clicks ENABLE ROW LEVEL SECURITY;
```

4. Click "Run" (bottom right)

### 3. Get API Credentials
1. Go to **Settings** > **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public key** (starts with `eyJhbGc...`)

### 4. Configure Frontend
1. Open `frontend/.env` file
2. Add these lines:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

3. Save the file
4. Restart your dev server:
```bash
cd frontend
npm run dev
```

## ✅ Verify Setup

1. Visit your profile page: `http://localhost:5177/dashboard`
2. Click **📊 Analytics** in the sidebar
3. If configured correctly, you'll see "No clicks tracked yet"
4. If not configured, you'll see "Analytics not available"

## 📈 What Gets Tracked?

### When someone clicks a link on your public profile:
- ✅ Profile ID
- ✅ Link label (e.g., "GitHub", "Twitter")
- ✅ Timestamp
- ✅ User agent (browser info)
- ✅ Referrer (where they came from)

### Analytics Dashboard Shows:
- **Total Clicks** - All-time link clicks
- **Active Links** - Number of links with clicks
- **Top Links** - Most clicked links (ranked)
- **Recent Activity** - Clicks by day (last 7 days)

## 🔐 Privacy & Security

### ✅ Privacy-Friendly:
- No IP addresses stored
- No personal data collected
- Anonymous tracking
- GDPR-compliant

### ✅ Secure:
- Supabase handles authentication
- API keys are safe to expose (anon key)
- Row Level Security can be enabled
- Data encrypted at rest

## 🎨 Advanced Usage

### View Analytics for Specific Link
Click the **📊** icon next to any link in your dashboard.

### Export Data
Go to Supabase Dashboard > **Table Editor** > **link_clicks** > **Export**

### Create Custom Reports
Use Supabase SQL Editor to write custom queries:

```sql
-- Most popular link this month
SELECT link_label, COUNT(*) as clicks
FROM link_clicks
WHERE timestamp >= date_trunc('month', NOW())
GROUP BY link_label
ORDER BY clicks DESC
LIMIT 10;

-- Hourly traffic pattern
SELECT 
  EXTRACT(HOUR FROM timestamp) as hour,
  COUNT(*) as clicks
FROM link_clicks
GROUP BY hour
ORDER BY hour;
```

## 🚧 Troubleshooting

### "Analytics not available"
- ✅ Check `.env` file has correct credentials
- ✅ Restart dev server after adding env vars
- ✅ Verify Supabase project is active

### "Failed to track click"
- ✅ Check Supabase table was created correctly
- ✅ Verify API key has correct permissions
- ✅ Check browser console for errors

### No data showing
- ✅ Share your profile and click a link yourself
- ✅ Wait a few seconds, then refresh analytics
- ✅ Check Supabase Table Editor to see raw data

## 💰 Costs

### Free Tier Limits (Supabase):
- ✅ 500MB database storage
- ✅ 2GB bandwidth/month
- ✅ 50,000 monthly active users
- ✅ Unlimited API requests

**For a personal linktree:** Free tier is more than enough!

**For production:** ~$25/month for Pro tier (100GB bandwidth)

## 🔮 Future Enhancements

- [ ] Real-time analytics dashboard
- [ ] Click heatmaps
- [ ] Conversion tracking
- [ ] A/B testing
- [ ] Export to CSV
- [ ] Weekly email reports
- [ ] Blockchain anchoring (weekly summaries)

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase SQL Editor Guide](https://supabase.com/docs/guides/database/sql-editor)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 🆘 Need Help?

Create an issue on GitHub with:
- Error message
- Steps to reproduce
- Screenshots of Supabase dashboard

---

**Made with ❤️ for SuiTree** 🌳
