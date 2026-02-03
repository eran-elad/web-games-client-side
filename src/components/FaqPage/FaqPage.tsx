import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FAQ_CONTENT } from '../../config/faqContent';
import { GAME_NAME, GAME_URL } from '../../config/gameConfig';
import './FaqPage.css';

export default function FaqPage() {
  const navigate = useNavigate();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_CONTENT.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <Helmet>
        <title>Hitfinder FAQ | Frequently Asked Questions</title>
        <meta
          name="description"
          content={`Frequently asked questions about ${GAME_NAME} - the daily music guessing game. Learn how to play, about clues, and more.`}
        />
        <link rel="canonical" href={`${GAME_URL}/faq`} />
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>
      <div className="faq-container">
        <div className="faq-content">
          <div className="faq-header">
            <h1 className="faq-title">Frequently Asked Questions</h1>
            <button
              className="app-close-button faq-close-button"
              onClick={() => navigate(-1)}
              aria-label="Close"
              title="Close"
            >
              ×
            </button>
          </div>

          <div className="faq-list">
            {FAQ_CONTENT.map((item, index) => (
              <div
                key={index}
                className={`faq-item ${expandedIndex === index ? 'expanded' : ''}`}
              >
                <button
                  className="faq-question"
                  onClick={() =>
                    setExpandedIndex(expandedIndex === index ? null : index)
                  }
                  aria-expanded={expandedIndex === index}
                >
                  {item.question}
                  <span className="faq-toggle">{expandedIndex === index ? '−' : '+'}</span>
                </button>
                {expandedIndex === index && (
                  <div className="faq-answer">{item.answer}</div>
                )}
              </div>
            ))}
          </div>

          <div className="faq-footer">
            <p>Still have questions? Check out the <Link to="/help">How to Play</Link> guide.</p>
            <button className="faq-back-button" onClick={() => navigate(-1)}>
              ← Back
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
