import { Link, useNavigate } from 'react-router-dom';
import PageMeta from '../PageMeta/PageMeta';
import { GAME_NAME } from '../../config/gameConfig';
import './AboutPage.css';

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <>
      <PageMeta
        title={`About ${GAME_NAME} | Daily Music Guessing Game`}
        description={`Learn about ${GAME_NAME} - the free daily music guessing game. Guess the secret hit song using clues like BPM, genre, and year.`}
        path="/about"
      />
      <div className="about-container">
      <div className="about-content">
        <div className="about-header">
          <h1 className="about-title">About {GAME_NAME}</h1>
          <button
            className="app-close-button about-close-button"
            onClick={() => navigate(-1)}
            aria-label="Close"
            title="Close"
          >
            ×
          </button>
        </div>

        <div className="about-body">
          <p>
            <strong>{GAME_NAME}</strong> is a free daily music guessing game. Each day, a new secret hit song is chosen. Your goal is to guess it using up to 8 attempts.
          </p>

          <section>
            <h2>How It Works</h2>
            <p>
              Type a song or artist name to make a guess. After each guess, you receive clues to help narrow down the answer:
            </p>
            <ul>
              <li><strong>Year</strong> – How many years off your guess is</li>
              <li><strong>Country</strong> – Distance and direction to the secret song&apos;s country</li>
              <li><strong>Genre</strong> – Whether the genre matches</li>
              <li><strong>BPM (Tempo)</strong> – How close the beats per minute are</li>
              <li><strong>Duration</strong> – Song length comparison (when relevant)</li>
            </ul>
          </section>

          <section>
            <h2>Features</h2>
            <ul>
              <li>New puzzle every day</li>
              <li>Play past puzzles from the Archive</li>
              <li>Track your statistics and streaks</li>
              <li>Compete on global leaderboards</li>
              <li>Lifeline to narrow down the song list when stuck</li>
            </ul>
          </section>

          <section>
            <h2>Part of Puzzlio.games</h2>
            <p>
              {GAME_NAME} is part of the Puzzlio.games family of daily puzzle games. We create fun, free games that you can play every day.
            </p>
          </section>
        </div>

        <div className="about-footer">
          <Link to="/play" className="about-play-button">
            Play {GAME_NAME}
          </Link>
          <div className="about-links">
            <Link to="/help">How to Play</Link>
            <span className="about-sep"> · </span>
            <Link to="/faq">FAQ</Link>
            <span className="about-sep"> · </span>
            <Link to="/privacy">Privacy Policy</Link>
            <span className="about-sep"> · </span>
            <a href="/credits">Credits</a>
          </div>
          <button className="about-back-button" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
