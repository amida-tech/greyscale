SET search_path TO schema;

INSERT INTO "RolesRights" (
SELECT '2',r.id
FROM "Rights" r
LEFT JOIN "RolesRights" rr
ON (r.id = rr."rightID") AND rr."roleID" = 2
WHERE rr."roleID" IS NULL
ORDER BY r.id
);