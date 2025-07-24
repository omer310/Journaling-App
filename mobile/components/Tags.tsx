import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';

interface Tag {
  id: string;
  name: string;
  color?: string;
}

interface TagsProps {
  selectedTags: string[];
  availableTags: Tag[];
  onTagSelect: (tagId: string) => void;
  onTagRemove: (tagId: string) => void;
  onTagCreate?: (tagName: string) => void;
  isDarkMode?: boolean;
}

export function Tags({
  selectedTags,
  availableTags,
  onTagSelect,
  onTagRemove,
  onTagCreate,
  isDarkMode = false,
}: TagsProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const handleCreateTag = () => {
    if (!newTagName.trim()) {
      Alert.alert('Error', 'Please enter a tag name');
      return;
    }

    if (onTagCreate) {
      onTagCreate(newTagName.trim());
      setNewTagName('');
      setIsAdding(false);
    }
  };

  const availableTagsList = availableTags.filter(tag => !selectedTags.includes(tag.id));

  return (
    <View style={styles.container}>
      {/* Selected Tags */}
      <View style={styles.selectedTagsContainer}>
        {selectedTags.map((tagId) => {
          const tag = availableTags.find((t) => t.id === tagId);
          if (!tag) return null;

          return (
            <View key={tag.id} style={styles.tagContainer}>
              <View style={[
                styles.tagChip,
                isDarkMode && styles.darkTagChip,
                tag.color && { borderColor: tag.color }
              ]}>
                <Text style={[
                  styles.tagText,
                  isDarkMode && styles.darkTagText,
                  tag.color && { color: tag.color }
                ]}>
                  {tag.name}
                </Text>
                <TouchableOpacity
                  onPress={() => onTagRemove(tag.id)}
                  style={styles.removeButton}
                >
                  <Text style={[
                    styles.removeButtonText,
                    isDarkMode && styles.darkRemoveButtonText
                  ]}>
                    ×
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        
        {/* Add Tag Button */}
        {onTagCreate && (
          <TouchableOpacity
            onPress={() => setIsAdding(true)}
            style={[
              styles.addTagButton,
              isDarkMode && styles.darkAddTagButton
            ]}
          >
            <Text style={[
              styles.addTagButtonText,
              isDarkMode && styles.darkAddTagButtonText
            ]}>
              + Add Tag
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Add Tag Input */}
      {isAdding && onTagCreate && (
        <View style={styles.addTagInputContainer}>
          <TextInput
            style={[
              styles.addTagInput,
              isDarkMode && styles.darkAddTagInput
            ]}
            value={newTagName}
            onChangeText={setNewTagName}
            placeholder="Enter tag name..."
            placeholderTextColor={isDarkMode ? '#666' : '#999'}
            autoFocus
            onSubmitEditing={handleCreateTag}
          />
          <View style={styles.addTagButtons}>
            <TouchableOpacity
              onPress={handleCreateTag}
              disabled={!newTagName.trim()}
              style={[
                styles.addTagConfirmButton,
                !newTagName.trim() && styles.disabledButton
              ]}
            >
              <Text style={styles.addTagConfirmButtonText}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setIsAdding(false);
                setNewTagName('');
              }}
              style={[
                styles.addTagCancelButton,
                isDarkMode && styles.darkAddTagCancelButton
              ]}
            >
              <Text style={[
                styles.addTagCancelButtonText,
                isDarkMode && styles.darkAddTagCancelButtonText
              ]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Available Tags */}
      {availableTagsList.length > 0 && (
        <View style={styles.availableTagsContainer}>
          <Text style={[
            styles.availableTagsTitle,
            isDarkMode && styles.darkAvailableTagsTitle
          ]}>
            Available Tags
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.availableTagsList}>
              {availableTagsList.map((tag) => (
                <TouchableOpacity
                  key={tag.id}
                  onPress={() => onTagSelect(tag.id)}
                  style={[
                    styles.availableTagChip,
                    isDarkMode && styles.darkAvailableTagChip,
                    tag.color && { borderColor: tag.color }
                  ]}
                >
                  <Text style={[
                    styles.availableTagText,
                    isDarkMode && styles.darkAvailableTagText,
                    tag.color && { color: tag.color }
                  ]}>
                    {tag.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  darkTagChip: {
    backgroundColor: '#2a2a2a',
    borderColor: '#444',
  },
  tagText: {
    fontSize: 14,
    color: '#333',
    marginRight: 4,
  },
  darkTagText: {
    color: '#fff',
  },
  removeButton: {
    marginLeft: 4,
  },
  removeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  darkRemoveButtonText: {
    color: '#888',
  },
  addTagButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  darkAddTagButton: {
    backgroundColor: '#2a2a2a',
    borderColor: '#444',
  },
  addTagButtonText: {
    fontSize: 14,
    color: '#666',
  },
  darkAddTagButtonText: {
    color: '#888',
  },
  addTagInputContainer: {
    marginBottom: 10,
  },
  addTagInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  darkAddTagInput: {
    borderColor: '#444',
    backgroundColor: '#2a2a2a',
    color: '#fff',
  },
  addTagButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  addTagConfirmButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  addTagConfirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addTagCancelButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  darkAddTagCancelButton: {
    backgroundColor: '#2a2a2a',
  },
  addTagCancelButtonText: {
    color: '#666',
    fontSize: 14,
  },
  darkAddTagCancelButtonText: {
    color: '#888',
  },
  availableTagsContainer: {
    marginTop: 10,
  },
  availableTagsTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  darkAvailableTagsTitle: {
    color: '#888',
  },
  availableTagsList: {
    flexDirection: 'row',
    gap: 8,
  },
  availableTagChip: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  darkAvailableTagChip: {
    backgroundColor: '#2a2a2a',
    borderColor: '#444',
  },
  availableTagText: {
    fontSize: 14,
    color: '#666',
  },
  darkAvailableTagText: {
    color: '#888',
  },
}); 