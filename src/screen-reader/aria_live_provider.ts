/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AudioFeedbackProvider, SpeechPriority } from './audio_feedback_types';

/**
 * Delivers audio feedback via ARIA live regions.
 * Announces to screen readers already running (NVDA, JAWS, VoiceOver)
 * without competing with Web Speech API output.
 */
export class AriaLiveProvider implements AudioFeedbackProvider {
  private assertiveRegion: HTMLElement;
  private politeRegion: HTMLElement;
  private enabled: boolean = true;

  constructor() {
    this.assertiveRegion = AriaLiveProvider.createRegion('assertive');
    this.politeRegion = AriaLiveProvider.createRegion('polite');
    document.body.appendChild(this.assertiveRegion);
    document.body.appendChild(this.politeRegion);
  }

  private static createRegion(politeness: 'assertive' | 'polite'): HTMLElement {
    const el = document.createElement('div');
    el.setAttribute('aria-live', politeness);
    el.setAttribute('aria-atomic', 'true');
    el.style.cssText =
      'position:absolute;width:1px;height:1px;padding:0;margin:-1px;' +
      'overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
    return el;
  }

  speak(message: string, priority: SpeechPriority = 'normal'): void {
    if (!this.enabled) return;
    const region = priority === 'high' ? this.assertiveRegion : this.politeRegion;
    // Clear then set so identical consecutive messages trigger a re-announcement.
    region.textContent = '';
    requestAnimationFrame(() => { region.textContent = message; });
  }

  forceSpeak(message: string): void {
    this.speak(message, 'high');
  }

  cancel(): void {
    this.assertiveRegion.textContent = '';
    this.politeRegion.textContent = '';
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.cancel();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  dispose(): void {
    this.cancel();
    this.assertiveRegion.remove();
    this.politeRegion.remove();
  }
}
