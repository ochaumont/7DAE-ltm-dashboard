"use client";

import { useEffect, useRef } from "react";

export type NodeContextMenuTarget = {
  nodeId: string;
  x: number;
  y: number;
  canExpandDependsOn: boolean;
  canExpandSupports: boolean;
  canHide: boolean;
};

type Props = {
  target: NodeContextMenuTarget | null;
  onExpandDependsOn: (nodeId: string) => void;
  onExpandSupports: (nodeId: string) => void;
  onHide: (nodeId: string) => void;
  onClose: () => void;
};

export default function NodeContextMenu({
  target,
  onExpandDependsOn,
  onExpandSupports,
  onHide,
  onClose,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!target) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function onPointerDown(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [target, onClose]);

  if (!target) return null;

  const itemClass = (enabled: boolean) =>
    `block w-full px-3 py-1.5 text-left text-sm rounded cursor-default ${
      enabled ? "text-fg hover:bg-surface-2" : "text-muted opacity-60"
    }`;

  return (
    <div
      ref={menuRef}
      role="menu"
      className="absolute z-30 min-w-[180px] rounded-card border border-border bg-surface py-1.5 shadow-2xl"
      style={{ left: target.x, top: target.y }}
    >
      <button
        type="button"
        role="menuitem"
        disabled={!target.canExpandDependsOn}
        onClick={() => {
          onExpandDependsOn(target.nodeId);
          onClose();
        }}
        className={itemClass(target.canExpandDependsOn)}
      >
        Show depends on
      </button>
      <button
        type="button"
        role="menuitem"
        disabled={!target.canExpandSupports}
        onClick={() => {
          onExpandSupports(target.nodeId);
          onClose();
        }}
        className={itemClass(target.canExpandSupports)}
      >
        Show supports
      </button>
      <div className="my-1 border-t border-border" />
      <button
        type="button"
        role="menuitem"
        disabled={!target.canHide}
        onClick={() => {
          onHide(target.nodeId);
          onClose();
        }}
        className={itemClass(target.canHide)}
      >
        Hide
      </button>
    </div>
  );
}
