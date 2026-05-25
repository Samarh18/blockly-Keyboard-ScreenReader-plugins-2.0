# Blockly Accessibility Plugins 2.0

This project is a continuation of thesis research that enhanced the accessibility of Blockly by combining the keyboard navigation plugin with additional screen reader support, making block-based programming more inclusive for users with visual impairments and mobility limitations.

**About this version:** The original work (1.0) was co-designed and evaluated with students as part of a thesis study. This 2.0 version moves beyond that work and is driven by the author's own ideas, as well as features that were briefly discussed with students during the study but were never fully implemented or tested. Nothing here has been co-designed or validated with users, it is exploratory and experimental.

## Demo

A working demonstration of this 2.0 implementation is available at: [https://samarh18.github.io/blockly-Keyboard-ScreenReader-plugins-2.0/](https://samarh18.github.io/blockly-Keyboard-ScreenReader-plugins-2.0/)

## Keyboard Shortcuts

### Workspace Shortcuts (Work only when focusing on the workspace)
- **O key**: Navigate to root block of current stack
- **N key**: Navigate to next stack of blocks
- **D key**: Delete all blocks from workspace

### Global Shortcuts (Work from anywhere on the page)
- **B key**: Open and focus the toolbox/blocks menu
- **W key**: Focus the workspace for block editing
- **S key**: Focus the Settings button
- **H key**: Focus the Help button
- **I key**: Announce current location in the interface *(2.0)*

## Usage Guidelines

### Getting Started

#### Initial Navigation
- Use **Tab Key** to navigate between main interface areas (workspace, toolbox, controls)

#### Basic Movement
- **Arrow Keys**: Navigate between blocks, connections, and fields
- **Enter**: Activate the current selection (open dropdowns, edit fields)
- **Escape**: Exit current context (close menus, return to workspace)

#### Screen Reader Settings

The accessibility demo includes a customizable settings window to personalize your screen reader experience. Access it by pressing **S** which will focus on the "Settings" button, and then pressing "Enter" will open the window, or clicking the button directly.

##### Available Settings

**Enable Screen Reader Checkbox**
- **Default**: Enabled
- **Function**: Turn all screen reader announcements on or off
- **Interaction**: Press **Space** to toggle on/off

**Speech Rate Slider**
- **Default**: 1.7
- **Function**: Controls how fast speech is spoken
- **Interaction**: Use **left/right arrow keys** to adjust

**Speech Pitch Slider**
- **Default**: 1.0
- **Function**: Controls the pitch/tone of speech
- **Interaction**: Use **left/right arrow keys** to adjust

**Speech Volume Slider**
- **Default**: 1.0
- **Function**: Controls how loud speech is
- **Interaction**: Use **left/right arrow keys** to adjust

**Voice Selection Dropdown menu**
- **Default**: System default voice
- **Function**: Choose which voice to use for speech
- **Interaction**: Use **up/down arrow keys** to browse voices

### Toolbox/Blocks Menu Navigation

#### Category Navigation
- **Arrow Keys**: Navigate between categories (Logic, Math, Text, etc.)
- **First Letter Navigation**: Press the first letter of a category name to jump to it

#### Block Selection in Flyout
- **Arrow Keys**: Navigate through available blocks
- **Enter**: Add the selected block to workspace
- **Escape**: Return to toolbox categories

#### Connecting Blocks
1. **Navigate to Connection Point**: Use arrow keys to move cursor to where you want to connect a block (input slot, under a block, etc.)
2. **Open Block Menu**: Press **Enter** to automatically open the toolbox/blocks menu
3. **Select Block**: Navigate through the menu and select the desired block by clicking **Enter**
4. **Automatic Connection**: The selected block is automatically added and connected to your indicated position

### Block Stack Navigation
- **O key**: Navigate to the root (top) block of the current stack
- **N key**: Navigate to the next stack of blocks (cycles through all stacks)

### Screen Reader Features

#### Automatic Announcements
- **Block Navigation**: Announces block type, position, and connections
- **Stack Navigation**: Announces current stack position 
- **Menu Navigation**: Describes menu items and navigation options
- **Context Awareness**: Provides relevant information based on current location in the workspace

#### Block Descriptions
The screen reader provides detailed descriptions for:
- Block types and purposes
- Field values (numbers, text, colors)
- Block position in sequences
- Special handling for mathematical expressions

### Menus and Dropdown Navigation

#### Dropdown Menus
- **Arrow Keys**: Navigate through options
- **Enter/Space**: Select current option
- **Escape**: Close menu without selection
- **Automatic Announcement**: Menu contents are announced when opened
- **Mathematical Function Menus**: Special support for math functions with clear pronunciation

## Recent Updates

> These updates were not co-designed with students. They reflect the author's own understanding of what would be useful based on the thesis study, but have not been validated with users.

### Workspace floor: bounded navigation at the end of all blocks
Navigating past the last block or last stack now lands on an explicit "workspace floor" — an empty area below the blocks — instead of wrapping or doing nothing.

- **Down arrow** past the last block → cursor moves to the empty workspace area. Screen reader announces *"End of blocks. Empty workspace area. Press Up arrow to return to blocks."*
- **Up arrow** from the workspace floor → cursor returns to the root of the last stack.
- **N key** past the last stack → cursor moves to the workspace floor. Screen reader announces *"End of stacks. Empty workspace area. Press N to return to the first stack."*
- **N key** from the workspace floor → wraps back to the first stack.
- **Enter** on the workspace floor is blocked: it previously opened the flyout and could let students add a disconnected block. It now announces *"Empty workspace area. Press Up arrow to return to blocks."* instead.

### Remove shortcut dialog and toggleShortcutDialog()
The built-in keyboard-shortcut reference dialog (`ShortcutDialog`) and its associated `toggleShortcutDialog()` methods have been removed from `KeyboardNavigation`, `NavigationController`, and the integration layer. The Help dialog already serves this role, so the shortcut dialog was redundant. The now-unused `shortcut_dialog.ts` file was also deleted.

### Integration Layer: Consistent Component Initialisation
The `SettingsDialog` and `HelpDialog` classes now follow the same initialisation pattern as every other component (`KeyboardNavigation`, `ScreenReader`, `GlobalShortcuts`): all setup — including injecting HTML into the DOM — happens inside the constructor. Previously, construction left the dialogs in a half-built state and a separate `.install()` call was required to finish the work. That extra step has been removed from the integration layer; constructing a dialog now fully prepares it, with no follow-up call needed.

### WCAG Contrast Compliance
All colors in the dialogs (settings, help, shortcut list) and the test page were checked against WCAG 2.1 AA contrast requirements. Any color pair that failed — including focus ring outlines, key badge borders, separator text, and button labels — was corrected. The amber focus ring color was darkened from `#ffa200` to `#b36800` so it meets the minimum 3:1 contrast ratio against white backgrounds required for UI components.

### Location Announcer — "I" Key 
Pressing **I** from anywhere on the page announces where focus currently is. It says **"Workspace"** if the Blockly canvas has focus, **"Blocks menu"** if the toolbox or flyout has focus, or the button name (e.g. **"Settings button"**, **"Help button"**) if a button has focus. The shortcut does not interfere with existing shortcuts or the toolbox's first-letter category-navigation behaviour.

### Auto-Layout Column System
The manual **C key** cleanup shortcut has been removed and replaced with an automatic layout system. Whenever a new disconnected block is added to the workspace, or the workspace finishes loading, all top-level stacks are automatically arranged into a single column on the left edge of the canvas. Stacks start at a fixed offset of 20px from the left and 20px from the top; each subsequent stack is placed below the previous one with a 40px vertical gap, calculated using each stack's actual rendered height. Blocks that are connected to a parent block are never repositioned.

### Block Child Count Announcement
When the keyboard cursor moves onto a block in the workspace, the screen reader now also says how many blocks are directly inside it. For example: *"Selected repeat 10 times block, contains 3 blocks"*. If the block is empty, it says *"empty"* instead. This does not apply to blocks in the toolbox or flyout — only on the main workspace.

## Current Status

This project is actively in development and not ready for production use. It builds on the keyboard navigation plugin and the thesis work from 1.0. Features added here are exploratory — they have not been co-designed or tested with users and should be treated as works-in-progress.