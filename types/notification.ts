export type NotificationType = 'status_change' | 'upvote' | 'badge_earned' | 'system';

export interface AppNotification {
  id: string;
  recipientUid: string;
  type: NotificationType;
  title: string;
  body: string;
  reportId?: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: any; // Firebase Timestamp or string depending on parsing
}
