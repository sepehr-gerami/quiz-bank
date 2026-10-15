"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
};

function isActivePath(href: string, pathname: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav
      className="hidden items-center gap-1 lg:flex"
      aria-label="ناوبری اصلی"
    >
      {items.map((item) => {
        const active = isActivePath(item.href, pathname);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-xl px-3.5 py-2 text-sm font-bold transition-all duration-200 ${
              active
                ? "bg-indigo-50 text-indigo-700"
                : "text-stone-500 hover:bg-stone-100/80 hover:text-stone-900"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const activeItem = items.find((item) =>
    isActivePath(item.href, pathname)
  );

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
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
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative w-full lg:hidden">
      {/* Hamburger trigger */}
      <button
        type="button"
        aria-label={open ? "بستن منو" : "باز کردن منو"}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((previous) => !previous)}
        className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3.5 text-sm font-bold outline-none transition-colors focus-visible:ring-4 focus-visible:ring-indigo-500/15 ${
          open
            ? "text-indigo-700"
            : "text-slate-700 hover:bg-slate-100/70"
        }`}
      >
        <span className="flex items-center gap-2.5">
          <span
            className={`flex size-9 items-center justify-center rounded-xl transition-colors ${
              open
                ? "bg-indigo-100 text-indigo-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {open ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </span>

          <span>فهرست صفحات</span>

          {activeItem && (
            <>
              <span className="text-slate-300">/</span>
              <span className="text-indigo-600">
                {activeItem.label}
              </span>
            </>
          )}
        </span>

        <ChevronDown
          className={`size-4 shrink-0 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180 text-indigo-600" : ""
          }`}
        />
      </button>

      {/* Dropdown menu */}
      {open && (
        <nav
          id={menuId}
          aria-label="ناوبری موبایل و تبلت"
          className="absolute inset-x-0 top-full z-50 mt-2 rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-xl shadow-slate-900/10 backdrop-blur-2xl animate-fade-up"
        >
          <div className="mb-2 px-3 pt-2 pb-1">
            <p className="text-xs font-medium text-slate-400">
              برای رفتن به صفحه موردنظر انتخاب کنید
            </p>
          </div>

          <div className="space-y-1">
            {items.map((item) => {
              const active = isActivePath(item.href, pathname);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-11 items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition-all duration-150 ${
                    active
                      ? "bg-gradient-to-l from-indigo-50 to-blue-50/70 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`size-2 shrink-0 rounded-full transition-colors ${
                        active
                          ? "bg-indigo-600 shadow-sm shadow-indigo-500/40"
                          : "bg-slate-200"
                      }`}
                    />

                    {item.label}
                  </span>

                  {active && (
                    <span className="rounded-lg bg-white/80 px-2 py-1 text-[10px] font-bold text-indigo-600">
                      صفحه فعلی
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
