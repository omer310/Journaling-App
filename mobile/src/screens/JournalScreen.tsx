import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Keyboard,
  Animated,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { storage, JournalEntry, Tag } from "../services/storage";
import { sync } from "../services/sync";
import { Tags } from "../../components/Tags";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  entry?: JournalEntry;
  onSave: () => void;
  onCancel: () => void;
}

export function JournalScreen({ entry, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(entry?.title || "");
  const [content, setContent] = useState(entry?.content || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(entry?.tags || []);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Always start in read mode, will be set to true for new entries in useEffect

  // Rich text formatting states
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">(
    "left"
  );
  const [headingLevel, setHeadingLevel] = useState<number>(0); // 0 = normal, 1-3 = headings

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [buttonScale] = useState(new Animated.Value(1));
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [currentTime, setCurrentTime] = useState(new Date());
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const generateUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  };

  useEffect(() => {
    if (entry) {
      // Existing entry - load data and stay in read mode
      setTitle(entry.title);
      setContent(entry.content);
      updateCounts(entry.content);
      setIsEditing(false); // Ensure we're in read mode for existing entries

      // Start subtle pulse animation for edit button
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      return () => pulseLoop.stop();
    } else {
      // New entry - start in edit mode
      setIsEditing(true);
    }
  }, [entry]);

  // Update word and character counts
  const updateCounts = (text: string) => {
    setCharCount(text.length);
    const words = text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
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
  const changeTextAlign = (align: "left" | "center" | "right") =>
    setTextAlign(align);
  const changeHeading = (level: number) => setHeadingLevel(level);

  const toggleToolbar = () => setShowToolbar(!showToolbar);

  // Get reading time estimate (average 200 words per minute)
  const getReadingTime = () => {
    const minutes = Math.ceil(wordCount / 200);
    return minutes === 1 ? "1 min read" : `${minutes} min read`;
  };

  // Rich Text Toolbar Component
  const RichTextToolbar = () => (
    <View
      style={[styles.modernToolbar, isDarkMode && styles.darkModernToolbar]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.toolbarContent}
      >
        {/* Text Style Section */}
        <View style={styles.toolbarSection}>
          <TouchableOpacity
            style={[
              styles.modernToolbarButton,
              headingLevel === 1 && styles.activeToolbarButton,
            ]}
            onPress={() => changeHeading(headingLevel === 1 ? 0 : 1)}
          >
            <Text
              style={[
                styles.toolbarButtonLabel,
                headingLevel === 1 && styles.activeToolbarLabel,
              ]}
            >
              H1
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modernToolbarButton,
              headingLevel === 2 && styles.activeToolbarButton,
            ]}
            onPress={() => changeHeading(headingLevel === 2 ? 0 : 2)}
          >
            <Text
              style={[
                styles.toolbarButtonLabel,
                headingLevel === 2 && styles.activeToolbarLabel,
              ]}
            >
              H2
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modernToolbarButton,
              headingLevel === 3 && styles.activeToolbarButton,
            ]}
            onPress={() => changeHeading(headingLevel === 3 ? 0 : 3)}
          >
            <Text
              style={[
                styles.toolbarButtonLabel,
                headingLevel === 3 && styles.activeToolbarLabel,
              ]}
            >
              H3
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.toolbarDivider,
            { backgroundColor: isDarkMode ? "#2d2d2d" : "#e2e8f0" },
          ]}
        />

        {/* Formatting Section */}
        <View style={styles.toolbarSection}>
          <TouchableOpacity
            style={[
              styles.modernToolbarButton,
              isBold && styles.activeToolbarButton,
            ]}
            onPress={toggleBold}
          >
            <Ionicons
              name="text"
              size={18}
              color={isBold ? "#fff" : isDarkMode ? "#a1a1aa" : "#64748b"}
              style={{ fontWeight: "bold" }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modernToolbarButton,
              isItalic && styles.activeToolbarButton,
            ]}
            onPress={toggleItalic}
          >
            <Text
              style={[
                styles.toolbarButtonLabel,
                { fontStyle: "italic" },
                isItalic && styles.activeToolbarLabel,
              ]}
            >
              I
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modernToolbarButton,
              isUnderline && styles.activeToolbarButton,
            ]}
            onPress={toggleUnderline}
          >
            <Text
              style={[
                styles.toolbarButtonLabel,
                { textDecorationLine: "underline" },
                isUnderline && styles.activeToolbarLabel,
              ]}
            >
              U
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.toolbarDivider,
            { backgroundColor: isDarkMode ? "#2d2d2d" : "#e2e8f0" },
          ]}
        />

        {/* Text Alignment Section */}
        <View style={styles.toolbarSection}>
          <TouchableOpacity
            style={[
              styles.modernToolbarButton,
              textAlign === "left" && styles.activeToolbarButton,
            ]}
            onPress={() => changeTextAlign("left")}
          >
            <Ionicons
              name="text-outline"
              size={18}
              color={
                textAlign === "left"
                  ? "#fff"
                  : isDarkMode
                  ? "#a1a1aa"
                  : "#64748b"
              }
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modernToolbarButton,
              textAlign === "center" && styles.activeToolbarButton,
            ]}
            onPress={() => changeTextAlign("center")}
          >
            <Ionicons
              name="text-outline"
              size={18}
              color={
                textAlign === "center"
                  ? "#fff"
                  : isDarkMode
                  ? "#a1a1aa"
                  : "#64748b"
              }
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modernToolbarButton,
              textAlign === "right" && styles.activeToolbarButton,
            ]}
            onPress={() => changeTextAlign("right")}
          >
            <Ionicons
              name="text-outline"
              size={18}
              color={
                textAlign === "right"
                  ? "#fff"
                  : isDarkMode
                  ? "#a1a1aa"
                  : "#64748b"
              }
            />
          </TouchableOpacity>
        </View>

        <View style={styles.toolbarDivider} />

        {/* Font Size Section */}
        <View style={styles.toolbarSection}>
          <TouchableOpacity
            style={[
              styles.modernToolbarButton,
              fontSize === 14 && styles.activeToolbarButton,
            ]}
            onPress={() => changeFontSize(14)}
          >
            <Text
              style={[
                styles.toolbarButtonLabel,
                fontSize === 14 && styles.activeToolbarLabel,
              ]}
            >
              S
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modernToolbarButton,
              fontSize === 16 && styles.activeToolbarButton,
            ]}
            onPress={() => changeFontSize(16)}
          >
            <Text
              style={[
                styles.toolbarButtonLabel,
                fontSize === 16 && styles.activeToolbarLabel,
              ]}
            >
              M
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modernToolbarButton,
              fontSize === 18 && styles.activeToolbarButton,
            ]}
            onPress={() => changeFontSize(18)}
          >
            <Text
              style={[
                styles.toolbarButtonLabel,
                fontSize === 18 && styles.activeToolbarLabel,
              ]}
            >
              L
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  useEffect(() => {
    const loadTheme = async () => {
      const theme = await storage.getTheme();
      setIsDarkMode(theme === "dark");
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

  // Update time every second for new entries only
  useEffect(() => {
    if (!entry) { // Only for new entries
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [entry]);

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        console.log("Keyboard shown, height:", e.endCoordinates.height);
        const height = Math.max(e.endCoordinates.height, 0);
        setKeyboardHeight(height);
        setIsKeyboardVisible(true);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        console.log("Keyboard hidden");
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    );

    // Add fallback listeners for production builds
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) => {
        console.log(
          "Keyboard did show (fallback), height:",
          e.endCoordinates.height
        );
        const height = Math.max(e.endCoordinates.height, 0);
        setKeyboardHeight(height);
        setIsKeyboardVisible(true);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        console.log("Keyboard did hide (fallback)");
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardWillShowListener?.remove();
      keyboardWillHideListener?.remove();
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const handleCreateTag = async (tagName: string) => {
    try {
      const newTag = await storage.addTag({
        name: tagName,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      });
      setAvailableTags((prev) => [...prev, newTag]);
      setSelectedTags((prev) => [...prev, newTag.id]);
    } catch (error) {
      console.error("Error creating tag:", error);
      Alert.alert("Error", "Failed to create tag. Please try again.");
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title for your entry");
      return;
    }

    if (!content.trim()) {
      Alert.alert("Error", "Please write something in your entry");
      return;
    }

    setIsSaving(true);
    try {
      const newEntry = {
        id: entry?.id || generateUUID(),
        title: title.trim(),
        content: content.trim(),
        date: entry?.date || (() => {
          const now = new Date();
          const date = now.toLocaleDateString('en-CA'); // YYYY-MM-DD
          const pad = (n: number) => n.toString().padStart(2, '0');
          const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
          return `${date} ${time}`;
        })(),
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
          console.error("Error syncing entry after save:", syncError);
          // Don't show error to user, entry is saved locally and can be synced later
        }
        setIsEditing(false); // Switch back to read mode after saving
        onSave();
      } else {
        throw new Error("Entry was not saved successfully");
      }
    } catch (error) {
      console.error("Error saving entry:", error);
      Alert.alert("Error", "Failed to save entry. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
        isDarkMode && styles.darkContainer,
      ]}
    >
      {/* Compact Header */}
      <View style={[styles.compactHeader, isDarkMode && styles.darkHeader]}>
        <TouchableOpacity
          onPress={onCancel}
          disabled={isSaving}
          style={styles.headerIconButton}
        >
          <Ionicons
            name="close"
            size={24}
            color={isDarkMode ? "#fff" : "#000"}
          />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.dateText, isDarkMode && styles.darkText]}>
            {entry
              ? new Date(entry.createdAt).toLocaleDateString("en-US", {
                  weekday: "long",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : currentTime.toLocaleDateString("en-US", {
                  weekday: "long",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
          </Text>
          <Text
            style={[styles.timeText, isDarkMode && styles.darkSecondaryText]}
          >
            {entry
              ? new Date(entry.createdAt).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })
              : currentTime.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                })}
          </Text>
        </View>

        <View style={styles.headerRight}>
          {entry && !isEditing ? (
                    <TouchableOpacity
          onPress={() => {
            setIsEditing(true);
          }}
          style={styles.editButton}
        >
              <Ionicons
                name="create-outline"
                size={24}
                color={isDarkMode ? "#fff" : "#000"}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              style={[styles.headerIconButton, styles.saveButton]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="checkmark" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content Area - Maximized */}
      <KeyboardAvoidingView
        style={[styles.mainContent, isDarkMode && styles.darkContainer]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        enabled={isEditing}
      >
        {isEditing ? (
          <>
            {/* Title Input - Only visible when editing */}
            <TextInput
              style={[styles.titleInput, isDarkMode && styles.darkInput]}
              placeholder="Title"
              placeholderTextColor={isDarkMode ? "#666" : "#999"}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              returnKeyType="next"
            />

            {/* Content Input - Scrollable */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.contentScrollView}
              contentContainerStyle={[
                styles.contentScrollContainer,
                {
                  paddingBottom: isKeyboardVisible ? keyboardHeight + 100 : 50, // Add space for keyboard + toolbar
                },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
              <TextInput
                style={[
                  styles.contentInput,
                  styles.scrollableContentInput,
                  isDarkMode && styles.darkInput,
                  {
                    fontSize:
                      headingLevel === 1
                        ? 20
                        : headingLevel === 2
                        ? 18
                        : headingLevel === 3
                        ? 16
                        : fontSize,
                    fontWeight: isBold || headingLevel > 0 ? "bold" : "normal",
                    fontStyle: isItalic ? "italic" : "normal",
                    textDecorationLine: isUnderline ? "underline" : "none",
                    textAlign: textAlign,
                  },
                ]}
                placeholder="Write your thoughts..."
                placeholderTextColor={isDarkMode ? "#666" : "#999"}
                value={content}
                onChangeText={handleContentChange}

                multiline
                textAlignVertical="top"
                autoFocus={!entry && isEditing}
                scrollEnabled={false} // Disable TextInput's own scrolling since we're using ScrollView
              />
            </ScrollView>
          </>
        ) : (
          /* Read-only view */
          <ScrollView
            style={[styles.readOnlyContent, isDarkMode && styles.darkContainer]}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            <Text style={[styles.readOnlyTitle, isDarkMode && styles.darkText]}>
              {title}
            </Text>
            <Text
              style={[
                styles.readOnlyContentText,
                isDarkMode && styles.darkText,
              ]}
            >
              {content}
            </Text>
          </ScrollView>
        )}

                {/* Floating Toolbar - Only when editing and keyboard visible */}
        {isEditing && isKeyboardVisible && (
          <View
            style={[
              styles.floatingToolbar,
              isDarkMode && styles.darkFloatingToolbar,
            ]}
          >
            <View style={[styles.statsBar, isDarkMode && styles.darkStatsBar]}>
              <View style={styles.statsLeft}>
                <TouchableOpacity
                  onPress={toggleToolbar}
                  style={styles.toolbarToggle}
                >
                  <Ionicons
                    name={showToolbar ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={isDarkMode ? "#a1a1aa" : "#64748b"}
                  />
                  <Text
                    style={[
                      styles.toolbarToggleText,
                      isDarkMode && styles.darkStatsText,
                    ]}
                  >
                    Toolbar
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.statsRight}>
                <Text
                  style={[styles.statsText, isDarkMode && styles.darkStatsText]}
                >
                  {wordCount} words • {charCount} characters
                </Text>
                {wordCount > 0 && (
                  <Text
                    style={[
                      styles.readingTimeText,
                      isDarkMode && styles.darkStatsText,
                    ]}
                  >
                    {getReadingTime()}
                  </Text>
                )}
              </View>
            </View>

            {showToolbar && <RichTextToolbar />}
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Main Floating Edit Button - Only for existing entries */}
      {!isEditing && entry && (
        <Animated.View
          style={[
            styles.mainFloatingEditButton,
            {
              transform: [
                { scale: Animated.multiply(buttonScale, pulseAnimation) },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.editButtonTouchable}
            onPress={() => {
              // Add a subtle press animation
              Animated.sequence([
                Animated.timing(buttonScale, {
                  toValue: 0.95,
                  duration: 100,
                  useNativeDriver: true,
                }),
                Animated.timing(buttonScale, {
                  toValue: 1,
                  duration: 100,
                  useNativeDriver: true,
                }),
              ]).start();
              setIsEditing(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5", // Light gray background like in the image
  },
  compactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "transparent",
  },
  headerIconButton: {
    padding: 8,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  timeText: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  headerRight: {
    width: 40,
    alignItems: "flex-end",
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#22c55e",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  mainContent: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  titleInput: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  maximizedContentInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: "#1a1a1a",
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: "transparent",
    textAlignVertical: "top",
  },
  contentScrollView: {
    flex: 1,
  },
  contentScrollContainer: {
    flexGrow: 1,
    minHeight: "100%",
  },
  scrollableContentInput: {
    fontSize: 16,
    lineHeight: 24,
    color: "#1a1a1a",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    backgroundColor: "transparent",
    textAlignVertical: "top",
    minHeight: 400, // Ensure minimum height for comfortable editing
  },
  readOnlyContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  readOnlyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  readOnlyContentText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#1a1a1a",
  },
  mainFloatingEditButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#22c55e",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  editButtonTouchable: {
    width: "100%",
    height: "100%",
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },

  disabledText: {
    opacity: 0.5,
  },
  statsText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  darkStatsText: {
    color: "#a1a1aa",
  },
  toolbarButtonText: {
    fontSize: 16,
    color: "#666",
  },
  toolbar: {
    flexDirection: "row",
    padding: 8,
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  toolbarButton: {
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 4,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  toolbarButtonActive: {
    backgroundColor: "#4f46e5",
    borderColor: "#4f46e5",
  },
  toolbarButtonTextActive: {
    color: "#fff",
  },
  content: {
    flex: 1,
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 24,
    color: "#1a1a1a",
    padding: 16,
    minHeight: 200,
  },
  floatingToolbar: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000, // Ensure toolbar appears above other content
    minHeight: 60, // Ensure minimum height for the toolbar
    width: "100%", // Ensure full width
  },
  darkFloatingToolbar: {
    backgroundColor: "#1a1a1a",
    borderTopColor: "#2d2d2d",
  },
  statsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "transparent",
  },
  darkStatsBar: {
    backgroundColor: "transparent",
  },
  statsLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  statsRight: {
    alignItems: "flex-end",
  },
  toolbarToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toolbarToggleText: {
    fontSize: 12,
    color: "#64748b",
    marginLeft: 4,
  },
  readingTimeText: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  boldText: {
    fontWeight: "bold",
  },
  italicText: {
    fontStyle: "italic",
  },
  darkContainer: {
    backgroundColor: "#1a1a1a",
  },
  darkHeader: {
    backgroundColor: "#1a1a1a",
  },
  darkText: {
    color: "#fff",
  },
  darkSecondaryText: {
    color: "#a1a1aa",
  },
  darkInput: {
    color: "#fff",
    backgroundColor: "#1a1a1a",
  },
  darkToolbar: {
    backgroundColor: "#2d2d2d",
    borderBottomColor: "#404040",
  },
  modernToolbar: {
    backgroundColor: "#f8fafc",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  darkModernToolbar: {
    backgroundColor: "#1e1e1e",
    borderTopColor: "#2d2d2d",
  },
  toolbarContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  toolbarSection: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  toolbarDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 12,
  },
  modernToolbarButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 2,
    backgroundColor: "transparent",
    minWidth: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  activeToolbarButton: {
    backgroundColor: "#4f46e5",
  },
  toolbarButtonLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  activeToolbarLabel: {
    color: "#fff",
  },
});
