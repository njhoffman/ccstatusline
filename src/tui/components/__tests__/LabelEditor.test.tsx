import React from 'react';
import {
    describe,
    expect,
    it,
    vi
} from 'vitest';

import type { WidgetItem } from '../../../types/Widget';
import {
    KEYS,
    renderComponent
} from '../../__tests__/helpers/render-component';
import { LabelEditor } from '../LabelEditor';

const WIDGET: WidgetItem = { id: '1', type: 'model' };

function setUp(widget: WidgetItem = WIDGET) {
    const onComplete = vi.fn();
    const onCancel = vi.fn();
    const onPreview = vi.fn();
    const editor = renderComponent(
        <LabelEditor
            widget={widget}
            defaultLabel='Model: '
            onComplete={onComplete}
            onCancel={onCancel}
            onPreview={onPreview}
        />
    );
    return { editor, onComplete, onCancel, onPreview };
}

describe('LabelEditor', () => {
    it('starts from the default label, which it keeps visible', async () => {
        const { editor } = setUp();

        try {
            await editor.waitForFrame('"Model:  " (default: "Model: ")');
        } finally {
            editor.cleanup();
        }
    });

    it('starts from an existing label', async () => {
        const { editor } = setUp({ ...WIDGET, metadata: { label: 'M ' } });

        try {
            await editor.waitForFrame('"M  " (default: "Model: ")');
        } finally {
            editor.cleanup();
        }
    });

    it('previews each edit and saves on Enter', async () => {
        const { editor, onComplete, onPreview } = setUp();

        try {
            await editor.waitForFrame('"Model:  "');
            await editor.pressKey('X', '"Model: X "');
            expect(onPreview).toHaveBeenLastCalledWith({ ...WIDGET, metadata: { label: 'Model: X' } });

            await editor.pressKeyAndExpect(KEYS.enter, () => {
                expect(onComplete).toHaveBeenCalledWith({ ...WIDGET, metadata: { label: 'Model: X' } });
            });
        } finally {
            editor.cleanup();
        }
    });

    it('does not preview a key that leaves the text alone', async () => {
        const { editor, onPreview } = setUp();

        try {
            await editor.waitForFrame('"Model:  "');
            await editor.pressKeyAndExpect(KEYS.left, () => {
                expect(editor.frame()).toContain('"Model: "');
            });
            expect(onPreview).not.toHaveBeenCalled();
        } finally {
            editor.cleanup();
        }
    });

    it('resets to the default on Tab', async () => {
        const { editor, onComplete } = setUp({ ...WIDGET, metadata: { label: 'M ' } });

        try {
            await editor.waitForFrame('"M  "');
            await editor.pressKeyAndExpect(KEYS.tab, () => {
                expect(onComplete).toHaveBeenCalledTimes(1);
            });
            const saved = onComplete.mock.calls[0]?.[0] as WidgetItem;
            expect(saved.metadata?.label).toBeUndefined();
        } finally {
            editor.cleanup();
        }
    });

    it('cancels on Esc without saving', async () => {
        const { editor, onComplete, onCancel } = setUp();

        try {
            await editor.waitForFrame('"Model:  "');
            await editor.pressKeyAndExpect(KEYS.escape, () => {
                expect(onCancel).toHaveBeenCalledTimes(1);
            });
            expect(onComplete).not.toHaveBeenCalled();
        } finally {
            editor.cleanup();
        }
    });
});
