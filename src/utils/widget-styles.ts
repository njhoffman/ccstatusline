import type { PowerlineConfig } from '../types/PowerlineConfig';
import type { Settings } from '../types/Settings';
import {
    WidgetStyleSchema,
    type WidgetStyleName
} from '../types/WidgetStyle';

export interface WidgetStyleDefinition {
    name: string;
    description: string;
    usesPowerline: boolean;
    overrides: {
        defaultSeparator?: string;
        defaultPadding?: string;
        globalBold?: boolean;
        inheritSeparatorColors?: boolean;
        powerline?: Partial<PowerlineConfig>;
    };
}

export const WIDGET_STYLE_DEFINITIONS: Record<WidgetStyleName, WidgetStyleDefinition> = {
    classic: {
        name: 'Classic',
        description: 'Default style with configurable separators',
        usesPowerline: false,
        overrides: {}
    },
    bubble: {
        name: 'Bubble',
        description: 'Rounded bubble segments with colored backgrounds',
        usesPowerline: true,
        overrides: {
            defaultPadding: ' ',
            powerline: {
                enabled: true,
                separators: [' '],
                separatorInvertBackground: [false],
                startCaps: [],
                endCaps: [],
                segmentCaps: {
                    start: '\uE0B6',
                    end: '\uE0B4',
                    gap: ' '
                }
            }
        }
    },
    slashed: {
        name: 'Slashed',
        description: 'Forward slash separators between widgets',
        usesPowerline: false,
        overrides: {
            defaultSeparator: '/',
            defaultPadding: ' '
        }
    },
    minimal: {
        name: 'Minimal',
        description: 'No separators or padding, compact display',
        usesPowerline: false,
        overrides: {
            defaultSeparator: ' ',
            defaultPadding: ''
        }
    },
    rainbow: {
        name: 'Rainbow',
        description: 'Powerline arrows with cycling background colors',
        usesPowerline: true,
        overrides: {
            defaultPadding: ' ',
            powerline: {
                enabled: true,
                separators: ['\uE0B0'],
                separatorInvertBackground: [false],
                startCaps: [],
                endCaps: []
            }
        }
    },
    pure: {
        name: 'Pure',
        description: 'Bold foreground text only, no backgrounds or separators',
        usesPowerline: false,
        overrides: {
            defaultSeparator: ' ',
            defaultPadding: ' ',
            globalBold: true
        }
    }
};

export function getWidgetStyleNames(): WidgetStyleName[] {
    return [...WidgetStyleSchema.options];
}

export function getWidgetStyleDefinition(name: WidgetStyleName): WidgetStyleDefinition {
    return WIDGET_STYLE_DEFINITIONS[name];
}

export function getWidgetStyleDescription(name: WidgetStyleName): string {
    return WIDGET_STYLE_DEFINITIONS[name].description;
}

export function applyWidgetStyle(settings: Settings): Settings {
    const styleName = settings.widgetStyle;
    if (styleName === 'classic') {
        return settings;
    }

    const style = WIDGET_STYLE_DEFINITIONS[styleName];

    const overrides = style.overrides;
    const effectiveSettings: Settings = {
        ...settings,
        defaultSeparator: overrides.defaultSeparator ?? settings.defaultSeparator,
        defaultPadding: overrides.defaultPadding ?? settings.defaultPadding,
        globalBold: overrides.globalBold ?? settings.globalBold,
        inheritSeparatorColors: overrides.inheritSeparatorColors ?? settings.inheritSeparatorColors
    };

    if (style.usesPowerline && overrides.powerline) {
        effectiveSettings.powerline = {
            ...settings.powerline,
            ...overrides.powerline,
            enabled: true,
            // Preserve user's theme selection for color cycling
            theme: settings.powerline.theme ?? overrides.powerline.theme
        };
    } else if (!style.usesPowerline) {
        // Non-powerline styles disable powerline mode
        effectiveSettings.powerline = {
            ...settings.powerline,
            enabled: false
        };
    }

    return effectiveSettings;
}