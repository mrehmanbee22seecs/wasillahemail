import React from 'react';
import { Building2, MapPin, Globe2, Mail, Phone, Link as LinkIcon } from 'lucide-react';
import VerifiedBadge from '../VerifiedBadge';
import { NGOProfile } from '../../types/ngo';

interface ProfileHeaderProps {
  ngo: NGOProfile;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ ngo }) => {
  const locationParts = [ngo.city, ngo.province, ngo.country].filter(Boolean);
  const location = locationParts.join(', ');

  return (
    <section className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-logo-navy/10 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-gradient-to-r from-vibrant-orange to-logo-teal" />
      <div className="relative flex flex-col md:flex-row gap-6 md:gap-8">
        {/* Logo / Icon */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-logo-navy flex items-center justify-center shadow-lg">
            <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-cream-elegant" />
          </div>
        </div>

        {/* Main Info */}
        <div className="flex-1 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-modern-display text-logo-navy font-bold">
                {ngo.organizationName}
              </h1>
              {location && (
                <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>{location}</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <VerifiedBadge verified={ngo.verified} />
            </div>
          </div>

          {ngo.mission && (
            <p className="text-sm sm:text-base text-gray-700 font-elegant-body">
              {ngo.mission}
            </p>
          )}
          {ngo.overview && (
            <p className="text-sm text-gray-600">
              {ngo.overview}
            </p>
          )}

          {/* Contact & Social */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100 mt-2">
            {ngo.contactEmail && (
              <a
                href={`mailto:${ngo.contactEmail}`}
                className="inline-flex items-center gap-2 text-sm text-logo-navy hover:text-vibrant-orange transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>{ngo.contactEmail}</span>
              </a>
            )}
            {ngo.contactPhone && (
              <a
                href={`tel:${ngo.contactPhone}`}
                className="inline-flex items-center gap-2 text-sm text-logo-navy hover:text-vibrant-orange transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>{ngo.contactPhone}</span>
              </a>
            )}
            {ngo.website && (
              <a
                href={ngo.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-logo-navy hover:text-vibrant-orange transition-colors"
              >
                <Globe2 className="w-4 h-4" />
                <span>Website</span>
              </a>
            )}
            {ngo.social?.facebook && (
              <a
                href={ngo.social.facebook}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-logo-navy hover:text-vibrant-orange"
              >
                <LinkIcon className="w-3 h-3" />
                <span>Facebook</span>
              </a>
            )}
            {ngo.social?.instagram && (
              <a
                href={ngo.social.instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-logo-navy hover:text-vibrant-orange"
              >
                <LinkIcon className="w-3 h-3" />
                <span>Instagram</span>
              </a>
            )}
            {ngo.social?.linkedin && (
              <a
                href={ngo.social.linkedin}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-logo-navy hover:text-vibrant-orange"
              >
                <LinkIcon className="w-3 h-3" />
                <span>LinkedIn</span>
              </a>
            )}
            {ngo.social?.twitter && (
              <a
                href={ngo.social.twitter}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-logo-navy hover:text-vibrant-orange"
              >
                <LinkIcon className="w-3 h-3" />
                <span>Twitter</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfileHeader;


