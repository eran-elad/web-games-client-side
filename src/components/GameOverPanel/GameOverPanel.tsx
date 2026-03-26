import React from "react";
import ShareResult from "../ShareResult/ShareResult";
import ExternalPlatformLinks from "../ExternalPlatformLinks/ExternalPlatformLinks";
import NewDailyPuzzleBanner from "../NewDailyPuzzleBanner/NewDailyPuzzleBanner";
import type { ExternalLink } from "../../services/gameApi";
import { getCountryName, formatGenderValue } from "../../utils/formatters";
import "./GameOverPanel.css";
import { getCountryFlag, normalizeCountryCode } from "../../config/countryCodes";
import { useAuth } from "../../auth/AuthContext";
import { GOOGLE_CLIENT_ID } from "../../config/apiConfig";
import GoogleSignInButton from "../GoogleSignInButton/GoogleSignInButton";

type GameStatus = "won" | "lost" | "abandoned" | "quit";

type SecretSong = {
  display?: string;
  title?: string;
  artist?: string;
  album?: string;
  year: number;
  country: string;
  genre: string;
  duration_sec: number;
  bpm?: number | null;
  bpm_details?: string | null;
  artist_type?: string;
  gender?: string;
};

type Guess = {
  songTitle: string;
  artist: string;
  clues: any;
  guessedCountry?: string;
  guessedArtistType?: string;
  guessedGender?: string;
  guessedYear?: number;
  guessedBpm?: number | null;
  guessedBpmDetails?: string | null;
  songId?: string;
  isLifeline?: boolean;
  catalogSize?: number;
  catalogSizeAfterGuess?: number;
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}


const SecretSongDetails = ({ secretSong }: { secretSong: SecretSong }) => {
    
    const [expandedKeys, setExpandedKeys] = React.useState<Record<string, boolean>>({});
  
    const toggle = (key: string) => {
      setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const iconSrc = (name: string) => `/clue_icons/${name}.svg`;

    type RowOpts = {
    k?: string;                 // key for expandable rows
    icon: string;               // svg name without .svg (e.g. "album")
    label: string;
    value: React.ReactNode;
    expandable?: boolean;
    title?: string;
    };

    const countryCode = normalizeCountryCode(secretSong.country || "");
    const countryFlag = getCountryFlag(countryCode) || "🌍";

    const DetailRow = ({ k, icon, label, value, expandable, title }: RowOpts) => {
    const isExpanded = k ? !!expandedKeys[k] : false;

    const commonProps = expandable && k
        ? {
            className: `secret-song-info-item is-expandable ${isExpanded ? "expanded" : ""}`,
            onClick: () => toggle(k),
            role: "button" as const,
            tabIndex: 0,
            onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") toggle(k);
            },
            "aria-expanded": isExpanded,
            "aria-label": label,
            title: title ?? "Tap to expand",
        }
        : {
            className: "secret-song-info-item",
            "aria-label": label,
        };

    return (
        <div {...commonProps}>
        <span className="secret-song-info-icon" aria-hidden="true">
            <img src={iconSrc(icon)} alt="" />
        </span>

        {/* <span className="secret-song-label">{label}</span> */}
        <span className="secret-song-value">{value}</span>
        </div>
    );
    };
  
    return (
      <div className="secret-song-details">
        <div className="secret-song-details-title">Details</div>
  
        <div className="secret-song-info-grid">
            {secretSong.album && (
                <DetailRow
                k="album"
                icon="album"
                label="Album:"
                value={secretSong.album}
                expandable
                />
            )}

            <DetailRow icon="year" label="Year:" value={secretSong.year} />

            <div
                className={`secret-song-info-item is-expandable ${expandedKeys.country ? "expanded" : ""}`}
                onClick={() => toggle("country")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") toggle("country");
                }}
                aria-expanded={!!expandedKeys.country}
                title="Tap to expand"
                >
                <span className="secret-song-icon secret-song-flag" aria-hidden="true">
                    {countryFlag}
                </span>

                {/* <span className="secret-song-label">Country:</span> */}
                <span className="secret-song-value">{getCountryName(secretSong.country)}</span>
            </div>

            <DetailRow icon="genre" label="Genre:" value={secretSong.genre} />
            <DetailRow icon="duration" label="Duration:" value={formatDuration(secretSong.duration_sec)} />

            {secretSong.bpm != null && (
                <DetailRow icon="tempo" label="BPM:" value={`${secretSong.bpm} BPM`} />
            )}

            {secretSong.artist_type && (
                <DetailRow
                icon={secretSong.artist_type === "Person" ? "artist-type-person" : "artist-type-group"}
                label="Type:"
                value={secretSong.artist_type === "Person" ? "Solo" : secretSong.artist_type}
                />
            )}

            {secretSong.gender && (
                <DetailRow
                k="gender"
                icon="gender"
                label="Gender:"
                value={formatGenderValue(secretSong.gender)}
                expandable
                />
            )}
            </div>
      </div>
    );
  };

