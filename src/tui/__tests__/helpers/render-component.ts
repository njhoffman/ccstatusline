import { render } from 'ink';
import { PassThrough } from 'node:stream';
import type React from 'react';
import stripAnsi from 'strip-ansi';
import { expect } from 'vitest';

import { waitFor } from './wait-for-ink';

export const KEYS = {
    up: '\u001B[A',
    down: '\u001B[B',
    left: '\u001B[D',
    enter: '\r',
    escape: '\u001B',
    tab: '\t',
    backspace: '\u007F',
    ctrlS: '\u0013'
};

class MockTtyStream extends PassThrough {
    isTTY = true;
    columns = 120;
    rows = 40;

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

// Renders one component with fake terminal streams, for tests that don't need
// the whole App around it
export function renderComponent(element: React.ReactElement) {
    const stdin = new MockTtyStream();
    const stdout = new MockTtyStream();
    const stderr = new MockTtyStream();
    const frames: string[] = [];
    stdout.on('data', (chunk: Buffer | string) => {
        // Ink also writes bare cursor codes, which strip down to nothing
        const frame = stripAnsi(chunk.toString());
        if (frame) {
            frames.push(frame);
        }
    });

    const instance = render(element, {
        stdin: stdin as unknown as NodeJS.ReadStream,
        stdout: stdout as unknown as NodeJS.WriteStream,
        stderr: stderr as unknown as NodeJS.WriteStream,
        debug: true,
        exitOnCtrlC: false,
        patchConsole: false
    });

    // Debug mode writes whole frames, so the last one is the current screen
    const frame = () => frames.at(-1) ?? '';

    return {
        frame,
        waitForFrame: (expected: string) => waitFor(() => {
            expect(frame()).toContain(expected);
        }),
        // Sends a key that changes the screen, and waits for the change
        pressKey: async (key: string, expected: string) => {
            stdin.write(key);
            await waitFor(() => {
                expect(frame()).toContain(expected);
            });
        },
        // Sends a key that ends in a callback, and waits for the call
        pressKeyAndExpect: async (key: string, assertions: () => void) => {
            stdin.write(key);
            await waitFor(assertions);
        },
        cleanup: () => {
            instance.unmount();
            instance.cleanup();
            stdin.destroy();
            stdout.destroy();
            stderr.destroy();
        }
    };
}
