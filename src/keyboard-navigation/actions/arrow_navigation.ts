/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {ASTNode, ShortcutRegistry, utils as BlocklyUtils} from 'blockly/core';

import type {Field, Toolbox, WorkspaceSvg} from 'blockly/core';

/** Speaks a message via the global accessibilityDemo screen reader. */
function speakMessage(message: string): void {
  const sr = (window as any).accessibilityDemo?.getScreenReader?.();
  sr?.forceSpeak?.(message);
}

import * as Constants from '../constants';
import type {Navigation} from '../navigation';

const KeyCodes = BlocklyUtils.KeyCodes;

/**
 * Class for registering shortcuts for navigating the workspace with arrow keys.
 */
export class ArrowNavigation {
  constructor(private navigation: Navigation) {}

  /**
   * Gives the cursor to the field to handle if the cursor is on a field.
   *
   * @param workspace The workspace to check.
   * @param shortcut The shortcut
   *     to give to the field.
   * @returns True if the shortcut was handled by the field, false
   *     otherwise.
   */
  fieldShortcutHandler(
    workspace: WorkspaceSvg,
    shortcut: ShortcutRegistry.KeyboardShortcut,
  ): boolean {
    const cursor = workspace.getCursor();
    if (!cursor || !cursor.getCurNode()) {
      return false;
    }
    const curNode = cursor.getCurNode();
    if (curNode?.getType() === ASTNode.types.FIELD) {
      return (curNode.getLocation() as Field).onShortcut(shortcut);
    }
    return false;
  }

  /**
   * Moves the cursor to an empty workspace position below the last stack and
   * announces that the student has reached the end of all blocks.
   */
  private goToWorkspaceFloor(workspace: WorkspaceSvg): void {
    const cursor = workspace.getCursor();
    if (!cursor) return;

    const topBlocks = workspace.getTopBlocks(false);
    let wsX = 20;
    let wsY = 200;
    if (topBlocks.length > 0) {
      const lowest = topBlocks.sort(
        (a, b) =>
          b.getRelativeToSurfaceXY().y - a.getRelativeToSurfaceXY().y,
      )[0];
      const pos = lowest.getRelativeToSurfaceXY();
      wsX = pos.x;
      wsY = pos.y + 150;
    }

    const wsNode = ASTNode.createWorkspaceNode(
      workspace,
      new BlocklyUtils.Coordinate(wsX, wsY),
    );
    cursor.setCurNode(wsNode);
    speakMessage('End of blocks. Empty workspace area. Press Up arrow to return to blocks.');
  }

  /**
   * Moves the cursor back to the root of the last stack (used when pressing
   * Up from the workspace floor).
   */
  private goToLastBlock(workspace: WorkspaceSvg): void {
    const cursor = workspace.getCursor();
    if (!cursor) return;

    const topBlocks = workspace.getTopBlocks(false);
    if (topBlocks.length === 0) return;

    const sorted = topBlocks.sort((a, b) => {
      const aPos = a.getRelativeToSurfaceXY();
      const bPos = b.getRelativeToSurfaceXY();
      if (Math.abs(aPos.y - bPos.y) > 50) return aPos.y - bPos.y;
      return aPos.x - bPos.x;
    });

    const lastRoot = sorted[sorted.length - 1];
    const blockNode = ASTNode.createBlockNode(lastRoot);
    if (blockNode) {
      cursor.setCurNode(blockNode);
      speakMessage('Back to blocks.');
    }
  }

