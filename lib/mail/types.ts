export interface MailAddress { name?: string; email: string }
export interface Mailbox { id: string; name: string; role: string | null; totalEmails: number; unreadEmails: number }
export interface MailAttachment { blobId: string; name: string; type: string; size: number }
export interface MailMessage {
  id: string; threadId: string; subject: string; preview: string;
  from: MailAddress[]; to: MailAddress[]; cc?: MailAddress[]; bcc?: MailAddress[];
  receivedAt: string; keywords: Record<string, boolean>; mailboxIds: Record<string, boolean>;
  hasAttachment: boolean; textBody?: string; attachments?: MailAttachment[];
}
export interface MailUser { email: string; name: string; role: "USER" | "ADMIN" | "AUDITOR" }
