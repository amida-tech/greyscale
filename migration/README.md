# Instructions
------------
1. Run patch ../backend/db_dump/patches/20160510-01-Attachments.sql for your DB (don't forget to set correct db user inside patch)
2. Run patch ../backend/db_dump/patches/20160601-01-AttachmentAttempts.sql for your DB (don't forget to set correct db user inside patch)
3. Run patch ../backend/db_dump/patches/20160601-02-AnswerAttachments.sql for your DB (don't forget to set correct db user inside patch)
4. Run patch ../backend/db_dump/patches/20160603-01-AttachmentLinks.sql for your DB (don't forget to set correct db user inside patch)
5. Run patch ../backend/db_dump/patches/20160603-02-DataMigration.sql for your DB (don't forget to set correct db user inside patch)
6. Rename config_etalon.js to config.js and set your credentials for AWS and DB
7. Run npm install (in console)
8. Run node app.js (in console)