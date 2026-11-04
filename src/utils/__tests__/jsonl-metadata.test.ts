import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it
} from 'vitest';

import {
    getThinkingEffortUpdate,
    getTranscriptThinkingEffort,
    normalizeThinkingEffort
} from '../jsonl-metadata';

function stdoutRecord(text: string) {
    return { message: { content: `<local-command-stdout>${text}</local-command-stdout>` } };
}

describe('normalizeThinkingEffort', () => {
    it.each(['low', 'medium', 'high', 'xhigh', 'max'])('recognises %s', (effort) => {
        expect(normalizeThinkingEffort(effort)).toEqual({ value: effort, known: true });
    });

    it('ignores case', () => {
        expect(normalizeThinkingEffort('HIGH')).toEqual({ value: 'high', known: true });
    });

    it('keeps plausible future values, marked unknown', () => {
        expect(normalizeThinkingEffort('ultra-max')).toEqual({ value: 'ultra-max', known: false });
    });

    it.each([undefined, '', 'x', 'a'.repeat(21), 'has space', '---'])('rejects %j', (value) => {
        expect(normalizeThinkingEffort(value)).toBeUndefined();
    });
});

describe('getThinkingEffortUpdate', () => {
    it.each([null, {}, { message: {} }, { message: { content: ['not a string'] } }, { message: { content: 'hello' } }])(
        'ignores unrelated record %j',
        (record) => {
            expect(getThinkingEffortUpdate(record)).toBeNull();
        }
    );

    it('reads /effort output', () => {
        expect(getThinkingEffortUpdate(stdoutRecord('Set effort level to high'))).toEqual({ effort: { value: 'high', known: true } });
    });

    it('reads /model output with an effort, through ANSI codes', () => {
        const record = stdoutRecord('Set model to \u001B[1mopus\u001B[22m with xhigh effort');
        expect(getThinkingEffortUpdate(record)).toEqual({ effort: { value: 'xhigh', known: true } });
    });

    it('clears the effort when /model output has none', () => {
        expect(getThinkingEffortUpdate(stdoutRecord('Set model to opus'))).toEqual({ effort: undefined });
    });

    it('ignores the phrase when it is only quoted inside other text', () => {
        const record = { message: { content: 'see <local-command-stdout>Set effort level to high' } };
        expect(getThinkingEffortUpdate(record)).toBeNull();
    });
});

describe('getTranscriptThinkingEffort', () => {
    let dir: string;
    let transcript: string;

    function writeTranscript(records: unknown[]) {
        fs.writeFileSync(transcript, records.map(record => JSON.stringify(record)).join('\n'));
    }

    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccstatusline-jsonl-metadata-'));
        transcript = path.join(dir, 'transcript.jsonl');
    });

    afterEach(() => {
        fs.rmSync(dir, { recursive: true, force: true });
    });

    it('returns nothing without a path or a readable file', () => {
        expect(getTranscriptThinkingEffort(undefined)).toBeUndefined();
        expect(getTranscriptThinkingEffort(path.join(dir, 'missing.jsonl'))).toBeUndefined();
    });

    it('uses the latest change', () => {
        writeTranscript([
            stdoutRecord('Set effort level to low'),
            { message: { content: 'chat' } },
            stdoutRecord('Set effort level to max'),
            { message: { content: 'more chat' } }
        ]);
        expect(getTranscriptThinkingEffort(transcript)).toEqual({ value: 'max', known: true });
    });

    it('treats a later /model without an effort as clearing it', () => {
        writeTranscript([stdoutRecord('Set effort level to max'), stdoutRecord('Set model to opus')]);
        expect(getTranscriptThinkingEffort(transcript)).toBeUndefined();
    });

    it('skips malformed lines', () => {
        fs.writeFileSync(transcript, `${JSON.stringify(stdoutRecord('Set effort level to low'))}\n{ not json\n`);
        expect(getTranscriptThinkingEffort(transcript)).toEqual({ value: 'low', known: true });
    });
});
