/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export type SpeechPriority = 'high' | 'normal';

/** Speech synthesis configuration shared by the screen reader and settings dialog. */
export interface SpeechSettings {
  enabled: boolean;
  rate: number;        // 0.5–3.0
  pitch: number;       // 0.5–2.0
  volume: number;      // 0.1–1.0
  voiceIndex: number;  // Index in available voices array
}

/**
 * Common interface for all audio feedback providers.
 * Decouples "what to announce" from "how to announce it" so providers
 * can be swapped, composed, or replaced for testing.
 */
export interface AudioFeedbackProvider {
  speak(message: string, priority: SpeechPriority): void;
  forceSpeak(message: string): void;
  cancel(): void;
  setEnabled(enabled: boolean): void;
  isEnabled(): boolean;
  dispose(): void;
  /** Only implemented by providers that have configurable speech settings. */
  updateSettings?(settings: SpeechSettings): void;
}
