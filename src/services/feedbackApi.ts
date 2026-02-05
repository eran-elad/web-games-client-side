/**
 * API service for feedback submission
 * POST /api/feedback - multipart/form-data
 */

import { getApiUrl } from '../config/apiConfig';

export type FeedbackType =
  | 'bug'
  | 'feedback'
  | 'feature_request'
  | 'content_issue'
  | 'other';

export interface FeedbackPayload {
  message: string;
  feedback_type?: FeedbackType;
  contact_email?: string;
  player_id?: string;
  session_id?: string;
  puzzle_id?: string;
  game_id?: string;
  client_context?: string;
}

export interface SubmitFeedbackResult {
  feedback_id: string;
}

const MAX_MESSAGE_LENGTH = 4000;
const MIN_MESSAGE_LENGTH = 3;
const MAX_SCREENSHOT_SIZE_BYTES = 4 * 1024 * 1024; // 4MB
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/**
 * Validate message (trim, min length)
 */
export function validateMessage(message: string): string | null {
  const trimmed = message.trim();
  if (trimmed.length < MIN_MESSAGE_LENGTH) {
    return `Message must be at least ${MIN_MESSAGE_LENGTH} characters`;
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return `Message must be at most ${MAX_MESSAGE_LENGTH} characters`;
  }
  return null;
}

/**
 * Validate screenshot file (size, mime type)
 */
export function validateScreenshot(file: File): string | null {
  if (file.size > MAX_SCREENSHOT_SIZE_BYTES) {
    return 'Screenshot must be under 4MB';
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return 'Screenshot must be PNG, JPEG, or WebP';
  }
  return null;
}

/**
 * Basic email validation (if not empty)
 */
export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (trimmed.length === 0) return null;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(trimmed)) {
    return 'Please enter a valid email address';
  }
  return null;
}

/**
 * Submit feedback to the API
 * Uses multipart/form-data for optional screenshot
 */
export async function submitFeedback(
  payload: FeedbackPayload,
  screenshot?: File | null,
  honeypotValue?: string
): Promise<SubmitFeedbackResult> {
  const formData = new FormData();

  formData.append('message', payload.message.trim());
  formData.append('feedback_type', payload.feedback_type || 'feedback');

  if (payload.contact_email?.trim()) {
    formData.append('contact_email', payload.contact_email.trim());
  }
  if (payload.player_id) {
    formData.append('player_id', payload.player_id);
  }
  if (payload.session_id) {
    formData.append('session_id', payload.session_id);
  }
  if (payload.puzzle_id) {
    formData.append('puzzle_id', payload.puzzle_id);
  }
  if (payload.game_id) {
    formData.append('game_id', payload.game_id);
  }
  if (payload.client_context) {
    formData.append('client_context', payload.client_context);
  }
  if (screenshot) {
    formData.append('screenshot', screenshot);
  }

  formData.append('website', honeypotValue ?? '');

  const response = await fetch(getApiUrl('/api/feedback'), {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = `Server error (${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage =
          typeof errorData.detail === 'string'
            ? errorData.detail
            : errorData.detail?.message || JSON.stringify(errorData.detail);
      }
    } catch {
      errorMessage = response.statusText || `Server error (${response.status})`;
    }
    throw new Error(errorMessage);
  }

  return await response.json();
}
