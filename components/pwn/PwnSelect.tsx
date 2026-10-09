"use client";

import { useState } from "react";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "@/components/icons";

export function PwnSelect({
  id,
  value,
  onValueChange,
  options,
  disabled,
  "aria-label": ariaLabel,
}: {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((option) => option.value === value)?.label ?? "";

  return (
    <Select.Root
      value={value}
      open={open}
      onOpenChange={setOpen}
      onValueChange={(next) => {
        onValueChange(next);
        setOpen(false);
      }}
      disabled={disabled}
    >
      <Select.Trigger id={id} aria-label={ariaLabel} className="pwn-select-trigger">
        <Select.Value className="pwn-select-value">{selectedLabel}</Select.Value>
        <Select.Icon className="pwn-select-chevron">
          <ChevronDown className="h-4 w-4" aria-hidden />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className="pwn-select-menu"
          position="popper"
          sideOffset={6}
          collisionPadding={12}
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <Select.Viewport className="pwn-select-viewport">
            {options.map((option) => (
              <Select.Item key={option.value} value={option.value} className="pwn-select-item">
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="pwn-select-check">
                  <Check className="h-3.5 w-3.5" aria-hidden />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
// creado por pato dev y askforvini
