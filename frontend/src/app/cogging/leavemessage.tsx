"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { AiOutlineLoading } from "react-icons/ai";
import { startThread } from "@/lib/chat";
import sent from "../../../public/sent.png";
import Image from "next/image";
import Link from "next/link";
import { useNotifications } from "@/components/our/notification-context";
import { toast } from "sonner";

export default function LeaveMessage({ trigger }: { trigger: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [areaText, setAreaText] = useState("");
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState<{ id: string } | null>(null);
    const { refresh } = useNotifications();

    const handleClose = (next: boolean) => {
        setOpen(next);
        if (!next) {
            setTimeout(() => { setSuccess(null); setAreaText(""); }, 200);
        }
    };

    const handleSend = async () => {
        if (!areaText.trim() || sending) return;
        setSending(true);
        const r = await startThread(areaText);
        setSending(false);
        if (r.ok) {
            setSuccess({ id: r.id });
            setAreaText("");
            void refresh();
        } else {
            toast.error(r.error || "Failed to send");
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="font-public">
                <DialogTitle></DialogTitle>
                {success ? (
                    <div className="flex flex-col items-center justify-center px-6 py-4">
                        <Image src={sent} alt="" width={90} />
                        <h2 className="text-xl mt-3 font-montserrat font-semibold">Conversation started</h2>
                        <p className="text-sm mt-2 text-center leading-relaxed text-slate-600">Your message is in the queue. The team usually replies within 2 working days — you can also chat live in Messages.</p>
                        <div className="w-full flex items-center gap-2 mt-5">
                            <Button onClick={() => handleClose(false)} className="flex-[3] bg-slate-900 hover:bg-slate-800 cursor-pointer">Close</Button>
                            <Link className="flex-[2]" href="/message"><Button variant="outline" className="cursor-pointer w-full">Open chat</Button></Link>
                        </div>
                    </div>
                ) : (
                    <div>
                        <h1 className="-mt-3 text-xl font-semibold text-slate-900">Leave a message</h1>
                        <p className="text-sm text-slate-600 mt-1">Ask anything about the platform. Replies appear live inside Messages and a red dot will mark the avatar when there's a new answer.</p>
                        <Textarea
                            value={areaText}
                            onChange={(e) => setAreaText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                    e.preventDefault();
                                    void handleSend();
                                }
                            }}
                            placeholder="What's your question?"
                            className="min-h-[200px] mt-4"
                            autoFocus
                        />
                        <Button
                            type="button"
                            onClick={handleSend}
                            disabled={!areaText.trim() || sending}
                            className="w-full cursor-pointer mt-4 bg-slate-900 hover:bg-slate-800"
                        >
                            {sending ? <><AiOutlineLoading className="animate-spin" />Sending...</> : "Send message"}
                        </Button>
                        <p className="text-[10px] text-slate-400 mt-2 text-center">Tip: Ctrl/⌘+Enter to send</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
