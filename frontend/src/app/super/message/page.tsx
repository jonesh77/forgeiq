import { listMyThreads } from "@/lib/chat";
import { getUserServer } from "@/lib/userserver";
import { redirect } from "next/navigation";
import ChatClient from "../../message/chat-client";

export default async function SuperMessagePage() {
  const user = await getUserServer();
  if (!user.super) redirect("/");
  const threads = await listMyThreads();

  return <ChatClient initialThreads={threads} isSuper={true} />;
}
