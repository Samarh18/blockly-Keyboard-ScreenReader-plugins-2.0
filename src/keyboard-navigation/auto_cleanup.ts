/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Auto-layout system that organizes top-level block stacks
 * into a single column on the left edge of the workspace.
 */

import * as Blockly from 'blockly/core';

/**
 * Organizes all top-level (parentless) block stacks into a single left-edge
 * column whenever a block is added or the workspace finishes loading.
 * Layout constants: x=20, y=20 start, 40px vertical gap between stacks.
 */
export class AutoCleanup {
    private workspace: Blockly.WorkspaceSvg;
    private layoutTimeout: number | null = null;
    private readonly LAYOUT_DELAY = 100;
    private static readonly LEFT_OFFSET = 20;
    private static readonly TOP_OFFSET = 20;
    private static readonly VERTICAL_GAP = 40;

    constructor(workspace: Blockly.WorkspaceSvg) {
        this.workspace = workspace;
        this.initEventListeners();
        this.scheduleLayout();
    }

    private initEventListeners(): void {
        this.workspace.addChangeListener((event: Blockly.Events.Abstract) => {
            if (event.type === Blockly.Events.BLOCK_CREATE ||
                event.type === Blockly.Events.FINISHED_LOADING) {
                this.scheduleLayout();
            }
        });
    }

    private scheduleLayout(): void {
        if (this.layoutTimeout) {
            clearTimeout(this.layoutTimeout);
        }
        this.layoutTimeout = window.setTimeout(() => {
            this.performLayout();
            this.layoutTimeout = null;
        }, this.LAYOUT_DELAY);
    }

    private performLayout(): void {
        if (this.workspace.options.readOnly) return;

        const topBlocks = this.workspace.getTopBlocks(false).filter(
            (block) => block.getParent() === null,
        );

        if (topBlocks.length === 0) return;

        Blockly.Events.disable();
        try {
            let y = AutoCleanup.TOP_OFFSET;
            for (const block of topBlocks) {
                block.moveTo(
                    new Blockly.utils.Coordinate(AutoCleanup.LEFT_OFFSET, y),
                );
                const size = block.getHeightWidth();
                y += size.height + AutoCleanup.VERTICAL_GAP;
            }
        } finally {
            Blockly.Events.enable();
        }
    }

    dispose(): void {
        if (this.layoutTimeout) {
            clearTimeout(this.layoutTimeout);
            this.layoutTimeout = null;
        }
    }
}
