import React, { useEffect } from 'react';
import { HELP_CONTENT } from '../../config/helpContent';
import './HelpPage.css';

interface HelpPageProps {
  onClose: () => void;
}

const HelpPage = ({ onClose }: HelpPageProps) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    containerRef.current?.scrollTo(0, 0);
  }, []);

  return (
    <div
      ref={containerRef}
      className="help-page-container"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-page-title"
    >
      <div
        className="help-page-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="help-page-header">
          <h1 id="help-page-title" className="help-page-title">
            <span className="help-icon">🎵</span>
            {HELP_CONTENT.title}
          </h1>
          <button 
            className="app-close-button help-close-button" 
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
