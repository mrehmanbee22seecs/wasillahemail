import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../types/user';
import { ProjectSubmission, EventSubmission } from '../types/submissions';
import FollowButton from '../components/Social/FollowButton';
import ShareButton from '../components/Social/ShareButton';
import Likes from '../components/Social/Likes';
import Comments from '../components/Social/Comments';
import ImpactDashboard from '../components/Gamification/ImpactDashboard';

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { currentUser, userData } = useAuth();

  const effectiveUid = userId || currentUser?.uid || null;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<ProjectSubmission[]>([]);
  const [events, setEvents] = useState<EventSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!effectiveUid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        let user: UserProfile | null = null;
        if (userData && userData.uid === effectiveUid) {
          user = userData as UserProfile;
        } else {
          const snap = await getDoc(doc(db, 'users', effectiveUid));
          if (snap.exists()) {
            user = snap.data() as UserProfile;
          }
        }

        if (!user) {
          setProfile(null);
          setProjects([]);
          setEvents([]);
          return;
        }

        setProfile(user);

        // Simple activity: projects submitted by user
        const projectsQuery = query(
          collection(db, 'project_submissions'),
          where('submittedBy', '==', effectiveUid)
        );
        const projSnap = await getDocs(projectsQuery);
        const proj: ProjectSubmission[] = [];
        projSnap.forEach((d) => {
          proj.push({ id: d.id, ...(d.data() as any) } as ProjectSubmission);
        });
        setProjects(proj);

        // Events submitted by user
        const eventsQuery = query(
          collection(db, 'event_submissions'),
          where('submittedBy', '==', effectiveUid)
        );
        const eventsSnap = await getDocs(eventsQuery);
        const ev: EventSubmission[] = [];
        eventsSnap.forEach((d) => {
          ev.push({ id: d.id, ...(d.data() as any) } as EventSubmission);
        });
        setEvents(ev);
      } catch (err) {
        console.error('Error loading user profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [effectiveUid, userData]);

  const stats = useMemo(() => {
    if (!profile) return null;
    return {
      projectsJoined: (profile as any).projectsJoined || 0,
      projectsCompleted: (profile as any).projectsCompleted || 0,
      eventsAttended: (profile as any).eventsAttended || 0,
      hoursVolunteered: (profile as any).hoursVolunteered || 0,
    };
  }, [profile]);

  if (!effectiveUid) {
    return (
      <div className="min-h-screen bg-cream-white flex items-center justify-center">
        <p className="text-logo-navy text-sm font-semibold">
          Please sign in to view profiles.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vibrant-orange mx-auto mb-4" />
          <p className="text-xl font-luxury-heading text-black">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-cream-white flex items-center justify-center">
        <p className="text-logo-navy text-sm font-semibold">
          User profile not found or not accessible.
        </p>
      </div>
    );
  }

  const isOwnProfile = !!currentUser && currentUser.uid === effectiveUid;

  return (
    <div className="min-h-screen bg-cream-white pt-24 pb-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <section className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-logo-navy/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-cream-elegant border border-vibrant-orange/40 overflow-hidden flex items-center justify-center text-2xl font-bold text-logo-navy">
              {profile.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile.displayName || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                (profile.displayName || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-modern-display text-logo-navy font-bold">
                {profile.displayName || 'Community Member'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">
                {profile.role ? profile.role.toUpperCase() : 'VOLUNTEER'}
              </p>
              {profile.city && (
                <p className="text-xs text-gray-500">
                  {profile.city}
                  {profile.province ? `, ${profile.province}` : ''}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 justify-end">
            <Likes targetType="user" targetId={effectiveUid} />
            <ShareButton variant="button" />
            <FollowButton targetUserId={effectiveUid} />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Bio & Details */}
            <section className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-logo-navy/10 space-y-4">
              <h2 className="text-lg sm:text-xl font-modern-display text-logo-navy font-bold">
                About
              </h2>
              <p className="text-sm text-gray-700">
                {profile.bio || 'This user has not added a bio yet.'}
              </p>

              {Array.isArray(profile.interests) && profile.interests.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-700 mb-1">Causes & Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((i) => (
                      <span
                        key={i}
                        className="px-2 py-1 text-[11px] rounded-full bg-vibrant-orange/10 text-vibrant-orange-dark"
                      >
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Activity */}
            <section className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-logo-navy/10 space-y-4">
              <h2 className="text-lg sm:text-xl font-modern-display text-logo-navy font-bold">
                Recent Projects & Events
              </h2>

              {projects.length === 0 && events.length === 0 ? (
                <p className="text-xs text-gray-500">
                  No public activity yet.
                </p>
              ) : (
                <div className="space-y-3 text-sm">
                  {projects.slice(0, 3).map((p) => (
                    <div key={p.id} className="border border-gray-200 rounded-xl p-3">
                      <div className="text-logo-navy font-semibold text-sm">{p.title}</div>
                      <div className="text-[11px] text-gray-500">Project</div>
                    </div>
                  ))}
                  {events.slice(0, 3).map((e) => (
                    <div key={e.id} className="border border-gray-200 rounded-xl p-3">
                      <div className="text-logo-navy font-semibold text-sm">{e.title}</div>
                      <div className="text-[11px] text-gray-500">Event</div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Comments on profile */}
            <section className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-logo-navy/10">
              <Comments targetType="user" targetId={effectiveUid} />
            </section>
          </div>

          <div className="space-y-6">
            {/* Stats & impact */}
            {stats && (
              <section className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-logo-navy/10">
                <h2 className="text-lg sm:text-xl font-modern-display text-logo-navy font-bold mb-4">
                  Impact Summary
                </h2>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-gray-500">Projects Joined</div>
                    <div className="text-logo-navy font-bold text-lg">{stats.projectsJoined}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Projects Completed</div>
                    <div className="text-logo-navy font-bold text-lg">
                      {stats.projectsCompleted}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Events Attended</div>
                    <div className="text-logo-navy font-bold text-lg">
                      {stats.eventsAttended}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Hours Volunteered</div>
                    <div className="text-logo-navy font-bold text-lg">
                      {stats.hoursVolunteered}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Gamified impact */}
            {effectiveUid && (
              <section className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 border border-logo-navy/10">
                <ImpactDashboard userId={effectiveUid} />
              </section>
            )}

            {isOwnProfile && (
              <p className="text-[11px] text-gray-400 text-center">
                This is your public profile. Update your details from your dashboard to customize
                how others see you.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;


