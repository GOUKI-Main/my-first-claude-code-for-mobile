import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@notes';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export default function App() {
  const [notes, setNotes] = useState([]);
  const [screen, setScreen] = useState('list'); // 'list' | 'edit'
  const [currentNote, setCurrentNote] = useState(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setNotes(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load notes', e);
    }
  };

  const saveNotes = async (updatedNotes) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
      setNotes(updatedNotes);
    } catch (e) {
      console.error('Failed to save notes', e);
    }
  };

  const openNewNote = () => {
    setCurrentNote(null);
    setTitle('');
    setBody('');
    setScreen('edit');
  };

  const openExistingNote = (note) => {
    setCurrentNote(note);
    setTitle(note.title);
    setBody(note.body);
    setScreen('edit');
  };

  const saveCurrentNote = () => {
    if (!title.trim() && !body.trim()) {
      setScreen('list');
      return;
    }

    const now = new Date().toISOString();
    let updatedNotes;

    if (currentNote) {
      updatedNotes = notes.map((n) =>
        n.id === currentNote.id
          ? { ...n, title: title.trim(), body: body.trim(), updatedAt: now }
          : n
      );
    } else {
      const newNote = {
        id: generateId(),
        title: title.trim(),
        body: body.trim(),
        createdAt: now,
        updatedAt: now,
      };
      updatedNotes = [newNote, ...notes];
    }

    saveNotes(updatedNotes);
    setScreen('list');
  };

  const deleteNote = (noteId) => {
    Alert.alert('メモを削除', 'このメモを削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => {
          const updatedNotes = notes.filter((n) => n.id !== noteId);
          saveNotes(updatedNotes);
          if (screen === 'edit') {
            setScreen('list');
          }
        },
      },
    ]);
  };

  const filteredNotes = notes.filter((note) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(q) ||
      note.body.toLowerCase().includes(q)
    );
  });

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  };

  const renderNoteItem = ({ item }) => (
    <TouchableOpacity
      style={styles.noteItem}
      onPress={() => openExistingNote(item)}
      onLongPress={() => deleteNote(item.id)}
    >
      <Text style={styles.noteTitle} numberOfLines={1}>
        {item.title || 'タイトルなし'}
      </Text>
      <Text style={styles.notePreview} numberOfLines={2}>
        {item.body || '本文なし'}
      </Text>
      <Text style={styles.noteDate}>{formatDate(item.updatedAt)}</Text>
    </TouchableOpacity>
  );

  if (screen === 'edit') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={saveCurrentNote} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>← 戻る</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {currentNote ? '編集' : '新規メモ'}
          </Text>
          {currentNote ? (
            <TouchableOpacity
              onPress={() => deleteNote(currentNote.id)}
              style={styles.headerBtn}
            >
              <Text style={[styles.headerBtnText, styles.deleteText]}>
                削除
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerBtn} />
          )}
        </View>
        <KeyboardAvoidingView
          style={styles.editContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TextInput
            style={styles.titleInput}
            placeholder="タイトル"
            placeholderTextColor="#999"
            value={title}
            onChangeText={setTitle}
            autoFocus={!currentNote}
          />
          <TextInput
            style={styles.bodyInput}
            placeholder="メモを入力..."
            placeholderTextColor="#999"
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>メモ帳</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="メモを検索..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {filteredNotes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery ? '該当するメモがありません' : 'メモがありません'}
          </Text>
          {!searchQuery && (
            <Text style={styles.emptySubText}>
              右下の「＋」ボタンでメモを作成しましょう
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          renderItem={renderNoteItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={openNewNote}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerBtn: {
    minWidth: 60,
  },
  headerBtnText: {
    fontSize: 16,
    color: '#4A90D9',
  },
  deleteText: {
    color: '#E74C3C',
    textAlign: 'right',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: '#333',
  },
  listContent: {
    padding: 16,
  },
  noteItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noteTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notePreview: {
    fontSize: 14,
    color: '#777',
    marginBottom: 8,
    lineHeight: 20,
  },
  noteDate: {
    fontSize: 12,
    color: '#aaa',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#bbb',
    textAlign: 'center',
  },
  editContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    color: '#333',
  },
  bodyInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    lineHeight: 24,
    color: '#333',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A90D9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    lineHeight: 32,
  },
});
