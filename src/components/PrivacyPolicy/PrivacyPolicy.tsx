import PageMeta from '../PageMeta/PageMeta';
import './PrivacyPolicy.css';
import { GAME_NAME } from '../../config/gameConfig';

interface PrivacyPolicyProps {
  onClose: () => void;
}

const PrivacyPolicy = ({ onClose }: PrivacyPolicyProps) => {
  return (
    <>
      <PageMeta
        title="Privacy Policy – Hitfinder"
        description={`Privacy policy for ${GAME_NAME} - the daily music guessing game. Learn how we handle your data.`}
        path="/privacy"
      />
    <div className="privacy-container">
      <div className="privacy-content">
        <div className="privacy-header">
          <h1 className="privacy-title">Privacy Policy</h1>
          <button 
            className="app-close-button privacy-close-button" 
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            ×
          </button>
        </div>
        
        <div className="privacy-body">
          <p className="privacy-updated">Last updated: January 2026</p>
          
          <section>
            <h2>Overview</h2>
            <p>
              {GAME_NAME} is a free word-guessing game. We respect your privacy and are committed to protecting any information collected while you use our service.
            </p>
          </section>
          
          <section>
            <h2>Information We Collect</h2>
            <p>We collect minimal information to provide and improve the game:</p>
            <ul>
              <li><strong>Game Progress:</strong> Your guesses and game statistics are stored locally in your browser (localStorage) to save your progress and display statistics.</li>
              <li><strong>Analytics:</strong> We use Google Analytics to understand how players interact with the game. This includes anonymous data such as page views, device type, and general location (country/region level).</li>
            </ul>
          </section>
          
          <section>
            <h2>Cookies</h2>
            <p>
              We use cookies through Google Analytics to analyze site traffic. These cookies do not personally identify you. You can disable cookies in your browser settings if you prefer.
            </p>
          </section>
          
          <section>
            <h2>Data Storage</h2>
            <p>
              All game data (your guesses, statistics, preferences) is stored locally on your device using browser localStorage. We do not store personal game data on our servers.
            </p>
          </section>
          
          <section>
            <h2>Third-Party Services</h2>
            <p>
              We use Google Analytics to understand usage patterns. Google's privacy policy can be found at{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                policies.google.com/privacy
              </a>.
            </p>
          </section>
          
          <section>
            <h2>Contact</h2>
            <p>
              If you have questions about this privacy policy, please contact us at privacy@puzzlio.games.
            </p>
          </section>
        </div>
        
        <div className="privacy-footer">
          <button className="privacy-back-button" onClick={onClose}>
            ← Back
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default PrivacyPolicy;
