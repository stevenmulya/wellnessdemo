/**
 * WEB PUSH NOTIFICATION INTEGRATION TEMPLATE (VAPID / WEB-PUSH)
 * -------------------------------------------------------------
 * Template adapter for dispatching background push notifications to `PushSubscription` records.
 * To enable in production:
 * 1. Generate VAPID keys (`npx web-push generate-vapid-keys`)
 * 2. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env
 */

export interface PushNotificationPayload {
  userId: string;
  title: string;
  body: string;
  url?: string;
}

export async function sendWebPushNotificationTemplate(
  payload: PushNotificationPayload
): Promise<{ sent: boolean }> {
  // TODO [Third-Party Integration]:
  // Use `web-push` package with prisma.pushSubscription.findMany({ where: { userId: payload.userId } })
  console.log(`[PUSH ADAPTER TEMPLATE] Ready to push "${payload.title}" to user ${payload.userId}`);
  return { sent: true };
}
