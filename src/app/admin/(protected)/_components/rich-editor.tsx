"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState } from "react";
import styles from "./rich-editor.module.css";

/**
 * TipTap keeps its value in its own state, so the HTML is mirrored into a
 * hidden input for the server action to read with the rest of the form.
 */
export function RichEditor({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: string;
}) {
  const [html, setHtml] = useState(defaultValue);

  const editor = useEditor({
    // Rendering on the server would mismatch on hydration.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        code: false,
      }),
    ],
    content: defaultValue,
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
    editorProps: { attributes: { class: styles.content } },
  });

  if (!editor)
    return <div className={styles.loading}>Завантаження редактора…</div>;

  const button = (
    label: string,
    title: string,
    active: boolean,
    onClick: () => void,
  ) => (
    <button
      type="button"
      title={title}
      aria-pressed={active}
      className={`${styles.toolButton} ${active ? styles.toolButtonActive : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        {button("Ж", "Жирний", editor.isActive("bold"), () =>
          editor.chain().focus().toggleBold().run(),
        )}
        {button("К", "Курсив", editor.isActive("italic"), () =>
          editor.chain().focus().toggleItalic().run(),
        )}
        {button(
          "H2",
          "Підзаголовок",
          editor.isActive("heading", { level: 2 }),
          () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        )}
        {button(
          "H3",
          "Менший підзаголовок",
          editor.isActive("heading", { level: 3 }),
          () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        )}
        {button("•", "Список", editor.isActive("bulletList"), () =>
          editor.chain().focus().toggleBulletList().run(),
        )}
        {button(
          "1.",
          "Нумерований список",
          editor.isActive("orderedList"),
          () => editor.chain().focus().toggleOrderedList().run(),
        )}
        {button("❝", "Цитата", editor.isActive("blockquote"), () =>
          editor.chain().focus().toggleBlockquote().run(),
        )}
      </div>

      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
