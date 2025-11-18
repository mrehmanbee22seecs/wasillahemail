import React from 'react';
import { MatchingFactors } from '../../utils/matchingAlgorithm';

interface MatchScoreProps {
  factors: MatchingFactors;
}

const MatchScore: React.FC<MatchScoreProps> = ({ factors }) => {
  const { totalScore, skillsScore, interestsScore, locationScore, availabilityScore, experienceScore } = factors;

  const sections = [
    { label: 'Skills', value: skillsScore },
    { label: 'Interests', value: interestsScore },
    { label: 'Location', value: locationScore },
    { label: 'Availability', value: availabilityScore },
    { label: 'Experience', value: experienceScore },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-logo-navy">Match score</span>
        <span className="text-sm font-bold text-vibrant-orange">{totalScore}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-1.5 rounded-full bg-gradient-to-r from-vibrant-orange to-logo-teal transition-all"
          style={{ width: `${totalScore}%` }}
        />
      </div>
      <div className="grid grid-cols-2 gap-1 mt-1">
        {sections.map((s) => (
          <div key={s.label} className="flex items-center justify-between text-[10px] text-gray-600">
            <span>{s.label}</span>
            <span>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchScore;


