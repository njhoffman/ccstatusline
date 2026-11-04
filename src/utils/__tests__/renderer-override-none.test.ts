import {
    describe,
    expect,
    it
} from 'vitest';

import type { RenderContext } from '../../types/RenderContext';
import {
    DEFAULT_SETTINGS,
    type Settings
} from '../../types/Settings';
import type { WidgetItem } from '../../types/Widget';
import { getVisibleText } from '../ansi';
import {
    calculateMaxWidthsFromPreRendered,
    preRenderAllWidgets,
    renderStatusLine,
    type PreRenderedWidget
} from '../renderer';

// Hex colors bypass chalk, so the expected codes do not depend on its level.
const BG_CODE = /\x1b\[(?:4[0-7]|10[0-7]|48;[25];[\d;]+)m/;
const FG_CODE = /\x1b\[(?:3[0-7]|9[0-7]|38;[25];[\d;]+)m/;
const A_FG_CODE = '\x1b[38;2;170;187;204m';
const A_BG_CODE = '\x1b[48;2;17;34;51m';
const B_BG_CODE = '\x1b[48;2;68;85;102m';
const OVERRIDE_BG_CODE = '\x1b[48;2;255;0;0m';

function createSettings(overrides: Partial<Settings> = {}): Settings {
    return {
        ...DEFAULT_SETTINGS,
        colorLevel: 3,
        defaultPadding: ' ',
        ...overrides,
        powerline: {
            ...DEFAULT_SETTINGS.powerline,
            ...(overrides.powerline ?? {})
        }
    };
}

function renderLine(widgets: WidgetItem[], settingsOverrides: Partial<Settings> = {}): string {
    const settings = createSettings(settingsOverrides);
    const context: RenderContext = { isPreview: false, terminalWidth: 200 };
    const preRenderedLines = preRenderAllWidgets([widgets], settings, context);
    const preCalculatedMaxWidths = calculateMaxWidthsFromPreRendered(preRenderedLines, settings);
    return renderStatusLine(widgets, settings, context, preRenderedLines[0] ?? [], preCalculatedMaxWidths);
}

const widgets: WidgetItem[] = [
    { id: 'a', type: 'custom-text', customText: 'model', color: 'hex:AABBCC', backgroundColor: 'hex:112233' },
    { id: 'b', type: 'custom-text', customText: 'branch', color: 'hex:A89278', backgroundColor: 'hex:445566' }
];

describe('global override none', () => {
    it('keeps widget backgrounds when the background override is disabled', () => {
        const line = renderLine(widgets);
        expect(line).toContain(A_BG_CODE);
        expect(line).toContain(B_BG_CODE);
    });

    it('applies a solid background override to every widget', () => {
        const line = renderLine(widgets, { overrideBackgroundColor: 'hex:FF0000' });
        expect(line).toContain(OVERRIDE_BG_CODE);
        expect(line).not.toContain(A_BG_CODE);
        expect(line).not.toContain(B_BG_CODE);
    });

    it('strips every background when the background override is none', () => {
        const line = renderLine(widgets, { overrideBackgroundColor: 'none' });
        expect(line).not.toMatch(BG_CODE);
        expect(line).toMatch(FG_CODE);
        expect(getVisibleText(line)).toBe(getVisibleText(renderLine(widgets)));
    });

    it('strips backgrounds from inherited separators when the background override is none', () => {
        const line = renderLine(widgets, {
            overrideBackgroundColor: 'none',
            defaultSeparator: '|',
            inheritSeparatorColors: true
        });
        expect(line).toContain('|');
        expect(line).not.toMatch(BG_CODE);
    });

    it('strips every foreground when the foreground override is none', () => {
        const line = renderLine(widgets, { overrideForegroundColor: 'none' });
        expect(line).not.toMatch(FG_CODE);
        expect(line).toMatch(BG_CODE);
    });

    it('strips intrinsic ANSI colors from preserve-color widgets when the foreground override is none', () => {
        const widget: WidgetItem = { id: 'cmd', type: 'custom-command', preserveColors: true };
        const content = `${A_FG_CODE}red\x1b[39m`;
        const preRendered: PreRenderedWidget[] = [{ content, plainLength: 3, widget }];
        const line = renderStatusLine([widget], createSettings({ overrideForegroundColor: 'none' }), { isPreview: false, terminalWidth: 200 }, preRendered, []);
        expect(getVisibleText(line).trim()).toBe('red');
        expect(line).not.toMatch(FG_CODE);
    });

    it('drops the widget text foreground in powerline mode when the foreground override is none', () => {
        const line = renderLine(widgets, {
            overrideForegroundColor: 'none',
            powerline: { ...DEFAULT_SETTINGS.powerline, enabled: true }
        });
        expect(line).toContain(A_BG_CODE);
        expect(line).not.toContain(A_FG_CODE);
        expect(line).not.toContain('\x1b[38;2;168;146;120m');
    });
});

describe('pure widget style', () => {
    it('renders without backgrounds even when a background override is set', () => {
        const line = renderLine(widgets, { widgetStyle: 'pure', overrideBackgroundColor: 'hex:FF0000' });
        expect(line).not.toMatch(BG_CODE);
        expect(line).toMatch(FG_CODE);
    });
});
