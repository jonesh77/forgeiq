"use client";

import { Button } from "@/components/ui/button";
import { MdPictureAsPdf } from "react-icons/md";
import { AiOutlineLoading } from "react-icons/ai";
import { useState } from "react";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";

type PassScheduleResult = {
  feed: number;
  depth_schedule: number;
  number_of_rotation: number;
  pass_schedule: number[];
  forging_ratios: string[];
  length_changes: number[];
  cutting_lengths: string[];
  void_closure: number[];
};

export function PassSchedulePdfButton({
  result, inputs,
}: {
  result: PassScheduleResult;
  inputs: { initial_cross_section?: string; initial_length?: string; cutting_length?: string };
}) {
  const { t } = useT();
  const [busy, setBusy] = useState(false);

  const exportPdf = async () => {
    setBusy(true);
    try {
      const [{ jsPDF }, autoTableMod] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const autoTable = (autoTableMod as any).default || (autoTableMod as any).autoTable;

      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const margin = 40;
      let y = margin;

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Pass Schedule Report", margin, y); y += 24;

      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y); y += 14;
      doc.text(
        `Inputs: cross-section=${inputs.initial_cross_section || "-"} mm, ` +
        `length=${inputs.initial_length || "-"} mm, cutting=${inputs.cutting_length || "-"} mm`,
        margin, y,
      ); y += 18;

      doc.setFont("helvetica", "bold"); doc.setFontSize(12);
      doc.text("Mechanical parameters", margin, y); y += 6;

      autoTable(doc, {
        startY: y + 4,
        head: [["Feed", "Depth Schedule", "Number of Rotations"]],
        body: [[
          result.feed?.toFixed(3),
          result.depth_schedule?.toFixed(3),
          result.number_of_rotation?.toFixed(3),
        ]],
        theme: "striped",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [29, 41, 61] },
      });
      y = (doc as any).lastAutoTable.finalY + 20;

      doc.setFont("helvetica", "bold"); doc.setFontSize(12);
      doc.text("Per-pass schedule", margin, y); y += 6;

      const passes = result.pass_schedule.map((_, i) => `Pass ${i + 1}`);
      autoTable(doc, {
        startY: y + 4,
        head: [["", ...passes]],
        body: [
          ["Pass Schedule", ...result.pass_schedule.map((v) => v.toFixed(3))],
          ["Forging Ratio", ...result.forging_ratios],
          ["Length Change (mm)", ...result.length_changes.map((v) => String(v))],
          ["Cutting Length", ...result.cutting_lengths],
          ["Void Closure (%)", ...result.void_closure.map((v) => `${Math.floor(v)}%`)],
        ],
        theme: "grid",
        styles: { fontSize: 9, halign: "center" },
        headStyles: { fillColor: [29, 41, 61] },
        columnStyles: { 0: { halign: "left", fontStyle: "bold", cellWidth: 110 } },
      });

      const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
      doc.save(`pass_schedule_${stamp}.pdf`);
      toast.success("PDF downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={exportPdf}
      disabled={busy}
      variant="outline"
      className="cursor-pointer h-8 text-xs"
    >
      {busy
        ? <><AiOutlineLoading className="animate-spin" />{t("pdf.exporting")}</>
        : <><MdPictureAsPdf className="text-red-600" />{t("pdf.export")}</>}
    </Button>
  );
}
