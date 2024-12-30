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
} from 'react-icons/ri';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  autosave?: boolean;
}

const AUTOSAVE_DELAY = 1000; // 1 second

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Write your thoughts here...',
  autosave = true,
}: RichTextEditorProps): React.ReactElement | null {
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
  });

  useEffect(() => {
    if (!editor || !autosave) return;

    const timer = setTimeout(() => {
      // Trigger save here
      console.log('Autosaving...', editor.getHTML());
    }, AUTOSAVE_DELAY);

    return () => clearTimeout(timer);
  }, [editor, autosave, content]);

  const ToolbarButton = useCallback(
    ({ 
      icon: Icon,
      action,
      isActive = () => false,
    }: {
      icon: React.ComponentType;
      action: () => void;
      isActive?: () => boolean;
    }) => (
      <button
        onClick={action}
        className={`p-2 rounded hover:bg-surface-hover ${
          isActive() ? 'text-primary bg-surface-hover' : 'text-secondary'
        }`}
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
        />
        <ToolbarButton
          icon={RiItalic}
          action={() => editor.chain().focus().toggleItalic().run()}
          isActive={() => editor.isActive('italic')}
        />
        <ToolbarButton
          icon={RiStrikethrough}
          action={() => editor.chain().focus().toggleStrike().run()}
          isActive={() => editor.isActive('strike')}
        />
        <div className="w-px h-6 bg-border mx-2" />
        <ToolbarButton
          icon={RiH1}
          action={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={() => editor.isActive('heading', { level: 1 })}
        />
        <ToolbarButton
          icon={RiH2}
          action={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={() => editor.isActive('heading', { level: 2 })}
        />
        <div className="w-px h-6 bg-border mx-2" />
        <ToolbarButton
          icon={RiListUnordered}
          action={() => editor.chain().focus().toggleBulletList().run()}
          isActive={() => editor.isActive('bulletList')}
        />
        <ToolbarButton
          icon={RiListOrdered}
          action={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={() => editor.isActive('orderedList')}
        />
        <ToolbarButton
          icon={RiCheckboxLine}
          action={() => editor.chain().focus().toggleTaskList().run()}
          isActive={() => editor.isActive('taskList')}
        />
        <div className="w-px h-6 bg-border mx-2" />
        <ToolbarButton
          icon={RiDoubleQuotesL}
          action={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={() => editor.isActive('blockquote')}
        />
        <ToolbarButton
          icon={RiCodeBoxLine}
          action={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={() => editor.isActive('codeBlock')}
        />
        <div className="w-px h-6 bg-border mx-2" />
        <ToolbarButton
          icon={RiAlignLeft}
          action={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={() => editor.isActive({ textAlign: 'left' })}
        />
        <ToolbarButton
          icon={RiAlignCenter}
          action={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={() => editor.isActive({ textAlign: 'center' })}
        />
        <ToolbarButton
          icon={RiAlignRight}
          action={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={() => editor.isActive({ textAlign: 'right' })}
        />
        <div className="w-px h-6 bg-border mx-2" />
        <ToolbarButton
          icon={RiMarkPenLine}
          action={() => editor.chain().focus().toggleHighlight().run()}
          isActive={() => editor.isActive('highlight')}
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