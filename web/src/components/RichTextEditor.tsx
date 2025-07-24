'use client';

import React, { useCallback, useEffect } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import {
  RiBold,
  RiItalic,
  RiStrikethrough,
  RiH1,
  RiH2,
  RiListUnordered,
  RiListOrdered,
  RiDoubleQuotesL,
  RiCodeBoxLine,
  RiAlignLeft,
  RiAlignCenter,
  RiAlignRight,
  RiMarkPenLine,
  RiCheckboxLine,
  RiMicLine,
  RiMicOffLine,
} from 'react-icons/ri';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  autosave?: boolean;
}

const AUTOSAVE_DELAY = 1000;

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Write your thoughts here...',
  autosave = true,
}: RichTextEditorProps): React.ReactElement | null {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    finalTranscript,
    interimTranscript
  } = useSpeechRecognition({
    commands: [],
    transcribing: true,
    clearTranscriptOnListen: true,
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Typography,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'editor-content prose dark:prose-invert max-w-none focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    immediatelyRender: false,
  });

  // Insert transcript into editor when it changes
  useEffect(() => {
    if (editor && (finalTranscript || interimTranscript)) {
      console.log('Final transcript:', finalTranscript);
      console.log('Interim transcript:', interimTranscript);
      editor.commands.focus();
      if (finalTranscript) {
        editor.commands.insertContent(finalTranscript + ' ');
        resetTranscript();
      }
    }
  }, [editor, finalTranscript, interimTranscript]);

  useEffect(() => {
    if (!editor || !autosave) return;

    const timer = setTimeout(() => {
      console.log('Autosaving...', editor.getHTML());
    }, AUTOSAVE_DELAY);

    return () => clearTimeout(timer);
  }, [editor, autosave, content]);

  const toggleListening = () => {
    if (!browserSupportsSpeechRecognition) {
      // Check if user is using Brave
      const isBrave = typeof (navigator as any).brave !== 'undefined' || typeof (window as any).brave !== 'undefined';
      if (isBrave) {
        alert('Voice input is not supported in Brave browser due to privacy restrictions. Please use Chrome or Edge for voice input functionality.');
      } else {
        alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      }
      return;
    }

    if (!isMicrophoneAvailable) {
      alert('Please allow microphone access to use voice input.');
      return;
    }

    if (listening) {
      console.log('Stopping speech recognition');
      SpeechRecognition.stopListening();
    } else {
      console.log('Starting speech recognition');
      try {
        // Focus the editor before starting speech recognition
        editor?.commands.focus();
        SpeechRecognition.startListening({ 
          continuous: true,
          language: 'en-US',
          interimResults: true
        });
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        alert('Error starting voice input. Please try again.');
      }
    }
  };

  const ToolbarButton = useCallback(
    ({ 
      icon: Icon,
      action,
      isActive = () => false,
      title = '',
    }: {
      icon: React.ComponentType;
      action: () => void;
      isActive?: () => boolean;
      title?: string;
    }) => (
      <button
        onClick={action}
        className={`p-2 rounded hover:bg-surface-hover ${
          isActive() ? 'text-primary bg-surface-hover' : 'text-secondary'
        }`}
        title={title}
      >
        <Icon />
      </button>
    ),
    []
  );

  if (!editor) return null;

  return (
    <div className="editor-container">
      <div className="editor-toolbar">
        <ToolbarButton
          icon={RiBold}
          action={() => editor.chain().focus().toggleBold().run()}
          isActive={() => editor.isActive('bold')}
          title="Bold"
        />
        <ToolbarButton
          icon={RiItalic}
          action={() => editor.chain().focus().toggleItalic().run()}
          isActive={() => editor.isActive('italic')}
          title="Italic"
        />
        <ToolbarButton
          icon={RiStrikethrough}
          action={() => editor.chain().focus().toggleStrike().run()}
          isActive={() => editor.isActive('strike')}
          title="Strikethrough"
        />
        <div className="w-px h-6 bg-border mx-2" />
        <ToolbarButton
          icon={RiH1}
          action={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={() => editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        />
        <ToolbarButton
          icon={RiH2}
          action={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={() => editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        />
        <div className="w-px h-6 bg-border mx-2" />
        <ToolbarButton
          icon={RiListUnordered}
          action={() => editor.chain().focus().toggleBulletList().run()}
          isActive={() => editor.isActive('bulletList')}
          title="Bullet List"
        />
        <ToolbarButton
          icon={RiListOrdered}
          action={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={() => editor.isActive('orderedList')}
          title="Numbered List"
        />
        <ToolbarButton
          icon={RiCheckboxLine}
          action={() => editor.chain().focus().toggleTaskList().run()}
          isActive={() => editor.isActive('taskList')}
          title="Task List"
        />
        <div className="w-px h-6 bg-border mx-2" />
        <ToolbarButton
          icon={RiDoubleQuotesL}
          action={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={() => editor.isActive('blockquote')}
          title="Quote"
        />
        <ToolbarButton
          icon={RiCodeBoxLine}
          action={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={() => editor.isActive('codeBlock')}
          title="Code Block"
        />
        <div className="w-px h-6 bg-border mx-2" />
        <ToolbarButton
          icon={RiAlignLeft}
          action={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={() => editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        />
        <ToolbarButton
          icon={RiAlignCenter}
          action={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={() => editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        />
        <ToolbarButton
          icon={RiAlignRight}
          action={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={() => editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        />
        <div className="w-px h-6 bg-border mx-2" />
        <ToolbarButton
          icon={RiMarkPenLine}
          action={() => editor.chain().focus().toggleHighlight().run()}
          isActive={() => editor.isActive('highlight')}
          title="Highlight"
        />
        <div className="w-px h-6 bg-border mx-2" />
        <ToolbarButton
          icon={listening ? RiMicOffLine : RiMicLine}
          action={toggleListening}
          isActive={() => listening}
          title={listening ? "Stop Voice Input" : "Start Voice Input"}
        />
      </div>

      <EditorContent editor={editor} />

      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          className="bg-surface border border-border rounded-lg shadow-lg flex overflow-hidden"
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 hover:bg-surface-hover ${
              editor.isActive('bold') ? 'text-primary bg-surface-hover' : 'text-secondary'
            }`}
          >
            <RiBold />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 hover:bg-surface-hover ${
              editor.isActive('italic') ? 'text-primary bg-surface-hover' : 'text-secondary'
            }`}
          >
            <RiItalic />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`p-2 hover:bg-surface-hover ${
              editor.isActive('highlight') ? 'text-primary bg-surface-hover' : 'text-secondary'
            }`}
          >
            <RiMarkPenLine />
          </button>
        </BubbleMenu>
      )}
    </div>
  );
} 