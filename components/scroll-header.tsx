"use client";

import { useState, type ReactNode } from "react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";

type ScrollHeaderProps = {
  children: ReactNode;
};

export function ScrollHeader({ children }: ScrollHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const next = latest > 24;

    setIsScrolled((current) =>
      current === next ? current : next
    );
  });

  const spring = {
    type: "spring" as const,
    stiffness: 240,
    damping: 28,
    mass: 0.8,
  };

  return (
    <motion.header className="sticky top-0 z-40 w-full">
      <motion.div
        layout
        initial={false}
        animate={{
          y: isScrolled ? 16 : 0,
          borderRadius: isScrolled ? 40 : 0,
          boxShadow: isScrolled
            ? "0 12px 35px rgba(15, 23, 42, 0.12)"
            : "0 0 0 rgba(15, 23, 42, 0)",
        }}
        transition={{
          ...spring,
          layout: spring,
        }}
     className={[
  "mx-auto backdrop-blur-3xl",
  isScrolled
    ? [
        // موبایل: جمع‌تر
        "w-[calc(100%-2.5rem)]",

        // موبایل بزرگ و نمایشگرهای کوچک
        "sm:w-[calc(100%-3rem)]",

        // تبلت: جمع‌تر با عرض محدود
        "md:w-[calc(100%-5rem)]",
        "md:max-w-2xl",

        // دسکتاپ: فضای بیشتر
        "lg:w-[calc(100%-2rem)]",
        "lg:max-w-5xl",

        "border border-white/60 bg-white/75",
      ].join(" ")
    : [
        "w-full max-w-none",
        "bg-paper/85",
      ].join(" "),
].join(" ")}
      >
        {children}
      </motion.div>
    </motion.header>
  );
}