"use client";

import { useEffect } from "react";

const editable = (el: EventTarget | null) =>
  el instanceof HTMLElement && Boolean(el.closest("input, textarea, select, [contenteditable='true']"));

// Native-app behavior the CSS in globals.css can't do alone:
// - no long-press / right-click menu (Android shows one for images and links), except in text fields
// - no dragging images and links around
// - iOS only applies :active (our press-and-hold animations) when a touchstart listener exists
export function AppFeel() {
  useEffect(() => {
    const noMenu = (e: Event) => {
      if (!editable(e.target)) e.preventDefault();
    };
    const noDrag = (e: DragEvent) => e.preventDefault();
    const enableActive = () => {};
    document.addEventListener("contextmenu", noMenu);
    document.addEventListener("dragstart", noDrag);
    document.addEventListener("touchstart", enableActive, { passive: true });
    return () => {
      document.removeEventListener("contextmenu", noMenu);
      document.removeEventListener("dragstart", noDrag);
      document.removeEventListener("touchstart", enableActive);
    };
  }, []);
  return null;
}
