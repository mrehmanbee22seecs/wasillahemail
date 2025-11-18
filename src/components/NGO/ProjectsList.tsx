import React, { useMemo, useState } from 'react';
import { Calendar, Filter, Users } from 'lucide-react';
import { ProjectSubmission } from '../../types/submissions';

type ProjectFilterTab = 'active' | 'upcoming' | 'completed' | 'all';

interface ProjectsListProps {
  projects: ProjectSubmission[];
}

const ProjectsList: React.FC<ProjectsListProps> = ({ projects }) => {
  const [activeTab, setActiveTab] = useState<ProjectFilterTab>('active');

  const now = new Date();

  const categorized = useMemo(() => {
    const active: ProjectSubmission[] = [];
    const upcoming: ProjectSubmission[] = [];
    const completed: ProjectSubmission[] = [];

    projects.forEach((p) => {
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);

      if (p.status === 'completed' || end < now) {
        completed.push(p);
      } else if (start > now) {
        upcoming.push(p);
      } else {
        active.push(p);
      }
    });

    return { active, upcoming, completed };
  }, [projects, now]);

  const filtered = useMemo(() => {
    switch (activeTab) {
      case 'active':
        return categorized.active;
      case 'upcoming':
        return categorized.upcoming;
      case 'completed':
        return categorized.completed;
      case 'all':
      default:
        return projects;
    }
  }, [activeTab, categorized, projects]);

  return (
    <section className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-logo-navy/10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-vibrant-orange" />
          <h2 className="text-lg sm:text-xl font-modern-display text-logo-navy font-bold">
            Projects
          </h2>
        </div>
        <div className="inline-flex rounded-full bg-gray-100 p-1 text-xs sm:text-sm">
          {(['active', 'upcoming', 'completed', 'all'] as ProjectFilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-full capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-vibrant-orange text-white'
                  : 'text-gray-700 hover:bg-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-600 text-sm">
          No projects in this category yet.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((project) => (
            <div
              key={project.id}
              className="p-4 border border-gray-200 rounded-xl hover:border-vibrant-orange/60 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="flex-1">
                  <h3 className="font-semibold text-logo-navy text-sm sm:text-base">
                    {project.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                    {project.description}
                  </p>
                </div>
                {project.category && (
                  <span className="px-2 py-0.5 rounded-full bg-logo-teal/10 text-logo-teal text-xxs sm:text-xs font-medium">
                    {project.category}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-xxs sm:text-xs text-gray-500">
                <div className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {project.startDate} – {project.endDate}
                  </span>
                </div>
                <div className="inline-flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>
                    {project.participantIds?.length || 0} volunteers ·{' '}
                    {project.peopleImpacted || 0} people impacted
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default ProjectsList;


