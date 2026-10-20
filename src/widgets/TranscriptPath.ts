import type { RenderContext } from '../types/RenderContext';
import type { Settings } from '../types/Settings';
import type {
    Widget,
    WidgetEditorDisplay,
    WidgetItem
} from '../types/Widget';

export class TranscriptPathWidget implements Widget {
    getDefaultColor(): string { return 'brightBlack'; }
    getDescription(): string { return 'Shows the path to the current transcript file'; }
    getDisplayName(): string { return 'Transcript Path'; }
    getCategory(): string { return 'Other'; }
    getEditorDisplay(item: WidgetItem): WidgetEditorDisplay {
        return { displayText: this.getDisplayName() };
    }

    render(item: WidgetItem, context: RenderContext, settings: Settings): string | null {
        if (context.isPreview) {
            return '~/.claude/transcripts/session.jsonl';
        }

        const transcriptPath = context.data?.transcript_path;
        if (transcriptPath) {
            return transcriptPath;
        }
        return null;
    }

    supportsRawValue(): boolean { return false; }
    supportsColors(item: WidgetItem): boolean { return true; }
}