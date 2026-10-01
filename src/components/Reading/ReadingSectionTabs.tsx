"use client";

type ReadingSectionTabsProps = {
  sectionCount?: 1 | 2 | 3;
  activeSection: 1 | 2 | 3;
  onSectionChange: (section: 1 | 2 | 3) => void;
  isSectionComplete?: (section: 1 | 2 | 3) => boolean;
};

export function ReadingSectionTabs({
  sectionCount = 3,
  activeSection,
  onSectionChange,
  isSectionComplete,
}: ReadingSectionTabsProps) {
  return (
    <nav
      aria-label="Reading sections"
      className="grid w-full grid-cols-3 gap-1 rounded-2xl border border-gray-200 bg-white p-1 shadow-sm"
    >
      {([1, 2, 3] as const).slice(0, sectionCount).map((section) => {
        const isActive = activeSection === section;
        const isComplete = isSectionComplete?.(section) ?? false;

        return (
          <button
            key={section}
            type="button"
            aria-current={isActive ? "step" : undefined}
            onClick={() => onSectionChange(section)}
            className={`flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-extrabold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:text-sm ${
              isActive
                ? "bg-black text-white shadow-sm"
                : "bg-white text-black hover:bg-gray-100"
            }`}
          >
            <span>Section {section}</span>
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                isActive ? "bg-white" : isComplete ? "bg-black" : "bg-gray-300"
              }`}
            />
          </button>
        );
      })}
    </nav>
  );
}
