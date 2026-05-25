/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AudioFeedbackProvider, SpeechPriority, SpeechSettings } from './audio_feedback_types';

/**
 * Delivers audio feedback via the Web Speech API (speechSynthesis).
 * Handles voice loading, Chrome's 15-second pause bug, and priority queuing.
 */
export class WebSpeechProvider implements AudioFeedbackProvider {
  private settings: SpeechSettings;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private enabled: boolean;
  private pendingMessage: string | null = null;
  private interruptionTimer: number | null = null;
  private debug: boolean = true;

  constructor(settings: SpeechSettings) {
    this.settings = { ...settings };
    this.enabled = settings.enabled;
    this.initializeSpeechSynthesis();
  }

  private log(message: string): void {
    if (this.debug) console.log(`[WebSpeechProvider] ${message}`);
  }

  private initializeSpeechSynthesis(): void {
    if (!('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.log(`Loaded ${window.speechSynthesis.getVoices().length} voices`);
        this.applyVoiceSettings();
        this.announceReady();
      };
    } else {
      this.applyVoiceSettings();
      this.announceReady();
    }
  }

  private announceReady(): void {
    setTimeout(() => {
      this.speak(
        'Screen reader enabled. Press Tab to navigate between controls. Use arrow keys within menus.',
        'normal',
      );
    }, 100);
  }

  private applyVoiceSettings(): void {
    const voices = window.speechSynthesis.getVoices();
    this.selectedVoice = voices[this.settings.voiceIndex] || voices[0] || null;
  }

  speak(message: string, priority: SpeechPriority = 'normal'): void {
    this.log(`Speaking: ${message} (priority: ${priority})`);
    if (!('speechSynthesis' in window) || !this.enabled) return;

    if (this.interruptionTimer) {
      clearTimeout(this.interruptionTimer);
      this.interruptionTimer = null;
    }

    if (priority === 'high') {
      this.pendingMessage = null;
      window.speechSynthesis.cancel();
      this.interruptionTimer = window.setTimeout(() => {
        this.interruptionTimer = null;
        this.speakImmediate(message);
      }, 50);
    } else {
      if (window.speechSynthesis.speaking || this.interruptionTimer !== null) {
        this.pendingMessage = message;
      } else {
        this.speakImmediate(message);
      }
    }
  }

  private speakImmediate(message: string): void {
    try {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = this.settings.rate;
      utterance.pitch = this.settings.pitch;
      utterance.volume = this.settings.volume;
      if (this.selectedVoice) utterance.voice = this.selectedVoice;

      utterance.onstart = () => this.log(`Speech started: "${message}"`);
      utterance.onend = () => {
        this.log(`Speech ended: "${message}"`);
        if (this.pendingMessage) {
          const pending = this.pendingMessage;
          this.pendingMessage = null;
          this.speak(pending);
        }
      };
      utterance.onerror = (e) => this.log(`Speech error: ${e.error} for: "${message}"`);

      // Chrome pauses speechSynthesis after ~15 s of silence and never auto-resumes.
      // resume() is a no-op when synthesis is already running.
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      this.log(`Error creating utterance: ${error}`);
    }
  }

  forceSpeak(message: string): void {
    if (!this.enabled) {
      this.log(`Force speech blocked - disabled: "${message}"`);
      return;
    }
    if (!('speechSynthesis' in window)) return;

    if (this.interruptionTimer) {
      clearTimeout(this.interruptionTimer);
      this.interruptionTimer = null;
    }
    this.pendingMessage = null;
    window.speechSynthesis.cancel();
    this.interruptionTimer = window.setTimeout(() => {
      this.interruptionTimer = null;
      this.speakImmediate(message);
    }, 100);
  }

  cancel(): void {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    this.pendingMessage = null;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.cancel();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  updateSettings(settings: SpeechSettings): void {
    this.settings = { ...settings };
    this.setEnabled(settings.enabled);
    this.applyVoiceSettings();
  }

  dispose(): void {
    this.cancel();
    if (this.interruptionTimer) {
      clearTimeout(this.interruptionTimer);
      this.interruptionTimer = null;
    }
  }
}
