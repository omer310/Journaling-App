import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Keyboard,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storage, JournalEntry, Tag } from '../services/storage';
import { sync } from '../services/sync';
import { Tags } from '../../components/Tags';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  entry?: JournalEntry;
  onSave: () => void;
  onCancel: () => void;
}

export function JournalScreen({ entry, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(entry?.title || '');
  const [content, setContent] = useState(entry?.content || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(entry?.tags || []);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Rich text formatting states
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('left');
  const [headingLevel, setHeadingLevel] = useState<number>(0); // 0 = normal, 1-3 = headings
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  useEffect(() => {
    if (entry) {
      setTitle(entry.title);
      setContent(entry.content);
      updateCounts(entry.content);
    }
  }, [entry]);

  // Update word and character counts
  const updateCounts = (text: string) => {
    setCharCount(text.length);
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  };

  const handleContentChange = (text: string) => {
    setContent(text);
    updateCounts(text);
  };

  // Formatting functions
  const toggleBold = () => setIsBold(!isBold);
  const toggleItalic = () => setIsItalic(!isItalic);
  const toggleUnderline = () => setIsUnderline(!isUnderline);
  
  const changeFontSize = (size: number) => setFontSize(size);
  const changeTextAlign = (align: 'left' | 'center' | 'right') => setTextAlign(align);
  const changeHeading = (level: number) => setHeadingLevel(level);
  
  const toggleToolbar = () => setShowToolbar(!showToolbar);

  // Get reading time estimate (average 200 words per minute)
  const getReadingTime = () => {
    const minutes = Math.ceil(wordCount / 200);
    return minutes === 1 ? '1 min read' : `${minutes} min read`;
  };

  // Rich Text Toolbar Component
  const RichTextToolbar = () => (
    <View style={[styles.modernToolbar, isDarkMode && styles.darkModernToolbar]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.toolbarContent}
      >
        {/* Text Style Section */}
        <View style={styles.toolbarSection}>
          <TouchableOpacity
            style={[styles.modernToolbarButton, headingLevel === 1 && styles.activeToolbarButton]}
            onPress={() => changeHeading(headingLevel === 1 ? 0 : 1)}
          >
            <Text style={[styles.toolbarButtonLabel, headingLevel === 1 && styles.activeToolbarLabel]}>H1</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.modernToolbarButton, headingLevel === 2 && styles.activeToolbarButton]}
            onPress={() => changeHeading(headingLevel === 2 ? 0 : 2)}
          >
            <Text style={[styles.toolbarButtonLabel, headingLevel === 2 && styles.activeToolbarLabel]}>H2</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.modernToolbarButton, headingLevel === 3 && styles.activeToolbarButton]}
            onPress={() => changeHeading(headingLevel === 3 ? 0 : 3)}
          >
            <Text style={[styles.toolbarButtonLabel, headingLevel === 3 && styles.activeToolbarLabel]}>H3</Text>
          </TouchableOpacity>
                 </View>

         <View style={[styles.toolbarDivider, { backgroundColor: isDarkMode ? '#2d2d2d' : '#e2e8f0' }]} />

         {/* Formatting Section */}
        <View style={styles.toolbarSection}>
          <TouchableOpacity
            style={[styles.modernToolbarButton, isBold && styles.activeToolbarButton]}
            onPress={toggleBold}
          >
            <Ionicons 
              name="text" 
              size={18} 
              color={isBold ? '#fff' : (isDarkMode ? '#a1a1aa' : '#64748b')} 
              style={{ fontWeight: 'bold' }}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.modernToolbarButton, isItalic && styles.activeToolbarButton]}
            onPress={toggleItalic}
          >
            <Text style={[
              styles.toolbarButtonLabel,
              { fontStyle: 'italic' },
              isItalic && styles.activeToolbarLabel
            ]}>I</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.modernToolbarButton, isUnderline && styles.activeToolbarButton]}
            onPress={toggleUnderline}
          >
            <Text style={[
              styles.toolbarButtonLabel,
              { textDecorationLine: 'underline' },
              isUnderline && styles.activeToolbarLabel
            ]}>U</Text>
          </TouchableOpacity>
                 </View>

         <View style={[styles.toolbarDivider, { backgroundColor: isDarkMode ? '#2d2d2d' : '#e2e8f0' }]} />

         {/* Text Alignment Section */}
        <View style={styles.toolbarSection}>
          <TouchableOpacity
            style={[styles.modernToolbarButton, textAlign === 'left' && styles.activeToolbarButton]}
            onPress={() => changeTextAlign('left')}
          >
            <Ionicons 
              name="text-outline" 
              size={18} 
              color={textAlign === 'left' ? '#fff' : (isDarkMode ? '#a1a1aa' : '#64748b')} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.modernToolbarButton, textAlign === 'center' && styles.activeToolbarButton]}
            onPress={() => changeTextAlign('center')}
          >
            <Ionicons 
              name="text-outline" 
              size={18} 
              color={textAlign === 'center' ? '#fff' : (isDarkMode ? '#a1a1aa' : '#64748b')} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.modernToolbarButton, textAlign === 'right' && styles.activeToolbarButton]}
            onPress={() => changeTextAlign('right')}
          >
            <Ionicons 
              name="text-outline" 
              size={18} 
              color={textAlign === 'right' ? '#fff' : (isDarkMode ? '#a1a1aa' : '#64748b')} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.toolbarDivider} />

        {/* Font Size Section */}
        <View style={styles.toolbarSection}>
          <TouchableOpacity
            style={[styles.modernToolbarButton, fontSize === 14 && styles.activeToolbarButton]}
            onPress={() => changeFontSize(14)}
          >
            <Text style={[styles.toolbarButtonLabel, fontSize === 14 && styles.activeToolbarLabel]}>S</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.modernToolbarButton, fontSize === 16 && styles.activeToolbarButton]}
            onPress={() => changeFontSize(16)}
          >
            <Text style={[styles.toolbarButtonLabel, fontSize === 16 && styles.activeToolbarLabel]}>M</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.modernToolbarButton, fontSize === 18 && styles.activeToolbarButton]}
            onPress={() => changeFontSize(18)}
          >
            <Text style={[styles.toolbarButtonLabel, fontSize === 18 && styles.activeToolbarLabel]}>L</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  useEffect(() => {
    const loadTheme = async () => {
      const theme = await storage.getTheme();
      setIsDarkMode(theme === 'dark');
    };
    loadTheme();
  }, []);

  useEffect(() => {
    const loadTags = async () => {
      const tags = await storage.getAllTags();
      setAvailableTags(tags);
    };
    loadTags();
  }, []);

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardWillShowListener?.remove();
      keyboardWillHideListener?.remove();
    };
  }, []);

  const handleCreateTag = async (tagName: string) => {
    try {
      const newTag = await storage.addTag({
        name: tagName,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      });
      setAvailableTags(prev => [...prev, newTag]);
      setSelectedTags(prev => [...prev, newTag.id]);
    } catch (error) {
      console.error('Error creating tag:', error);
      Alert.alert('Error', 'Failed to create tag. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your entry');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Error', 'Please write something in your entry');
      return;
    }

    setIsSaving(true);
    try {
      const newEntry = {
        id: entry?.id || generateUUID(),
        title: title.trim(),
        content: content.trim(),
        date: entry?.date || new Date().toISOString().split('T')[0],
        tags: selectedTags,
        mood: entry?.mood,
        createdAt: entry?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        synced: false,
      };

      if (entry) {
        await storage.updateEntry(newEntry);
      } else {
        await storage.createEntry(newEntry);
      }

      const savedEntry = await storage.getEntry(newEntry.id);
      if (savedEntry) {
        // Try to sync immediately after saving
        try {
          await sync.syncEntry(savedEntry);
        } catch (syncError) {
          console.error('Error syncing entry after save:', syncError);
          // Don't show error to user, entry is saved locally and can be synced later
        }
        onSave();
      } else {
        throw new Error('Entry was not saved successfully');
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[
      styles.container, 
      { paddingTop: insets.top },
      isDarkMode && styles.darkContainer
    ]}>
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <TouchableOpacity
          onPress={onCancel}
          disabled={isSaving} 
          style={styles.headerButton}
        >
          <Text style={[
            styles.headerButtonText, 
            isSaving && styles.disabledText,
            isDarkMode && styles.darkText
          ]}>
            Cancel
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDarkMode && styles.darkText]}>
          {entry ? 'Edit Entry' : 'New Entry'}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={[styles.headerButton, styles.saveButton]}
        >
          <Text
            style={[
              styles.headerButtonText,
              styles.saveButtonText,
              isSaving && styles.disabledText,
            ]}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={[styles.titleInput, isDarkMode && styles.darkInput]}
        placeholder="Entry Title"
        placeholderTextColor={isDarkMode ? '#666' : '#999'}
        value={title}
        onChangeText={setTitle}
        maxLength={100}
        returnKeyType="next"
      />
      
      <View style={styles.titleStats}>
        <Text style={[styles.statsText, isDarkMode && styles.darkStatsText]}>
          {title.length}/100
        </Text>
      </View>

      <Tags
        selectedTags={selectedTags}
        availableTags={availableTags}
        onTagSelect={(tagId) => setSelectedTags([...selectedTags, tagId])}
        onTagRemove={(tagId) => setSelectedTags(selectedTags.filter(id => id !== tagId))}
        onTagCreate={handleCreateTag}
        isDarkMode={isDarkMode}
      />

      <ScrollView 
        style={[
          styles.content,
          { marginBottom: isKeyboardVisible && showToolbar ? keyboardHeight + 130 : isKeyboardVisible ? keyboardHeight + 80 : 100 }
        ]}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <TextInput
          style={[
            styles.contentInput,
            isDarkMode && styles.darkInput,
            {
              fontSize: headingLevel === 1 ? 20 : headingLevel === 2 ? 18 : headingLevel === 3 ? 16 : fontSize,
              fontWeight: isBold || headingLevel > 0 ? 'bold' : 'normal',
              fontStyle: isItalic ? 'italic' : 'normal',
              textDecorationLine: isUnderline ? 'underline' : 'none',
              textAlign: textAlign,
            },
          ]}
          placeholder="Write your thoughts..."
          placeholderTextColor={isDarkMode ? '#666' : '#999'}
          value={content}
          onChangeText={handleContentChange}
          multiline
          textAlignVertical="top"
          autoFocus={!entry}
        />
      </ScrollView>

      {/* Floating Toolbar - positioned above keyboard */}
      {isKeyboardVisible && (
        <View style={[
          styles.floatingToolbar,
          {
            bottom: keyboardHeight,
          },
          isDarkMode && styles.darkFloatingToolbar
        ]}>
          {/* Stats Bar */}
          <View style={[styles.statsBar, isDarkMode && styles.darkStatsBar]}>
            <View style={styles.statsLeft}>
              <TouchableOpacity onPress={toggleToolbar} style={styles.toolbarToggle}>
                <Ionicons 
                  name={showToolbar ? 'chevron-up' : 'chevron-down'} 
                  size={16} 
                  color={isDarkMode ? '#a1a1aa' : '#64748b'} 
                />
                <Text style={[styles.toolbarToggleText, isDarkMode && styles.darkStatsText]}>
                  Toolbar
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.statsRight}>
              <Text style={[styles.statsText, isDarkMode && styles.darkStatsText]}>
                {wordCount} words • {charCount} characters
              </Text>
              {wordCount > 0 && (
                <Text style={[styles.readingTimeText, isDarkMode && styles.darkStatsText]}>
                  {getReadingTime()}
                </Text>
              )}
            </View>
          </View>
          
          {/* Rich Text Toolbar */}
          {showToolbar && <RichTextToolbar />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Light mode background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  disabledText: {
    opacity: 0.5,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    padding: 16,
    paddingBottom: 8,
  },
  titleStats: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  statsText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  darkStatsText: {
    color: '#a1a1aa',
  },
  toolbarButtonText: {
    fontSize: 16,
    color: '#666',
  },
  toolbar: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  toolbarButton: {
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  toolbarButtonActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  toolbarButtonTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#1a1a1a',
    padding: 16,
    minHeight: 200,
  },
  floatingToolbar: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  darkFloatingToolbar: {
    backgroundColor: '#1a1a1a',
    borderTopColor: '#2d2d2d',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  darkStatsBar: {
    backgroundColor: 'transparent',
  },
  statsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsRight: {
    alignItems: 'flex-end',
  },
  toolbarToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toolbarToggleText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  readingTimeText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  boldText: {
    fontWeight: 'bold',
  },
  italicText: {
    fontStyle: 'italic',
  },
  darkContainer: {
    backgroundColor: '#1a1a1a',
  },
  darkHeader: {
    borderBottomColor: '#2d2d2d',
  },
  darkText: {
    color: '#fff',
  },
  darkInput: {
    color: '#fff',
    backgroundColor: '#1a1a1a',
  },
  darkToolbar: {
    backgroundColor: '#2d2d2d',
    borderBottomColor: '#404040',
  },
  modernToolbar: {
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  darkModernToolbar: {
    backgroundColor: '#1e1e1e',
    borderTopColor: '#2d2d2d',
  },
  toolbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  toolbarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  toolbarDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 12,
  },
  modernToolbarButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 2,
    backgroundColor: 'transparent',
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeToolbarButton: {
    backgroundColor: '#4f46e5',
  },
  toolbarButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  activeToolbarLabel: {
    color: '#fff',
  },
});