import { useState, useEffect, useRef } from 'react';
import {
  submitFeedback,
  validateMessage,
  validateScreenshot,
  validateEmail,
  type FeedbackType,
} from '../../services/feedbackApi';
import {
  getPlayerId,
  getSessionId,
  getPuzzleId,
  getGameId,
} from '../../utils/storage';
import { MUSIC_GAME_ID } from '../../config/gameConfig';
import './FeedbackModal.css';

const FEEDBACK_TYPES: { value: FeedbackType; label: string }[] = [
  { value: 'feedback', label: 'Feedback' },
  { value: 'bug', label: 'Bug' },
  { value: 'feature_request', label: 'Feature request' },
  { value: 'content_issue', label: 'Content issue' },
  { value: 'other', label: 'Other' },
];

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function buildClientContext(formStartedAt: number): string {
  const ctx: Record<string, string | number | undefined> = {
    route: typeof window !== 'undefined' ? window.location.pathname : '',
    view: typeof window !== 'undefined' ? window.location.pathname.replace('/', '') || 'daily' : 'daily',
    build: undefined,
    player_id: getPlayerId() ?? undefined,
    session_id: getSessionId() ?? undefined,
    puzzle_id: getPuzzleId() ?? undefined,
    form_started_at: formStartedAt,
    ts: new Date().toISOString(),
  };
  return JSON.stringify(ctx);
}

export default function FeedbackModal({
  isOpen,
  onClose,
  onSuccess,
}: FeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('feedback');
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formStartedAtRef = useRef<number>(0);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      formStartedAtRef.current = Date.now();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateScreenshot(file);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setScreenshot(file);
    const reader = new FileReader();
    reader.onload = () => setScreenshotPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const msgErr = validateMessage(message);
    if (msgErr) {
      setError(msgErr);
      return;
    }

    const emailErr = validateEmail(contactEmail);
    if (emailErr) {
      setError(emailErr);
      return;
    }

    const playerId = getPlayerId();
    const sessionId = getSessionId();
    const puzzleId = getPuzzleId();
    const gameId = getGameId();

    const payload = {
      message: message.trim(),
      feedback_type: feedbackType,
      contact_email: contactEmail.trim() || undefined,
      player_id: playerId ?? undefined,
      session_id: sessionId ?? undefined,
      puzzle_id: !sessionId ? (puzzleId ?? undefined) : undefined,
      game_id: !sessionId && !puzzleId ? (gameId ?? MUSIC_GAME_ID) : gameId ?? undefined,
      client_context: buildClientContext(formStartedAtRef.current),
    };

    const honeypotValue = honeypotRef.current?.value ?? '';

    setIsSubmitting(true);
    try {
      await submitFeedback(payload, screenshot, honeypotValue);
      setMessage('');
      setContactEmail('');
      handleRemoveScreenshot();
      setFeedbackType('feedback');
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="feedback-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      <div
        className="feedback-modal-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="feedback-modal-header">
          <h1 id="feedback-modal-title" className="feedback-modal-title">
            <span className="feedback-modal-icon">💬</span>
            Send Feedback
          </h1>
          <button
            className="app-close-button feedback-modal-close"
            onClick={onClose}
            aria-label="Close feedback"
            title="Close"
            type="button"
          >
            ×
          </button>
        </div>

        <form className="feedback-modal-body" onSubmit={handleSubmit}>
          <div
            className="feedback-honeypot"
            aria-hidden="true"
          >
            <input
              ref={honeypotRef}
              type="text"
              name="website"
              autoComplete="off"
              tabIndex={-1}
            />
          </div>

          <div className="feedback-field">
            <label htmlFor="feedback-type">Type</label>
            <select
              id="feedback-type"
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value as FeedbackType)}
              disabled={isSubmitting}
            >
              {FEEDBACK_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="feedback-field">
            <label htmlFor="feedback-message">Message *</label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your feedback..."
              required
              maxLength={4000}
              disabled={isSubmitting}
              rows={5}
            />
            <span className="feedback-char-count">{message.length}/4000</span>
          </div>

          <div className="feedback-field">
            <label>Screenshot (optional)</label>
            <div className="feedback-screenshot-row">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                disabled={isSubmitting}
                className="feedback-file-input"
              />
              {screenshotPreview && (
                <div className="feedback-screenshot-preview">
                  <img src={screenshotPreview} alt="Screenshot preview" />
                  <button
                    type="button"
                    className="feedback-remove-screenshot"
                    onClick={handleRemoveScreenshot}
                    disabled={isSubmitting}
                    aria-label="Remove screenshot"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="feedback-field">
            <label htmlFor="feedback-email">Contact email (optional)</label>
            <input
              id="feedback-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="Only if you want follow-up"
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="feedback-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="feedback-submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
