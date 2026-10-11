import { useEffect, useState } from 'react';
import { Button, Dialog, HelperText, Portal, TextInput, useTheme } from 'react-native-paper';

interface Props {
  visible: boolean;
  title: string;
  initialName?: string;
  onDismiss: () => void;
  onSave: (name: string) => void;
}

export function BuildingFormDialog({ visible, title, initialName = '', onDismiss, onSave }: Props) {
  const theme = useTheme();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setError('');
    }
  }, [initialName, visible]);

  const save = () => {
    try {
      onSave(name);
      onDismiss();
    } catch (value) {
      setError(value instanceof Error ? value.message : 'Unable to save building');
    }
  };

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={{ backgroundColor: theme.colors.surfaceVariant }}
      >
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <TextInput
            label="Building name"
            mode="outlined"
            value={name}
            onChangeText={(value) => {
              setName(value);
              setError('');
            }}
            error={Boolean(error)}
          />
          <HelperText type="error" visible={Boolean(error)}>
            {error}
          </HelperText>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={save}>Save</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
