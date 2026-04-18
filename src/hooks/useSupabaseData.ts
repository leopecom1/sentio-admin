import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ============================================
// Types
// ============================================

interface DashboardStats {
  totalUsers: number;
  todayCheckins: number;
  todayJournals: number;
  weekConversations: number;
  crisisCount: number;
}

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: string;
  checkin_streak: number;
  longest_streak: number;
  total_checkins: number;
  total_journal_entries: number;
  total_chat_messages: number;
  total_tools_used: number;
  onboarding_completed: boolean;
  last_active_at: string | null;
  created_at: string;
  // Joined from latest checkin
  last_emotion: string | null;
  last_energy: number | null;
  last_stress: number | null;
}

interface DailyCheckinPoint {
  date: string;    // "Lun", "Mar", etc.
  fullDate: string; // ISO date
  count: number;
}

interface EmotionCount {
  name: string;
  value: number;
  color: string;
}

interface StressTrendPoint {
  date: string;
  avg: number;
}

interface FeatureUsageCount {
  tool_category: string;
  count: number;
}

interface AnalyticsData {
  dailyCheckins: DailyCheckinPoint[];
  emotionDistribution: EmotionCount[];
  stressTrend: StressTrendPoint[];
  featureUsage: FeatureUsageCount[];
}

interface ConversationRow {
  id: string;
  user_id: string;
  user_name: string | null;
  title: string | null;
  initial_emotion: string | null;
  message_count: number;
  is_crisis: boolean;
  created_at: string;
  updated_at: string;
}

interface Article {
  id: string;
  title: string;
  subtitle: string | null;
  content: string;
  category: string;
  tags: string[];
  cover_image_url: string | null;
  reading_time_minutes: number;
  reflection_question: string | null;
  is_published: boolean;
  is_premium: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface DailyPhrase {
  id: string;
  phrase: string;
  author: string | null;
  category: string;
  is_active: boolean;
  created_at: string;
}

// ============================================
// Emotion color map (matches lib/utils.ts)
// ============================================

const EMOTION_COLORS: Record<string, string> = {
  calm: '#7B9E87',
  focused: '#3D5A80',
  motivated: '#C9A96E',
  grateful: '#9B8EC4',
  hopeful: '#6DB3C4',
  tired: '#8E8E93',
  overwhelmed: '#D4A574',
  anxious: '#D4856A',
  frustrated: '#C75B5B',
  sad: '#7A8BA8',
  insecure: '#B8A9C9',
  lonely: '#8B9DC3',
  pressured: '#CC8B6E',
  angry: '#BF4E4E',
  blocked: '#6B7280',
};

const EMOTION_LABELS: Record<string, string> = {
  calm: 'Tranquilo',
  focused: 'Enfocado',
  motivated: 'Motivado',
  grateful: 'Agradecido',
  hopeful: 'Esperanzado',
  tired: 'Cansado',
  overwhelmed: 'Abrumado',
  anxious: 'Ansioso',
  frustrated: 'Frustrado',
  sad: 'Triste',
  insecure: 'Inseguro',
  lonely: 'Solo',
  pressured: 'Presionado',
  angry: 'Enojado',
  blocked: 'Bloqueado',
};

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

// ============================================
// Helper: get ISO date string for "today" and "start of week"
// ============================================

function todayISO(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function startOfWeekISO(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day);
  return d.toISOString().split('T')[0];
}

// ============================================
// 1. useDashboardStats
// ============================================

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    todayCheckins: 0,
    todayJournals: 0,
    weekConversations: 0,
    crisisCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        const today = todayISO();
        const weekStart = startOfWeekISO();

        // Run all queries in parallel
        const [usersRes, checkinsRes, journalsRes, convsRes, crisisRes] = await Promise.all([
          // Total users
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true }),

          // Today's check-ins
          supabase
            .from('checkins')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', `${today}T00:00:00`),

          // Today's journal entries
          supabase
            .from('journal_entries')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', `${today}T00:00:00`),

          // This week's conversations
          supabase
            .from('chat_conversations')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', `${weekStart}T00:00:00`),

          // Today's crisis check-ins (stress=5, energy=1)
          supabase
            .from('checkins')
            .select('id', { count: 'exact', head: true })
            .eq('is_crisis', true)
            .gte('created_at', `${today}T00:00:00`),
        ]);

        if (!cancelled) {
          setStats({
            totalUsers: usersRes.count ?? 0,
            todayCheckins: checkinsRes.count ?? 0,
            todayJournals: journalsRes.count ?? 0,
            weekConversations: convsRes.count ?? 0,
            crisisCount: crisisRes.count ?? 0,
          });
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar estadisticas.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStats();
    return () => { cancelled = true; };
  }, []);

  return { ...stats, loading, error };
}

// ============================================
// 2. useUsers
// ============================================

