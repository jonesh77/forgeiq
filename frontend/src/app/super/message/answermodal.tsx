"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useActionState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { postReply } from "@/app/auth/lib/actions";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short", // "short" -> May | "long" -> May (full) | "numeric" -> 5
  });
}

export function AnswerMessageModal ({ trigger, message_id, message, defaultValue = "", readOnly = false }) {
    const postReplyWithId = postReply.bind(null, message_id);

    const initialState = { message: "" }

    let [formState, formAction, isPending] = useActionState(postReplyWithId, initialState);
    
    return (
        <Dialog>
            <DialogTrigger>{trigger}</DialogTrigger>
            <DialogContent className="!max-w-full w-[900px]">
                <DialogHeader>
                <DialogTitle>Message sent on {formatDate(message.sentAt)}</DialogTitle>
                <div className="w-full flex gap-x-8 items-start pt-4 font-public">
                    <div className="flex-1">
                        <p className=" font-medium">Question by {message.email}</p>
                        <p className="mt-2 leading-loose text-sm">{message.message}</p>
                    </div>
                    <form className="flex-1" action={formAction}>
                        <h2 className="font-medium">Your reply</h2>
                        <Textarea readOnly={readOnly} defaultValue={defaultValue} name="reply" required className="mt-3 h-[200px]" placeholder="Type your answer here..."></Textarea>
                        <Button disabled={readOnly} type="submit" className="w-full mt-5 cursor-pointer">Send reply</Button>
                    </form>
                </div>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}