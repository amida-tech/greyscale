#!/bin/bash

pg_basebackup -x --host=127.0.0.1 -U postgres -w --format=tar -D - |bzip2 -9 > /twc-backup/backup-$(date +%Y-%m-%d).tar.bz2

#pg_dump --host 127.0.0.1 --port 5432 --username "postgres" --role "postgres" --no-password  --format tar --blobs --verbose  "tripwecan_development" --file - |bzip2 -9 > /twc-backup/backup-$(date +%Y-%m-%d).tar.bz2
