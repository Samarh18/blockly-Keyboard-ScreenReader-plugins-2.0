/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AudioFeedbackProvider, SpeechPriority, SpeechSettings } from './audio_feedback_types';

/**
 * Delegates all audio feedback to multiple providers simultaneously.
 * The default configuration combines WebSpeechProvider and AriaLiveProvider
 * so both Web Speech output and ARIA live regions fire for every announcement.
 */
export class CompositeProvider implements AudioFeedbackProvider {
  private providers: AudioFeedbackProvider[];
  private enabled: boolean = true;

  constructor(providers: AudioFeedbackProvider[]) {
    this.providers = [...providers];
  }

  speak(message: string, priority: SpeechPriority = 'normal'): void {
    for (const p of this.providers) p.speak(message, priority);
  }

  forceSpeak(message: string): void {
    for (const p of this.providers) p.forceSpeak(message);
  }

  cancel(): void {
    for (const p of this.providers) p.cancel();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    for (const p of this.providers) p.setEnabled(enabled);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  updateSettings(settings: SpeechSettings): void {
    for (const p of this.providers) p.updateSettings?.(settings);
  }

  dispose(): void {
    for (const p of this.providers) p.dispose();
  }
}