export function useUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('last_active_at', { ascending: false })
        .limit(500);

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        setUsers([]);
        setError(null);
        setLoading(false);
        return;
      }

      // For each user, get their most recent checkin for emotion context
      // We batch this by getting the latest checkin per user with a single query
      const userIds = profiles.map((p) => p.id);

      const { data: latestCheckins, error: checkinsError } = await supabase
        .from('checkins')
        .select('user_id, primary_emotion, energy_level, stress_level, created_at')
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
        .limit(500);

      if (checkinsError) throw checkinsError;

      // Build a map: user_id -> latest checkin (first occurrence since ordered DESC)
      const checkinMap = new Map<string, { emotion: string; energy: number; stress: number }>();
      for (const c of latestCheckins ?? []) {
        if (!checkinMap.has(c.user_id)) {
          checkinMap.set(c.user_id, {
            emotion: c.primary_emotion,
            energy: c.energy_level,
            stress: c.stress_level,
          });
        }
      }

      const mapped: UserProfile[] = profiles.map((p) => {
        const latestCheckin = checkinMap.get(p.id);
        return {
          id: p.id,
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          plan: p.plan,
          checkin_streak: p.checkin_streak,
          longest_streak: p.longest_streak,
          total_checkins: p.total_checkins,
          total_journal_entries: p.total_journal_entries,
          total_chat_messages: p.total_chat_messages,
          total_tools_used: p.total_tools_used,
          onboarding_completed: p.onboarding_completed,
          last_active_at: p.last_active_at,
          created_at: p.created_at,
          last_emotion: latestCheckin?.emotion ?? null,
          last_energy: latestCheckin?.energy ?? null,
          last_stress: latestCheckin?.stress ?? null,
        };
      });

      setUsers(mapped);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Client-side search by name or email-like pattern
  const searchUsers = useCallback(
    (query: string): UserProfile[] => {
      if (!query.trim()) return users;
      const q = query.toLowerCase();
      return users.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q)
      );
    },
    [users]
  );

  return { users, loading, error, searchUsers, refetch: fetchUsers };
}

