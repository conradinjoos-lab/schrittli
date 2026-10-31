ALTER TABLE wuensche ADD COLUMN bilder TEXT;
UPDATE wuensche SET status='neu',svg=NULL,grund=NULL,versuche=0 WHERE stil='echt' AND status IN ('bereit','fehler');
