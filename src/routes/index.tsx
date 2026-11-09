import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import AppShell from "../AppShell";

export const Route = createFileRoute("/")({
  codeSplitGroupings: [],
  ssr: false,
  head: () => ({
    meta: [
      { title: "MIS Insights Hub — Virtual CFO Suite" },
      {
        name: "description",
        content:
          "Virtual CFO Suite & MIS financial insights hub with compliance tracking, action pendencies, budget vs actuals, and client financial analytics.",
      },
      { property: "og:title", content: "MIS Insights Hub — Virtual CFO Suite" },
      {
        property: "og:description",
        content:
          "Virtual CFO Suite & MIS financial insights hub with compliance tracking, action pendencies, budget vs actuals, and client financial analytics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  return (
    <ClientOnly fallback={<AppLoadingFallback />}>
      <AppShell />
    </ClientOnly>
  );
}

function AppLoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans antialiased">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-2.5 flex items-center justify-between gap-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
                V
              </div>
              <div>
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-none">
                  Virtual CFO Suite
                </h1>
                <p className="text-[11px] text-slate-500 font-medium">MIS Insights Hub</p>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-64 bg-slate-200 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-28 bg-white rounded-xl border border-slate-200" />
            <div className="h-28 bg-white rounded-xl border border-slate-200" />
            <div className="h-28 bg-white rounded-xl border border-slate-200" />
          </div>
          <div className="h-64 bg-white rounded-xl border border-slate-200" />
        </div>
      </main>
    </div>
  );
}
