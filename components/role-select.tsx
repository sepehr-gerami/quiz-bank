
"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  GraduationCap,
  UserRound,
} from "lucide-react";

const roles = [
  {
    value: "user",
    label: "دانش‌آموز",
    description: "شرکت در آزمون‌ها و مشاهده نتایج",
    icon: UserRound,
  },
  {
    value: "teacher",
    label: "معلم",
    description: "ساخت و مدیریت آزمون‌های خود",
    icon: GraduationCap,
  },
] as const;

type Role = (typeof roles)[number]["value"];

export default function RoleSelect() {
  const [value, setValue] = useState<Role>("user");
  const [open, setOpen] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const selected = roles.find((role) => role.value === value) ?? roles[0];
  const SelectedIcon = selected.icon;

  useEffect(() => {
    if (!open) return;

    function handleOutsideClick(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }

      if (
        event.key === "ArrowDown" &&
        rootRef.current?.contains(document.activeElement)
      ) {
        event.preventDefault();
        setValue((current) => (current === "user" ? "teacher" : "user"));
      }

      if (
        event.key === "ArrowUp" &&
        rootRef.current?.contains(document.activeElement)
      ) {
        event.preventDefault();
        setValue((current) => (current === "teacher" ? "user" : "teacher"));
      }
    }

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      {/* مقدار انتخاب‌شده به فرم ثبت‌نام ارسال می‌شود */}
      <input type="hidden" name="role" value={value} />

      <button
        id="role"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((previous) => !previous)}
        className={`group flex w-full items-center gap-3 rounded-xl border p-3 text-right outline-none transition-all duration-200 focus-visible:ring-4 focus-visible:ring-indigo-500/10 ${
          open
            ? "border-indigo-400 bg-white ring-2 ring-indigo-100"
            : "border-stone-300 bg-white hover:border-indigo-300"
        }`}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-blue-100 text-indigo-600">
          <SelectedIcon className="size-5" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-stone-800">
            {selected.label}
          </span>

          <span className="mt-1 block text-xs leading-5 text-stone-500">
            {selected.description}
          </span>
        </span>

        <ChevronDown
          className={`size-4 shrink-0 text-stone-400 transition-transform duration-200 ${
            open ? "rotate-180 text-indigo-600" : ""
          }`}
        />
      </button>

      {open && (
        <div
          id={menuId}
          role="listbox"
          aria-label="انتخاب نوع حساب کاربری"
          className="absolute inset-x-0 top-full z-50 mt-2 origin-top overflow-hidden rounded-2xl border border-white/90 bg-white/95 p-1.5 shadow-xl shadow-slate-900/10 backdrop-blur-2xl animate-fade-up"
        >
          {roles.map((role) => {
            const Icon = role.icon;
            const active = role.value === value;

            return (
              <button
                key={role.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  setValue(role.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-xl p-3 text-right transition-colors duration-150 ${
                  active
                    ? "bg-gradient-to-l from-indigo-50 to-blue-50/70"
                    : "hover:bg-stone-50"
                }`}
              >
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                    active
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "bg-stone-100 text-stone-500"
                  }`}
                >
                  <Icon className="size-5" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-stone-800">
                    {role.label}
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-stone-500">
                    {role.description}
                  </span>
                </span>

                {active && (
                  <Check className="size-4 shrink-0 text-indigo-600" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
