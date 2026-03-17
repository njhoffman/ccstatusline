import {
    Box,
    Text,
    useInput
} from 'ink';
import React, {
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';

import type { Settings } from '../../types/Settings';
import type { WidgetStyleName } from '../../types/WidgetStyle';
import {
    getWidgetStyleDefinition,
    getWidgetStyleNames
} from '../../utils/widget-styles';

import {
    List,
    type ListEntry
} from './List';

function buildWidgetStyleItems(
    styles: WidgetStyleName[],
    originalStyle: WidgetStyleName
): ListEntry<WidgetStyleName>[] {
    return styles.map((styleName) => {
        const style = getWidgetStyleDefinition(styleName);

        return {
            label: style.name,
            sublabel: styleName === originalStyle ? '(current)' : undefined,
            value: styleName,
            description: style.description
        };
    });
}

export interface WidgetStyleSelectorProps {
    settings: Settings;
    onUpdate: (settings: Settings) => void;
    onBack: () => void;
}

export const WidgetStyleSelector: React.FC<WidgetStyleSelectorProps> = ({
    settings,
    onUpdate,
    onBack
}) => {
    const styles = useMemo(() => getWidgetStyleNames(), []);
    const currentStyle = (settings.widgetStyle ?? 'classic') as WidgetStyleName;
    const [selectedIndex, setSelectedIndex] = useState(Math.max(0, styles.indexOf(currentStyle)));
    const originalStyleRef = useRef(currentStyle);
    const originalSettingsRef = useRef(settings);
    const latestSettingsRef = useRef(settings);
    const latestOnUpdateRef = useRef(onUpdate);
    const didHandleInitialSelectionRef = useRef(false);

    useEffect(() => {
        latestSettingsRef.current = settings;
        latestOnUpdateRef.current = onUpdate;
    }, [settings, onUpdate]);

    useEffect(() => {
        const styleName = styles[selectedIndex];

        if (!styleName) {
            return;
        }

        if (!didHandleInitialSelectionRef.current) {
            didHandleInitialSelectionRef.current = true;
            return;
        }

        latestOnUpdateRef.current({
            ...latestSettingsRef.current,
            widgetStyle: styleName
        });
    }, [selectedIndex, styles]);

    useInput((_input, key) => {
        if (key.escape) {
            onUpdate(originalSettingsRef.current);
            onBack();
        }
    });

    const styleItems = useMemo(
        () => buildWidgetStyleItems(styles, originalStyleRef.current),
        [styles]
    );

    return (
        <Box flexDirection='column'>
            <Text bold>
                {`Widget Style  |  `}
                <Text dimColor>
                    {`Current: ${getWidgetStyleDefinition(originalStyleRef.current).name}`}
                </Text>
            </Text>
            <Box>
                <Text dimColor>
                    {'Up/Down navigate, Enter apply, ESC cancel'}
                </Text>
            </Box>

            <List
                marginTop={1}
                items={styleItems}
                onSelect={() => {
                    onBack();
                }}
                onSelectionChange={(_styleName, index) => {
                    setSelectedIndex(index);
                }}
                initialSelection={selectedIndex}
            />

            <Box marginTop={1}>
                <Text dimColor>
                    {'Styles control separators, padding, and rendering mode. Widget-level colors are preserved.'}
                </Text>
            </Box>
        </Box>
    );
};
