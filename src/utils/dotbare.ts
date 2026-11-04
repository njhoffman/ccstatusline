import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { execGit } from './git';

// dotbare keeps dotfiles in one repository whose work tree is the home directory,
// so a config directory it tracks isn't a git repo that git can find from inside

export interface DotbareLookup {
    homeDir?: string;
    env?: NodeJS.ProcessEnv;
    // Whether the dotbare repository has files at or below a directory
    hasTrackedFiles?: (dir: string, gitDir: string, workTree: string) => boolean;
}

// Where a dotbare directory never applies: the home directory and ~/.config hold
// many projects, and the rest are throwaway
function isExcluded(dir: string, homeDir: string): boolean {
    const relative = path.relative(homeDir, dir);
    if (relative === '' || relative === '.config' || relative.startsWith('..') || path.isAbsolute(relative)) {
        return true;
    }

    const throwaway = ['Downloads', '.cache', path.join('.local', 'share'), 'tmp'];
    return throwaway.some(name => relative === name || relative.startsWith(`${name}${path.sep}`))
        || relative.split(path.sep).includes('scratchpad');
}

function defaultHasTrackedFiles(dir: string, gitDir: string, workTree: string): boolean {
    try {
        return execGit([`--git-dir=${gitDir}`, `--work-tree=${workTree}`, 'ls-files', '--', '.'], dir).trim().length > 0;
    } catch {
        return false;
    }
}

// The config directory a path belongs to: ~/.config/NAME or ~/.NAME
function getConfigDir(relative: string, homeDir: string): string | null {
    const [first, second] = relative.split(path.sep);
    if (first === '.config') {
        return second ? path.join(homeDir, '.config', second) : null;
    }

    return first?.startsWith('.') ? path.join(homeDir, first) : null;
}

function findVersionDir(dir: string, homeDir: string): string | null {
    for (let current = dir; current !== homeDir && current !== path.dirname(current); current = path.dirname(current)) {
        if (fs.existsSync(path.join(current, 'VERSION'))) {
            return current;
        }
    }

    return null;
}

/**
 * The project root of a directory tracked by the dotbare repository, or null when
 * it isn't one: the nearest ancestor with a VERSION, else its config directory
 * (~/NAME for a directory elsewhere under home). Callers check for a real git repo
 * first, because one nested in a dotbare directory wins.
 */
export function findDotbareRoot(cwd: string | undefined, lookup: DotbareLookup = {}): string | null {
    if (!cwd) {
        return null;
    }

    const env = lookup.env ?? process.env;
    const hasTrackedFiles = lookup.hasTrackedFiles ?? defaultHasTrackedFiles;

    let dir: string;
    let homeDir: string;
    try {
        dir = fs.realpathSync(cwd);
        homeDir = fs.realpathSync(lookup.homeDir ?? os.homedir());
    } catch {
        return null;
    }

    if (isExcluded(dir, homeDir)) {
        return null;
    }

    const gitDir = env.DOTBARE_DIR ?? path.join(homeDir, '.cfg');
    const workTree = env.DOTBARE_TREE ?? homeDir;
    if (!fs.existsSync(gitDir)) {
        return null;
    }

    const relative = path.relative(homeDir, dir);
    const configDir = getConfigDir(relative, homeDir);
    const tracked = hasTrackedFiles(dir, gitDir, workTree)
        || (configDir !== null && hasTrackedFiles(configDir, gitDir, workTree));
    if (!tracked) {
        return null;
    }

    const [first = ''] = relative.split(path.sep);
    return findVersionDir(dir, homeDir) ?? configDir ?? path.join(homeDir, first);
}
