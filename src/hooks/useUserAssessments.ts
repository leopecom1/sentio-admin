import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface UserOnboarding {
  id: string;
  full_name: string | null;
  email: string | null;
  onboarding_completed: boolean;
  pressure_types: string[] | null;
  current_mood: string | null;
  initial_energy: number | null;
  goals: string[] | null;
  created_at: string;
}

export interface TestResult {
  id: string;
  user_id: string;
  user_name?: string | null;
  test_type: string;
  severity: string;
  severity_score: number;
  scores: Record<string, number>;
  answers: Array<{ question: string; dimension: string; answer_value: number }>;
  created_at: string;
}

export function useUserOnboardings() {
  const [users, setUsers] = useState<UserOnboarding[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, onboarding_completed, pressure_types, current_mood, initial_energy, goals, created_at')
      .eq('onboarding_completed', true)
      .order('created_at', { ascending: false });
    setUsers((data as UserOnboarding[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { users, loading, reload: load };
}

export function useTestResults() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('test_results')
      .select('*, profiles!test_results_user_id_fkey(full_name)')
      .order('created_at', { ascending: false });

    const mapped = (data || []).map((r: any) => ({
      ...r,
      user_name: r.profiles?.full_name ?? 'Usuario',
    }));
    setResults(mapped);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { results, loading, reload: load };
}
