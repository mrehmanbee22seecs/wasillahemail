import { UserProfile } from './user';
import { ProjectSubmission, EventSubmission } from './submissions';

export interface NGOProfileStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  upcomingProjects: number;
  totalEvents: number;
  upcomingEvents: number;
  pastEvents: number;
  totalVolunteers: number;
  peopleImpacted: number;
}

export interface NGOProfile {
  id: string; // maps to users/{uid}
  organizationName: string;
  mission?: string;
  overview?: string;
  logoUrl?: string;
  verified: boolean;
  contactEmail: string;
  contactPhone?: string;
  city?: string;
  province?: string;
  country?: string;
  website?: string;
  social?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  };
  // Derived stats (not stored directly in Firestore)
  stats?: NGOProfileStats;
  // Optional rich content
  successStories?: Array<{
    id: string;
    title: string;
    summary: string;
    date?: any;
  }>;
  testimonials?: Array<{
    id: string;
    name: string;
    role?: string;
    message: string;
  }>;
  gallery?: Array<{
    id: string;
    imageUrl: string;
    caption?: string;
  }>;
}

export interface NGOProfileDataSource {
  user: UserProfile;
  projects: ProjectSubmission[];
  events: EventSubmission[];
}


