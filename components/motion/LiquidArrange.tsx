"use client";

import { Reorder, useDragControls, useMotionValue, useTransform } from "framer-motion";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";

export function LiquidArrange<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
}: {
  items: T[];
  onReorder: (next: T[]) => void;
  renderItem: (item: T) => ReactNode;
}) {
  if (!items.length) return null;
  return (
    <Reorder.Group axis="y" values={items} onReorder={onReorder} className="space-y-2">
      {items.map((item) => (
        <LiquidRow key={item.id} item={item}>
          {renderItem(item)}
        </LiquidRow>
      ))}
    </Reorder.Group>
  );
}

function stretch(axis: number, other: number) {
  const primary = Math.min(0.2, Math.abs(axis) / 2800);
  const cross = Math.min(0.14, Math.abs(other) / 2800);
  return 1 + primary - cross * 0.4;
}

function LiquidRow<T extends { id: string }>({ item, children }: { item: T; children: ReactNode }) {
  const controls = useDragControls();
  const vx = useMotionValue(0);
  const vy = useMotionValue(0);
  const scaleX = useTransform([vx, vy], ([x, y]) => stretch(Number(x), Number(y)));
  const scaleY = useTransform([vx, vy], ([x, y]) => stretch(Number(y), Number(x)));
  const rotate = useTransform(vx, [-1800, 1800], [-7, 7]);

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      onDrag={(_, info) => {
        vx.set(info.velocity.x);
        vy.set(info.velocity.y);
      }}
      onDragEnd={() => {
        vx.set(0);
        vy.set(0);
      }}
      style={{ scaleX, scaleY, rotate }}
      className="relative flex items-center gap-1 rounded-2xl"
      whileDrag={{ zIndex: 8, boxShadow: "0 18px 40px rgba(0,0,0,0.38)" }}
    >
      <button
        type="button"
        aria-label="Reordenar"
        className="cursor-grab touch-none rounded-lg p-1 text-gray-600 hover:text-gold active:cursor-grabbing"
        onPointerDown={(event) => controls.start(event)}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </Reorder.Item>
  );
}
