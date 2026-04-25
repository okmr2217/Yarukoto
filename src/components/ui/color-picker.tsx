"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { COLOR_PRESETS } from "@/constants/colors";

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

interface ColorPickerProps {
  value?: string;
  onChange: (value: string | undefined) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const pickerId = useId();
  const [prevValue, setPrevValue] = useState(value);
  const [hexInput, setHexInput] = useState(value ?? "");
  const [hexError, setHexError] = useState(false);

  if (prevValue !== value) {
    setPrevValue(value);
    setHexInput(value ?? "");
    setHexError(false);
  }

  const isCustom = value !== undefined && !COLOR_PRESETS.some((c) => c.value.toLowerCase() === value.toLowerCase());
  const pickerValue = value && HEX_REGEX.test(value) ? value : "#000000";

  const handleHexChange = (raw: string) => {
    let input = raw;
    if (input && !input.startsWith("#")) {
      input = "#" + input;
    }
    input = input.toUpperCase();
    setHexInput(input);

    if (input === "" || input === "#") {
      setHexError(false);
      onChange(undefined);
      return;
    }
    if (HEX_REGEX.test(input)) {
      setHexError(false);
      onChange(input);
    } else {
      setHexError(true);
    }
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setHexInput(val);
    setHexError(false);
    onChange(val);
  };

  return (
    <div className="space-y-2">
      {/* プリセット行 */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className={cn(
            "w-7 h-7 rounded-full border-2 transition-all bg-muted flex items-center justify-center text-xs text-muted-foreground",
            !value ? "border-foreground scale-110" : "border-transparent hover:scale-105",
          )}
          aria-label="なし"
        >
          ✕
        </button>
        {COLOR_PRESETS.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => onChange(c.value)}
            className={cn(
              "w-7 h-7 rounded-full border-2 transition-all",
              value?.toLowerCase() === c.value.toLowerCase()
                ? "border-foreground scale-110"
                : "border-transparent hover:scale-105",
            )}
            style={{ backgroundColor: c.value }}
            aria-label={c.name}
          />
        ))}
      </div>

      {/* カスタム行 */}
      <div className="flex items-center gap-2">
        <div className="relative w-7 h-7 shrink-0">
          <label
            htmlFor={pickerId}
            className={cn(
              "block w-7 h-7 rounded-full border-2 transition-all cursor-pointer",
              isCustom ? "border-foreground scale-110" : "border-transparent hover:scale-105",
            )}
            style={
              isCustom
                ? { backgroundColor: value }
                : { background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }
            }
            aria-label="カスタムカラーを選択"
          />
          <input
            id={pickerId}
            type="color"
            value={pickerValue}
            onChange={handlePickerChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            tabIndex={-1}
          />
        </div>
        <Input
          value={hexInput}
          onChange={(e) => handleHexChange(e.target.value)}
          placeholder="#RRGGBB"
          maxLength={7}
          className={cn(
            "w-32 font-mono uppercase",
            hexError && "border-destructive text-destructive focus-visible:ring-destructive",
          )}
        />
        {hexError && <span className="text-xs text-destructive">不正なHEX</span>}
      </div>
    </div>
  );
}
