import type { ExternalLink } from '../../services/gameApi';
import './ExternalPlatformLinks.css';

type PlatformId = 'spotify' | 'appleMusic' | 'youtube' | 'wiki';

const KNOWN_PLATFORMS: Record<string, { label: string; type: PlatformId }> = {
  spotify: { label: 'Spotify', type: 'spotify' },
  applemusic: { label: 'Apple Music', type: 'appleMusic' },
  youtube: { label: 'YouTube', type: 'youtube' },
  wiki: { label: 'Wiki', type: 'wiki' },
};

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

function SpotifyIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function AppleMusicIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      {/* Double eighth note (Apple Music style) */}
      <path d="M12 3v10.55c-.94-.54-2.1-.75-3.33-.32-1.34.48-2.37 1.67-2.37 3.07 0 1.74 1.27 3.15 2.83 3.15.96 0 1.83-.4 2.45-1.03V14h2V3h-2zm0 12.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
      <path d="M17 3v8.55c-.94-.54-2.1-.75-3.33-.32-1.34.48-2.37 1.67-2.37 3.07 0 1.74 1.27 3.15 2.83 3.15.96 0 1.83-.4 2.45-1.03V3h-2zm0 12.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
    </svg>
  );
}

function YouTubeIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function WikiIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      {/* Wikipedia W letterform */}
      <path d="M4 20L7 8L10 14L12 10L14 14L17 8L20 20Z" />
    </svg>
  );
}

function GenericLinkIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
    </svg>
  );
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
                {known?.type === 'spotify' && <SpotifyIcon size={26} />}
                {known?.type === 'appleMusic' && <AppleMusicIcon size={26} />}
                {known?.type === 'youtube' && <YouTubeIcon size={26} />}
                {known?.type === 'wiki' && <WikiIcon size={26} />}
                {!isKnown && <GenericLinkIcon size={26} />}
              </span>
              {!isKnown && <span className="external-platform-link-label">{label}</span>}
            </a>
          );
        })}
      </div>
    </div>
  );
}
