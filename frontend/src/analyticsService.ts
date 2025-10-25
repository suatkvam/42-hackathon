import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Initialize Supabase client
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export interface LinkClick {
  id?: string;
  profile_id: string;
  link_label: string;
  timestamp?: string;
  user_agent?: string;
  referrer?: string;
}

export interface AnalyticsStats {
  totalClicks: number;
  clicksByLink: Record<string, number>;
  clicksByDay: Record<string, number>;
  topLinks: Array<{ label: string; clicks: number }>;
  recentClicks: LinkClick[];
}

// Track a link click
export async function trackLinkClick(
  profileId: string,
  linkLabel: string
): Promise<void> {
  if (!supabase) {
    console.warn('Supabase not configured. Skipping analytics tracking.');
    return;
  }

  try {
    const { error } = await supabase.from('link_clicks').insert({
      profile_id: profileId,
      link_label: linkLabel,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      referrer: document.referrer || 'direct',
    });

    if (error) {
      console.error('Failed to track click:', error);
    }
  } catch (err) {
    console.error('Analytics tracking error:', err);
  }
}

// Get analytics for a profile
export async function getAnalytics(profileId: string): Promise<AnalyticsStats | null> {
  if (!supabase) {
    console.warn('Supabase not configured. Analytics not available.');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('link_clicks')
      .select('*')
      .eq('profile_id', profileId)
      .order('timestamp', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Failed to fetch analytics:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return {
        totalClicks: 0,
        clicksByLink: {},
        clicksByDay: {},
        topLinks: [],
        recentClicks: [],
      };
    }

    // Aggregate data
    const clicksByLink: Record<string, number> = {};
    const clicksByDay: Record<string, number> = {};

    data.forEach((click: any) => {
      // Count by link
      clicksByLink[click.link_label] = (clicksByLink[click.link_label] || 0) + 1;

      // Count by day
      const day = new Date(click.timestamp).toLocaleDateString();
      clicksByDay[day] = (clicksByDay[day] || 0) + 1;
    });

    // Get top links
    const topLinks = Object.entries(clicksByLink)
      .map(([label, clicks]) => ({ label, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);

    return {
      totalClicks: data.length,
      clicksByLink,
      clicksByDay,
      topLinks,
      recentClicks: data.slice(0, 10),
    };
  } catch (err) {
    console.error('Analytics fetch error:', err);
    return null;
  }
}

// Get analytics for a specific link
export async function getLinkAnalytics(
  profileId: string,
  linkLabel: string
): Promise<number> {
  if (!supabase) {
    return 0;
  }

  try {
    const { count, error } = await supabase
      .from('link_clicks')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profileId)
      .eq('link_label', linkLabel);

    if (error) {
      console.error('Failed to fetch link analytics:', error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('Link analytics error:', err);
    return 0;
  }
}

// Check if Supabase is configured
export function isAnalyticsEnabled(): boolean {
  return supabase !== null;
}

// Get analytics summary
export async function getAnalyticsSummary(profileId: string) {
  if (!supabase) {
    return null;
  }

  try {
    const stats = await getAnalytics(profileId);
    if (!stats) return null;

    return {
      total: stats.totalClicks,
      today: getTodayClicks(stats.clicksByDay),
      thisWeek: getWeekClicks(stats.clicksByDay),
      topLink: stats.topLinks[0] || null,
    };
  } catch (err) {
    console.error('Summary error:', err);
    return null;
  }
}

// Helper functions
function getTodayClicks(clicksByDay: Record<string, number>): number {
  const today = new Date().toLocaleDateString();
  return clicksByDay[today] || 0;
}

function getWeekClicks(clicksByDay: Record<string, number>): number {
  const now = new Date();
  let total = 0;

  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayKey = date.toLocaleDateString();
    total += clicksByDay[dayKey] || 0;
  }

  return total;
}
