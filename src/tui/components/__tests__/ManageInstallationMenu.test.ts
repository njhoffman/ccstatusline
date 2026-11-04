import {
    describe,
    expect,
    it
} from 'vitest';

import {
    buildManageInstallationItems,
    buildUninstallItems
} from '../ManageInstallationMenu';

describe('ManageInstallationMenu helpers', () => {
    it('builds update and uninstall actions', () => {
        expect(buildManageInstallationItems().map(item => item.value)).toEqual([
            'checkUpdates',
            'uninstall'
        ]);
        expect(buildManageInstallationItems()[0]?.label).toBe('🔄 Check for Updates');
    });

    it('offers no update check for a self-managed install, which it would replace with the npm package', () => {
        const selfManaged = { method: 'self-managed', packageManager: 'unknown' } as const;
        const pinned = { method: 'pinned', packageManager: 'npm' } as const;

        expect(buildManageInstallationItems(selfManaged).map(item => item.value)).toEqual(['uninstall']);
        expect(buildManageInstallationItems(pinned).map(item => item.value)).toEqual(['checkUpdates', 'uninstall']);
    });

    it('offers npm, bun, and combined package removal when both are installed', () => {
        const items = buildUninstallItems([
            {
                packageManager: 'npm',
                available: true,
                installed: true,
                binDir: '/usr/local/bin'
            },
            {
                packageManager: 'bun',
                available: true,
                installed: true,
                binDir: '/home/alice/.bun/bin'
            }
        ]);

        expect(items.map(item => item.value.packageManagers)).toEqual([
            [],
            ['npm'],
            ['bun'],
            ['npm', 'bun']
        ]);
    });

    it('only offers Claude settings removal when no global package is detected', () => {
        const items = buildUninstallItems([
            {
                packageManager: 'npm',
                available: true,
                installed: false,
                binDir: '/usr/local/bin'
            },
            {
                packageManager: 'bun',
                available: false,
                installed: false,
                binDir: null
            }
        ]);

        expect(items).toHaveLength(1);
        expect(items[0]?.value.packageManagers).toEqual([]);
    });
});
