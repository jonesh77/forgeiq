"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { FaRegBookmark, FaBookmark } from "react-icons/fa6";
import { MdDelete } from "react-icons/md";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import {
  Bookmark, BookmarkService,
  saveBookmark, listBookmarks, deleteBookmark,
} from "@/lib/bookmarks";

/**
 * Small panel that hangs off a form, letting users:
 *  - save the current parameter values as a named bookmark
 *  - pick a previous bookmark and apply its params back to the form
 *
 * The host form passes `getCurrentParams` (read live values) and
 * `applyParams` (set inputs to the chosen values).
 */
export function BookmarkPanel({
  service, getCurrentParams, applyParams, className = "",
}: {
  service: BookmarkService;
  getCurrentParams: () => Record<string, string>;
  applyParams: (params: Record<string, string>) => void;
  className?: string;
}) {
  const { t } = useT();
  const [items, setItems] = useState<Bookmark[]>([]);
  const [open, setOpen] = useState(false);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const list = await listBookmarks(service);
    setItems(list);
  };

  useEffect(() => { if (open) void refresh(); }, [open]);

  const doSave = async () => {
    if (!name.trim()) return;
    setBusy(true);
    const params = getCurrentParams();
    const r = await saveBookmark({ service, name, params });
    setBusy(false);
    if (r.ok) {
      toast.success(t("bookmark.saved"));
      setName(""); setNaming(false);
      void refresh();
    } else {
      toast.error(r.error || t("bookmark.failed"));
    }
  };

  const doDelete = async (id?: string) => {
    if (!id) return;
    const r = await deleteBookmark(id);
    if (r.ok) {
      toast.success(t("bookmark.deleted"));
      void refresh();
    }
  };

  return (
    <div className={"flex flex-wrap items-center gap-2 " + className}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            className="cursor-pointer h-8 px-3 text-xs bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700"
            title={t("bookmark.list")}
          >
            <FaRegBookmark />{t("bookmark.list")}
            {items.length > 0 && <span className="ml-1 bg-slate-300 text-slate-800 rounded-full px-1.5 text-[10px]">{items.length}</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="font-public min-w-[280px]">
          <DropdownMenuLabel>{t("bookmark.list")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {items.length === 0 && (
            <div className="px-3 py-4 text-xs text-slate-500 italic">{t("bookmark.empty")}</div>
          )}
          {items.map((b) => (
            <DropdownMenuItem
              key={b._id}
              className="cursor-pointer flex items-center justify-between gap-2"
              onSelect={(e) => { e.preventDefault(); applyParams(b.params); toast.success(t("bookmark.loaded")); setOpen(false); }}
            >
              <span className="flex items-center gap-2 truncate">
                <FaBookmark className="text-slate-500 text-xs shrink-0" />
                <span className="truncate">{b.name}</span>
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); void doDelete(b._id); }}
                className="opacity-50 hover:opacity-100 hover:text-red-600 cursor-pointer"
                title={t("bookmark.delete")}
              >
                <MdDelete />
              </button>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {naming ? (
        <div className="flex items-center gap-1">
          <Input
            autoFocus
            placeholder={t("bookmark.name_prompt")}
            className="h-8 w-44 text-xs"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void doSave(); } if (e.key === "Escape") setNaming(false); }}
          />
          <Button type="button" size="sm" disabled={busy || !name.trim()} onClick={doSave} className="h-8 cursor-pointer">{t("bookmark.save_confirm")}</Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => { setName(""); setNaming(false); }} className="h-8 cursor-pointer">×</Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="secondary"
          className="cursor-pointer h-8 px-3 text-xs bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700"
          onClick={() => setNaming(true)}
        >
          <FaBookmark />{t("bookmark.save")}
        </Button>
      )}
    </div>
  );
}
