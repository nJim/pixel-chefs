"use client";

import { Card } from "@spacefast/zero/kit";

export default function AboutPage() {
  return (
    <Card title="About">
      <p class="text-sm leading-relaxed text-ink-muted">
        This guestbook is a capsule app on Spacefast Zero. Messages live in Zero's database,
        the signMessage mutation writes them, and every open tab picks up new notes live — no
        polling, no refresh.
      </p>
    </Card>
  );
}
