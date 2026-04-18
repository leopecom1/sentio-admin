import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ── Types ──

export interface PointRule {
  id: string;
  action_key: string;
  label: string;
  description: string | null;
  xp_amount: number;
  icon: string;
  category: string;
  is_active: boolean;
}

export interface GamificationLevel {
  id: string;
  level: number;
  title: string;
  xp_required: number;
  icon: string;
}

export interface GamificationAchievement {
  id: string;
  achievement_key: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  condition_type: string;
  condition_field: string | null;
  condition_value: number;
  xp_reward: number;
  is_active: boolean;
  sort_order: number;
}

// ── Point Rules Hook ──

export function usePointRules() {
  const [rules, setRules] = useState<PointRule[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRules = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('point_rules')
      .select('*')
      .order('category')
      .order('action_key');
    setRules(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadRules(); }, [loadRules]);

  const updateRule = async (id: string, updates: Partial<PointRule>) => {
    const { error } = await supabase
      .from('point_rules')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) await loadRules();
    return { error };
  };

  const createRule = async (rule: Omit<PointRule, 'id'>) => {
    const { error } = await supabase.from('point_rules').insert(rule);
    if (!error) await loadRules();
    return { error };
  };

  const deleteRule = async (id: string) => {
    const { error } = await supabase.from('point_rules').delete().eq('id', id);
    if (!error) await loadRules();
    return { error };
  };

  return { rules, loading, updateRule, createRule, deleteRule, reload: loadRules };
}

// ── Levels Hook ──

export function useLevels() {
  const [levels, setLevels] = useState<GamificationLevel[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLevels = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('gamification_levels')
      .select('*')
      .order('level');
    setLevels(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadLevels(); }, [loadLevels]);

  const updateLevel = async (id: string, updates: Partial<GamificationLevel>) => {
    const { error } = await supabase
      .from('gamification_levels')
      .update(updates)
      .eq('id', id);
    if (!error) await loadLevels();
    return { error };
  };

  const createLevel = async (level: Omit<GamificationLevel, 'id'>) => {
    const { error } = await supabase.from('gamification_levels').insert(level);
    if (!error) await loadLevels();
    return { error };
  };

  const deleteLevel = async (id: string) => {
    const { error } = await supabase.from('gamification_levels').delete().eq('id', id);
    if (!error) await loadLevels();
    return { error };
  };

  return { levels, loading, updateLevel, createLevel, deleteLevel, reload: loadLevels };
}

// ── Achievements Hook ──

export function useAchievements() {
  const [achievements, setAchievements] = useState<GamificationAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAchievements = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('gamification_achievements')
      .select('*')
      .order('sort_order');
    setAchievements(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadAchievements(); }, [loadAchievements]);

  const updateAchievement = async (id: string, updates: Partial<GamificationAchievement>) => {
    const { error } = await supabase
      .from('gamification_achievements')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) await loadAchievements();
    return { error };
  };

  const createAchievement = async (achievement: Omit<GamificationAchievement, 'id'>) => {
    const { error } = await supabase.from('gamification_achievements').insert(achievement);
    if (!error) await loadAchievements();
    return { error };
  };

  const deleteAchievement = async (id: string) => {
    const { error } = await supabase.from('gamification_achievements').delete().eq('id', id);
    if (!error) await loadAchievements();
    return { error };
  };

  return { achievements, loading, updateAchievement, createAchievement, deleteAchievement, reload: loadAchievements };
}
