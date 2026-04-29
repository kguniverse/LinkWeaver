import { Network } from "lucide-react";

export default function Header() {
  return (
    <header className="h-14 shrink-0 border-b bg-white">
      <div className="h-full flex items-center gap-3 px-5">
        <div className="size-8 rounded-md bg-sky-100 flex items-center justify-center">
          <Network className="size-4 text-sky-700" strokeWidth={2} />
        </div>
        <div className="flex flex-col leading-tight">
          <h1 className="text-sm font-semibold text-slate-900">LinkWeaver</h1>
          <p className="text-xs text-slate-500">Research Collaboration Triage</p>
        </div>
      </div>
    </header>
  );
}
