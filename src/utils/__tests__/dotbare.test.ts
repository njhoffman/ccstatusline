import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest';

import { findDotbareRoot } from '../dotbare';

describe('findDotbareRoot', () => {
    let homeDir: string;
    let tracked: Set<string>;

    const makeDir = (...parts: string[]) => {
        const dir = path.join(homeDir, ...parts);
        fs.mkdirSync(dir, { recursive: true });
        return dir;
    };
    const lookup = (env: NodeJS.ProcessEnv = {}) => ({
        homeDir,
        env,
        hasTrackedFiles: (dir: string) => tracked.has(dir)
    });

    beforeEach(() => {
        homeDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'ccstatusline-dotbare-')));
        tracked = new Set();
        makeDir('.cfg');
    });

    afterEach(() => {
        fs.rmSync(homeDir, { recursive: true, force: true });
    });

    it('finds the config directory from inside it', () => {
        const root = makeDir('.config', 'tmux');
        tracked.add(root);

        expect(findDotbareRoot(root, lookup())).toBe(root);
        expect(findDotbareRoot(makeDir('.config', 'tmux', 'plugins', 'mine'), lookup())).toBe(root);
    });

    it('handles a dot directory directly in the home directory', () => {
        const root = makeDir('.shell');
        tracked.add(root);

        expect(findDotbareRoot(makeDir('.shell', 'scripts'), lookup())).toBe(root);
    });

    it('takes a directory elsewhere under home only when it holds tracked files', () => {
        const dir = makeDir('notes', 'daily');

        expect(findDotbareRoot(dir, lookup())).toBeNull();
        tracked.add(dir);
        expect(findDotbareRoot(dir, lookup())).toBe(path.join(homeDir, 'notes'));
    });

    it('prefers the nearest ancestor with a VERSION', () => {
        const config = makeDir('.config', 'nvim');
        const project = makeDir('.config', 'nvim', 'lua', 'plugin');
        const inner = makeDir('.config', 'nvim', 'lua', 'plugin', 'src');
        fs.writeFileSync(path.join(project, 'VERSION'), '1.0.0');
        tracked.add(config);

        expect(findDotbareRoot(inner, lookup())).toBe(project);
    });

    it('returns null for an untracked directory', () => {
        expect(findDotbareRoot(makeDir('.config', 'untracked'), lookup())).toBeNull();
    });

    it('returns null without a directory or a dotbare repository', () => {
        const root = makeDir('.config', 'tmux');
        tracked.add(root);

        expect(findDotbareRoot(undefined, lookup())).toBeNull();
        expect(findDotbareRoot(path.join(homeDir, 'missing'), lookup())).toBeNull();
        fs.rmSync(path.join(homeDir, '.cfg'), { recursive: true });
        expect(findDotbareRoot(root, lookup())).toBeNull();
    });

    it.each([
        ['the home directory', []],
        ['~/.config', ['.config']],
        ['downloads', ['Downloads', 'x']],
        ['caches', ['.cache', 'x']],
        ['local data', ['.local', 'share', 'x']],
        ['tmp', ['tmp', 'x']],
        ['a scratchpad', ['work', 'scratchpad', 'x']]
    ])('does not apply to %s', (_name, parts) => {
        const dir = makeDir(...parts);
        tracked.add(dir);

        expect(findDotbareRoot(dir, lookup())).toBeNull();
    });

    it('does not apply outside the home directory', () => {
        const outside = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'ccstatusline-dotbare-outside-')));
        try {
            tracked.add(outside);
            expect(findDotbareRoot(outside, lookup())).toBeNull();
        } finally {
            fs.rmSync(outside, { recursive: true, force: true });
        }
    });

    it('resolves symlinks before comparing with the home directory', () => {
        const root = makeDir('.config', 'tmux');
        tracked.add(root);
        const link = path.join(homeDir, 'tmux-link');
        fs.symlinkSync(root, link);

        expect(findDotbareRoot(link, lookup())).toBe(root);
    });

    it('honors DOTBARE_DIR and DOTBARE_TREE', () => {
        const root = makeDir('.config', 'tmux');
        const gitDir = makeDir('elsewhere.git');
        fs.rmSync(path.join(homeDir, '.cfg'), { recursive: true });
        const hasTrackedFiles = vi.fn(() => true);

        expect(findDotbareRoot(root, { homeDir, env: { DOTBARE_DIR: gitDir, DOTBARE_TREE: '/tree' }, hasTrackedFiles })).toBe(root);
        expect(hasTrackedFiles).toHaveBeenCalledWith(root, gitDir, '/tree');
    });
});
