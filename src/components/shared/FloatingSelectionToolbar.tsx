"use client";

import { useCallback, useEffect, useState } from "react";
import { IconBold, IconItalic, IconPalette, IconUnderline } from "@tabler/icons-react";

type EditableField = HTMLInputElement | HTMLTextAreaElement;

type FloatingSelectionToolbarProps = {
  allEditableFields?: boolean;
  syntax?: "html" | "markdown";
};

const formats = [
  { tag: "strong", label: "Bold", icon: IconBold },
  { tag: "em", label: "Italic", icon: IconItalic },
  { tag: "u", label: "Underline", icon: IconUnderline },
] as const;

function setNativeValue(field: EditableField, value: string) {
  const prototype = field instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(field, value);
  field.dispatchEvent(new Event("input", { bubbles: true }));
}

function isSupportedField(element: Element | null, allEditableFields: boolean): element is EditableField {
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) return false;
  if (element.disabled || element.readOnly || element.dataset.formatToolbar === "false") return false;
  if (!allEditableFields && element.dataset.formatToolbar !== "true") return false;
  if (element instanceof HTMLTextAreaElement) return true;
  return ["text", "search", "email", "url", "tel"].includes(element.type || "text");
}

export function FloatingSelectionToolbar({
  allEditableFields = false,
  syntax = "html",
}: FloatingSelectionToolbarProps) {
  const [field, setField] = useState<EditableField | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const inspectSelection = useCallback(() => {
    const active = document.activeElement;
    if (
      !isSupportedField(active, allEditableFields) ||
      (active.selectionStart ?? 0) === (active.selectionEnd ?? 0)
    ) {
      setField(null);
      return;
    }

    const rect = active.getBoundingClientRect();
    setPosition({
      top: Math.max(8, rect.top - 48),
      left: Math.min(window.innerWidth - 178, Math.max(8, rect.left + rect.width / 2 - 85)),
    });
    setField(active);
  }, [allEditableFields]);

  useEffect(() => {
    document.addEventListener("mouseup", inspectSelection);
    document.addEventListener("keyup", inspectSelection);
    document.addEventListener("select", inspectSelection, true);
    document.addEventListener("selectionchange", inspectSelection);
    window.addEventListener("resize", inspectSelection);
    window.addEventListener("scroll", inspectSelection, true);
    return () => {
      document.removeEventListener("mouseup", inspectSelection);
      document.removeEventListener("keyup", inspectSelection);
      document.removeEventListener("select", inspectSelection, true);
      document.removeEventListener("selectionchange", inspectSelection);
      window.removeEventListener("resize", inspectSelection);
      window.removeEventListener("scroll", inspectSelection, true);
    };
  }, [inspectSelection]);

  const applyFormat = (prefix: string, suffix: string) => {
    if (!field) return;
    const start = field.selectionStart ?? 0;
    const end = field.selectionEnd ?? 0;
    if (start === end) return;
    const selected = field.value.slice(start, end);
    const nextValue = `${field.value.slice(0, start)}${prefix}${selected}${suffix}${field.value.slice(end)}`;
    setNativeValue(field, nextValue);
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
      inspectSelection();
    });
  };

  if (!field) return null;

  return (
    <div
      className="fixed z-[100] flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 p-1 text-white shadow-xl"
      style={position}
      role="toolbar"
      aria-label="Selected text formatting"
      onMouseDown={(event) => event.preventDefault()}
    >
      {formats.map(({ tag, label, icon: Icon }) => (
        <button
          key={tag}
          type="button"
          onClick={() => {
            const markers = syntax === "markdown"
              ? tag === "strong" ? ["**", "**"] : tag === "em" ? ["*", "*"] : ["__", "__"]
              : [`<${tag}>`, `</${tag}>`];
            applyFormat(markers[0], markers[1]);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/15"
          title={label}
          aria-label={`${label} selected text`}
        >
          <Icon size={17} stroke={2.4} />
        </button>
      ))}
      <span className="mx-0.5 h-5 w-px bg-white/20" />
      <label className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-md hover:bg-white/15" title="Text color" aria-label="Color selected text">
        <IconPalette size={17} stroke={2.4} />
        <input
          type="color"
          defaultValue="#000000"
          className="absolute inset-0 cursor-pointer opacity-0"
          onMouseDown={(event) => event.preventDefault()}
          onChange={(event) => syntax === "markdown"
            ? applyFormat(`{color:${event.target.value}}`, "{/color}")
            : applyFormat(`<span style="color:${event.target.value}">`, "</span>")}
        />
      </label>
    </div>
  );
}
