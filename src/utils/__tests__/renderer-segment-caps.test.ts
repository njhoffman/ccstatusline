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
import {
    renderStatusLine,
    type PreRenderedWidget
} from '../renderer';

// Hex colors produce raw truecolor codes, so expected strings do not depend
// on chalk's ambient color-support detection.
const A_FG = 'hex:AABBCC';
const A_BG = 'hex:112233';
const B_FG = 'hex:DDEEFF';
const B_BG = 'hex:445566';

const A_FG_CODE = '\x1b[38;2;170;187;204m';
const A_BG_CODE = '\x1b[48;2;17;34;51m';
const A_BG_AS_FG_CODE = '\x1b[38;2;17;34;51m';
const B_FG_CODE = '\x1b[38;2;221;238;255m';
const B_BG_CODE = '\x1b[48;2;68;85;102m';
const B_BG_AS_FG_CODE = '\x1b[38;2;68;85;102m';

const BOLD = '\x1b[1m';
const INTENSITY_RESET = '\x1b[22m';
const FG_RESET = '\x1b[39m';
// Emitted after each Powerline widget's text.
const COLOR_RESET = '\x1b[49m\x1b[39m';

const SEGMENT_CAPS = { start: '(', end: ')', gap: '_' };

type PowerlineOverrides = Partial<Settings['powerline']>;

function text(id: string, extra: Partial<WidgetItem> = {}): WidgetItem {
    return { id, type: 'custom-text', ...extra };
}

const FLEX: WidgetItem = { id: 'flex', type: 'flex-separator' };

function segmentCapSettings(powerline: PowerlineOverrides = {}): Settings {
    return {
        ...DEFAULT_SETTINGS,
        colorLevel: 3,
        powerline: {
            ...DEFAULT_SETTINGS.powerline,
            enabled: true,
            separators: ['>'],
            separatorInvertBackground: [false],
            segmentCaps: SEGMENT_CAPS,
            ...powerline
        }
    };
}

function preRender(widgets: WidgetItem[], contentByIndex: Record<number, string>): PreRenderedWidget[] {
    return widgets.map((widget, i) => {
        const content = contentByIndex[i] ?? '';
        return { content, plainLength: content.length, widget };
    });
}

// terminalWidth 0 means "width unknown": no truncation, and each flex
// separator collapses to a single space.
function render(
    widgets: WidgetItem[],
    contentByIndex: Record<number, string>,
    settings: Settings = segmentCapSettings()
): string {
    const context: RenderContext = { isPreview: false, terminalWidth: 0 };
    return renderStatusLine(widgets, settings, context, preRender(widgets, contentByIndex), []);
}

const segmentA = (content = 'A'): string => `${A_BG_AS_FG_CODE}(${FG_RESET}${A_FG_CODE}${A_BG_CODE}${content}${COLOR_RESET}${A_BG_AS_FG_CODE})${FG_RESET}`;
const segmentB = (content = 'B'): string => `${B_BG_AS_FG_CODE}(${FG_RESET}${B_FG_CODE}${B_BG_CODE}${content}${COLOR_RESET}${B_BG_AS_FG_CODE})${FG_RESET}`;

describe('powerline segment caps', () => {
    it('wraps each widget in caps colored by its background, joined by the gap instead of separators', () => {
        const widgets = [
            text('a', { color: A_FG, backgroundColor: A_BG }),
            text('b', { color: B_FG, backgroundColor: B_BG })
        ];

        const line = render(widgets, { 0: 'A', 1: 'B' });

        expect(line).toBe(`${segmentA()}_${segmentB()}`);
    });

    it('keeps merged widgets inside one segment', () => {
        const widgets = [
            text('a', { color: A_FG, backgroundColor: A_BG, merge: true }),
            text('b', { color: A_FG, backgroundColor: A_BG })
        ];

        const line = render(widgets, { 0: 'A', 1: 'B' });

        expect(line).toBe(
            `${A_BG_AS_FG_CODE}(${FG_RESET}`
            + `${A_FG_CODE}${A_BG_CODE}A${COLOR_RESET}`
            + `${A_FG_CODE}${A_BG_CODE}B${COLOR_RESET}`
            + `${A_BG_AS_FG_CODE})${FG_RESET}`
        );
    });

    it('closes the segment before a flex separator and reopens after it without a gap', () => {
        const widgets = [
            text('a', { color: A_FG, backgroundColor: A_BG }),
            FLEX,
            text('b', { color: B_FG, backgroundColor: B_BG })
        ];

        const line = render(widgets, { 0: 'A', 2: 'B' });

        expect(line).toBe(`${segmentA()} ${segmentB()}`);
    });

    it('ignores line-level start and end caps', () => {
        const widgets = [text('a', { color: A_FG, backgroundColor: A_BG })];

        const line = render(widgets, { 0: 'A' }, segmentCapSettings({ startCaps: ['['], endCaps: [']'] }));

        expect(line).toBe(segmentA());
    });

    it('emits uncolored caps for widgets without a background', () => {
        const widgets = [text('a', { color: A_FG }), text('b', { color: B_FG })];

        const line = render(widgets, { 0: 'A', 1: 'B' });

        expect(line).toBe(`(${A_FG_CODE}A${COLOR_RESET})_(${B_FG_CODE}B${COLOR_RESET})`);
    });

    it('ends bold before the end cap so caps are never bold', () => {
        const widgets = [text('a', { color: A_FG, backgroundColor: A_BG, bold: true })];

        const line = render(widgets, { 0: 'A' });

        expect(line).toBe(
            `${A_BG_AS_FG_CODE}(${FG_RESET}`
            + `${BOLD}${A_FG_CODE}${A_BG_CODE}A${COLOR_RESET}${INTENSITY_RESET}`
            + `${A_BG_AS_FG_CODE})${FG_RESET}`
        );
    });

    it('renders padded bubble segments from the widget style even when powerline is disabled', () => {
        const settings: Settings = {
            ...DEFAULT_SETTINGS,
            colorLevel: 3,
            widgetStyle: 'bubble',
            powerline: { ...DEFAULT_SETTINGS.powerline, enabled: false }
        };
        const widgets = [
            text('a', { color: A_FG, backgroundColor: A_BG }),
            text('b', { color: B_FG, backgroundColor: B_BG })
        ];

        const line = render(widgets, { 0: 'A', 1: 'B' }, settings);

        expect(line).toBe(
            `${A_BG_AS_FG_CODE}\uE0B6${FG_RESET}${A_FG_CODE}${A_BG_CODE} A ${COLOR_RESET}${A_BG_AS_FG_CODE}\uE0B4${FG_RESET}`
            + ' '
            + `${B_BG_AS_FG_CODE}\uE0B6${FG_RESET}${B_FG_CODE}${B_BG_CODE} B ${COLOR_RESET}${B_BG_AS_FG_CODE}\uE0B4${FG_RESET}`
        );
    });
});
