import { capsule, endpoint, mutation, query, string, table, json } from "@spacefast/zero/server";

import { cleanGuestbookMessage } from "../shared/guestbook";

export default capsule({
  name: "Pixel Chefs",
  schema: {
    messages: table({
      message: string(),
      authorId: string(),
      authorName: string(),
    }),
  },
  queries: {
    messages: query(async (ctx) =>
      ctx.db.messages
        .withIndex("by_creation")
        .order("desc")
        .take(50)
    ),
  },
  mutations: {
    signMessage: mutation(async (ctx, message: string) => {
      const cleanMessage = cleanGuestbookMessage(message);
      if (!cleanMessage) return null;
      return ctx.db.messages.insert({
        message: cleanMessage,
        authorId: ctx.auth.userId,
        authorName: ctx.auth.displayName,
      });
    }),
  },
  endpoints: {
    count: endpoint({ method: "GET", path: "/api/messages/count" }, async (ctx) =>
      json({ count: (await ctx.db.messages.withIndex("by_creation").collect()).length })
    ),
  },
});
