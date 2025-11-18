import { useEffect, useState, useCallback } from 'react';
import { ProjectSubmission } from '../types/submissions';
import { useAuth } from '../contexts/AuthContext';
import { MatchResult } from '../utils/matchingAlgorithm';
import { getOrComputeMatches, getDailyRecommendations, getWeeklyDigest } from '../services/matchingService';

interface UseMatchingReturn {
  matches: MatchResult[];
  daily: MatchResult[];
  weekly: MatchResult[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useMatching(projects: ProjectSubmission[]): UseMatchingReturn {
  const { userData } = useAuth();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [daily, setDaily] = useState<MatchResult[]>([]);
  const [weekly, setWeekly] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userData || userData.role === 'ngo' || !projects.length) {
      setMatches([]);
      setDaily([]);
      setWeekly([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const typedUser = userData as any;
      const [allMatches, dailyRecs, weeklyDigest] = await Promise.all([
        getOrComputeMatches(typedUser, projects),
        getDailyRecommendations(typedUser, projects),
        getWeeklyDigest(typedUser, projects),
      ]);
      setMatches(allMatches);
      setDaily(dailyRecs);
      setWeekly(weeklyDigest);
    } catch (err: any) {
      console.error('Error loading matches:', err);
      setError(err?.message || 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  }, [userData, projects]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    matches,
    daily,
    weekly,
    loading,
    error,
    refresh: load,
  };
}


