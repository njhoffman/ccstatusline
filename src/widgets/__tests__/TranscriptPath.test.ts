import {
    describe,
    expect,
    it
} from 'vitest';

import type { RenderContext } from '../../types';
import { DEFAULT_SETTINGS } from '../../types/Settings';
import { TranscriptPathWidget } from '../TranscriptPath';

describe('TranscriptPath widget', () => {
    it('renders transcript path from context data', () => {
        const widget = new TranscriptPathWidget();
        const context: RenderContext = { data: { transcript_path: '/home/user/.claude/transcripts/session.jsonl' } };

        expect(widget.render({ id: 'tp', type: 'transcript-path' }, context, DEFAULT_SETTINGS))
            .toBe('/home/user/.claude/transcripts/session.jsonl');
    });

    it('returns null when transcript_path is missing', () => {
        const widget = new TranscriptPathWidget();
        const context: RenderContext = { data: {} };

        expect(widget.render({ id: 'tp', type: 'transcript-path' }, context, DEFAULT_SETTINGS))
            .toBeNull();
    });

    it('returns null when data is missing', () => {
        const widget = new TranscriptPathWidget();
        const context: RenderContext = {};

        expect(widget.render({ id: 'tp', type: 'transcript-path' }, context, DEFAULT_SETTINGS))
            .toBeNull();
    });

    it('renders preview text in preview mode', () => {
        const widget = new TranscriptPathWidget();
        const context: RenderContext = { isPreview: true };

        expect(widget.render({ id: 'tp', type: 'transcript-path' }, context, DEFAULT_SETTINGS))
            .toBe('~/.claude/transcripts/session.jsonl');
    });

    it('has correct metadata', () => {
        const widget = new TranscriptPathWidget();
        expect(widget.getDefaultColor()).toBe('brightBlack');
        expect(widget.getCategory()).toBe('Other');
        expect(widget.getDisplayName()).toBe('Transcript Path');
        expect(widget.supportsRawValue()).toBe(false);
        expect(widget.supportsColors({ id: 'tp', type: 'transcript-path' })).toBe(true);
    });
});