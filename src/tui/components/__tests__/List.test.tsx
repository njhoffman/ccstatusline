import {
    render,
    useInput
} from 'ink';
import { PassThrough } from 'node:stream';
import React, { useState } from 'react';
import stripAnsi from 'strip-ansi';
import {
    describe,
    expect,
    it
} from 'vitest';

import { waitFor } from '../../__tests__/helpers/wait-for-ink';
import { List } from '../List';

const DOWN = '\u001B[B';
const UP = '\u001B[A';

class MockTtyStream extends PassThrough {
    isTTY = true;
    columns = 80;
    rows = 24;

    setRawMode() {
        return this;
    }

    ref() {
        return this;
    }

    unref() {
        return this;
    }
}

const ITEMS = ['one', 'two', 'three', 'four', 'five'].map(value => ({ label: value, value }));

// A parent that hands the reported position back as initialSelection, as the
// TUI's menus do, but only after a delay. The "x" key moves the cursor from
// outside the list.
function EchoingParent({ echoDelayMs, itemCount = ITEMS.length }: { echoDelayMs: number; itemCount?: number }) {
    const [selection, setSelection] = useState(0);

    useInput((input) => {
        if (input === 'x') {
            setSelection(3);
        }
    });

    return (
        <List
            items={ITEMS.slice(0, itemCount)}
            initialSelection={selection}
            onSelect={() => undefined}
            onSelectionChange={(_, index) => {
                setTimeout(() => { setSelection(index); }, echoDelayMs);
            }}
        />
    );
}

function renderList(element: React.ReactElement) {
    const stdin = new MockTtyStream();
    const stdout = new MockTtyStream();
    const stderr = new MockTtyStream();
    const chunks: string[] = [];
    stdout.on('data', (chunk: Buffer | string) => {
        chunks.push(chunk.toString());
    });
    const instance = render(element, {
        stdin: stdin as unknown as NodeJS.ReadStream,
        stdout: stdout as unknown as NodeJS.WriteStream,
        stderr: stderr as unknown as NodeJS.WriteStream,
        debug: true,
        exitOnCtrlC: false,
        patchConsole: false
    });

    return {
        stdin,
        // Debug mode writes whole frames, so the last one is the current screen.
        // Ink also writes bare cursor codes, which strip down to nothing.
        frame: () => chunks.map(chunk => stripAnsi(chunk)).filter(Boolean).at(-1) ?? '',
        // Each position the cursor visited, in order, so a brief jump back shows
        cursorPath: () => chunks
            .map(chunk => /▶ {2}(\w+)/.exec(stripAnsi(chunk))?.[1])
            .filter((label): label is string => label !== undefined)
            .filter((label, index, labels) => label !== labels[index - 1]),
        rerender: (next: React.ReactElement) => { instance.rerender(next); },
        cleanup: () => {
            instance.unmount();
            instance.cleanup();
            stdin.destroy();
            stdout.destroy();
            stderr.destroy();
        }
    };
}

function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

describe('List', () => {
    it('keeps the cursor when the parent echoes an older position after another keypress', async () => {
        const list = renderList(<EchoingParent echoDelayMs={60} />);

        try {
            await waitFor(() => { expect(list.frame()).toContain('▶  one'); });
            list.stdin.write(DOWN);
            await waitFor(() => { expect(list.frame()).toContain('▶  two'); });
            list.stdin.write(DOWN);
            await waitFor(() => { expect(list.frame()).toContain('▶  three'); });
            list.stdin.write(DOWN);
            await waitFor(() => { expect(list.frame()).toContain('▶  four'); });

            await sleep(200);
            expect(list.cursorPath()).toEqual(['one', 'two', 'three', 'four']);
        } finally {
            list.cleanup();
        }
    });

    it('keeps the cursor when moving back and forth faster than the echoes', async () => {
        const list = renderList(<EchoingParent echoDelayMs={60} />);

        try {
            await waitFor(() => { expect(list.frame()).toContain('▶  one'); });
            list.stdin.write(DOWN);
            await waitFor(() => { expect(list.frame()).toContain('▶  two'); });
            list.stdin.write(DOWN);
            await waitFor(() => { expect(list.frame()).toContain('▶  three'); });
            list.stdin.write(UP);
            await waitFor(() => { expect(list.frame()).toContain('▶  two'); });

            await sleep(200);
            expect(list.cursorPath()).toEqual(['one', 'two', 'three', 'two']);
        } finally {
            list.cleanup();
        }
    });

    it('follows a move the parent makes itself', async () => {
        const list = renderList(<EchoingParent echoDelayMs={0} />);

        try {
            await waitFor(() => { expect(list.frame()).toContain('▶  one'); });
            list.stdin.write('x');
            await waitFor(() => { expect(list.frame()).toContain('▶  four'); });
        } finally {
            list.cleanup();
        }
    });

    it('clamps the cursor when the list shrinks', async () => {
        const list = renderList(<EchoingParent echoDelayMs={0} />);

        try {
            await waitFor(() => { expect(list.frame()).toContain('▶  one'); });
            list.stdin.write(UP);
            await waitFor(() => { expect(list.frame()).toContain('▶  five'); });
            list.rerender(<EchoingParent echoDelayMs={0} itemCount={2} />);
            await waitFor(() => { expect(list.frame()).toContain('▶  two'); });
        } finally {
            list.cleanup();
        }
    });

    it('still resets to a fixed initialSelection when a list without a parent echo changes length', async () => {
        const items = ITEMS.slice(0, 3);
        const list = renderList(<List items={items} initialSelection={1} onSelect={() => undefined} />);

        try {
            await waitFor(() => { expect(list.frame()).toContain('▶  two'); });
            list.stdin.write(DOWN);
            await waitFor(() => { expect(list.frame()).toContain('▶  three'); });
            list.rerender(<List items={ITEMS} initialSelection={1} onSelect={() => undefined} />);
            await waitFor(() => { expect(list.frame()).toContain('▶  two'); });
        } finally {
            list.cleanup();
        }
    });
});
