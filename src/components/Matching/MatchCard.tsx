import React from 'react';
import { MatchResult } from '../../utils/matchingAlgorithm';
import ProjectCard from '../ProjectCard';
import MatchScore from './MatchScore';

interface MatchCardProps {
  match: MatchResult;
}

const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const { project, factors } = match;

  return (
    <div className="space-y-3">
      <ProjectCard
        project={{ ...project, matchScore: factors.totalScore as any }}
        matchScore={factors.totalScore}
        showMatchScore={true}
      />
      <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
        <MatchScore factors={factors} />
        <div className="mt-2 space-y-1">
          <p className="text-[11px] text-gray-700 font-semibold">
            Why this matches you:
          </p>
          <ul className="text-[11px] text-gray-600 list-disc list-inside space-y-0.5">
            {factors.reasons.slice(0, 3).map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
          {factors.improvementSuggestions.length > 0 && (
            <>
              <p className="text-[11px] text-gray-700 font-semibold mt-1">
                Improve your matches:
              </p>
              <ul className="text-[11px] text-gray-600 list-disc list-inside space-y-0.5">
                {factors.improvementSuggestions.slice(0, 2).map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchCard;


