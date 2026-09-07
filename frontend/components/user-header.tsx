import { Button } from "@/components/ui/button";

type UserHeaderProps = {
  userName?: string | null;
  onSignOut?: () => void | Promise<void>;
  compact?: boolean;
};

export function UserHeader({ userName, onSignOut, compact = false }: UserHeaderProps) {
  const initials = (userName ?? "User").trim().charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 shadow-sm shadow-slate-950/30">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/20 text-xs font-semibold text-sky-200 ring-1 ring-sky-400/30">
          {initials}
        </span>
        <span className={compact ? "max-w-[10rem] truncate" : "max-w-[14rem] truncate"}>{userName ?? "User"}</span>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onSignOut}
        className="border-slate-700 bg-slate-900 text-slate-100 transition-colors duration-200 hover:border-sky-400/70 hover:bg-sky-500/15 hover:text-sky-100"
      >
        Sign Out
      </Button>
    </div>
  );
}
