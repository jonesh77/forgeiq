import { ProgramHeader } from "@/components/our/program-header";
import { listMyThreads } from "@/lib/chat";
import { getUserServer } from "@/lib/userserver";
import { redirect } from "next/navigation";
import ChatClient from "./chat-client";

export default async function MessagePage() {
  const user = await getUserServer();
  if (user.super) redirect("/super/message");
  const threads = await listMyThreads();

  return (
    <div className="font-public min-h-screen bg-slate-50/40 flex flex-col">
      <ProgramHeader title="Messages" accent="slate" minimize />
      <ChatClient initialThreads={threads} isSuper={false} />
    </div>
  );
}