  /**
   * Adds all arrow key navigation shortcuts to the registry.
   */
  install() {
    const shortcuts: {
      [name: string]: ShortcutRegistry.KeyboardShortcut;
    } = {
      /** Go to the next location to the right. */
      right: {
        name: Constants.SHORTCUT_NAMES.RIGHT,
        preconditionFn: (workspace) =>
          this.navigation.canCurrentlyNavigate(workspace),
        callback: (workspace, e, shortcut) => {
          const toolbox = workspace.getToolbox() as Toolbox;
          let isHandled = false;
          switch (this.navigation.getState(workspace)) {
            case Constants.STATE.WORKSPACE:
              isHandled = this.fieldShortcutHandler(workspace, shortcut);
              if (!isHandled && workspace) {
                if (
                  !this.navigation.defaultWorkspaceCursorPositionIfNeeded(
                    workspace,
                  )
                ) {
                  workspace.getCursor()?.in();
                }
                isHandled = true;
              }
              return isHandled;
            case Constants.STATE.TOOLBOX:
              isHandled =
                toolbox && typeof toolbox.onShortcut === 'function'
                  ? toolbox.onShortcut(shortcut)
                  : false;
              if (!isHandled) {
                this.navigation.focusFlyout(workspace);
              }
              return true;
            default:
              return false;
          }
        },
        keyCodes: [KeyCodes.RIGHT],
      },

      /** Go to the next location to the left. */
      left: {
        name: Constants.SHORTCUT_NAMES.LEFT,
        preconditionFn: (workspace) =>
          this.navigation.canCurrentlyNavigate(workspace),
        callback: (workspace, e, shortcut) => {
          const toolbox = workspace.getToolbox() as Toolbox;
          let isHandled = false;
          switch (this.navigation.getState(workspace)) {
            case Constants.STATE.WORKSPACE:
              isHandled = this.fieldShortcutHandler(workspace, shortcut);
              if (!isHandled && workspace) {
                if (
                  !this.navigation.defaultWorkspaceCursorPositionIfNeeded(
                    workspace,
                  )
                ) {
                  workspace.getCursor()?.out();
                }
                isHandled = true;
              }
              return isHandled;
            case Constants.STATE.FLYOUT:
              this.navigation.focusToolbox(workspace);
              return true;
            case Constants.STATE.TOOLBOX:
              return toolbox && typeof toolbox.onShortcut === 'function'
                ? toolbox.onShortcut(shortcut)
                : false;
            default:
              return false;
          }
        },
        keyCodes: [KeyCodes.LEFT],
      },

      /** Go down to the next location. */
      down: {
        name: Constants.SHORTCUT_NAMES.DOWN,
        preconditionFn: (workspace) =>
          this.navigation.canCurrentlyNavigate(workspace),
        callback: (workspace, e, shortcut) => {
          const toolbox = workspace.getToolbox() as Toolbox;
          const flyout = workspace.getFlyout();
          let isHandled = false;
          switch (this.navigation.getState(workspace)) {
            case Constants.STATE.WORKSPACE:
              isHandled = this.fieldShortcutHandler(workspace, shortcut);
              if (!isHandled && workspace) {
                const cursor = workspace.getCursor();
                if (cursor?.getCurNode()?.getType() === ASTNode.types.WORKSPACE) {
                  // Already on the workspace floor — stay and re-announce.
                  speakMessage('End of blocks. Press Up arrow to return to blocks.');
                } else if (
                  !this.navigation.defaultWorkspaceCursorPositionIfNeeded(workspace)
                ) {
                  const nodeBefore = cursor?.getCurNode();
                  cursor?.next();
                  const nodeAfter = cursor?.getCurNode();
                  // If the cursor didn't move, we've passed the last block.
                  if (nodeBefore !== null && nodeBefore === nodeAfter) {
                    this.goToWorkspaceFloor(workspace);
                  }
                }
                isHandled = true;
              }
              return isHandled;
            case Constants.STATE.FLYOUT:
              isHandled = this.fieldShortcutHandler(workspace, shortcut);
              if (!isHandled && flyout) {
                if (!this.navigation.defaultFlyoutCursorIfNeeded(workspace)) {
                  flyout.getWorkspace()?.getCursor()?.next();
                }
                isHandled = true;
              }
              return isHandled;
            case Constants.STATE.TOOLBOX:
              return toolbox && typeof toolbox.onShortcut === 'function'
                ? toolbox.onShortcut(shortcut)
                : false;
            default:
              return false;
          }
        },
        keyCodes: [KeyCodes.DOWN],
      },
      /** Go up to the previous location. */
      up: {
        name: Constants.SHORTCUT_NAMES.UP,
        preconditionFn: (workspace) =>
          this.navigation.canCurrentlyNavigate(workspace),
        callback: (workspace, e, shortcut) => {
          const flyout = workspace.getFlyout();
          const toolbox = workspace.getToolbox() as Toolbox;
          let isHandled = false;
          switch (this.navigation.getState(workspace)) {
            case Constants.STATE.WORKSPACE:
              isHandled = this.fieldShortcutHandler(workspace, shortcut);
              if (!isHandled) {
                if (workspace.getCursor()?.getCurNode()?.getType() === ASTNode.types.WORKSPACE) {
                  // On the workspace floor — go back up to the last block.
                  this.goToLastBlock(workspace);
                } else if (
                  !this.navigation.defaultWorkspaceCursorPositionIfNeeded(workspace, 'last')
                ) {
                  workspace.getCursor()?.prev();
                }
                isHandled = true;
              }
              return isHandled;
            case Constants.STATE.FLYOUT:
              isHandled = this.fieldShortcutHandler(workspace, shortcut);
              if (!isHandled && flyout) {
                if (
                  !this.navigation.defaultFlyoutCursorIfNeeded(
                    workspace,
                    'last',
                  )
                ) {
                  flyout.getWorkspace()?.getCursor()?.prev();
                }
                isHandled = true;
              }
              return isHandled;
            case Constants.STATE.TOOLBOX:
              return toolbox && typeof toolbox.onShortcut === 'function'
                ? toolbox.onShortcut(shortcut)
                : false;
            default:
              return false;
          }
        },
        keyCodes: [KeyCodes.UP],
      },
    };

    for (const shortcut of Object.values(shortcuts)) {
      ShortcutRegistry.registry.register(shortcut);
    }
  }

  /**
   * Removes all the arrow navigation shortcuts.
   */
  uninstall() {
    ShortcutRegistry.registry.unregister(Constants.SHORTCUT_NAMES.LEFT);
    ShortcutRegistry.registry.unregister(Constants.SHORTCUT_NAMES.RIGHT);
    ShortcutRegistry.registry.unregister(Constants.SHORTCUT_NAMES.DOWN);
    ShortcutRegistry.registry.unregister(Constants.SHORTCUT_NAMES.UP);
  }
}
