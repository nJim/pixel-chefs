export type GuestbookMessage = {
  id: string;
  message: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
};

export function cleanGuestbookMessage(value: string): string {
  return value.trim().slice(0, 500);
}
