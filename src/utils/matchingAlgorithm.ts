import { ProjectSubmission } from '../types/submissions';
import { UserProfile } from '../types/user';

export interface MatchingFactors {
  skillsScore: number;
  interestsScore: number;
  locationScore: number;
  availabilityScore: number;
  experienceScore: number;
  totalScore: number;
  reasons: string[];
  improvementSuggestions: string[];
}

export interface MatchResult {
  project: ProjectSubmission;
  factors: MatchingFactors;
}

interface MatchingOptions {
  userProfile: UserProfile;
}

export function calculateMatch(
  project: ProjectSubmission,
  { userProfile }: MatchingOptions
): MatchResult {
  const reasons: string[] = [];
  const suggestions: string[] = [];

  const userLocation =
    userProfile.location || userProfile.city || userProfile.province || userProfile.country || '';
  const userSkills = userProfile.skills || [];
  const userInterests = userProfile.interests || [];

  // Location (0–25)
  let locationScore = 0;
  if (userLocation && project.location) {
    const u = userLocation.toLowerCase();
    const p = project.location.toLowerCase();
    if (u === p) {
      locationScore = 25;
      reasons.push('Same city/location');
    } else if (p.includes(u) || u.includes(p)) {
      locationScore = 15;
      reasons.push('Nearby location');
    } else {
      suggestions.push('Look for projects closer to your city for higher match.');
    }
  }

  // Skills (0–35)
  const projectSkills = [
    ...(project.requiredSkills || []),
    ...(project.preferredSkills || []),
    ...(project.skillRequirements || []),
  ];
  let skillsScore = 0;
  if (projectSkills.length && userSkills.length) {
    const matchingSkills = projectSkills.filter((s) =>
      userSkills.some((u) => u.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(u.toLowerCase()))
    );
    const ratio = matchingSkills.length / projectSkills.length;
    skillsScore = Math.min(35, Math.round(ratio * 35));
    if (matchingSkills.length) {
      reasons.push(`${matchingSkills.length} skill${matchingSkills.length > 1 ? 's' : ''} match`);
    } else {
      suggestions.push('Add more skills to your profile to improve skill-based matches.');
    }
  }

  // Interests / category (0–20)
  let interestsScore = 0;
  if (userInterests.length && project.category) {
    const category = project.category.toLowerCase();
    const interestMatch = userInterests.some(
      (i) => i.toLowerCase().includes(category) || category.includes(i.toLowerCase())
    );
    if (interestMatch) {
      interestsScore = 20;
      reasons.push('Matches your interests/causes');
    } else {
      suggestions.push('Add or update your causes and interests for better topic alignment.');
    }
  }

  // Availability (0–10)
  let availabilityScore = 0;
  if (userProfile.availability && project.startDate && project.endDate) {
    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    const userStart = userProfile.availability.startDate
      ? new Date(userProfile.availability.startDate)
      : null;
    const userEnd = userProfile.availability.endDate
      ? new Date(userProfile.availability.endDate)
      : null;

    if (!userStart || !userEnd || (start >= userStart && end <= userEnd)) {
      availabilityScore = 10;
      reasons.push('Fits your availability window');
    } else {
      suggestions.push('Adjust your availability dates to better match project timelines.');
    }
  }

  // Experience (0–10) – heuristic: number of past activities/projects
  let experienceScore = 0;
  const activityCount = (userProfile.activityLog || []).length;
  if (activityCount > 0) {
    if (activityCount >= 20) {
      experienceScore = 10;
      reasons.push('Strong volunteering experience');
    } else if (activityCount >= 5) {
      experienceScore = 7;
      reasons.push('Some prior volunteering experience');
    } else {
      experienceScore = 4;
      reasons.push('Getting started with volunteering');
    }
  } else {
    suggestions.push('Participate in a few projects to build your volunteering experience.');
  }

  const totalScore = Math.min(
    100,
    locationScore + skillsScore + interestsScore + availabilityScore + experienceScore
  );

  if (!reasons.length) {
    reasons.push('General recommendation based on available data.');
  }

  return {
    project,
    factors: {
      skillsScore,
      interestsScore,
      locationScore,
      availabilityScore,
      experienceScore,
      totalScore,
      reasons,
      improvementSuggestions: suggestions,
    },
  };
}

export function sortMatches(matches: MatchResult[]): MatchResult[] {
  return [...matches].sort((a, b) => b.factors.totalScore - a.factors.totalScore);
}


