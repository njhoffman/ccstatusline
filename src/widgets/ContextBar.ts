import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    CustomKeybind,
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';
import { getContextWindowMetrics } from '../utils/context-window';
import {
    getContextConfig,
    getModelContextIdentifier
} from '../utils/model-context';
import {
    formatPercent,
    resolveNumberFormat
} from '../utils/number-format';
import { formatTokens } from '../utils/renderer';
import { makeUsageProgressBar } from '../utils/usage';

import { formatRawOrLabeledValue } from './shared/raw-or-labeled';
import { makeSliderBar } from './shared/usage-display';

const LABEL = 'Context: ';

type DisplayMode = 'progress' | 'progress-short' | 'slider';
type LabelMode = 'full' | 'percent' | 'tokens' | 'none';

const LABEL_MODE_TEXT: Record<Exclude<LabelMode, 'full'>, string> = {
    percent: 'percent label',
    tokens: 'tokens label',
    none: 'no label'
};

function getDisplayMode(item: WidgetItem): DisplayMode {
    const mode = item.metadata?.display;
    if (mode === 'progress' || mode === 'slider') {
        return mode;
    }
    // Legacy 'slider-only' is a slider with no label (see getLabelMode)
    if (mode === 'slider-only') {
        return 'slider';
    }
    return 'progress-short';
}

function getLabelMode(item: WidgetItem): LabelMode {
    const labels = item.metadata?.labels;
    if (labels === 'percent' || labels === 'tokens' || labels === 'none') {
        return labels;
    }
    if (item.metadata?.display === 'slider-only') {
        return 'none';
    }
    return 'full';
}

function formatBarLabel(bar: string, mode: LabelMode, usedDisplay: string, totalDisplay: string, percentDisplay: string): string {
    switch (mode) {
        case 'percent':
            return `${bar} ${percentDisplay}`;
        case 'tokens':
            return `${bar} ${usedDisplay}/${totalDisplay}`;
        case 'none':
            return bar;
        default:
            return `${bar} ${usedDisplay}/${totalDisplay} (${percentDisplay})`;
    }
}

// Normalize legacy 'slider-only' into display + labels before changing either
function normalizeMetadata(item: WidgetItem): Record<string, string> {
    const metadata = { ...(item.metadata ?? {}) };
    if (metadata.display === 'slider-only') {
        metadata.display = 'slider';
        if (!('labels' in metadata)) {
            metadata.labels = 'none';
        }
    }
    return metadata;
}

export class ContextBarWidget implements Widget {
    getDefaultColor(): string { return 'blue'; }
    getDescription(): string { return 'Shows context usage as a progress bar'; }
    getDisplayName(): string { return 'Context Bar'; }
    getCategory(): string { return 'Context'; }
    getLabelPrefix(): string { return LABEL; }

    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        const mode = getDisplayMode(item);
        const modifiers: string[] = [];

        if (mode === 'progress-short') {
            modifiers.push('medium bar');
        } else if (mode === 'slider') {
            modifiers.push('short bar');
        }

        const labelMode = getLabelMode(item);
        if (labelMode !== 'full') {
            modifiers.push(LABEL_MODE_TEXT[labelMode]);
        }

        return {
            displayText: this.getDisplayName(),
            modifierText: modifiers.length > 0 ? `(${modifiers.join(', ')})` : undefined
        };
    }

    handleEditorAction(action: string, item: WidgetItem): WidgetItem | null {
        if (action === 'toggle-progress') {
            const currentMode = getDisplayMode(item);
            const nextMode: DisplayMode = currentMode === 'progress-short'
                ? 'progress'
                : currentMode === 'progress'
                    ? 'slider'
                    : 'progress-short';

            return {
                ...item,
                metadata: {
                    ...normalizeMetadata(item),
                    display: nextMode
                }
            };
        }

        if (action === 'cycle-labels') {
            const currentLabels = getLabelMode(item);
            const nextLabels: LabelMode = currentLabels === 'full'
                ? 'percent'
                : currentLabels === 'percent'
                    ? 'tokens'
                    : currentLabels === 'tokens'
                        ? 'none'
                        : 'full';

            const metadata = normalizeMetadata(item);
            if (nextLabels === 'full') {
                delete metadata.labels;
            } else {
                metadata.labels = nextLabels;
            }

            return {
                ...item,
                metadata: Object.keys(metadata).length > 0 ? metadata : undefined
            };
        }

        return null;
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        const displayMode = getDisplayMode(item);
        const labelMode = getLabelMode(item);
        const tokenFormat = resolveNumberFormat('token', item, settings);
        const percentFormat = resolveNumberFormat('percent', item, settings);

        if (context.isPreview) {
            const usedDisplay = formatTokens(50000, tokenFormat, 0);
            const totalDisplay = formatTokens(200000, tokenFormat, 0);
            const percentDisplay = formatPercent(25, percentFormat, 0);
            const previewBar = displayMode === 'slider'
                ? makeSliderBar(25)
                : makeUsageProgressBar(25, displayMode === 'progress' ? 32 : 16);
            const previewDisplay = formatBarLabel(previewBar, labelMode, usedDisplay, totalDisplay, percentDisplay);
            return formatRawOrLabeledValue(item, this.getLabelPrefix(), previewDisplay);
        }

        const contextWindowMetrics = getContextWindowMetrics(context.data);

        let total = contextWindowMetrics.windowSize;
        let used = contextWindowMetrics.contextLengthTokens;

        if (used === null && context.tokenMetrics) {
            used = context.tokenMetrics.contextLength;
        }

        if (total === null && context.tokenMetrics) {
            const modelIdentifier = getModelContextIdentifier(context.data?.model);
            total = getContextConfig(modelIdentifier).maxTokens;
        }

        if (used === null || total === null || total <= 0) {
            return null;
        }

        const percent = (used / total) * 100;
        const clampedPercent = Math.max(0, Math.min(100, percent));
        const usedDisplay = formatTokens(used, tokenFormat, 0);
        const totalDisplay = formatTokens(total, tokenFormat, 0);
        const percentDisplay = formatPercent(clampedPercent, percentFormat, 0);

        const bar = displayMode === 'slider'
            ? makeSliderBar(clampedPercent)
            : makeUsageProgressBar(clampedPercent, displayMode === 'progress' ? 32 : 16);
        const display = formatBarLabel(bar, labelMode, usedDisplay, totalDisplay, percentDisplay);

        return formatRawOrLabeledValue(item, this.getLabelPrefix(), display);
    }

    getCustomKeybinds(): CustomKeybind[] {
        return [
            { key: 'p', label: '(p)rogress toggle', action: 'toggle-progress' },
            { key: 'l', label: '(l)abels', action: 'cycle-labels' }
        ];
    }

    supportsRawValue(): boolean { return true; }

    supportsColors(item: WidgetItem): boolean { return true; }
    supportsNumberFormat(): boolean { return true; }
}
