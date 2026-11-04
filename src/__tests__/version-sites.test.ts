import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
    describe,
    expect,
    it
} from 'vitest';

function readJson(relativePath: string): unknown {
    return JSON.parse(fs.readFileSync(fileURLToPath(new URL(`../../${relativePath}`, import.meta.url)), 'utf-8'));
}

interface Marketplace {
    metadata: { version: string };
    plugins: { name: string; version: string }[];
}

describe('version sites', () => {
    const { version } = readJson('package.json') as { version: string };

    it('is a release version', () => {
        expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('matches package.json in the plugin manifest', () => {
        expect((readJson('plugin/.claude-plugin/plugin.json') as { version: string }).version).toBe(version);
    });

    it('matches package.json in both places in the marketplace manifest', () => {
        const marketplace = readJson('.claude-plugin/marketplace.json') as Marketplace;

        expect(marketplace.metadata.version).toBe(version);
        expect(marketplace.plugins.map(plugin => plugin.version)).toEqual([version]);
    });
});
