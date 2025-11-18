import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../types/user';
import { ProjectSubmission, EventSubmission } from '../types/submissions';
import { NGOProfile, NGOProfileStats } from '../types/ngo';
import ProfileHeader from '../components/NGO/ProfileHeader';
import ProjectsList from '../components/NGO/ProjectsList';
import ImpactDisplay from '../components/NGO/ImpactDisplay';
import { Calendar } from 'lucide-react';

const buildNGOProfile = (
  user: UserProfile,
  projects: ProjectSubmission[],
  events: EventSubmission[]
): NGOProfile => {
  const ngoInfo = user.ngoInfo || {};

  const stats: NGOProfileStats = {
    totalProjects: projects.length,
    activeProjects: projects.filter((p) => p.status === 'approved' && p.isVisible).length,
    completedProjects: projects.filter((p) => p.status === 'completed').length,
    upcomingProjects: projects.filter((p) => new Date(p.startDate) > new Date()).length,
    totalEvents: events.length,
    upcomingEvents: events.filter((e) => new Date(e.date) > new Date()).length,
    pastEvents: events.filter((e) => new Date(e.date) <= new Date()).length,
    totalVolunteers: Array.from(
      new Set([
        ...projects.flatMap((p) => p.participantIds || []),
        ...events.flatMap((e) => e.attendeeIds || []),
      ])
    ).length,
    peopleImpacted: [...projects, ...events].reduce(
      (sum, item) => sum + ((item as any).peopleImpacted || 0),
      0
    ),
  };

  return {
    id: user.uid,
    organizationName: ngoInfo.organizationName || user.displayName || 'NGO',
    mission: user.bio,
    overview: undefined,
    logoUrl: user.photoURL || undefined,
    verified: !!ngoInfo.verified,
    contactEmail: user.email || '',
    contactPhone: user.phoneNumber || undefined,
    city: user.city,
    province: user.province,
    country: user.country,
    website: user.socialLinks?.website,
    social: {
      facebook: user.socialLinks?.facebook,
      instagram: user.socialLinks?.instagram,
      twitter: user.socialLinks?.twitter,
      linkedin: user.socialLinks?.linkedin,
    },
    stats,
  };
};

const NGOPersonal: React.FC = () => {
  const { ngoId } = useParams<{ ngoId: string }>();
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();

  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<ProjectSubmission[]>([]);
  const [events, setEvents] = useState<EventSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const effectiveUid = ngoId || currentUser?.uid || null;

  useEffect(() => {
    const loadProfile = async () => {
      if (!effectiveUid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // If viewing own profile and userData is available, use that
        let user: UserProfile | null = null;
        if (userData && userData.uid === effectiveUid) {
          user = userData as UserProfile;
        } else {
          // Lazy import to avoid circular imports
          const { doc, getDoc } = await import('firebase/firestore');
          const { db: firestoreDb } = await import('../config/firebase');
          const snap = await getDoc(doc(firestoreDb, 'users', effectiveUid));
          if (snap.exists()) {
            user = snap.data() as UserProfile;
          }
        }

        if (!user || user.role !== 'ngo') {
          setProfileUser(null);
          setLoading(false);
          return;
        }

        setProfileUser(user);

        // Fetch NGO's projects
        const projectsQuery = query(
          collection(db, 'project_submissions'),
          where('submittedBy', '==', effectiveUid),
          orderBy('submittedAt', 'desc')
        );
        const projectsSnap = await getDocs(projectsQuery);
        const proj: ProjectSubmission[] = [];
        projectsSnap.forEach((d) => {
          proj.push({ id: d.id, ...d.data() } as ProjectSubmission);
        });
        setProjects(proj);

        // Fetch NGO's events
        const eventsQuery = query(
          collection(db, 'event_submissions'),
          where('submittedBy', '==', effectiveUid),
          orderBy('submittedAt', 'desc')
        );
        const eventsSnap = await getDocs(eventsQuery);
        const ev: EventSubmission[] = [];
        eventsSnap.forEach((d) => {
          ev.push({ id: d.id, ...d.data() } as EventSubmission);
        });
        setEvents(ev);
      } catch (err) {
        console.error('Error loading NGO profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [effectiveUid, userData]);

  const ngoProfile = useMemo(() => {
    if (!profileUser) return null;
    return buildNGOProfile(profileUser, projects, events);
  }, [profileUser, projects, events]);

  if (!effectiveUid) {
    return (
      <div className="min-h-screen bg-cream-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-logo-navy font-semibold text-sm">
            Please sign in as an NGO to view your profile page.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vibrant-orange mx-auto mb-4"></div>
          <p className="text-xl font-luxury-heading text-black">Loading NGO profile...</p>
        </div>
      </div>
    );
  }

  if (!ngoProfile) {
    return (
      <div className="min-h-screen bg-cream-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-logo-navy font-semibold text-sm">
            NGO profile not found or not accessible.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-white pt-24 pb-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <ProfileHeader ngo={ngoProfile} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ProjectsList projects={projects} />

            {/* Events block */}
            <section className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-logo-navy/10">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-vibrant-orange" />
                <h2 className="text-lg sm:text-xl font-modern-display text-logo-navy font-bold">
                  Events
                </h2>
              </div>
              {events.length === 0 ? (
                <div className="text-center text-xs text-gray-500 py-6">
                  No events published yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="p-4 border border-gray-200 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                    >
                      <div>
                        <div className="text-sm font-semibold text-logo-navy">
                          {event.title}
                        </div>
                        <div className="text-xs text-gray-600">
                          {event.date} · {event.time} · {event.location}
                        </div>
                      </div>
                      <div className="text-xxs text-gray-500">
                        {(event.attendeeIds?.length || 0)} attendees ·{' '}
                        {event.peopleImpacted || 0} people impacted
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <ImpactDisplay ngo={ngoProfile} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NGOPersonal;


