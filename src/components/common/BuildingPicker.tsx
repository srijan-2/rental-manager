import { useState } from 'react';
import { Modal as RNModal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, HelperText, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { useBuildingsStore } from '../../store/buildingsStore';
interface Props {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}
export function BuildingPicker({ value, onChange, error }: Props) {
  const theme = useTheme();
  const buildings = useBuildingsStore((s) => s.buildings);
  const add = useBuildingsStore((s) => s.addBuilding);
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const selected = buildings.find((b) => b.id === value);
  const save = () => {
    try {
      const b = add(name);
      onChange(b.id);
      setName('');
      setNameError('');
      setDialog(false);
    } catch (e) {
      setNameError(e instanceof Error ? e.message : 'Unable to add building');
    }
  };
  return (
    <>
      <Pressable
        style={[
          styles.selector,
          { borderColor: error ? theme.colors.error : theme.colors.outline },
        ]}
        onPress={() => setOpen(true)}
      >
        <Text style={selected ? styles.value : styles.placeholder}>
          {selected?.name ?? 'Select Building'}
        </Text>
        <Text>⌄</Text>
      </Pressable>
      <HelperText type="error" visible={Boolean(error)}>
        {error}
      </HelperText>
      <RNModal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View
            style={[styles.sheet, { backgroundColor: theme.colors.surface }]}
            onStartShouldSetResponder={() => true}
          >
            <Text variant="titleMedium">Select Building</Text>
            <ScrollView>
              {buildings.map((b) => (
                <Pressable
                  key={b.id}
                  style={styles.option}
                  onPress={() => {
                    onChange(b.id);
                    setOpen(false);
                  }}
                >
                  <Text>{b.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Button
              mode="outlined"
              onPress={() => {
                setOpen(false);
                setDialog(true);
              }}
            >
              + Add new building
            </Button>
          </View>
        </Pressable>
      </RNModal>
      <Portal>
        <Dialog visible={dialog} onDismiss={() => setDialog(false)}>
          <Dialog.Title>Add Building</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Building name"
              mode="outlined"
              value={name}
              onChangeText={(v) => {
                setName(v);
                setNameError('');
              }}
              error={Boolean(nameError)}
            />
            <HelperText type="error" visible={Boolean(nameError)}>
              {nameError}
            </HelperText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialog(false)}>Cancel</Button>
            <Button onPress={save}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}
const styles = StyleSheet.create({
  selector: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: { fontSize: 16 },
  placeholder: { color: '#777', fontSize: 16 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,.5)' },
  sheet: {
    padding: 20,
    gap: 12,
    maxHeight: '65%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  option: { paddingVertical: 14 },
});
