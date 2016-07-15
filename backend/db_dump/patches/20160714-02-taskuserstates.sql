CREATE OR REPLACE FUNCTION patch_20160714_02_taskuserstates() RETURNS void AS
$BODY$
DECLARE
    schema_name text;
BEGIN
	FOR schema_name IN
		SELECT pg_catalog.pg_namespace.nspname
		FROM pg_catalog.pg_namespace
		INNER JOIN pg_catalog.pg_user
		ON (pg_catalog.pg_namespace.nspowner = pg_catalog.pg_user.usesysid)
		AND ((pg_catalog.pg_user.usename = 'indaba') -- HAVE TO SET CORRECT DB USER
			OR (pg_catalog.pg_namespace.nspname = 'public')
		)

		LOOP
		EXECUTE 'SET search_path TO ' || quote_ident(schema_name);

		EXECUTE 'CREATE TABLE "TaskUserStates" ( '
                || '"taskId" int4 NOT NULL, '
                || '"userId" int4 NOT NULL, '
                || '"stateId" int2, '
                || '"createdAt" timestamptz DEFAULT now(), '
                || '"updatedAt" timestamptz, '
                || '"flagged" bool, '
                || '"late" bool, '
                || '"approvedAt" timestamptz, '
                || '"startedAt" timestamptz, '
                || '"draftAt" timestamptz, '
                || 'PRIMARY KEY ("taskId", "userId"), '
                || 'FOREIGN KEY ("taskId") REFERENCES "Tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE, '
                || 'FOREIGN KEY ("userId") REFERENCES "Users" ("id") ON DELETE CASCADE ON UPDATE CASCADE, '
                || 'UNIQUE ("taskId", "userId") '
                || ');';

    END LOOP;

END
$BODY$
LANGUAGE plpgsql;

SELECT patch_20160714_02_taskuserstates();
DROP FUNCTION IF EXISTS public.patch_20160714_02_taskuserstates();