// ============================================
// 3. useAnalytics
// ============================================

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData>({
    dailyCheckins: [],
    emotionDistribution: [],
    stressTrend: [],
    featureUsage: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAnalytics() {
      try {
        const sevenDaysAgo = daysAgoISO(6); // today inclusive = 7 days

        // Run all queries in parallel
        const [checkinsRes, toolRes] = await Promise.all([
          // All check-ins from last 7 days (for daily counts, emotion dist, stress trend)
          supabase
            .from('checkins')
            .select('primary_emotion, stress_level, created_at')
            .gte('created_at', `${sevenDaysAgo}T00:00:00`)
            .order('created_at', { ascending: true })
            .limit(10000),

          // Tool usage counts by category
          supabase
            .from('tool_usage')
            .select('tool_category, created_at')
            .gte('created_at', `${sevenDaysAgo}T00:00:00`)
            .limit(10000),
        ]);

        if (checkinsRes.error) throw checkinsRes.error;
        if (toolRes.error) throw toolRes.error;

        const checkins = checkinsRes.data ?? [];
        const tools = toolRes.data ?? [];

        // --- Daily check-in counts (last 7 days) ---
        const dailyMap = new Map<string, number>();
        // Pre-populate all 7 days
        for (let i = 6; i >= 0; i--) {
          dailyMap.set(daysAgoISO(i), 0);
        }
        for (const c of checkins) {
          const dateKey = c.created_at.split('T')[0];
          if (dailyMap.has(dateKey)) {
            dailyMap.set(dateKey, (dailyMap.get(dateKey) ?? 0) + 1);
          }
        }
        const dailyCheckins: DailyCheckinPoint[] = Array.from(dailyMap.entries()).map(
          ([dateStr, count]) => {
            const d = new Date(dateStr + 'T12:00:00');
            return {
              date: DAY_NAMES[d.getDay()],
              fullDate: dateStr,
              count,
            };
          }
        );

        // --- Emotion distribution ---
        const emotionCounts = new Map<string, number>();
        for (const c of checkins) {
          const emo = c.primary_emotion;
          emotionCounts.set(emo, (emotionCounts.get(emo) ?? 0) + 1);
        }
        const emotionDistribution: EmotionCount[] = Array.from(emotionCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([emotion, count]) => ({
            name: EMOTION_LABELS[emotion] ?? emotion,
            value: count,
            color: EMOTION_COLORS[emotion] ?? '#9CA3AF',
          }));

        // --- Stress trend (daily average) ---
        const stressDaily = new Map<string, { sum: number; count: number }>();
        for (let i = 6; i >= 0; i--) {
          stressDaily.set(daysAgoISO(i), { sum: 0, count: 0 });
        }
        for (const c of checkins) {
          const dateKey = c.created_at.split('T')[0];
          const entry = stressDaily.get(dateKey);
          if (entry) {
            entry.sum += c.stress_level;
            entry.count += 1;
          }
        }
        const stressTrend: StressTrendPoint[] = Array.from(stressDaily.entries()).map(
          ([dateStr, { sum, count }]) => {
            const d = new Date(dateStr + 'T12:00:00');
            return {
              date: DAY_NAMES[d.getDay()],
              avg: count > 0 ? Math.round((sum / count) * 10) / 10 : 0,
            };
          }
        );

        // --- Feature usage counts ---
        const toolCounts = new Map<string, number>();
        for (const t of tools) {
          const cat = t.tool_category;
          toolCounts.set(cat, (toolCounts.get(cat) ?? 0) + 1);
        }
        const featureUsage: FeatureUsageCount[] = Array.from(toolCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([tool_category, count]) => ({ tool_category, count }));

        if (!cancelled) {
          setData({ dailyCheckins, emotionDistribution, stressTrend, featureUsage });
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar analiticas.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAnalytics();
    return () => { cancelled = true; };
  }, []);

  return { ...data, loading, error };
}

// ============================================
// 4. useConversations
// ============================================

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchConversations() {
      try {
        // Fetch recent conversations with user profile info
        const { data: convs, error: convsError } = await supabase
          .from('chat_conversations')
          .select(`
            id,
            user_id,
            title,
            initial_emotion,
            message_count,
            is_crisis,
            created_at,
            updated_at,
            profiles!chat_conversations_user_id_fkey ( full_name )
          `)
          .order('updated_at', { ascending: false })
          .limit(200);

        if (convsError) throw convsError;

        if (!cancelled) {
          const mapped: ConversationRow[] = (convs ?? []).map((c: any) => ({
            id: c.id,
            user_id: c.user_id,
            user_name: c.profiles?.full_name ?? null,
            title: c.title,
            initial_emotion: c.initial_emotion,
            message_count: c.message_count,
            is_crisis: c.is_crisis,
            created_at: c.created_at,
            updated_at: c.updated_at,
          }));
          setConversations(mapped);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          // Fallback: if the join fails (FK name mismatch), fetch without join
          try {
            const { data: convs, error: convsError } = await supabase
              .from('chat_conversations')
              .select('*')
              .order('updated_at', { ascending: false })
              .limit(200);

            if (convsError) throw convsError;

            // Fetch profile names separately
            const userIds = [...new Set((convs ?? []).map((c: any) => c.user_id))];
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, full_name')
              .in('id', userIds);

            const nameMap = new Map<string, string>();
            for (const p of profiles ?? []) {
              if (p.full_name) nameMap.set(p.id, p.full_name);
            }

            const mapped: ConversationRow[] = (convs ?? []).map((c: any) => ({
              id: c.id,
              user_id: c.user_id,
              user_name: nameMap.get(c.user_id) ?? null,
              title: c.title,
              initial_emotion: c.initial_emotion,
              message_count: c.message_count,
              is_crisis: c.is_crisis,
              created_at: c.created_at,
              updated_at: c.updated_at,
            }));

            if (!cancelled) {
              setConversations(mapped);
              setError(null);
            }
          } catch (fallbackErr) {
            if (!cancelled) {
              setError(
                fallbackErr instanceof Error
                  ? fallbackErr.message
                  : 'Error al cargar conversaciones.'
              );
            }
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchConversations();
    return () => { cancelled = true; };
  }, []);

  return { conversations, loading, error };
}

// ============================================
// 5. useArticles (CRUD)
// ============================================

export function useArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('articles')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(500);

      if (fetchError) throw fetchError;
      setArticles(data ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar articulos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const createArticle = useCallback(
    async (article: Omit<Article, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error: insertError } = await supabase
        .from('articles')
        .insert(article)
        .select()
        .single();

      if (insertError) throw insertError;
      setArticles((prev) => [data, ...prev]);
      return data as Article;
    },
    []
  );

  const updateArticle = useCallback(
    async (id: string, updates: Partial<Omit<Article, 'id' | 'created_at'>>) => {
      const { data, error: updateError } = await supabase
        .from('articles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      setArticles((prev) => prev.map((a) => (a.id === id ? (data as Article) : a)));
      return data as Article;
    },
    []
  );

  const deleteArticle = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;
    setArticles((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return { articles, loading, error, createArticle, updateArticle, deleteArticle, refetch: fetchArticles };
}

// ============================================
// 6. useDailyPhrases (CRUD)
// ============================================

export function useDailyPhrases() {
  const [phrases, setPhrases] = useState<DailyPhrase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhrases = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('daily_phrases')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (fetchError) throw fetchError;
      setPhrases(data ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar frases.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhrases();
  }, [fetchPhrases]);

  const createPhrase = useCallback(
    async (phrase: Omit<DailyPhrase, 'id' | 'created_at'>) => {
      const { data, error: insertError } = await supabase
        .from('daily_phrases')
        .insert(phrase)
        .select()
        .single();

      if (insertError) throw insertError;
      setPhrases((prev) => [data, ...prev]);
      return data as DailyPhrase;
    },
    []
  );

  const updatePhrase = useCallback(
    async (id: string, updates: Partial<Omit<DailyPhrase, 'id' | 'created_at'>>) => {
      const { data, error: updateError } = await supabase
        .from('daily_phrases')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      setPhrases((prev) => prev.map((p) => (p.id === id ? (data as DailyPhrase) : p)));
      return data as DailyPhrase;
    },
    []
  );

  const deletePhrase = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase
      .from('daily_phrases')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;
    setPhrases((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { phrases, loading, error, createPhrase, updatePhrase, deletePhrase, refetch: fetchPhrases };
}