function getHeadline(status: GameStatus): string {
  if (status === "won") return "🎉 Congratulations! You guessed it!";
  if (status === "quit") return "😔 You gave up. Better luck next time!";
  return "😔 Game Over. Better luck next time!";
}

export default function GameOverPanel(props: {
  status: GameStatus;
  secretSong: SecretSong | null | undefined;
  guesses: Guess[];
  guessedCount: number;
  maxGuesses: number;
  puzzleDate: string | null;
  externalLinks: ExternalLink[] | null;
  sessionId: string | null;
  onShowFeedback?: () => void;
  onPlayAnotherArchivedPuzzle?: () => void;
  shouldShowBanner: boolean;
  onSwitchToDaily: () => void;
  onDismissBanner: () => void;
}) {
  const {
    status,
    secretSong,
    guesses,
    guessedCount,
    maxGuesses,
    puzzleDate,
    externalLinks,
    sessionId,
    onShowFeedback,
    onPlayAnotherArchivedPuzzle,
    shouldShowBanner,
    onSwitchToDaily,
    onDismissBanner,
  } = props;

  const { auth } = useAuth();
  const isWon = status === "won";
  const showSaveProgressCta =
    GOOGLE_CLIENT_ID && auth.status === "anonymous";

  return (
    <div
      className={`game-status-message ${isWon ? "won" : "lost"}`}
      data-outcome={isWon ? "won" : "lost"}
    >
      <div className="game-over-panel">
        <div className="game-over-hero">
          <div className="game-over-headline">{getHeadline(status)}</div>
  
          {secretSong && (
            <div className="game-over-solution">
              <div className="game-over-solution-label">The secret song was</div>
              <div className="game-over-solution-title">
                {secretSong.display ||
                  `${secretSong.title || ""} - ${secretSong.artist || ""}`.trim() ||
                  "Unknown"}
              </div>
            </div>
          )}
        </div>
  
        {secretSong && (
          <>
            <div className="game-over-actions">
              <ShareResult
                guesses={guesses}
                guessCount={guessedCount}
                maxGuesses={maxGuesses}
                isWon={isWon}
                puzzleDate={puzzleDate || undefined}
                sessionId={sessionId ?? undefined}
              />

              {showSaveProgressCta && (
                <div className="game-over-save-progress">
                  <div className="game-over-save-progress-title">Save your progress</div>
                  <p className="game-over-save-progress-text">
                    Sign in to keep your streaks, stats, and badges across devices.
                  </p>
                  <GoogleSignInButton />
                </div>
              )}

              {auth.status === "authenticated" && (
                <p className="game-over-progress-saved">Progress saved to your account.</p>
              )}
  
              {externalLinks && externalLinks.length > 0 && (
                <ExternalPlatformLinks
                  links={externalLinks}
                  sessionId={sessionId ?? undefined}
                />
              )}
  
              {onShowFeedback && (
                <button
                  type="button"
                  className="feedback-result-button"
                  onClick={onShowFeedback}
                >
                  💬 Send Feedback
                </button>
              )}

              {onPlayAnotherArchivedPuzzle && (
                <button
                  type="button"
                  className="feedback-result-button archive-result-button"
                  onClick={onPlayAnotherArchivedPuzzle}
                >
                  <span className="archive-result-icon" aria-hidden="true">🎧</span>
                  <span>Play Archived Puzzles</span>
                </button>
              )}
            </div>
  
            {shouldShowBanner && (
              <NewDailyPuzzleBanner
                onSwitchToDaily={onSwitchToDaily}
                onDismiss={onDismissBanner}
              />
            )}
  
            <SecretSongDetails secretSong={secretSong} />
          </>
        )}
      </div>
    </div>
  );
}