import React from 'react';
import {
    describe,
    expect,
    it,
    vi
} from 'vitest';

import {
    DEFAULT_SETTINGS,
    type Settings
} from '../../../types/Settings';
import {
    KEYS,
    renderComponent
} from '../../__tests__/helpers/render-component';
import { WidgetStyleSelector } from '../WidgetStyleSelector';

const SETTINGS: Settings = { ...DEFAULT_SETTINGS, widgetStyle: 'classic' };

function setUp(settings: Settings = SETTINGS) {
    const onUpdate = vi.fn();
    const onBack = vi.fn();
    const selector = renderComponent(<WidgetStyleSelector settings={settings} onUpdate={onUpdate} onBack={onBack} />);
    return { selector, onUpdate, onBack };
}

describe('WidgetStyleSelector', () => {
    it('lists the styles in order, on the current one, without applying anything', async () => {
        const { selector, onUpdate } = setUp();

        try {
            await selector.waitForFrame('▶  Classic (current)');
            // After the header, which also names the current style
            const frame = selector.frame().slice(selector.frame().indexOf('ESC cancel'));
            const positions = ['Minimal', 'Pure', 'Slashed', 'Classic', 'Bubble', 'Rainbow'].map(name => frame.indexOf(name));
            expect(positions).toEqual([...positions].sort((a, b) => a - b));
            expect(positions).not.toContain(-1);
            expect(onUpdate).not.toHaveBeenCalled();
        } finally {
            selector.cleanup();
        }
    });

    it('previews the highlighted style as the cursor moves', async () => {
        const { selector, onUpdate } = setUp();

        try {
            await selector.waitForFrame('▶  Classic');
            await selector.pressKey(KEYS.down, '▶  Bubble');
            await selector.pressKeyAndExpect(KEYS.up, () => {
                expect(selector.frame()).toContain('▶  Classic');
                expect(onUpdate).toHaveBeenLastCalledWith({ ...SETTINGS, widgetStyle: 'classic' });
            });
            expect(onUpdate).toHaveBeenCalledWith({ ...SETTINGS, widgetStyle: 'bubble' });
        } finally {
            selector.cleanup();
        }
    });

    it('moves with j and k', async () => {
        const { selector } = setUp();

        try {
            await selector.waitForFrame('▶  Classic');
            await selector.pressKey('j', '▶  Bubble');
            await selector.pressKey('k', '▶  Classic');
        } finally {
            selector.cleanup();
        }
    });

    it('keeps the choice on Enter', async () => {
        const { selector, onUpdate, onBack } = setUp();

        try {
            await selector.waitForFrame('▶  Classic');
            await selector.pressKey(KEYS.down, '▶  Bubble');
            await selector.pressKeyAndExpect(KEYS.enter, () => {
                expect(onBack).toHaveBeenCalledTimes(1);
            });
            expect(onUpdate).toHaveBeenLastCalledWith({ ...SETTINGS, widgetStyle: 'bubble' });
        } finally {
            selector.cleanup();
        }
    });

    it('restores the original settings on Esc', async () => {
        const { selector, onUpdate, onBack } = setUp();

        try {
            await selector.waitForFrame('▶  Classic');
            await selector.pressKey(KEYS.down, '▶  Bubble');
            await selector.pressKeyAndExpect(KEYS.escape, () => {
                expect(onBack).toHaveBeenCalledTimes(1);
            });
            expect(onUpdate).toHaveBeenLastCalledWith(SETTINGS);
        } finally {
            selector.cleanup();
        }
    });

    it('keeps labelling the style it opened on as current after moving', async () => {
        const { selector } = setUp();

        try {
            await selector.waitForFrame('▶  Classic');
            await selector.pressKey(KEYS.down, '▶  Bubble');
            expect(selector.frame()).toContain('Classic (current)');
            expect(selector.frame()).toContain('Current: Classic');
        } finally {
            selector.cleanup();
        }
    });
});
