"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

interface TimePickerProps {
  value?: string;
  onChange: (value: string) => void;
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  return (
    <Input
      type="time"
      value={value}
      step={1800}
      lang="en-GB"
      onChange={(e) => onChange(e.target.value)}
      className="
        bg-background
        text-sm
        appearance-none
        [&::-webkit-calendar-picker-indicator]:hidden
        [&::-webkit-calendar-picker-indicator]:appearance-none
      "
    />
  );
}
