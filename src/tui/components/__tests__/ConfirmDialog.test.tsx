import React from 'react';
import {
    describe,
    expect,
    it,
    vi
} from 'vitest';

import {
    KEYS,
    renderComponent
} from '../../__tests__/helpers/render-component';
import { ConfirmDialog } from '../ConfirmDialog';

function setUp(props: { busy?: boolean; inline?: boolean } = {}) {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const dialog = renderComponent(<ConfirmDialog message='Really?' onConfirm={onConfirm} onCancel={onCancel} {...props} />);
    return { dialog, onConfirm, onCancel };
}

describe('ConfirmDialog', () => {
    it('confirms with Enter on Yes', async () => {
        const { dialog, onConfirm, onCancel } = setUp();

        try {
            await dialog.waitForFrame('▶  Yes');
            expect(dialog.frame()).toContain('Really?');
            await dialog.pressKeyAndExpect(KEYS.enter, () => {
                expect(onConfirm).toHaveBeenCalledTimes(1);
            });
            expect(onCancel).not.toHaveBeenCalled();
        } finally {
            dialog.cleanup();
        }
    });

    it('cancels with Enter on No', async () => {
        const { dialog, onConfirm, onCancel } = setUp();

        try {
            await dialog.waitForFrame('▶  Yes');
            await dialog.pressKey(KEYS.down, '▶  No');
            await dialog.pressKeyAndExpect(KEYS.enter, () => {
                expect(onCancel).toHaveBeenCalledTimes(1);
            });
            expect(onConfirm).not.toHaveBeenCalled();
        } finally {
            dialog.cleanup();
        }
    });

    it('cancels with Esc', async () => {
        const { dialog, onCancel } = setUp();

        try {
            await dialog.waitForFrame('▶  Yes');
            await dialog.pressKeyAndExpect(KEYS.escape, () => {
                expect(onCancel).toHaveBeenCalledTimes(1);
            });
        } finally {
            dialog.cleanup();
        }
    });

    it('replaces the options with a working line and ignores Esc while busy', async () => {
        const { dialog, onConfirm, onCancel } = setUp({ busy: true });

        try {
            await dialog.waitForFrame('Working...');
            expect(dialog.frame()).not.toContain('Yes');

            await dialog.pressKey(KEYS.escape, 'Working...');
            await new Promise((resolve) => {
                setTimeout(resolve, 100);
            });
            expect(onCancel).not.toHaveBeenCalled();
            expect(onConfirm).not.toHaveBeenCalled();
        } finally {
            dialog.cleanup();
        }
    });

    it('leaves out the message when inline', async () => {
        const { dialog, onConfirm } = setUp({ inline: true });

        try {
            await dialog.waitForFrame('▶  Yes');
            expect(dialog.frame()).not.toContain('Really?');
            await dialog.pressKeyAndExpect(KEYS.enter, () => {
                expect(onConfirm).toHaveBeenCalledTimes(1);
            });
        } finally {
            dialog.cleanup();
        }
    });
});
