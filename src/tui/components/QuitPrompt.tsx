import {
    Box,
    Text,
    useInput
} from 'ink';
import React from 'react';

import {
    List,
    type ListEntry
} from './List';

export type QuitPromptAction = 'save' | 'exit' | 'cancel';

export interface QuitPromptProps { onSelect: (action: QuitPromptAction) => void }

const QUIT_OPTIONS: ListEntry<QuitPromptAction>[] = [
    { label: '💾 Save & Exit', value: 'save' },
    { label: '❌ Exit without saving', value: 'exit' },
    { label: '← Keep editing', value: 'cancel' }
];

export const QuitPrompt: React.FC<QuitPromptProps> = ({ onSelect }) => {
    useInput((_, key) => {
        if (key.escape) {
            onSelect('cancel');
        }
    });

    return (
        <Box flexDirection='column'>
            <Text bold>You have unsaved changes</Text>
            <List
                items={QUIT_OPTIONS}
                marginTop={1}
                color='cyan'
                onSelect={(action) => {
                    if (action !== 'back') {
                        onSelect(action);
                    }
                }}
            />
        </Box>
    );
};
