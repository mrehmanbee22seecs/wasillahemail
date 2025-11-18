import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { calculatePoints, GamificationAction } from '../utils/pointsCalculator';
import { sendAchievementNotification } from '../utils/notificationHelpers';

export interface PointsEntry {
  id: string;
  userId: string;
  action: GamificationAction;
  points: number;
  reason: string;
  category: string;
  createdAt: any;
  meta?: Record<string, any>;
}

export interface UserPointsStats {
  userId: string;
  displayName: string;
  role: string;
  totalPoints: number;
  monthlyPoints: number;
  badgesCount: number;
  achievementsCount: number;
}

export interface Badge {
  id: string;
  userId: string;
  type: 'volunteer' | 'organizer' | 'contributor' | 'leader';
  name: string;
  description: string;
  icon: string;
  earnedAt: any;
}

export interface Achievement {
  id: string;
  userId: string;
  key: string;
  name: string;
  description: string;
  earnedAt: any;
}

const POINTS_COLLECTION = 'user_points';
const STATS_COLLECTION = 'user_points_stats';
const BADGES_COLLECTION = 'user_badges';
const ACHIEVEMENTS_COLLECTION = 'user_achievements';

export async function awardPoints(options: {
  userId: string;
  displayName: string;
  role: string;
  action: GamificationAction;
  meta?: Record<string, any>;
}): Promise<void> {
  const { userId, displayName, role, action, meta } = options;
  const result = calculatePoints(action);

  // 1) Add to points history
  await addDoc(collection(db, POINTS_COLLECTION), {
    userId,
    action,
    points: result.points,
    reason: result.reason,
    category: result.category,
    meta: meta || {},
    createdAt: serverTimestamp(),
  });

  // 2) Update aggregate stats doc
  const statsRef = doc(db, STATS_COLLECTION, userId);
  const statsSnap = await getDoc(statsRef);
  if (!statsSnap.exists()) {
    await updateDoc(statsRef, {
      userId,
      displayName,
      role,
      totalPoints: result.points,
      monthlyPoints: result.points,
      badgesCount: 0,
      achievementsCount: 0,
      updatedAt: serverTimestamp(),
    }).catch(async () => {
      await addDoc(collection(db, STATS_COLLECTION), {
        userId,
        displayName,
        role,
        totalPoints: result.points,
        monthlyPoints: result.points,
        badgesCount: 0,
        achievementsCount: 0,
        updatedAt: serverTimestamp(),
      });
    });
  } else {
    const data = statsSnap.data() as any;
    await updateDoc(statsRef, {
      totalPoints: (data.totalPoints || 0) + result.points,
      monthlyPoints: (data.monthlyPoints || 0) + result.points,
      displayName,
      role,
      updatedAt: serverTimestamp(),
    });
  }

  // 3) Check for simple achievements (example threshold-based)
  if (action === 'project_completed') {
    await maybeAwardAchievement(userId, displayName, 'first_project', {
      name: 'First Project Completed',
      description: 'Congratulations on completing your first project!',
    });
  }
}

export function subscribeToUserPoints(
  userId: string,
  cb: (entries: PointsEntry[]) => void
): () => void {
  const q = query(
    collection(db, POINTS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const list: PointsEntry[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...(d.data() as any) });
    });
    cb(list);
  });
}

export function subscribeToUserStats(
  userId: string,
  cb: (stats: UserPointsStats | null) => void
): () => void {
  const statsRef = doc(db, STATS_COLLECTION, userId);
  return onSnapshot(statsRef, (snap) => {
    if (!snap.exists()) {
      cb(null);
      return;
    }
    cb(snap.data() as UserPointsStats);
  });
}

export function subscribeToLeaderboard(
  scope: 'global' | 'monthly' | 'role',
  roleFilter: string | null,
  cb: (rows: UserPointsStats[]) => void
): () => void {
  const statsCol = collection(db, STATS_COLLECTION);
  let q;
  if (scope === 'monthly') {
    q = query(statsCol, orderBy('monthlyPoints', 'desc'));
  } else if (scope === 'role' && roleFilter) {
    q = query(
      statsCol,
      where('role', '==', roleFilter),
      orderBy('totalPoints', 'desc')
    );
  } else {
    q = query(statsCol, orderBy('totalPoints', 'desc'));
  }
  return onSnapshot(q, (snap) => {
    const list: UserPointsStats[] = [];
    snap.forEach((d) => list.push(d.data() as UserPointsStats));
    cb(list);
  });
}

export function subscribeToBadges(
  userId: string,
  cb: (badges: Badge[]) => void
): () => void {
  const q = query(
    collection(db, BADGES_COLLECTION),
    where('userId', '==', userId),
    orderBy('earnedAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const list: Badge[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
    cb(list);
  });
}

export function subscribeToAchievements(
  userId: string,
  cb: (achievements: Achievement[]) => void
): () => void {
  const q = query(
    collection(db, ACHIEVEMENTS_COLLECTION),
    where('userId', '==', userId),
    orderBy('earnedAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const list: Achievement[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
    cb(list);
  });
}

async function maybeAwardAchievement(
  userId: string,
  displayName: string,
  key: string,
  meta: { name: string; description: string }
): Promise<void> {
  const existingRef = doc(db, `${ACHIEVEMENTS_COLLECTION}/${userId}_${key}`);
  const snap = await getDoc(existingRef);
  if (snap.exists()) return;

  await updateDoc(existingRef, {
    userId,
    key,
    name: meta.name,
    description: meta.description,
    earnedAt: serverTimestamp(),
  }).catch(async () => {
    await addDoc(collection(db, ACHIEVEMENTS_COLLECTION), {
      userId,
      key,
      name: meta.name,
      description: meta.description,
      earnedAt: serverTimestamp(),
    });
  });

  // Notify user about new achievement
  await sendAchievementNotification({
    achievementId: `${userId}_${key}`,
    achievementName: meta.name,
    description: meta.description,
    userId,
  });
}


