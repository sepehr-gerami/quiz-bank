"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  FileText,
  Layers,
} from "lucide-react";

const options = [
  {
    value: "topic",
    label: "موضوع جدید",
    description: "پیشنهاد یک موضوع آموزشی تازه",
    icon: FileText,
  },
  {
    value: "quiz",
    label: "آزمون جدید",
    description: "درخواست طراحی آزمون و پرسش‌ها",
    icon: Layers,
  },
] as const;

type RequestType = (typeof options)[number]["value"];

export function RequestTypeSelect() {
  const [value, setValue] = useState<RequestType>("topic");
  const [open, setOpen] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];
  const SelectedIcon = selected.icon;

  useEffect(() => {
    function handleOutsideClick(event: PointerEvent) {
      if (
        rootRef.current &&
        event.target instanceof Node &&
        !rootRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      {/* Value submitted with the existing server action */}
      <input type="hidden" name="type" value={value} />

      {/* Dropdown trigger */}
      <button
        id="type"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="request-type-options"
        onClick={() => setOpen((current) => !current)}
        className={`group flex w-full items-center gap-3 rounded-2xl border p-3.5 text-right outline-none backdrop-blur-xl transition-all duration-200 focus-visible:ring-4 focus-visible:ring-indigo-500/10 ${
          open
            ? "border-indigo-300 bg-white/95 ring-4 ring-indigo-500/10"
            : "border-slate-200/90 bg-white/65 hover:border-indigo-200 hover:bg-white/90"
        }`}
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-50 to-blue-100/80 text-indigo-600 transition-colors group-hover:from-indigo-100 group-hover:to-blue-100">
          <SelectedIcon className="size-5" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-extrabold text-slate-800">
            {selected.label}
          </span>

          <span className="mt-1 block text-xs leading-5 text-slate-500">
            {selected.description}
          </span>
        </span>

        <ChevronDown
          className={`size-4 shrink-0 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180 text-indigo-600" : ""
          }`}
        />
      </button>

      {/* Glass dropdown menu */}
      {open && (
        <div
          id="request-type-options"
          role="listbox"
          aria-label="انتخاب نوع درخواست"
          className="absolute inset-x-0 top-full z-30 mt-2 origin-top overflow-hidden rounded-2xl border border-white/90 bg-white/90 p-1.5 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl animate-fade-up"
        >
          {options.map((option) => {
            const OptionIcon = option.icon;
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setValue(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl p-3 text-right transition-all duration-150 ${
                  isSelected
                    ? "bg-linear-to-l from-indigo-50/90 to-blue-50/70"
                    : "hover:bg-slate-50/90"
                }`}
              >
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                    isSelected
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "bg-slate-100/90 text-slate-500"
                  }`}
                >
                  <OptionIcon className="size-5" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-slate-800">
                    {option.label}
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    {option.description}
                  </span>
                </span>

                <span className="flex size-6 shrink-0 items-center justify-center">
                  {isSelected && (
                    <Check className="size-4 text-indigo-600" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}