import { useState } from 'react';
import { Alert, Keyboard, StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, Text, TextInput, useTheme } from 'react-native-paper';
import { spacing } from '../../styles/layout';
import { UnitNote } from '../../types/unit';
import { useDateFormat } from '../../hooks/useDateFormat';

interface Props {
  notes: UnitNote[];
  onAdd: (text: string) => void;
  onUpdate: (noteId: string, text: string) => void;
  onDelete: (noteId: string) => void;
  onMessage: (message: string) => void;
}

export function UnitNotes({ notes, onAdd, onUpdate, onDelete, onMessage }: Props) {
  const theme = useTheme();
  const { formatIndianDate } = useDateFormat();
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const sortedNotes = [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const isEditing = editingId !== null;

  const save = () => {
    const text = draft.trim();
    if (!text) return;
    Keyboard.dismiss();
    if (editingId) {
      onUpdate(editingId, text);
      onMessage('Note updated');
    } else {
      onAdd(text);
      onMessage('Note added');
    }
    setDraft('');
    setEditingId(null);
  };

  const edit = (note: UnitNote) => {
    setDraft(note.text);
    setEditingId(note.id);
  };

  const remove = (noteId: string) => {
    Alert.alert('Delete note?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (editingId === noteId) {
            setDraft('');
            setEditingId(null);
          }
          onDelete(noteId);
          onMessage('Note deleted');
        },
      },
    ]);
  };

  return (
    <>
      <TextInput
        mode="outlined"
        label="Add a note"
        multiline
        numberOfLines={4}
        value={draft}
        onChangeText={setDraft}
      />
      <View style={styles.actions}>
        {isEditing ? (
          <Button
            onPress={() => {
              setDraft('');
              setEditingId(null);
            }}
          >
            Cancel
          </Button>
        ) : null}
        <Button mode="contained-tonal" disabled={!draft.trim()} onPress={save}>
          {isEditing ? 'Update Note' : 'Add Note'}
        </Button>
      </View>
      {sortedNotes.length === 0 ? (
        <Text style={{ color: theme.colors.onSurfaceVariant }}>No notes yet</Text>
      ) : (
        sortedNotes.map((note) => (
          <Card
            key={note.id}
            style={[
              styles.card,
              note.id === editingId && { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <Card.Content>
              <View style={styles.cardHeader}>
                <Text variant="bodyLarge" style={styles.noteText}>
                  {note.text}
                </Text>
                <View style={styles.cardActions}>
                  <IconButton icon="pencil-outline" onPress={() => edit(note)} />
                  <IconButton icon="delete-outline" onPress={() => remove(note.id)} />
                </View>
              </View>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {formatIndianDate(note.createdAt.slice(0, 10))}
                {note.updatedAt ? ' · edited' : ''}
              </Text>
            </Card.Content>
          </Card>
        ))
      )}
    </>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  card: {
    marginTop: spacing.xs,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  cardActions: {
    flexDirection: 'row',
    marginRight: -spacing.xs,
    marginTop: -spacing.xs,
  },
  noteText: {
    flex: 1,
  },
});
