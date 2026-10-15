"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";

export type CategoryFilterItem = {
    id: string;
    name: string;
    href: string;
    active: boolean;
};

export default function CategoryFilters({
    items,
}: {
    items: CategoryFilterItem[];
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const activeItem = items.find((item) => item.active) ?? items[0];

    // بستن منو با کلیک بیرون یا فشردن Escape
    useEffect(() => {
        if (!isOpen) return;

        const handlePointerDown = (event: PointerEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    return (
        <>
            {/* Mobile: Animated dropdown */}
            <div ref={dropdownRef} className="relative w-full md:hidden">
                <button
                    type="button"
                    onClick={() => setIsOpen((open) => !open)}
                    aria-expanded={isOpen}
                    aria-haspopup="menu"
                    aria-controls="category-filter-menu"
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm transition-colors hover:border-indigo-200 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30"
                >
                    <span className="flex min-w-0 items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                            <span className="size-2 rounded-full bg-indigo-500" />
                        </span>

                        <span className="min-w-0 text-right">
                            <span className="block text-[11px] text-stone-400">
                                دسته‌بندی آزمون‌ها
                            </span>

                            <span className="mt-0.5 block truncate font-semibold text-stone-800">
                                {activeItem?.name ?? "انتخاب دسته‌بندی"}
                            </span>
                        </span>
                    </span>

                    <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 350,
                            damping: 24,
                        }}
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500"
                    >
                        <ChevronDown className="size-4" />
                    </motion.span>
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            id="category-filter-menu"
                            role="menu"
                            initial={{
                                opacity: 0,
                                y: -8,
                                scale: 0.98,
                            }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                scale: 1,
                            }}
                            exit={{
                                opacity: 0,
                                y: -6,
                                scale: 0.98,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 380,
                                damping: 30,
                            }}
                            className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-stone-200 bg-white p-1.5 shadow-xl shadow-stone-900/10"
                        >
                            <div className="max-h-64 overflow-y-auto">
                                {items.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        role="menuitem"
                                        onClick={() => setIsOpen(false)}
                                        className={`relative isolate flex items-center justify-between gap-3 rounded-lg px-3.5 py-3 text-sm transition-colors ${
                                            item.active
                                                ? "font-semibold text-indigo-700"
                                                : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                                        }`}
                                    >
                                        {item.active && (
                                            <motion.span
                                                layoutId="mobile-active-category-background"
                                                className="pointer-events-none absolute inset-0 -z-10 rounded-lg border border-indigo-100 bg-indigo-50"
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 380,
                                                    damping: 30,
                                                }}
                                            />
                                        )}

                                        <span className="relative z-10">
                                            {item.name}
                                        </span>

                                        {item.active && (
                                            <Check className="relative z-10 size-4 shrink-0 text-indigo-600" />
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Desktop: Animated category pills */}
            <div className="hidden flex-wrap items-center gap-1.5 rounded-2xl border border-stone-200 bg-stone-100 p-1.5 md:flex">
                {items.map((item) => (
                    <Link
                        key={item.id}
                        href={item.href}
                        aria-current={item.active ? "page" : undefined}
                        className={`relative isolate rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                            item.active
                                ? "text-indigo-700"
                                : "text-stone-600 hover:text-stone-900"
                        }`}
                    >
                        {item.active && (
                            <motion.span
                                layoutId="desktop-active-category-background"
                                transition={{
                                    type: "spring",
                                    stiffness: 380,
                                    damping: 32,
                                }}
                                className="pointer-events-none absolute inset-0 -z-10 rounded-2xl border border-indigo-200 bg-white shadow-sm"
                            />
                        )}

                        <span className="relative z-10">
                            {item.name}
                        </span>
                    </Link>
                ))}
            </div>
        </>
    );
}