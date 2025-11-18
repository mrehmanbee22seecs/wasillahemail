import { collection, doc, getDoc, getDocs, query, setDoc, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ProjectSubmission } from '../types/submissions';
import { UserProfile } from '../types/user';
import { calculateMatch, sortMatches, MatchResult } from '../utils/matchingAlgorithm';

export interface MatchingCacheEntry {
  id: string;
  userId: string;
  projectId: string;
  totalScore: number;
  factors: Omit<MatchResult['factors'], 'totalScore'>;
  createdAt: any;
}

const CACHE_COLLECTION = 'matching_cache';
const CACHE_TTL_HOURS = 24;

function isCacheFresh(createdAt: any): boolean {
  if (!createdAt) return false;
  const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
  const ageMs = Date.now() - date.getTime();
  return ageMs < CACHE_TTL_HOURS * 60 * 60 * 1000;
}

export async function getCachedMatches(userId: string): Promise<MatchingCacheEntry[]> {
  const q = query(
    collection(db, CACHE_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  const entries: MatchingCacheEntry[] = [];
  snapshot.forEach((d) => {
    entries.push({ id: d.id, ...(d.data() as any) });
  });
  return entries;
}

export async function saveMatchesToCache(userId: string, matches: MatchResult[]): Promise<void> {
  const batch = matches.slice(0, 20); // Limit writes
  await Promise.all(
    batch.map(async (m) => {
      const ref = doc(collection(db, CACHE_COLLECTION));
      await setDoc(ref, {
        userId,
        projectId: m.project.id,
        totalScore: m.factors.totalScore,
        factors: {
          skillsScore: m.factors.skillsScore,
          interestsScore: m.factors.interestsScore,
          locationScore: m.factors.locationScore,
          availabilityScore: m.factors.availabilityScore,
          experienceScore: m.factors.experienceScore,
          reasons: m.factors.reasons,
          improvementSuggestions: m.factors.improvementSuggestions,
        },
        createdAt: serverTimestamp(),
      });
    })
  );
}

export async function getOrComputeMatches(
  user: UserProfile,
  projects: ProjectSubmission[]
): Promise<MatchResult[]> {
  if (!user.uid || !projects.length) return [];

  // Try to use fresh cache first
  const cached = await getCachedMatches(user.uid);
  if (cached.length && isCacheFresh(cached[0].createdAt)) {
    // Map back into MatchResult form
    const byId = new Map(projects.map((p) => [p.id, p]));
    const matches: MatchResult[] = cached
      .map((c) => {
        const project = byId.get(c.projectId);
        if (!project) return null;
        return {
          project,
          factors: {
            ...c.factors,
            totalScore: c.totalScore,
          },
        } as MatchResult;
      })
      .filter(Boolean) as MatchResult[];
    return sortMatches(matches);
  }

  // Compute fresh matches on client
  const matches = sortMatches(
    projects.map((p) => calculateMatch(p, { userProfile: user }))
  );

  // Save a small subset to cache (best-effort, don’t block user)
  saveMatchesToCache(user.uid, matches).catch((e) =>
    console.warn('Failed to save matching cache:', e)
  );

  return matches;
}

export async function getDailyRecommendations(
  user: UserProfile,
  projects: ProjectSubmission[],
  limit = 5
): Promise<MatchResult[]> {
  const matches = await getOrComputeMatches(user, projects);
  return matches.slice(0, limit);
}

export async function getWeeklyDigest(
  user: UserProfile,
  projects: ProjectSubmission[],
  limit = 10
): Promise<MatchResult[]> {
  const matches = await getOrComputeMatches(user, projects);
  return matches.slice(0, limit);
}


