import { HELP_CONTENT } from '../../config/helpContent';
import './HelpPage.css';

interface HelpPageProps {
  onClose: () => void;
}

const HelpPage = ({ onClose }: HelpPageProps) => {
  return (
    <div className="help-page-container">
      <div className="help-page-content">
        <div className="help-page-header">
          <h1 className="help-page-title">
            <span className="help-icon">🎵</span>
            {HELP_CONTENT.title}
          </h1>
          <button 
            className="help-close-button" 
            onClick={onClose} 
            aria-label="Close help"
            title="Close"
          >
            ×
          </button>
        </div>
        
        <p className="help-subtitle">{HELP_CONTENT.subtitle}</p>
        
        <div className="help-sections">
          {HELP_CONTENT.sections.map((section, index) => (
            <div key={index} className="help-section">
              <h2 className="help-section-title">
                {section.icon && <span className="section-icon">{section.icon}</span>}
                {section.title}
              </h2>
              <div className="help-section-content">
                {section.content.split('\n').map((line, lineIndex) => (
                  <p key={lineIndex} className="help-paragraph">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="help-footer">
          <p>{HELP_CONTENT.footer}</p>
        </div>
        
        <div className="help-actions">
          <button className="help-back-button" onClick={onClose}>
            ← Back to Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
