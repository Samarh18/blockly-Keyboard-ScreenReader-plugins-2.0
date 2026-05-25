/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Export the main ScreenReader class
export { ScreenReader } from './screen_reader';

// Export the SettingsDialog class and shared settings utilities
export { SettingsDialog, loadSpeechSettings, getDefaultSpeechSettings } from './settings_dialog';

// Export the HelpDialog class
export { HelpDialog } from './help_dialog';

// Export block description utilities
export { getBlockMessage, getDelimiterMessage, blockDescriptions } from './block_descriptions';

// Export audio feedback abstraction layer — host environments can inject
// custom providers or compose their own via these exports.
export {
  WebSpeechProvider,
  AriaLiveProvider,
  CompositeProvider,
} from './audio_feedback';
export type {
  AudioFeedbackProvider,
  SpeechSettings,
  SpeechPriority,
} from './audio_feedback';