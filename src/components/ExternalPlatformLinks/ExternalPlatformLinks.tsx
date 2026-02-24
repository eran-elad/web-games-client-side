import type { ExternalLink } from '../../services/gameApi';
import './ExternalPlatformLinks.css';

type PlatformId = 'spotify' | 'appleMusic' | 'youtube' | 'wiki';

const PLATFORM_ICON_FILES: Record<PlatformId, string> = {
  spotify: '/platform_icons/spotify-icon.svg',
  appleMusic: '/platform_icons/apple-music-icon.svg',
  youtube: '/platform_icons/youtube-icon.svg',
  wiki: '/platform_icons/wiki-icon.svg',
};

const KNOWN_PLATFORMS: Record<string, { label: string; type: PlatformId }> = {
  spotify: { label: 'Spotify', type: 'spotify' },
  applemusic: { label: 'Apple Music', type: 'appleMusic' },
  youtube: { label: 'YouTube', type: 'youtube' },
  wiki: { label: 'Wiki', type: 'wiki' },
};

const ICON_SIZE = 26;
const GENERIC_ICON = '/platform_icons/generic-link-icon.svg';

function buildUrlWithSessionId(url: string, sessionId?: string): string {
  if (!sessionId) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}session_id=${encodeURIComponent(sessionId)}`;
}

function humanizePlatformId(platformId: string): string {
  return platformId
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

export interface ExternalPlatformLinksProps {
  links: ExternalLink[];
  sessionId?: string;
}

export default function ExternalPlatformLinks({ links, sessionId }: ExternalPlatformLinksProps) {
  if (!links?.length) return null;

  return (
    <div className="external-platform-links" role="list">
      <div className="external-platform-links-list" role="list">
        {links.map((link, index) => {
          const key = `${link.platform_id}-${index}`;
          const normalizedId = link.platform_id.toLowerCase().replace(/\s/g, '');
          const known = KNOWN_PLATFORMS[normalizedId];
          const isKnown = !!known;
          const label = known ? known.label : humanizePlatformId(link.platform_id);
          const href = buildUrlWithSessionId(link.url, sessionId);

          return (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`external-platform-link ${isKnown ? 'external-platform-link--known' : 'external-platform-link--generic'}`}
              role="listitem"
              title={label}
              aria-label={label}
            >
              <span className="external-platform-link-icon" aria-hidden>
                <img
                  src={isKnown ? PLATFORM_ICON_FILES[known.type] : GENERIC_ICON}
                  alt=""
                  width={ICON_SIZE}
                  height={ICON_SIZE}
                  className="external-platform-link-img"
                />
              </span>
              {!isKnown && <span className="external-platform-link-label">{label}</span>}
            </a>
          );
        })}
      </div>
    </div>
  );
}
