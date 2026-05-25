/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Re-export everything so existing imports (from './audio_feedback') keep working.
export type { AudioFeedbackProvider, SpeechSettings, SpeechPriority } from './audio_feedback_types';
export { WebSpeechProvider } from './web_speech_provider';
export { AriaLiveProvider } from './aria_live_provider';
export { CompositeProvider } from './composite_provider';
