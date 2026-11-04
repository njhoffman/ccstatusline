import * as os from 'node:os';
import * as path from 'node:path';
import React from 'react';
import {
    describe,
    expect,
    it,
    vi
} from 'vitest';

import {
    KEYS,
    renderComponent
} from '../../__tests__/helpers/render-component';
import { ExportConfigDialog } from '../ExportConfigDialog';
import { ImportConfigDialog } from '../ImportConfigDialog';

describe('ExportConfigDialog', () => {
    const defaultPath = path.join(os.homedir(), 'ccstatusline-config.json');

    it('offers a path in the home directory', async () => {
        const onExport = vi.fn();
        const dialog = renderComponent(<ExportConfigDialog onExport={onExport} onCancel={vi.fn()} />);

        try {
            await dialog.waitForFrame(`Path: ${defaultPath}`);
            await dialog.pressKeyAndExpect(KEYS.enter, () => {
                expect(onExport).toHaveBeenCalledWith(defaultPath);
            });
        } finally {
            dialog.cleanup();
        }
    });

    it('edits the path before exporting', async () => {
        const onExport = vi.fn();
        const dialog = renderComponent(<ExportConfigDialog onExport={onExport} onCancel={vi.fn()} />);

        try {
            await dialog.waitForFrame(`Path: ${defaultPath}`);
            await dialog.pressKey(KEYS.backspace, `Path: ${defaultPath.slice(0, -1)}`);
            await dialog.pressKey('j', `Path: ${defaultPath.slice(0, -1)}j`);
            await dialog.pressKeyAndExpect(KEYS.enter, () => {
                expect(onExport).toHaveBeenCalledWith(`${defaultPath.slice(0, -1)}j`);
            });
        } finally {
            dialog.cleanup();
        }
    });

    it('cancels with Esc without exporting', async () => {
        const onExport = vi.fn();
        const onCancel = vi.fn();
        const dialog = renderComponent(<ExportConfigDialog onExport={onExport} onCancel={onCancel} />);

        try {
            await dialog.waitForFrame('Export Config');
            await dialog.pressKeyAndExpect(KEYS.escape, () => {
                expect(onCancel).toHaveBeenCalledTimes(1);
            });
            expect(onExport).not.toHaveBeenCalled();
        } finally {
            dialog.cleanup();
        }
    });
});

describe('ImportConfigDialog', () => {
    it('starts empty and passes on the typed path', async () => {
        const onFileChosen = vi.fn();
        const dialog = renderComponent(<ImportConfigDialog onFileChosen={onFileChosen} onCancel={vi.fn()} />);

        try {
            await dialog.waitForFrame('Import Config');
            await dialog.pressKey('a', 'Path: a');
            await dialog.pressKey('b', 'Path: ab');
            await dialog.pressKeyAndExpect(KEYS.backspace, () => {
                expect(dialog.frame()).not.toContain('Path: ab');
            });
            await dialog.pressKeyAndExpect(KEYS.enter, () => {
                expect(onFileChosen).toHaveBeenCalledWith('a');
            });
        } finally {
            dialog.cleanup();
        }
    });

    it('leaves control keys out of the path', async () => {
        const onFileChosen = vi.fn();
        const dialog = renderComponent(<ImportConfigDialog onFileChosen={onFileChosen} onCancel={vi.fn()} />);

        try {
            await dialog.waitForFrame('Import Config');
            await dialog.pressKey('a', 'Path: a');
            await dialog.pressKey(KEYS.ctrlS, 'Path: a');
            await dialog.pressKeyAndExpect(KEYS.enter, () => {
                expect(onFileChosen).toHaveBeenCalledWith('a');
            });
        } finally {
            dialog.cleanup();
        }
    });

    it('cancels with Esc without importing', async () => {
        const onFileChosen = vi.fn();
        const onCancel = vi.fn();
        const dialog = renderComponent(<ImportConfigDialog onFileChosen={onFileChosen} onCancel={onCancel} />);

        try {
            await dialog.waitForFrame('Import Config');
            await dialog.pressKeyAndExpect(KEYS.escape, () => {
                expect(onCancel).toHaveBeenCalledTimes(1);
            });
            expect(onFileChosen).not.toHaveBeenCalled();
        } finally {
            dialog.cleanup();
        }
    });
});
