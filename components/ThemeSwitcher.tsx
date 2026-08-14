"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Sun, Palette, Type, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ThemeSettingsDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ThemeSwitcher = ({ open, setOpen }: ThemeSettingsDialogProps) => {
  const { theme, setTheme, fontSize, setFontSize, buttonSize, setButtonSize } = useTheme();

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-card text-card-foreground border border-border rounded-xl shadow-2xl p-6 space-y-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] duration-200">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <Dialog.Title className="text-lg font-bold text-foreground flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              <span>Appearance Settings</span>
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
                <span className="sr-only">Close</span>
              </Button>
            </Dialog.Close>
          </div>

          {/* Theme Selection */}
          <div>
            <h4 className="text-xs font-bold mb-2.5 text-muted-foreground flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5" />
              <span>Theme Palette</span>
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: "light", label: "Light" },
                { id: "dark", label: "Dark" },
                { id: "blue", label: "Blue" },
                { id: "contrast", label: "High Contrast" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as any)}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-all ${
                    theme === t.id
                      ? "bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]"
                      : "bg-muted/30 border-border text-foreground hover:border-primary/40 hover:bg-muted"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size Selection */}
          <div>
            <h4 className="text-xs font-bold mb-2.5 text-muted-foreground flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5" />
              <span>Font Size</span>
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "standard", label: "Standard" },
                { id: "large", label: "Large" },
                { id: "xl", label: "Extra Large" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setFontSize(s.id as any)}
                  className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                    fontSize === s.id
                      ? "bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]"
                      : "bg-muted/30 border-border text-foreground hover:border-primary/40 hover:bg-muted"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Button Size Selection */}
          <div>
            <h4 className="text-xs font-bold mb-2.5 text-muted-foreground flex items-center gap-1.5">
              <MousePointerClick className="w-3.5 h-3.5" />
              <span>Button Size</span>
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "small", label: "Small" },
                { id: "medium", label: "Medium" },
                { id: "large", label: "Large" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setButtonSize(s.id as any)}
                  className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                    buttonSize === s.id
                      ? "bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]"
                      : "bg-muted/30 border-border text-foreground hover:border-primary/40 hover:bg-muted"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ThemeSwitcher;
