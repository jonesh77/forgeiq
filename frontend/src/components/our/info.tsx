import { IoInformationSharp } from "react-icons/io5";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "../ui/dialog";

const DIALOG_CLASS =
  "!max-w-2xl max-h-[85vh] overflow-y-auto font-public";

export default function AbsoluteInfoIcon({ title, content }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="absolute top-0 right-0 p-1.5 bg-gradient-to-br from-[#147ffd] to-[#a491fb] text-white rounded-md cursor-pointer hover:opacity-90 transition-opacity">
          <IoInformationSharp />
        </div>
      </DialogTrigger>
      <DialogContent className={DIALOG_CLASS}>
        <DialogTitle className="text-lg">{title}</DialogTitle>
        <div className="text-sm leading-relaxed space-y-3 text-slate-700">{content}</div>
      </DialogContent>
    </Dialog>
  );
}

export function InfoIcon({ title, content }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="p-1 bg-gradient-to-b from-[#147ffd] to-[#a491fb] text-white rounded-md cursor-pointer hover:opacity-90 transition-opacity">
          <IoInformationSharp />
        </div>
      </DialogTrigger>
      <DialogContent className={DIALOG_CLASS}>
        <DialogTitle className="text-lg">{title}</DialogTitle>
        <div className="text-sm leading-relaxed space-y-3 text-slate-700">{content}</div>
      </DialogContent>
    </Dialog>
  );
}

export function InfoTriggerCustom({ trigger, title, content }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className={DIALOG_CLASS}>
        <DialogTitle className="text-lg">{title}</DialogTitle>
        <div className="text-sm leading-relaxed space-y-3 text-slate-700">{content}</div>
      </DialogContent>
    </Dialog>
  );
}
