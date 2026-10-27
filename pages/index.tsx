"use client";

import { useMutation, useQuery } from "@spacefast/zero/client";
import { Avatar, Button, Card, EmptyState, TextArea } from "@spacefast/zero/kit";

import { cleanGuestbookMessage, type GuestbookMessage } from "../shared/guestbook";

export default function GuestbookPage() {
  const messages = useQuery<GuestbookMessage[]>("messages") ?? [];
  const signMessage = useMutation<[message: string], GuestbookMessage | null>("signMessage");

  async function onSubmit(event: SubmitEvent) {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const message = cleanGuestbookMessage(String(new FormData(form).get("message") ?? ""));
    if (!message) return;
    await signMessage(message);
    form.reset();
  }

  return (
    <div class="flex flex-col gap-4">
      <Card title="Pixel Chefs" subtitle="Leave a note — new entries show up live for everyone.">
        <form class="flex flex-col gap-2" onSubmit={(event) => void onSubmit(event)}>
          <TextArea name="message" rows={3} placeholder="Say something nice" aria-label="Your note" />
          <div class="flex justify-end">
            <Button type="submit">Sign the book</Button>
          </div>
        </form>
      </Card>
      <Card>
        {messages.length === 0 ? (
          <EmptyState title="No notes yet" description="Yours could be the first." />
        ) : (
          <ul class="divide-y divide-line">
            {messages.map((entry) => (
              <li key={entry.id} class="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <Avatar name={entry.authorName} size="sm" />
                <div class="min-w-0">
                  <p class="text-sm font-medium text-ink">{entry.authorName}</p>
                  <p class="text-sm break-words text-ink-muted">{entry.message}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
