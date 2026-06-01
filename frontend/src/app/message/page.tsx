import { listMyThreads } from "@/lib/chat";
import { getUserServer } from "@/lib/userserver";
import { redirect } from "next/navigation";
import ChatClient from "./chat-client";

export default async function MessagePage() {
  const user = await getUserServer();
  if (user.super) redirect("/super/message");
  const threads = await listMyThreads();

  return <ChatClient initialThreads={threads} isSuper={false} />;
}
