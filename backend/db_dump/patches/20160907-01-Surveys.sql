DO
$do$
DECLARE
    schema_name text;
    trigger_sql text;
    db_user constant text := 'indaba'; -- HAVE TO SET CORRECT DB USER
BEGIN
	FOR schema_name IN
		SELECT pg_catalog.pg_namespace.nspname
		FROM pg_catalog.pg_namespace
		INNER JOIN pg_catalog.pg_user
		ON (pg_catalog.pg_namespace.nspowner = pg_catalog.pg_user.usesysid)
		AND (pg_catalog.pg_user.usename = db_user)
    LOOP
        RAISE NOTICE 'db_user = %, schema = %', db_user, schema_name;

        EXECUTE $query$
            SET search_path TO $query$ || schema_name || $query$;

            CREATE OR REPLACE FUNCTION generate_survey_pk()
                RETURNS trigger AS
                $BODY$
                    DECLARE
                        _rel_id int;
                        _quest_id int;
                        _version int;
                    BEGIN

                    SELECT oid
                    INTO _rel_id
                    FROM pg_class
                    WHERE relname = 'Surveys'
                    AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = '$query$||schema_name||$query$');

                    IF NEW.id IS NOT NULL THEN
                        PERFORM pg_advisory_xact_lock(_rel_id, NEW.id);

                        IF NEW."surveyVersion" <> -1 THEN
                            SELECT  COALESCE(MAX("surveyVersion") + 1, 1)
                            INTO    NEW."surveyVersion"
                            FROM    "Surveys"
                            WHERE id = NEW.id;
                        END IF;
                    ELSE
                        PERFORM pg_advisory_xact_lock(_rel_id);
                        IF NEW."surveyVersion" <> -1 THEN
                            NEW."surveyVersion" := 0;
                        END IF;

                        SELECT  COALESCE(MAX(id) + 1, 1)
                        INTO    NEW.id
                        FROM    $query$ || schema_name || $query$."Surveys";
                    END IF;

                    RETURN NEW;
                    END;
                $BODY$
                LANGUAGE plpgsql VOLATILE STRICT
                COST 100;
                ALTER FUNCTION generate_survey_pk() OWNER TO $query$ || db_user || $query$;

--                CREATE TRIGGER generate_survey_pk
--                    BEFORE INSERT
--                    ON "Surveys"
--                    FOR EACH ROW
--                    EXECUTE PROCEDURE generate_survey_pk();

        $query$;

    END LOOP;

END
$do$
LANGUAGE plpgsql;
