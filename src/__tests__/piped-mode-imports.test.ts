import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    describe,
    expect,
    it
} from 'vitest';

const SRC_DIR = fileURLToPath(new URL('..', import.meta.url));
const ROOT_DIR = path.dirname(SRC_DIR);
const STATIC_IMPORT = /^(?:import|export)\s+(?!type\s)(?:[^'";]*?\sfrom\s+)?'([^']+)'/gm;

function resolveLocalImport(fromFile: string, specifier: string): string | null {
    const base = path.resolve(path.dirname(fromFile), specifier);
    const candidates = [`${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx'), base];
    return candidates.find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ?? null;
}

// Follows static imports only: the entry's `await import('./tui')` is the point
// where ink is allowed in. Maps each package reached to the file importing it.
function walkStaticImports(entry: string) {
    const visited = new Set<string>();
    const packages = new Map<string, string>();
    const queue = [entry];

    for (let file = queue.pop(); file !== undefined; file = queue.pop()) {
        if (visited.has(file)) {
            continue;
        }
        visited.add(file);
        for (const match of fs.readFileSync(file, 'utf-8').matchAll(STATIC_IMPORT)) {
            const specifier = match[1] ?? '';
            if (specifier.startsWith('.')) {
                const resolved = resolveLocalImport(file, specifier);
                if (resolved) {
                    queue.push(resolved);
                }
            } else {
                packages.set(specifier, path.relative(ROOT_DIR, file));
            }
        }
    }

    return { visited, packages };
}

function runBun(script: string): string {
    return execFileSync(process.execPath, ['-e', script], { cwd: ROOT_DIR, encoding: 'utf-8' }).trim();
}

describe('what piped mode loads', () => {
    it('does not reach ink through static imports', () => {
        const { visited, packages } = walkStaticImports(path.join(SRC_DIR, 'ccstatusline.ts'));

        // The walk really covered the widgets, including ones with editors
        expect(visited.has(path.join(SRC_DIR, 'widgets', 'CustomText.tsx'))).toBe(true);
        expect(visited.has(path.join(SRC_DIR, 'widgets', 'shared', 'ink.ts'))).toBe(true);
        expect(packages.get('ink')).toBeUndefined();
    });

    it('notices a direct ink import', () => {
        const { packages } = walkStaticImports(path.join(SRC_DIR, 'tui', 'index.tsx'));

        expect(packages.has('ink')).toBe(true);
    });
});

describe('ink wrapper', () => {
    it('explains itself when an editor renders outside the TUI', () => {
        const output = runBun(`
            const { Box } = await import('./src/widgets/shared/ink.ts');
            try { Box(); } catch (error) { console.log(error.message); }
        `);

        expect(output).toContain('ink is not loaded');
    });

    it('is filled in by the TUI entry', () => {
        const output = runBun(`
            const ink = await import('ink');
            const wrapper = await import('./src/widgets/shared/ink.ts');
            await import('./src/tui/index.tsx');
            console.log(wrapper.Box === ink.Box && wrapper.Text === ink.Text && wrapper.useInput === ink.useInput);
        `);

        expect(output).toBe('true');
    });
});
