"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Redo,
  Undo,
} from "lucide-react";
import { useEffect } from "react";

type TiptapEditorProps = {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function TiptapEditor({
  content,
  onChange,
  disabled = false,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || "",
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="tiptap-wrapper">
      {!disabled && (
        <div className="tiptap-toolbar" role="toolbar" aria-label="Formatting toolbar">
          <button
            type="button"
            className={`toolbar-btn ${editor.isActive("bold") ? "active" : ""}`}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold"
          >
            <Bold size={13} />
          </button>
          <button
            type="button"
            className={`toolbar-btn ${editor.isActive("italic") ? "active" : ""}`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic"
          >
            <Italic size={13} />
          </button>
          <span className="toolbar-divider" />
          <button
            type="button"
            className={`toolbar-btn ${editor.isActive("bulletList") ? "active" : ""}`}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet List"
          >
            <List size={13} />
          </button>
          <button
            type="button"
            className={`toolbar-btn ${editor.isActive("orderedList") ? "active" : ""}`}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Numbered List"
          >
            <ListOrdered size={13} />
          </button>
          <span className="toolbar-divider" />
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo size={13} />
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo size={13} />
          </button>
        </div>
      )}
      <EditorContent editor={editor} className="tiptap-content" />
    </div>
  );
}
