import React from 'react';
import { Heart, Users, Award, Image as ImageIcon, Quote } from 'lucide-react';
import { NGOProfile } from '../../types/ngo';

interface ImpactDisplayProps {
  ngo: NGOProfile;
}

const ImpactDisplay: React.FC<ImpactDisplayProps> = ({ ngo }) => {
  const stats = ngo.stats;

  return (
    <section className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-logo-navy/10 space-y-6">
      <div className="flex items-center gap-2">
        <Heart className="w-5 h-5 text-vibrant-orange" />
        <h2 className="text-lg sm:text-xl font-modern-display text-logo-navy font-bold">
          Impact & Stories
        </h2>
      </div>

      {/* Metrics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-cream-white rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-logo-navy">
              {stats.peopleImpacted}
            </div>
            <div className="text-xs text-gray-600">People impacted</div>
          </div>
          <div className="bg-cream-white rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-logo-navy">
              {stats.totalProjects}
            </div>
            <div className="text-xs text-gray-600">Projects</div>
          </div>
          <div className="bg-cream-white rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-logo-navy">
              {stats.totalVolunteers}
            </div>
            <div className="text-xs text-gray-600">Volunteers</div>
          </div>
          <div className="bg-cream-white rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-logo-navy">
              {stats.totalEvents}
            </div>
            <div className="text-xs text-gray-600">Events</div>
          </div>
        </div>
      )}

      {/* Success Stories */}
      {ngo.successStories && ngo.successStories.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-logo-navy mb-2 flex items-center gap-2">
            <Award className="w-4 h-4 text-vibrant-orange" />
            Success Stories
          </h3>
          <div className="space-y-3">
            {ngo.successStories.map((story) => (
              <div key={story.id} className="p-3 rounded-lg bg-gray-50">
                <div className="text-sm font-semibold text-logo-navy">
                  {story.title}
                </div>
                <div className="text-xs text-gray-600">{story.summary}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Testimonials */}
      {ngo.testimonials && ngo.testimonials.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-logo-navy mb-2 flex items-center gap-2">
            <Quote className="w-4 h-4 text-vibrant-orange" />
            Volunteer Testimonials
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ngo.testimonials.map((t) => (
              <div key={t.id} className="p-3 rounded-lg bg-gradient-to-br from-cream-white to-white border border-gray-100">
                <p className="text-xs text-gray-700 mb-2">&ldquo;{t.message}&rdquo;</p>
                <div className="text-xxs text-gray-600 font-semibold">
                  {t.name}
                  {t.role && <span className="text-gray-400"> · {t.role}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gallery */}
      {ngo.gallery && ngo.gallery.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-logo-navy mb-2 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-vibrant-orange" />
            Photo Gallery
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {ngo.gallery.map((img) => (
              <div
                key={img.id}
                className="relative rounded-lg overflow-hidden bg-gray-100 aspect-video"
              >
                {/* Placeholder: actual image URL if provided */}
                {img.imageUrl ? (
                  <img
                    src={img.imageUrl}
                    alt={img.caption || 'Impact photo'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state if no extra content */}
      {!stats && !ngo.successStories && !ngo.testimonials && !ngo.gallery && (
        <div className="text-center text-xs text-gray-500">
          Impact metrics and stories will appear here once available.
        </div>
      )}
    </section>
  );
};

export default ImpactDisplay;


