import {
    describe,
    expect,
    it
} from 'vitest';

import { DEFAULT_SETTINGS } from '../../types/Settings';
import {
    WIDGET_STYLE_DEFINITIONS,
    applyWidgetStyle,
    getWidgetStyleDefinition,
    getWidgetStyleDescription,
    getWidgetStyleNames
} from '../widget-styles';

describe('widget-styles', () => {
    describe('getWidgetStyleNames', () => {
        it('returns all six style names', () => {
            const names = getWidgetStyleNames();
            expect(names).toContain('classic');
            expect(names).toContain('bubble');
            expect(names).toContain('slashed');
            expect(names).toContain('minimal');
            expect(names).toContain('rainbow');
            expect(names).toContain('pure');
            expect(names).toHaveLength(6);
        });

        it('returns styles in schema order', () => {
            expect(getWidgetStyleNames()).toEqual(['minimal', 'pure', 'slashed', 'classic', 'bubble', 'rainbow']);
        });
    });

    describe('getWidgetStyleDefinition', () => {
        it('returns definitions for all styles', () => {
            for (const name of getWidgetStyleNames()) {
                const def = getWidgetStyleDefinition(name);
                expect(def.name).toBeTruthy();
                expect(def.description).toBeTruthy();
                expect(typeof def.usesPowerline).toBe('boolean');
            }
        });
    });

    describe('getWidgetStyleDescription', () => {
        it('returns descriptions for all styles', () => {
            for (const name of getWidgetStyleNames()) {
                expect(getWidgetStyleDescription(name)).toBeTruthy();
            }
        });
    });

    describe('applyWidgetStyle', () => {
        it('returns settings unchanged for classic style', () => {
            const settings = { ...DEFAULT_SETTINGS, widgetStyle: 'classic' as const };
            const result = applyWidgetStyle(settings);
            expect(result).toBe(settings);
        });

        it('enables powerline for bubble style', () => {
            const settings = { ...DEFAULT_SETTINGS, widgetStyle: 'bubble' as const };
            const result = applyWidgetStyle(settings);
            expect(result.powerline.enabled).toBe(true);
        });

        it('sets segment caps for bubble style', () => {
            const settings = { ...DEFAULT_SETTINGS, widgetStyle: 'bubble' as const };
            const result = applyWidgetStyle(settings);
            expect(result.powerline.segmentCaps).toEqual({
                start: '\uE0B6',
                end: '\uE0B4',
                gap: ' '
            });
        });

        it('sets slash separator for slashed style', () => {
            const settings = { ...DEFAULT_SETTINGS, widgetStyle: 'slashed' as const };
            const result = applyWidgetStyle(settings);
            expect(result.defaultSeparator).toBe('/');
            expect(result.powerline.enabled).toBe(false);
        });

        it('removes separators and padding for minimal style', () => {
            const settings = { ...DEFAULT_SETTINGS, widgetStyle: 'minimal' as const };
            const result = applyWidgetStyle(settings);
            expect(result.defaultSeparator).toBe(' ');
            expect(result.defaultPadding).toBe('');
            expect(result.powerline.enabled).toBe(false);
        });

        it('enables powerline with arrow separators for rainbow style', () => {
            const settings = { ...DEFAULT_SETTINGS, widgetStyle: 'rainbow' as const };
            const result = applyWidgetStyle(settings);
            expect(result.powerline.enabled).toBe(true);
            expect(result.powerline.separators).toEqual(['\uE0B0']);
        });

        it('enables global bold for pure style', () => {
            const settings = { ...DEFAULT_SETTINGS, widgetStyle: 'pure' as const };
            const result = applyWidgetStyle(settings);
            expect(result.globalBold).toBe(true);
            expect(result.powerline.enabled).toBe(false);
        });

        it('preserves user powerline theme selection for powerline styles', () => {
            const settings = {
                ...DEFAULT_SETTINGS,
                widgetStyle: 'bubble' as const,
                powerline: {
                    ...DEFAULT_SETTINGS.powerline,
                    theme: 'nord'
                }
            };
            const result = applyWidgetStyle(settings);
            expect(result.powerline.theme).toBe('nord');
        });

        it('preserves non-overridden settings', () => {
            const settings = {
                ...DEFAULT_SETTINGS,
                widgetStyle: 'slashed' as const,
                colorLevel: 3 as const,
                overrideForegroundColor: 'red'
            };
            const result = applyWidgetStyle(settings);
            expect(result.colorLevel).toBe(3);
            expect(result.overrideForegroundColor).toBe('red');
        });
    });

    describe('WIDGET_STYLE_DEFINITIONS', () => {
        it('bubble and rainbow use powerline mode', () => {
            expect(WIDGET_STYLE_DEFINITIONS.bubble.usesPowerline).toBe(true);
            expect(WIDGET_STYLE_DEFINITIONS.rainbow.usesPowerline).toBe(true);
        });

        it('classic, slashed, minimal, pure do not use powerline mode', () => {
            expect(WIDGET_STYLE_DEFINITIONS.classic.usesPowerline).toBe(false);
            expect(WIDGET_STYLE_DEFINITIONS.slashed.usesPowerline).toBe(false);
            expect(WIDGET_STYLE_DEFINITIONS.minimal.usesPowerline).toBe(false);
            expect(WIDGET_STYLE_DEFINITIONS.pure.usesPowerline).toBe(false);
        });
    });
});