"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Links } from "@/components/Links";

const projects = [
  { name: "Grid Patterns", href: "/grid", external: false },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div
        className={`max-w-2xl w-full transition-all duration-700 ease-out ${
          mounted
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-6 blur-sm"
        }`}
      >
        <header className="mb-12">
          <h1 className="text-2xl sm:text-3xl tracking-tight text-(--color-foreground) mb-4">
            Vasile Draguta
          </h1>
          <p className="text-base text-(--color-text-secondary) leading-relaxed">
            i need to add something here at some point
          </p>
          <Links align="left" />
        </header>

        <nav>
          <ul className="space-y-1">
            {projects.map((project, index) => (
              <li
                key={project.name}
                className={`transition-all duration-700 ease-out ${
                  mounted
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-6 blur-sm"
                }`}
                style={{
                  transitionDelay: mounted ? `${100 + index * 50}ms` : "0ms",
                }}
              >
                <Link
                  href={project.href}
                  className="group flex items-center py-3 px-4 -mx-4 rounded-lg transition-colors duration-200 hover:bg-(--color-surface)"
                >
                  <span className="text-(--color-foreground) font-medium transition-colors duration-200 group-hover:text-(--color-interactive-hover)">
                    {project.name}
                  </span>
                  <svg
                    className="ml-2 w-4 h-4 text-(--color-text-tertiary) transition-transform duration-200 group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
