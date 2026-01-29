import './CreditsPage.css';

interface CreditsPageProps {
  onClose: () => void;
}

const CreditsPage = ({ onClose }: CreditsPageProps) => {
  return (
    <div className="credits-container">
      <div className="credits-content">
        <div className="credits-header">
          <h1 className="credits-title">Credits & Data Sources</h1>
          <button
            className="app-close-button credits-close-button"
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            ×
          </button>
        </div>

        <div className="credits-body">
          <p>
            This project uses external music metadata and analytical data from third-party sources.
          </p>
          <p>
            Tempo, BPM, key, and related musical attributes are provided by{' '}
            <a href="https://getsongbpm.com" target="_blank" rel="noopener noreferrer">
              GetSongBPM.com
            </a>
            <br />
            <a href="https://getsongbpm.com" target="_blank" rel="noopener noreferrer">
              https://getsongbpm.com
            </a>
          </p>
          <p>
            Additional metadata may be sourced from other public music databases and APIs.
          </p>
        </div>

        <div className="credits-footer">
          <button className="credits-back-button" onClick={onClose}>
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreditsPage;
