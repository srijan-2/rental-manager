import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Divider, Modal, Snackbar, Text, useTheme } from 'react-native-paper';
import { useBuildingsStore, useUnitsStore } from '../../store';
import { deleteBuilding, renameBuilding } from '../../store/actions';
import { radius, spacing } from '../../styles/layout';
import { BuildingFormDialog } from './BuildingFormDialog';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export function ManageBuildingsModal({ visible, onDismiss }: Props) {
  const theme = useTheme();
  const buildings = useBuildingsStore((state) => state.buildings);
  const units = useUnitsStore((state) => state.units);
  const [dialog, setDialog] = useState<{ id?: string; name?: string } | null>(null);
  const [message, setMessage] = useState('');

  return (
    <>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surfaceVariant }]}
      >
        <Text variant="titleLarge">Manage buildings</Text>
        {buildings.map((building) => {
          const count = units.filter((unit) => unit.buildingId === building.id).length;
          return (
            <View key={building.id}>
              <View style={styles.row}>
                <View style={styles.name}>
                  <Text variant="titleMedium">{building.name}</Text>
                  <Text>{count ? `${count} units` : 'No units'}</Text>
                </View>
                <Button onPress={() => setDialog({ id: building.id, name: building.name })}>
                  Rename
                </Button>
                <Button
                  disabled={count > 0}
                  onPress={() =>
                    Alert.alert(`Delete ${building.name}?`, 'This cannot be undone.', [
                      { text: 'Cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => {
                          try {
                            deleteBuilding(building.id);
                          } catch (error) {
                            setMessage(
                              error instanceof Error ? error.message : 'Unable to delete building'
                            );
                          }
                        },
                      },
                    ])
                  }
                >
                  {count ? `Has ${count} units` : 'Delete'}
                </Button>
              </View>
              <Divider />
            </View>
          );
        })}
        <Button mode="contained" onPress={() => setDialog({})}>
          Add building
        </Button>
      </Modal>
      <BuildingFormDialog
        visible={dialog !== null}
        title={dialog?.id ? 'Rename Building' : 'Add Building'}
        initialName={dialog?.name}
        onDismiss={() => setDialog(null)}
        onSave={(name) => {
          if (dialog?.id) renameBuilding(dialog.id, name);
          else useBuildingsStore.getState().addBuilding(name);
        }}
      />
      <Snackbar visible={Boolean(message)} onDismiss={() => setMessage('')} duration={2500}>
        {message}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  modal: { borderRadius: radius.md, margin: spacing.md, padding: spacing.md, gap: spacing.sm },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, paddingVertical: spacing.xs },
  name: { flex: 1, gap: spacing.xxs },
});
