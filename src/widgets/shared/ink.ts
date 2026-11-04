import type * as Ink from 'ink';

// Widgets carry their editors, and piped mode loads every widget on each status
// line refresh. Importing ink directly would make all of those refreshes load
// it, so widgets import from here and the TUI entry supplies ink before it
// renders anything.
type InkExports = Pick<typeof Ink, 'Box' | 'Text' | 'useInput'>;

function notLoaded(): never {
    throw new Error('ink is not loaded: widget editors only work inside the TUI');
}

export let Box = notLoaded as unknown as InkExports['Box'];
export let Text = notLoaded as unknown as InkExports['Text'];
export let useInput = notLoaded as unknown as InkExports['useInput'];

export function provideInk(ink: InkExports): void {
    ({ Box, Text, useInput } = ink);
}
