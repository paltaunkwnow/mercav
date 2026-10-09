-- Calendario: link secreto para suscribirse desde Google Calendar, Apple o Outlook (los cambios por decreto llegan solos).
ALTER TABLE "CalendarPreference" ADD COLUMN "feedToken" TEXT;
CREATE UNIQUE INDEX "CalendarPreference_feedToken_key" ON "CalendarPreference"("feedToken");
