export type GamificationAction =
  | 'project_joined'
  | 'project_completed'
  | 'event_organized'
  | 'event_attended'
  | 'profile_completed'
  | 'bonus';

export interface PointsResult {
  points: number;
  reason: string;
  category: 'volunteer' | 'organizer' | 'contributor' | 'leader';
}

export function calculatePoints(action: GamificationAction): PointsResult {
  switch (action) {
    case 'project_joined':
      return {
        points: 10,
        reason: 'Joined a project',
        category: 'volunteer',
      };
    case 'project_completed':
      return {
        points: 30,
        reason: 'Completed a project',
        category: 'volunteer',
      };
    case 'event_organized':
      return {
        points: 50,
        reason: 'Organized an event',
        category: 'organizer',
      };
    case 'event_attended':
      return {
        points: 5,
        reason: 'Attended an event',
        category: 'contributor',
      };
    case 'profile_completed':
      return {
        points: 15,
        reason: 'Completed profile',
        category: 'contributor',
      };
    case 'bonus':
    default:
      return {
        points: 5,
        reason: 'Bonus contribution',
        category: 'contributor',
      };
  }
}


