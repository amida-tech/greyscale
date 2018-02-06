--
-- PostgreSQL database dump
--

-- Dumped from database version 9.6.4
-- Dumped by pg_dump version 9.6.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: sceleton; Type: SCHEMA; Schema: -; Owner: indabauser
--

CREATE SCHEMA sceleton;


ALTER SCHEMA sceleton OWNER TO indabauser;

--
-- Name: test; Type: SCHEMA; Schema: -; Owner: indabauser
--

CREATE SCHEMA test;


ALTER SCHEMA test OWNER TO indabauser;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


SET search_path = public, pg_catalog;

--
-- Name: event_status; Type: TYPE; Schema: public; Owner: indabauser
--

CREATE TYPE event_status AS ENUM (
    'New',
    'Submitted',
    'Approved',
    'Rejected',
    'Deleted',
    'Active',
    'Inactive'
);


ALTER TYPE event_status OWNER TO indabauser;

--
-- Name: order_status; Type: TYPE; Schema: public; Owner: indabauser
--

CREATE TYPE order_status AS ENUM (
    'New',
    'Acknowledged',
    'Confirmed',
    'Fulfilled',
    'Cancelled'
);


ALTER TYPE order_status OWNER TO indabauser;

--
-- Name: tour_status; Type: TYPE; Schema: public; Owner: indabauser
--

CREATE TYPE tour_status AS ENUM (
    'New',
    'Submitted',
    'Approved',
    'Active',
    'Inactive',
    'Deleted',
    'Rejected'
);


ALTER TYPE tour_status OWNER TO indabauser;

--
-- Name: transport_status; Type: TYPE; Schema: public; Owner: indabauser
--

CREATE TYPE transport_status AS ENUM (
    'New',
    'Submitted',
    'Approved',
    'Available',
    'Rented',
    'Deleted'
);


ALTER TYPE transport_status OWNER TO indabauser;

--
-- Name: clone_schema(text, text, boolean); Type: FUNCTION; Schema: public; Owner: indabauser
--

CREATE FUNCTION clone_schema(source_schema text, dest_schema text, include_recs boolean) RETURNS void
    LANGUAGE plpgsql
    AS $$

--  This function will clone all sequences, tables, data, views & functions from any existing schema to a new one
-- SAMPLE CALL:
-- SELECT clone_schema('public', 'new_schema', TRUE);

DECLARE
  src_oid          oid;
  tbl_oid          oid;
  func_oid         oid;
  object           text;
  buffer           text;
  srctbl           text;
  default_         text;
  column_          text;
  qry              text;
  dest_qry         text;
  v_def            text;
  seqval           bigint;
  sq_last_value    bigint;
  sq_max_value     bigint;
  sq_start_value   bigint;
  sq_increment_by  bigint;
  sq_min_value     bigint;
  sq_cache_value   bigint;
  sq_log_cnt       bigint;
  sq_is_called     boolean;
  sq_is_cycled     boolean;
  sq_cycled        char(10);

BEGIN

-- Check that source_schema exists
  SELECT oid INTO src_oid
    FROM pg_namespace
   WHERE nspname = quote_ident(source_schema);
  IF NOT FOUND
    THEN
    RAISE NOTICE 'source schema % does not exist!', source_schema;
    RETURN ;
  END IF;

  -- Check that dest_schema does not yet exist
  PERFORM nspname
    FROM pg_namespace
   WHERE nspname = quote_ident(dest_schema);
  IF FOUND
    THEN
    RAISE NOTICE 'dest schema % already exists!', dest_schema;
    RETURN ;
  END IF;

  EXECUTE 'CREATE SCHEMA ' || quote_ident(dest_schema) ;

  -- Create sequences
  -- TODO: Find a way to make this sequence's owner is the correct table.
  FOR object IN
    SELECT sequence_name::text
      FROM information_schema.sequences
     WHERE sequence_schema = quote_ident(source_schema)
  LOOP
    EXECUTE 'CREATE SEQUENCE ' || quote_ident(dest_schema) || '.' || quote_ident(object);
    srctbl := quote_ident(source_schema) || '.' || quote_ident(object);

    EXECUTE 'SELECT last_value, max_value, start_value, increment_by, min_value, cache_value, log_cnt, is_cycled, is_called
              FROM ' || quote_ident(source_schema) || '.' || quote_ident(object) || ';'
              INTO sq_last_value, sq_max_value, sq_start_value, sq_increment_by, sq_min_value, sq_cache_value, sq_log_cnt, sq_is_cycled, sq_is_called ;

    IF sq_is_cycled
      THEN
        sq_cycled := 'CYCLE';
    ELSE
        sq_cycled := 'NO CYCLE';
    END IF;

    EXECUTE 'ALTER SEQUENCE '   || quote_ident(dest_schema) || '.' || quote_ident(object)
            || ' INCREMENT BY ' || sq_increment_by
            || ' MINVALUE '     || sq_min_value
            || ' MAXVALUE '     || sq_max_value
            || ' START WITH '   || sq_start_value
            || ' RESTART '      || sq_min_value
            || ' CACHE '        || sq_cache_value
            || sq_cycled || ' ;' ;

    buffer := quote_ident(dest_schema) || '.' || quote_ident(object);
    IF include_recs
        THEN
            EXECUTE 'SELECT setval( ''' || buffer || ''', ' || sq_last_value || ', ' || sq_is_called || ');' ;
    ELSE
            EXECUTE 'SELECT setval( ''' || buffer || ''', ' || sq_start_value || ', ' || sq_is_called || ');' ;
    END IF;

  END LOOP;

-- Create tables
  FOR object IN
    SELECT TABLE_NAME::text
      FROM information_schema.tables
     WHERE table_schema = quote_ident(source_schema)
       AND table_type = 'BASE TABLE'

  LOOP
    buffer := dest_schema || '.' || quote_ident(object);
    EXECUTE 'CREATE TABLE ' || buffer || ' (LIKE ' || quote_ident(source_schema) || '.' || quote_ident(object)
        || ' INCLUDING ALL)';

    IF include_recs
      THEN
      -- Insert records from source table
      EXECUTE 'INSERT INTO ' || buffer || ' SELECT * FROM ' || quote_ident(source_schema) || '.' || quote_ident(object) || ';';
    END IF;

    FOR column_, default_ IN
      SELECT column_name::text,
             REPLACE(REPLACE(column_default::text, quote_ident(source_schema) || '.', ''), 'nextval(''', 'nextval(''' || dest_schema || '.')
        FROM information_schema.COLUMNS
       WHERE table_schema = dest_schema
         AND TABLE_NAME = object
         AND column_default LIKE 'nextval(%::regclass)'
    LOOP
      EXECUTE 'ALTER TABLE ' || buffer || ' ALTER COLUMN ' || column_ || ' SET DEFAULT ' || default_;
    END LOOP;

  END LOOP;

--  add FK constraint
  FOR qry IN
    SELECT 'ALTER TABLE ' || quote_ident(dest_schema) || '.' || quote_ident(rn.relname)
                          || ' ADD CONSTRAINT ' || quote_ident(ct.conname) || ' '
                          || REPLACE(REPLACE(pg_get_constraintdef(ct.oid), quote_ident(source_schema) || '.', ''), 'REFERENCES ', 'REFERENCES ' || dest_schema || '.') || ';'

      FROM pg_constraint ct
      JOIN pg_class rn ON rn.oid = ct.conrelid
     WHERE connamespace = src_oid
       AND rn.relkind = 'r'
       AND ct.contype = 'f'

    LOOP
      EXECUTE qry;

    END LOOP;


-- Create views
  FOR object IN
    SELECT table_name::text,
           view_definition
      FROM information_schema.views
     WHERE table_schema = quote_ident(source_schema)

  LOOP
    buffer := dest_schema || '.' || quote_ident(object);
    SELECT view_definition INTO v_def
      FROM information_schema.views
     WHERE table_schema = quote_ident(source_schema)
       AND table_name = quote_ident(object);

    EXECUTE 'CREATE OR REPLACE VIEW ' || buffer || ' AS ' || v_def || ';' ;

  END LOOP;

-- Create functions
  FOR func_oid IN
    SELECT oid
      FROM pg_proc
     WHERE pronamespace = src_oid

  LOOP
    SELECT pg_get_functiondef(func_oid) INTO qry;
    SELECT replace(qry, source_schema, dest_schema) INTO dest_qry;
    EXECUTE dest_qry;

  END LOOP;

  RETURN;

END;

$$;


ALTER FUNCTION public.clone_schema(source_schema text, dest_schema text, include_recs boolean) OWNER TO indabauser;

--
-- Name: fix_schema_references(text); Type: FUNCTION; Schema: public; Owner: indabauser
--

CREATE FUNCTION fix_schema_references(schema text) RETURNS void
    LANGUAGE plpgsql
    AS $$



-- This function will fix
-- 1) reference to sequence with using correct namespace
-- 2) FK constraints  reference with using correct namespace
-- SAMPLE CALL:
-- SELECT fix_schema_references('schemaName');

DECLARE
  src_oid          oid;
  object           text;
  buffer           text;
  default_         text;
  column_          text;
  qry              text;

BEGIN
  RAISE NOTICE 'Current schema: %', current_schema;
  RAISE NOTICE 'Target schema: %', schema;

-- Get src_oid
  SELECT oid INTO src_oid
    FROM pg_namespace
   WHERE nspname = quote_ident(schema);
  IF NOT FOUND
    THEN
    RAISE NOTICE 'Target schema % does not exist!', schema;
    RETURN ;
  END IF;
  --RAISE NOTICE 'Current schema oid: %', src_oid;

  RAISE NOTICE '%', 'SET search_path TO ' || schema || ';';
  EXECUTE 'SET search_path TO ' || schema || ';';

-- Fix reference to sequence
  FOR object IN
    SELECT TABLE_NAME::text
      FROM information_schema.tables
     WHERE table_schema = quote_ident(schema)
       AND table_type = 'BASE TABLE'

  LOOP
    buffer := schema || '.' || quote_ident(object);
    FOR column_, default_ IN
      SELECT column_name::text,
             REPLACE(REPLACE(column_default::text, 'public.', ''), 'nextval(''', 'nextval(''' || schema || '.')
        FROM information_schema.COLUMNS
       WHERE table_schema = schema
         AND TABLE_NAME = object
         AND column_default LIKE 'nextval(%::regclass)'
    LOOP
      RAISE NOTICE '%', 'ALTER TABLE ' || buffer || ' ALTER COLUMN ' || column_ || ' SET DEFAULT ' || default_;
      EXECUTE 'ALTER TABLE ' || buffer || ' ALTER COLUMN ' || column_ || ' SET DEFAULT ' || default_;
    END LOOP;

  END LOOP;


--  add FK constraint
  FOR qry IN
    SELECT 'ALTER TABLE ' || quote_ident(schema) || '.' || quote_ident(rn.relname)
													|| ' DROP CONSTRAINT ' || quote_ident(ct.conname) || ', '
                          || ' ADD CONSTRAINT ' || quote_ident(ct.conname) || ' '
                          || overlay(pg_get_constraintdef(ct.oid) placing 'REFERENCES '||schema||'.' from position('REFERENCES' in pg_get_constraintdef(ct.oid)) for 11) || ';'
      FROM pg_constraint ct
      JOIN pg_class rn ON rn.oid = ct.conrelid
     WHERE connamespace = src_oid
       AND rn.relkind = 'r'
       AND ct.contype = 'f'

    LOOP
      RAISE NOTICE '%', qry;
      EXECUTE qry;

    END LOOP;

END;

$$;


ALTER FUNCTION public.fix_schema_references(schema text) OWNER TO indabauser;

--
-- Name: order_before_update(); Type: FUNCTION; Schema: public; Owner: indabauser
--

CREATE FUNCTION order_before_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   NEW."updated" = now();

   RETURN NEW;
END$$;


ALTER FUNCTION public.order_before_update() OWNER TO indabauser;

--
-- Name: tours_before_insert(); Type: FUNCTION; Schema: public; Owner: indabauser
--

CREATE FUNCTION tours_before_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   new."created" = now();
new."updated" = now();

   RETURN NEW;
END;$$;


ALTER FUNCTION public.tours_before_insert() OWNER TO indabauser;

--
-- Name: tours_before_update(); Type: FUNCTION; Schema: public; Owner: indabauser
--

CREATE FUNCTION tours_before_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   NEW."updated" = now();

   RETURN NEW;
END;$$;


ALTER FUNCTION public.tours_before_update() OWNER TO indabauser;

--
-- Name: twc_delete_old_token(); Type: FUNCTION; Schema: public; Owner: indabauser
--

CREATE FUNCTION twc_delete_old_token() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   DELETE FROM "Token" WHERE "userID" = NEW."userID";
   RETURN NEW;
END;$$;


ALTER FUNCTION public.twc_delete_old_token() OWNER TO indabauser;

--
-- Name: twc_get_token(character varying, character varying); Type: FUNCTION; Schema: public; Owner: indabauser
--

CREATE FUNCTION twc_get_token(body character varying, exp character varying) RETURNS character varying
    LANGUAGE plpgsql
    AS $$BEGIN

  SELECT t."body"
    FROM "Token" t
   where (t."body" = twc_get_token.body)
   and ((now() - t."issuedAt") < (twc_get_token.exp || ' milliseconds')::interval);

END$$;


ALTER FUNCTION public.twc_get_token(body character varying, exp character varying) OWNER TO indabauser;

--
-- Name: user_company_check(); Type: FUNCTION; Schema: public; Owner: indabauser
--

CREATE FUNCTION user_company_check() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
  if (
    exists (
	select *
	  from "Users"
	        left join "Roles" on "Users"."roleID" = "Roles"."id"
	 where "Users"."id" = new."userID"
	       and "Roles"."name" = 'customer')
  )
  then
    RAISE EXCEPTION 'Bad user role - customer!';
  end if;

  RETURN NEW;
END;$$;


ALTER FUNCTION public.user_company_check() OWNER TO indabauser;

--
-- Name: users_before_update(); Type: FUNCTION; Schema: public; Owner: indabauser
--

CREATE FUNCTION users_before_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   NEW."updated" = now();

   RETURN NEW;
END$$;


ALTER FUNCTION public.users_before_update() OWNER TO indabauser;

SET search_path = sceleton, pg_catalog;

--
-- Name: clone_schema(text, text, boolean); Type: FUNCTION; Schema: sceleton; Owner: indabauser
--

CREATE FUNCTION clone_schema(source_schema text, dest_schema text, include_recs boolean) RETURNS void
    LANGUAGE plpgsql
    AS $$

--  This function will clone all sequences, tables, data, views & functions from any existing schema to a new one
-- SAMPLE CALL:
-- SELECT clone_schema('sceleton', 'new_schema', TRUE);

DECLARE
  src_oid          oid;
  tbl_oid          oid;
  func_oid         oid;
  object           text;
  buffer           text;
  srctbl           text;
  default_         text;
  column_          text;
  qry              text;
  dest_qry         text;
  v_def            text;
  seqval           bigint;
  sq_last_value    bigint;
  sq_max_value     bigint;
  sq_start_value   bigint;
  sq_increment_by  bigint;
  sq_min_value     bigint;
  sq_cache_value   bigint;
  sq_log_cnt       bigint;
  sq_is_called     boolean;
  sq_is_cycled     boolean;
  sq_cycled        char(10);

BEGIN

-- Check that source_schema exists
  SELECT oid INTO src_oid
    FROM pg_namespace
   WHERE nspname = quote_ident(source_schema);
  IF NOT FOUND
    THEN
    RAISE NOTICE 'source schema % does not exist!', source_schema;
    RETURN ;
  END IF;

  -- Check that dest_schema does not yet exist
  PERFORM nspname
    FROM pg_namespace
   WHERE nspname = quote_ident(dest_schema);
  IF FOUND
    THEN
    RAISE NOTICE 'dest schema % already exists!', dest_schema;
    RETURN ;
  END IF;

  EXECUTE 'CREATE SCHEMA ' || quote_ident(dest_schema) ;

  -- Create sequences
  -- TODO: Find a way to make this sequence's owner is the correct table.
  FOR object IN
    SELECT sequence_name::text
      FROM information_schema.sequences
     WHERE sequence_schema = quote_ident(source_schema)
  LOOP
    EXECUTE 'CREATE SEQUENCE ' || quote_ident(dest_schema) || '.' || quote_ident(object);
    srctbl := quote_ident(source_schema) || '.' || quote_ident(object);

    EXECUTE 'SELECT last_value, max_value, start_value, increment_by, min_value, cache_value, log_cnt, is_cycled, is_called
              FROM ' || quote_ident(source_schema) || '.' || quote_ident(object) || ';'
              INTO sq_last_value, sq_max_value, sq_start_value, sq_increment_by, sq_min_value, sq_cache_value, sq_log_cnt, sq_is_cycled, sq_is_called ;

    IF sq_is_cycled
      THEN
        sq_cycled := 'CYCLE';
    ELSE
        sq_cycled := 'NO CYCLE';
    END IF;

    EXECUTE 'ALTER SEQUENCE '   || quote_ident(dest_schema) || '.' || quote_ident(object)
            || ' INCREMENT BY ' || sq_increment_by
            || ' MINVALUE '     || sq_min_value
            || ' MAXVALUE '     || sq_max_value
            || ' START WITH '   || sq_start_value
            || ' RESTART '      || sq_min_value
            || ' CACHE '        || sq_cache_value
            || sq_cycled || ' ;' ;

    buffer := quote_ident(dest_schema) || '.' || quote_ident(object);
    IF include_recs
        THEN
            EXECUTE 'SELECT setval( ''' || buffer || ''', ' || sq_last_value || ', ' || sq_is_called || ');' ;
    ELSE
            EXECUTE 'SELECT setval( ''' || buffer || ''', ' || sq_start_value || ', ' || sq_is_called || ');' ;
    END IF;

  END LOOP;

-- Create tables
  FOR object IN
    SELECT TABLE_NAME::text
      FROM information_schema.tables
     WHERE table_schema = quote_ident(source_schema)
       AND table_type = 'BASE TABLE'

  LOOP
    buffer := dest_schema || '.' || quote_ident(object);
    EXECUTE 'CREATE TABLE ' || buffer || ' (LIKE ' || quote_ident(source_schema) || '.' || quote_ident(object)
        || ' INCLUDING ALL)';

    IF include_recs
      THEN
      -- Insert records from source table
      EXECUTE 'INSERT INTO ' || buffer || ' SELECT * FROM ' || quote_ident(source_schema) || '.' || quote_ident(object) || ';';
    END IF;

    FOR column_, default_ IN
      SELECT column_name::text,
             REPLACE(REPLACE(column_default::text, quote_ident(source_schema) || '.', ''), 'nextval(''', 'nextval(''' || dest_schema || '.')
        FROM information_schema.COLUMNS
       WHERE table_schema = dest_schema
         AND TABLE_NAME = object
         AND column_default LIKE 'nextval(%::regclass)'
    LOOP
      EXECUTE 'ALTER TABLE ' || buffer || ' ALTER COLUMN ' || column_ || ' SET DEFAULT ' || default_;
    END LOOP;

  END LOOP;

--  add FK constraint
  FOR qry IN
    SELECT 'ALTER TABLE ' || quote_ident(dest_schema) || '.' || quote_ident(rn.relname)
                          || ' ADD CONSTRAINT ' || quote_ident(ct.conname) || ' '
                          || REPLACE(REPLACE(pg_get_constraintdef(ct.oid), quote_ident(source_schema) || '.', ''), 'REFERENCES ', 'REFERENCES ' || dest_schema || '.') || ';'

      FROM pg_constraint ct
      JOIN pg_class rn ON rn.oid = ct.conrelid
     WHERE connamespace = src_oid
       AND rn.relkind = 'r'
       AND ct.contype = 'f'

    LOOP
      EXECUTE qry;

    END LOOP;


-- Create views
  FOR object IN
    SELECT table_name::text,
           view_definition
      FROM information_schema.views
     WHERE table_schema = quote_ident(source_schema)

  LOOP
    buffer := dest_schema || '.' || quote_ident(object);
    SELECT view_definition INTO v_def
      FROM information_schema.views
     WHERE table_schema = quote_ident(source_schema)
       AND table_name = quote_ident(object);

    EXECUTE 'CREATE OR REPLACE VIEW ' || buffer || ' AS ' || v_def || ';' ;

  END LOOP;

-- Create functions
  FOR func_oid IN
    SELECT oid
      FROM pg_proc
     WHERE pronamespace = src_oid

  LOOP
    SELECT pg_get_functiondef(func_oid) INTO qry;
    SELECT replace(qry, source_schema, dest_schema) INTO dest_qry;
    EXECUTE dest_qry;

  END LOOP;

  RETURN;

END;

$$;


ALTER FUNCTION sceleton.clone_schema(source_schema text, dest_schema text, include_recs boolean) OWNER TO indabauser;

--
-- Name: fix_schema_references(text); Type: FUNCTION; Schema: sceleton; Owner: indabauser
--

CREATE FUNCTION fix_schema_references(schema text) RETURNS void
    LANGUAGE plpgsql
    AS $$



-- This function will fix
-- 1) reference to sequence with using correct namespace
-- 2) FK constraints  reference with using correct namespace
-- SAMPLE CALL:
-- SELECT fix_schema_references('schemaName');

DECLARE
  src_oid          oid;
  object           text;
  buffer           text;
  default_         text;
  column_          text;
  qry              text;

BEGIN
  RAISE NOTICE 'Current schema: %', current_schema;
  RAISE NOTICE 'Target schema: %', schema;

-- Get src_oid
  SELECT oid INTO src_oid
    FROM pg_namespace
   WHERE nspname = quote_ident(schema);
  IF NOT FOUND
    THEN
    RAISE NOTICE 'Target schema % does not exist!', schema;
    RETURN ;
  END IF;
  --RAISE NOTICE 'Current schema oid: %', src_oid;

  RAISE NOTICE '%', 'SET search_path TO ' || schema || ';';
  EXECUTE 'SET search_path TO ' || schema || ';';

-- Fix reference to sequence
  FOR object IN
    SELECT TABLE_NAME::text
      FROM information_schema.tables
     WHERE table_schema = quote_ident(schema)
       AND table_type = 'BASE TABLE'

  LOOP
    buffer := schema || '.' || quote_ident(object);
    FOR column_, default_ IN
      SELECT column_name::text,
             REPLACE(REPLACE(column_default::text, 'sceleton.', ''), 'nextval(''', 'nextval(''' || schema || '.')
        FROM information_schema.COLUMNS
       WHERE table_schema = schema
         AND TABLE_NAME = object
         AND column_default LIKE 'nextval(%::regclass)'
    LOOP
      RAISE NOTICE '%', 'ALTER TABLE ' || buffer || ' ALTER COLUMN ' || column_ || ' SET DEFAULT ' || default_;
      EXECUTE 'ALTER TABLE ' || buffer || ' ALTER COLUMN ' || column_ || ' SET DEFAULT ' || default_;
    END LOOP;

  END LOOP;


--  add FK constraint
  FOR qry IN
    SELECT 'ALTER TABLE ' || quote_ident(schema) || '.' || quote_ident(rn.relname)
													|| ' DROP CONSTRAINT ' || quote_ident(ct.conname) || ', '
                          || ' ADD CONSTRAINT ' || quote_ident(ct.conname) || ' '
                          || overlay(pg_get_constraintdef(ct.oid) placing 'REFERENCES '||schema||'.' from position('REFERENCES' in pg_get_constraintdef(ct.oid)) for 11) || ';'
      FROM pg_constraint ct
      JOIN pg_class rn ON rn.oid = ct.conrelid
     WHERE connamespace = src_oid
       AND rn.relkind = 'r'
       AND ct.contype = 'f'

    LOOP
      RAISE NOTICE '%', qry;
      EXECUTE qry;

    END LOOP;

END;

$$;


ALTER FUNCTION sceleton.fix_schema_references(schema text) OWNER TO indabauser;

--
-- Name: order_before_update(); Type: FUNCTION; Schema: sceleton; Owner: indabauser
--

CREATE FUNCTION order_before_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   NEW."updated" = now();

   RETURN NEW;
END$$;


ALTER FUNCTION sceleton.order_before_update() OWNER TO indabauser;

--
-- Name: tours_before_insert(); Type: FUNCTION; Schema: sceleton; Owner: indabauser
--

CREATE FUNCTION tours_before_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   new."created" = now();
new."updated" = now();

   RETURN NEW;
END;$$;


ALTER FUNCTION sceleton.tours_before_insert() OWNER TO indabauser;

--
-- Name: tours_before_update(); Type: FUNCTION; Schema: sceleton; Owner: indabauser
--

CREATE FUNCTION tours_before_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   NEW."updated" = now();

   RETURN NEW;
END;$$;


ALTER FUNCTION sceleton.tours_before_update() OWNER TO indabauser;

--
-- Name: twc_delete_old_token(); Type: FUNCTION; Schema: sceleton; Owner: indabauser
--

CREATE FUNCTION twc_delete_old_token() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   DELETE FROM "Token" WHERE "userID" = NEW."userID";
   RETURN NEW;
END;$$;


ALTER FUNCTION sceleton.twc_delete_old_token() OWNER TO indabauser;

--
-- Name: twc_get_token(character varying, character varying); Type: FUNCTION; Schema: sceleton; Owner: indabauser
--

CREATE FUNCTION twc_get_token(body character varying, exp character varying) RETURNS character varying
    LANGUAGE plpgsql
    AS $$BEGIN

  SELECT t."body"
    FROM "Token" t
   where (t."body" = twc_get_token.body)
   and ((now() - t."issuedAt") < (twc_get_token.exp || ' milliseconds')::interval);

END$$;


ALTER FUNCTION sceleton.twc_get_token(body character varying, exp character varying) OWNER TO indabauser;

--
-- Name: user_company_check(); Type: FUNCTION; Schema: sceleton; Owner: indabauser
--

CREATE FUNCTION user_company_check() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
  if (
    exists (
	select *
	  from "Users"
	        left join "Roles" on "Users"."roleID" = "Roles"."id"
	 where "Users"."id" = new."userID"
	       and "Roles"."name" = 'customer')
  )
  then
    RAISE EXCEPTION 'Bad user role - customer!';
  end if;

  RETURN NEW;
END;$$;


ALTER FUNCTION sceleton.user_company_check() OWNER TO indabauser;

--
-- Name: users_before_update(); Type: FUNCTION; Schema: sceleton; Owner: indabauser
--

CREATE FUNCTION users_before_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   NEW."updated" = now();

   RETURN NEW;
END$$;


ALTER FUNCTION sceleton.users_before_update() OWNER TO indabauser;

SET search_path = test, pg_catalog;

--
-- Name: clone_schema(text, text, boolean); Type: FUNCTION; Schema: test; Owner: indabauser
--

CREATE FUNCTION clone_schema(source_schema text, dest_schema text, include_recs boolean) RETURNS void
    LANGUAGE plpgsql
    AS $$

--  This function will clone all sequences, tables, data, views & functions from any existing schema to a new one
-- SAMPLE CALL:
-- SELECT clone_schema('test', 'new_schema', TRUE);

DECLARE
  src_oid          oid;
  tbl_oid          oid;
  func_oid         oid;
  object           text;
  buffer           text;
  srctbl           text;
  default_         text;
  column_          text;
  qry              text;
  dest_qry         text;
  v_def            text;
  seqval           bigint;
  sq_last_value    bigint;
  sq_max_value     bigint;
  sq_start_value   bigint;
  sq_increment_by  bigint;
  sq_min_value     bigint;
  sq_cache_value   bigint;
  sq_log_cnt       bigint;
  sq_is_called     boolean;
  sq_is_cycled     boolean;
  sq_cycled        char(10);

BEGIN

-- Check that source_schema exists
  SELECT oid INTO src_oid
    FROM pg_namespace
   WHERE nspname = quote_ident(source_schema);
  IF NOT FOUND
    THEN
    RAISE NOTICE 'source schema % does not exist!', source_schema;
    RETURN ;
  END IF;

  -- Check that dest_schema does not yet exist
  PERFORM nspname
    FROM pg_namespace
   WHERE nspname = quote_ident(dest_schema);
  IF FOUND
    THEN
    RAISE NOTICE 'dest schema % already exists!', dest_schema;
    RETURN ;
  END IF;

  EXECUTE 'CREATE SCHEMA ' || quote_ident(dest_schema) ;

  -- Create sequences
  -- TODO: Find a way to make this sequence's owner is the correct table.
  FOR object IN
    SELECT sequence_name::text
      FROM information_schema.sequences
     WHERE sequence_schema = quote_ident(source_schema)
  LOOP
    EXECUTE 'CREATE SEQUENCE ' || quote_ident(dest_schema) || '.' || quote_ident(object);
    srctbl := quote_ident(source_schema) || '.' || quote_ident(object);

    EXECUTE 'SELECT last_value, max_value, start_value, increment_by, min_value, cache_value, log_cnt, is_cycled, is_called
              FROM ' || quote_ident(source_schema) || '.' || quote_ident(object) || ';'
              INTO sq_last_value, sq_max_value, sq_start_value, sq_increment_by, sq_min_value, sq_cache_value, sq_log_cnt, sq_is_cycled, sq_is_called ;

    IF sq_is_cycled
      THEN
        sq_cycled := 'CYCLE';
    ELSE
        sq_cycled := 'NO CYCLE';
    END IF;

    EXECUTE 'ALTER SEQUENCE '   || quote_ident(dest_schema) || '.' || quote_ident(object)
            || ' INCREMENT BY ' || sq_increment_by
            || ' MINVALUE '     || sq_min_value
            || ' MAXVALUE '     || sq_max_value
            || ' START WITH '   || sq_start_value
            || ' RESTART '      || sq_min_value
            || ' CACHE '        || sq_cache_value
            || sq_cycled || ' ;' ;

    buffer := quote_ident(dest_schema) || '.' || quote_ident(object);
    IF include_recs
        THEN
            EXECUTE 'SELECT setval( ''' || buffer || ''', ' || sq_last_value || ', ' || sq_is_called || ');' ;
    ELSE
            EXECUTE 'SELECT setval( ''' || buffer || ''', ' || sq_start_value || ', ' || sq_is_called || ');' ;
    END IF;

  END LOOP;

-- Create tables
  FOR object IN
    SELECT TABLE_NAME::text
      FROM information_schema.tables
     WHERE table_schema = quote_ident(source_schema)
       AND table_type = 'BASE TABLE'

  LOOP
    buffer := dest_schema || '.' || quote_ident(object);
    EXECUTE 'CREATE TABLE ' || buffer || ' (LIKE ' || quote_ident(source_schema) || '.' || quote_ident(object)
        || ' INCLUDING ALL)';

    IF include_recs
      THEN
      -- Insert records from source table
      EXECUTE 'INSERT INTO ' || buffer || ' SELECT * FROM ' || quote_ident(source_schema) || '.' || quote_ident(object) || ';';
    END IF;

    FOR column_, default_ IN
      SELECT column_name::text,
             REPLACE(REPLACE(column_default::text, quote_ident(source_schema) || '.', ''), 'nextval(''', 'nextval(''' || dest_schema || '.')
        FROM information_schema.COLUMNS
       WHERE table_schema = dest_schema
         AND TABLE_NAME = object
         AND column_default LIKE 'nextval(%::regclass)'
    LOOP
      EXECUTE 'ALTER TABLE ' || buffer || ' ALTER COLUMN ' || column_ || ' SET DEFAULT ' || default_;
    END LOOP;

  END LOOP;

--  add FK constraint
  FOR qry IN
    SELECT 'ALTER TABLE ' || quote_ident(dest_schema) || '.' || quote_ident(rn.relname)
                          || ' ADD CONSTRAINT ' || quote_ident(ct.conname) || ' '
                          || REPLACE(REPLACE(pg_get_constraintdef(ct.oid), quote_ident(source_schema) || '.', ''), 'REFERENCES ', 'REFERENCES ' || dest_schema || '.') || ';'

      FROM pg_constraint ct
      JOIN pg_class rn ON rn.oid = ct.conrelid
     WHERE connamespace = src_oid
       AND rn.relkind = 'r'
       AND ct.contype = 'f'

    LOOP
      EXECUTE qry;

    END LOOP;


-- Create views
  FOR object IN
    SELECT table_name::text,
           view_definition
      FROM information_schema.views
     WHERE table_schema = quote_ident(source_schema)

  LOOP
    buffer := dest_schema || '.' || quote_ident(object);
    SELECT view_definition INTO v_def
      FROM information_schema.views
     WHERE table_schema = quote_ident(source_schema)
       AND table_name = quote_ident(object);

    EXECUTE 'CREATE OR REPLACE VIEW ' || buffer || ' AS ' || v_def || ';' ;

  END LOOP;

-- Create functions
  FOR func_oid IN
    SELECT oid
      FROM pg_proc
     WHERE pronamespace = src_oid

  LOOP
    SELECT pg_get_functiondef(func_oid) INTO qry;
    SELECT replace(qry, source_schema, dest_schema) INTO dest_qry;
    EXECUTE dest_qry;

  END LOOP;

  RETURN;

END;

$$;


ALTER FUNCTION test.clone_schema(source_schema text, dest_schema text, include_recs boolean) OWNER TO indabauser;

--
-- Name: fix_schema_references(text); Type: FUNCTION; Schema: test; Owner: indabauser
--

CREATE FUNCTION fix_schema_references(schema text) RETURNS void
    LANGUAGE plpgsql
    AS $$



-- This function will fix
-- 1) reference to sequence with using correct namespace
-- 2) FK constraints  reference with using correct namespace
-- SAMPLE CALL:
-- SELECT fix_schema_references('schemaName');

DECLARE
  src_oid          oid;
  object           text;
  buffer           text;
  default_         text;
  column_          text;
  qry              text;

BEGIN
  RAISE NOTICE 'Current schema: %', current_schema;
  RAISE NOTICE 'Target schema: %', schema;

-- Get src_oid
  SELECT oid INTO src_oid
    FROM pg_namespace
   WHERE nspname = quote_ident(schema);
  IF NOT FOUND
    THEN
    RAISE NOTICE 'Target schema % does not exist!', schema;
    RETURN ;
  END IF;
  --RAISE NOTICE 'Current schema oid: %', src_oid;

  RAISE NOTICE '%', 'SET search_path TO ' || schema || ';';
  EXECUTE 'SET search_path TO ' || schema || ';';

-- Fix reference to sequence
  FOR object IN
    SELECT TABLE_NAME::text
      FROM information_schema.tables
     WHERE table_schema = quote_ident(schema)
       AND table_type = 'BASE TABLE'

  LOOP
    buffer := schema || '.' || quote_ident(object);
    FOR column_, default_ IN
      SELECT column_name::text,
             REPLACE(REPLACE(column_default::text, 'test.', ''), 'nextval(''', 'nextval(''' || schema || '.')
        FROM information_schema.COLUMNS
       WHERE table_schema = schema
         AND TABLE_NAME = object
         AND column_default LIKE 'nextval(%::regclass)'
    LOOP
      RAISE NOTICE '%', 'ALTER TABLE ' || buffer || ' ALTER COLUMN ' || column_ || ' SET DEFAULT ' || default_;
      EXECUTE 'ALTER TABLE ' || buffer || ' ALTER COLUMN ' || column_ || ' SET DEFAULT ' || default_;
    END LOOP;

  END LOOP;


--  add FK constraint
  FOR qry IN
    SELECT 'ALTER TABLE ' || quote_ident(schema) || '.' || quote_ident(rn.relname)
													|| ' DROP CONSTRAINT ' || quote_ident(ct.conname) || ', '
                          || ' ADD CONSTRAINT ' || quote_ident(ct.conname) || ' '
                          || overlay(pg_get_constraintdef(ct.oid) placing 'REFERENCES '||schema||'.' from position('REFERENCES' in pg_get_constraintdef(ct.oid)) for 11) || ';'
      FROM pg_constraint ct
      JOIN pg_class rn ON rn.oid = ct.conrelid
     WHERE connamespace = src_oid
       AND rn.relkind = 'r'
       AND ct.contype = 'f'

    LOOP
      RAISE NOTICE '%', qry;
      EXECUTE qry;

    END LOOP;

END;

$$;


ALTER FUNCTION test.fix_schema_references(schema text) OWNER TO indabauser;

--
-- Name: order_before_update(); Type: FUNCTION; Schema: test; Owner: indabauser
--

CREATE FUNCTION order_before_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   NEW."updated" = now();

   RETURN NEW;
END$$;


ALTER FUNCTION test.order_before_update() OWNER TO indabauser;

--
-- Name: tours_before_insert(); Type: FUNCTION; Schema: test; Owner: indabauser
--

CREATE FUNCTION tours_before_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   new."created" = now();
new."updated" = now();

   RETURN NEW;
END;$$;


ALTER FUNCTION test.tours_before_insert() OWNER TO indabauser;

--
-- Name: tours_before_update(); Type: FUNCTION; Schema: test; Owner: indabauser
--

CREATE FUNCTION tours_before_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   NEW."updated" = now();

   RETURN NEW;
END;$$;


ALTER FUNCTION test.tours_before_update() OWNER TO indabauser;

--
-- Name: twc_delete_old_token(); Type: FUNCTION; Schema: test; Owner: indabauser
--

CREATE FUNCTION twc_delete_old_token() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   DELETE FROM "Token" WHERE "userID" = NEW."userID";
   RETURN NEW;
END;$$;


ALTER FUNCTION test.twc_delete_old_token() OWNER TO indabauser;

--
-- Name: twc_get_token(character varying, character varying); Type: FUNCTION; Schema: test; Owner: indabauser
--

CREATE FUNCTION twc_get_token(body character varying, exp character varying) RETURNS character varying
    LANGUAGE plpgsql
    AS $$BEGIN

  SELECT t."body"
    FROM "Token" t
   where (t."body" = twc_get_token.body)
   and ((now() - t."issuedAt") < (twc_get_token.exp || ' milliseconds')::interval);

END$$;


ALTER FUNCTION test.twc_get_token(body character varying, exp character varying) OWNER TO indabauser;

--
-- Name: user_company_check(); Type: FUNCTION; Schema: test; Owner: indabauser
--

CREATE FUNCTION user_company_check() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
  if (
    exists (
	select *
	  from "Users"
	        left join "Roles" on "Users"."roleID" = "Roles"."id"
	 where "Users"."id" = new."userID"
	       and "Roles"."name" = 'customer')
  )
  then
    RAISE EXCEPTION 'Bad user role - customer!';
  end if;

  RETURN NEW;
END;$$;


ALTER FUNCTION test.user_company_check() OWNER TO indabauser;

--
-- Name: users_before_update(); Type: FUNCTION; Schema: test; Owner: indabauser
--

CREATE FUNCTION users_before_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   NEW."updated" = now();

   RETURN NEW;
END$$;


ALTER FUNCTION test.users_before_update() OWNER TO indabauser;

SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: Essences; Type: TABLE; Schema: public; Owner: indabauser
--

CREATE TABLE "Essences" (
    id integer NOT NULL,
    "tableName" character varying(100),
    name character varying(100) NOT NULL,
    "fileName" character varying(100),
    "nameField" character varying NOT NULL
);


ALTER TABLE "Essences" OWNER TO indabauser;

--
-- Name: COLUMN "Essences".name; Type: COMMENT; Schema: public; Owner: indabauser
--

COMMENT ON COLUMN "Essences".name IS 'Human readable name of essence';


--
-- Name: COLUMN "Essences"."fileName"; Type: COMMENT; Schema: public; Owner: indabauser
--

COMMENT ON COLUMN "Essences"."fileName" IS 'File name in models path';


--
-- Name: Entities_id_seq; Type: SEQUENCE; Schema: public; Owner: indabauser
--

CREATE SEQUENCE "Entities_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Entities_id_seq" OWNER TO indabauser;

--
-- Name: Entities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: indabauser
--

ALTER SEQUENCE "Entities_id_seq" OWNED BY "Essences".id;


--
-- Name: Index_id_seq; Type: SEQUENCE; Schema: public; Owner: indabauser
--

CREATE SEQUENCE "Index_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Index_id_seq" OWNER TO indabauser;

--
-- Name: Languages; Type: TABLE; Schema: public; Owner: indabauser
--

CREATE TABLE "Languages" (
    id integer NOT NULL,
    name character varying(100),
    "nativeName" character varying(255),
    code character varying(3)
);


ALTER TABLE "Languages" OWNER TO indabauser;

--
-- Name: Languages_id_seq; Type: SEQUENCE; Schema: public; Owner: indabauser
--

CREATE SEQUENCE "Languages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Languages_id_seq" OWNER TO indabauser;

--
-- Name: Languages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: indabauser
--

ALTER SEQUENCE "Languages_id_seq" OWNED BY "Languages".id;


--
-- Name: Logs; Type: TABLE; Schema: public; Owner: indabauser
--

CREATE TABLE "Logs" (
    id integer NOT NULL,
    created timestamp(6) with time zone DEFAULT now(),
    userid integer NOT NULL,
    action character varying,
    essence integer NOT NULL,
    entity integer,
    entities character varying,
    quantity integer DEFAULT 0,
    info text,
    error boolean DEFAULT false,
    result character varying
);


ALTER TABLE "Logs" OWNER TO indabauser;

--
-- Name: Logs_id_seq; Type: SEQUENCE; Schema: public; Owner: indabauser
--

CREATE SEQUENCE "Logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Logs_id_seq" OWNER TO indabauser;

--
-- Name: Logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: indabauser
--

ALTER SEQUENCE "Logs_id_seq" OWNED BY "Logs".id;


--
-- Name: Notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: indabauser
--

CREATE SEQUENCE "Notifications_id_seq"
    START WITH 1
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Notifications_id_seq" OWNER TO indabauser;

--
-- Name: Notifications; Type: TABLE; Schema: public; Owner: indabauser
--

CREATE TABLE "Notifications" (
    id integer DEFAULT nextval('"Notifications_id_seq"'::regclass) NOT NULL,
    "userFrom" integer NOT NULL,
    "userTo" integer NOT NULL,
    body text,
    email character varying,
    message text,
    subject character varying,
    "essenceId" integer,
    "entityId" integer,
    created timestamp(6) with time zone DEFAULT now() NOT NULL,
    reading timestamp(6) with time zone,
    sent timestamp(6) with time zone,
    read boolean DEFAULT false,
    "notifyLevel" smallint DEFAULT 0,
    result character varying,
    resent timestamp with time zone,
    note text,
    "userFromName" character varying,
    "userToName" character varying
);


ALTER TABLE "Notifications" OWNER TO indabauser;

--
-- Name: COLUMN "Notifications"."notifyLevel"; Type: COMMENT; Schema: public; Owner: indabauser
--

COMMENT ON COLUMN "Notifications"."notifyLevel" IS '0 - none, 1 - alert only, 2 - all notifications';


--
-- Name: Rights; Type: TABLE; Schema: public; Owner: indabauser
--

CREATE TABLE "Rights" (
    id integer NOT NULL,
    action character varying(80) NOT NULL,
    description text,
    "essenceId" integer
);


ALTER TABLE "Rights" OWNER TO indabauser;

--
-- Name: Rights_id_seq; Type: SEQUENCE; Schema: public; Owner: indabauser
--

CREATE SEQUENCE "Rights_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Rights_id_seq" OWNER TO indabauser;

--
-- Name: Rights_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: indabauser
--

ALTER SEQUENCE "Rights_id_seq" OWNED BY "Rights".id;


--
-- Name: role_id_seq; Type: SEQUENCE; Schema: public; Owner: indabauser
--

CREATE SEQUENCE role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE role_id_seq OWNER TO indabauser;

--
-- Name: Roles; Type: TABLE; Schema: public; Owner: indabauser
--

CREATE TABLE "Roles" (
    id integer DEFAULT nextval('role_id_seq'::regclass) NOT NULL,
    name character varying(20) NOT NULL,
    "isSystem" boolean DEFAULT false NOT NULL
);


ALTER TABLE "Roles" OWNER TO indabauser;

--
-- Name: RolesRights; Type: TABLE; Schema: public; Owner: indabauser
--

CREATE TABLE "RolesRights" (
    "roleID" bigint NOT NULL,
    "rightID" bigint NOT NULL
);


ALTER TABLE "RolesRights" OWNER TO indabauser;

--
-- Name: Subindex_id_seq; Type: SEQUENCE; Schema: public; Owner: indabauser
--

CREATE SEQUENCE "Subindex_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Subindex_id_seq" OWNER TO indabauser;

--
-- Name: Token; Type: TABLE; Schema: public; Owner: indabauser
--

CREATE TABLE "Token" (
    "userID" integer NOT NULL,
    body character varying(200) NOT NULL,
    "issuedAt" timestamp without time zone DEFAULT ('now'::text)::timestamp without time zone NOT NULL,
    realm character varying(80) NOT NULL
);


ALTER TABLE "Token" OWNER TO indabauser;

--
-- Name: UnitOfAnalysisClassType_id_seq; Type: SEQUENCE; Schema: public; Owner: indabauser
--

CREATE SEQUENCE "UnitOfAnalysisClassType_id_seq"
    START WITH 9
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysisClassType_id_seq" OWNER TO indabauser;

--
-- Name: UnitOfAnalysisTagLink_id_seq; Type: SEQUENCE; Schema: public; Owner: indabauser
--

CREATE SEQUENCE "UnitOfAnalysisTagLink_id_seq"
    START WITH 18
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysisTagLink_id_seq" OWNER TO indabauser;

--
-- Name: UnitOfAnalysisType_id_seq; Type: SEQUENCE; Schema: public; Owner: indabauser
--

CREATE SEQUENCE "UnitOfAnalysisType_id_seq"
    START WITH 9
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysisType_id_seq" OWNER TO indabauser;

--
-- Name: UnitOfAnalysis_id_seq; Type: SEQUENCE; Schema: public; Owner: indabauser
--

CREATE SEQUENCE "UnitOfAnalysis_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysis_id_seq" OWNER TO indabauser;

--
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: indabauser
--

CREATE SEQUENCE user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE user_id_seq OWNER TO indabauser;

--
-- Name: Users; Type: TABLE; Schema: public; Owner: indabauser
--

CREATE TABLE "Users" (
    "roleID" integer NOT NULL,
    id integer DEFAULT nextval('user_id_seq'::regclass) NOT NULL,
    email character varying(80) NOT NULL,
    "firstName" character varying(80) NOT NULL,
    "lastName" character varying(80),
    password character varying(200) NOT NULL,
    cell character varying(20),
    birthday date,
    "resetPasswordToken" character varying(100),
    "resetPasswordExpires" bigint,
    created timestamp with time zone DEFAULT now() NOT NULL,
    updated timestamp without time zone,
    "isActive" boolean,
    "activationToken" character varying(100),
    "organizationId" integer,
    location character varying,
    phone character varying,
    address character varying,
    lang character varying,
    bio text,
    "notifyLevel" smallint,
    timezone character varying,
    "lastActive" timestamp with time zone,
    affiliation character varying,
    "isAnonymous" boolean DEFAULT false NOT NULL,
    "langId" integer,
    salt character varying,
    "authId" integer NOT NULL,
    "isDeleted" timestamp(6) without time zone
);


ALTER TABLE "Users" OWNER TO indabauser;

--
-- Name: brand_id_seq; Type: SEQUENCE; Schema: public; Owner: indabauser
--

CREATE SEQUENCE brand_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE brand_id_seq OWNER TO indabauser;

--
-- Name: country_id_seq; Type: SEQUENCE; Schema: public; Owner: indabauser
--

CREATE SEQUENCE country_id_seq
    START WITH 240
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE country_id_seq OWNER TO indabauser;

--
-- Name: order_id_seq; Type: SEQUENCE; Schema: public; Owner: indabauser
--

CREATE SEQUENCE order_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE order_id_seq OWNER TO indabauser;

--
-- Name: transport_id_seq; Type: SEQUENCE; Schema: public; Owner: indabauser
--

CREATE SEQUENCE transport_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE transport_id_seq OWNER TO indabauser;

--
-- Name: transportmodel_id_seq; Type: SEQUENCE; Schema: public; Owner: indabauser
--

CREATE SEQUENCE transportmodel_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE transportmodel_id_seq OWNER TO indabauser;

SET search_path = sceleton, pg_catalog;

--
-- Name: AccessMatix_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE "AccessMatix_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "AccessMatix_id_seq" OWNER TO indabauser;

--
-- Name: AccessMatrices; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "AccessMatrices" (
    id integer DEFAULT nextval('"AccessMatix_id_seq"'::regclass) NOT NULL,
    name character varying(100),
    description text,
    default_value smallint
);


ALTER TABLE "AccessMatrices" OWNER TO indabauser;

--
-- Name: AccessPermissions_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE "AccessPermissions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "AccessPermissions_id_seq" OWNER TO indabauser;

--
-- Name: AccessPermissions; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "AccessPermissions" (
    "matrixId" integer NOT NULL,
    "roleId" integer NOT NULL,
    "rightId" integer NOT NULL,
    permission smallint,
    id integer DEFAULT nextval('"AccessPermissions_id_seq"'::regclass) NOT NULL
);


ALTER TABLE "AccessPermissions" OWNER TO indabauser;

--
-- Name: AnswerAttachments_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE "AnswerAttachments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "AnswerAttachments_id_seq" OWNER TO indabauser;

--
-- Name: AnswerAttachments; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "AnswerAttachments" (
    id integer DEFAULT nextval('"AnswerAttachments_id_seq"'::regclass) NOT NULL,
    "answerId" integer,
    filename character varying,
    size integer,
    mimetype character varying,
    body bytea,
    created timestamp with time zone DEFAULT now() NOT NULL,
    owner integer,
    "amazonKey" character varying
);


ALTER TABLE "AnswerAttachments" OWNER TO indabauser;

--
-- Name: AttachmentAttempts; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "AttachmentAttempts" (
    key character varying NOT NULL,
    filename character varying,
    mimetype character varying,
    size integer,
    created timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE "AttachmentAttempts" OWNER TO indabauser;

--
-- Name: AttachmentLinks; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "AttachmentLinks" (
    "essenceId" integer NOT NULL,
    "entityId" integer NOT NULL,
    attachments integer[]
);


ALTER TABLE "AttachmentLinks" OWNER TO indabauser;

--
-- Name: Attachments; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "Attachments" (
    id integer NOT NULL,
    filename character varying,
    size integer,
    mimetype character varying,
    body bytea,
    created timestamp with time zone,
    owner integer,
    "amazonKey" character varying
);


ALTER TABLE "Attachments" OWNER TO indabauser;

--
-- Name: Attachments_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE "Attachments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Attachments_id_seq" OWNER TO indabauser;

--
-- Name: Attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: sceleton; Owner: indabauser
--

ALTER SEQUENCE "Attachments_id_seq" OWNED BY "Attachments".id;


--
-- Name: Discussions_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE "Discussions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Discussions_id_seq" OWNER TO indabauser;

--
-- Name: Discussions; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "Discussions" (
    id integer DEFAULT nextval('"Discussions_id_seq"'::regclass) NOT NULL,
    "taskId" integer NOT NULL,
    "questionId" integer NOT NULL,
    "userId" integer,
    entry text NOT NULL,
    "isReturn" boolean DEFAULT false NOT NULL,
    created timestamp(6) with time zone DEFAULT now() NOT NULL,
    updated timestamp(6) with time zone,
    "isResolve" boolean DEFAULT false NOT NULL,
    "order" smallint DEFAULT 1 NOT NULL,
    "returnTaskId" integer,
    "userFromId" integer NOT NULL,
    "stepId" integer NOT NULL,
    "stepFromId" integer,
    activated boolean DEFAULT false NOT NULL
);


ALTER TABLE "Discussions" OWNER TO indabauser;

--
-- Name: Entities_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE "Entities_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Entities_id_seq" OWNER TO indabauser;

--
-- Name: EntityRoles_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE "EntityRoles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "EntityRoles_id_seq" OWNER TO indabauser;

--
-- Name: Essences; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "Essences" (
    id integer DEFAULT nextval('"Entities_id_seq"'::regclass) NOT NULL,
    "tableName" character varying(100),
    name character varying(100) NOT NULL,
    "fileName" character varying(100),
    "nameField" character varying NOT NULL
);


ALTER TABLE "Essences" OWNER TO indabauser;

--
-- Name: COLUMN "Essences".name; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "Essences".name IS 'Human readable name of essence';


--
-- Name: COLUMN "Essences"."fileName"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "Essences"."fileName" IS 'File name in models path';


--
-- Name: Groups_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE "Groups_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Groups_id_seq" OWNER TO indabauser;

--
-- Name: Groups; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "Groups" (
    id integer DEFAULT nextval('"Groups_id_seq"'::regclass) NOT NULL,
    title character varying,
    "organizationId" integer,
    "langId" integer
);


ALTER TABLE "Groups" OWNER TO indabauser;

--
-- Name: IndexQuestionWeights; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "IndexQuestionWeights" (
    "indexId" integer NOT NULL,
    "questionId" integer NOT NULL,
    weight numeric NOT NULL,
    type character varying NOT NULL
);


ALTER TABLE "IndexQuestionWeights" OWNER TO indabauser;

--
-- Name: IndexSubindexWeights; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "IndexSubindexWeights" (
    "indexId" integer NOT NULL,
    "subindexId" integer NOT NULL,
    weight numeric NOT NULL,
    type character varying NOT NULL
);


ALTER TABLE "IndexSubindexWeights" OWNER TO indabauser;

--
-- Name: Index_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE "Index_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Index_id_seq" OWNER TO indabauser;

--
-- Name: Indexes; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "Indexes" (
    id integer DEFAULT nextval('"Index_id_seq"'::regclass) NOT NULL,
    "productId" integer NOT NULL,
    title character varying,
    description text,
    divisor numeric DEFAULT 1 NOT NULL
);


ALTER TABLE "Indexes" OWNER TO indabauser;

--
-- Name: JSON_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE "JSON_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "JSON_id_seq" OWNER TO indabauser;

--
-- Name: Languages_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE "Languages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Languages_id_seq" OWNER TO indabauser;

--
-- Name: Languages; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "Languages" (
    id integer DEFAULT nextval('"Languages_id_seq"'::regclass) NOT NULL,
    name character varying(100),
    "nativeName" character varying(255),
    code character varying(3)
);


ALTER TABLE "Languages" OWNER TO indabauser;

--
-- Name: Logs_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE "Logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Logs_id_seq" OWNER TO indabauser;

--
-- Name: Logs; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "Logs" (
    id integer DEFAULT nextval('"Logs_id_seq"'::regclass) NOT NULL,
    created timestamp(6) with time zone DEFAULT now(),
    "user" integer NOT NULL,
    action character varying,
    essence integer NOT NULL,
    entity integer,
    entities character varying,
    quantity integer DEFAULT 0,
    info text,
    error boolean DEFAULT false,
    result character varying
);


ALTER TABLE "Logs" OWNER TO indabauser;

--
-- Name: Notifications_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE "Notifications_id_seq"
    START WITH 167
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Notifications_id_seq" OWNER TO indabauser;

--
-- Name: Notifications; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "Notifications" (
    id integer DEFAULT nextval('"Notifications_id_seq"'::regclass) NOT NULL,
    "userFrom" integer NOT NULL,
    "userTo" integer NOT NULL,
    body text,
    email character varying,
    message text,
    subject character varying,
    "essenceId" integer,
    "entityId" integer,
    created timestamp(6) with time zone DEFAULT now() NOT NULL,
    reading timestamp(6) with time zone,
    sent timestamp(6) with time zone,
    read boolean DEFAULT false,
    "notifyLevel" smallint DEFAULT 0,
    result character varying,
    resent timestamp with time zone,
    note text,
    "userFromName" character varying,
    "userToName" character varying
);


ALTER TABLE "Notifications" OWNER TO indabauser;

--
-- Name: COLUMN "Notifications"."notifyLevel"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "Notifications"."notifyLevel" IS '0 - none, 1 - alert only, 2 - all notifications';


--
-- Name: Organizations_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE "Organizations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Organizations_id_seq" OWNER TO indabauser;

--
-- Name: Organizations; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "Organizations" (
    id integer DEFAULT nextval('"Organizations_id_seq"'::regclass) NOT NULL,
    name character varying(100),
    address character varying(200),
    "adminUserId" integer,
    url character varying(200),
    "enforceApiSecurity" smallint,
    "isActive" boolean,
    "langId" integer,
    realm character varying(80),
    "enableFeaturePolicy" boolean DEFAULT false NOT NULL
);


ALTER TABLE "Organizations" OWNER TO indabauser;

--
-- Name: ProductUOA; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "ProductUOA" (
    "productId" integer NOT NULL,
    "UOAid" integer NOT NULL,
    "currentStepId" integer,
    "isComplete" boolean DEFAULT false NOT NULL,
    "isDeleted" timestamp(6) without time zone
);


ALTER TABLE "ProductUOA" OWNER TO indabauser;

--
-- Name: Products_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE "Products_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Products_id_seq" OWNER TO indabauser;

--
-- Name: Products; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "Products" (
    id integer DEFAULT nextval('"Products_id_seq"'::regclass) NOT NULL,
    title character varying(100),
    description text,
    "originalLangId" integer,
    "projectId" integer,
    "surveyId" integer,
    status smallint DEFAULT 0 NOT NULL,
    "langId" integer
);


ALTER TABLE "Products" OWNER TO indabauser;

--
-- Name: ProjectUserGroups; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "ProjectUserGroups" (
    "projectId" integer NOT NULL,
    "groupId" integer NOT NULL
);


ALTER TABLE "ProjectUserGroups" OWNER TO indabauser;

--
-- Name: ProjectUsers; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "ProjectUsers" (
    "projectId" integer NOT NULL,
    "userId" integer NOT NULL
);


ALTER TABLE "ProjectUsers" OWNER TO indabauser;

--
-- Name: Projects_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE "Projects_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Projects_id_seq" OWNER TO indabauser;

--
-- Name: Projects; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "Projects" (
    id integer DEFAULT nextval('"Projects_id_seq"'::regclass) NOT NULL,
    "organizationId" integer,
    "codeName" character varying(100),
    description text,
    created timestamp(0) with time zone DEFAULT now() NOT NULL,
    "matrixId" integer,
    "startTime" timestamp with time zone,
    status smallint DEFAULT 0 NOT NULL,
    "adminUserId" integer,
    "closeTime" timestamp with time zone,
    "firstActivated" timestamp(6) without time zone,
    "langId" integer
);


ALTER TABLE "Projects" OWNER TO indabauser;

--
-- Name: Rights_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE "Rights_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Rights_id_seq" OWNER TO indabauser;

--
-- Name: Rights; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "Rights" (
    id integer DEFAULT nextval('"Rights_id_seq"'::regclass) NOT NULL,
    action character varying(80) NOT NULL,
    description text,
    "essenceId" integer
);


ALTER TABLE "Rights" OWNER TO indabauser;

--
-- Name: role_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE role_id_seq OWNER TO indabauser;

--
-- Name: Roles; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "Roles" (
    id integer DEFAULT nextval('role_id_seq'::regclass) NOT NULL,
    name character varying(20) NOT NULL,
    "isSystem" boolean DEFAULT false NOT NULL
);


ALTER TABLE "Roles" OWNER TO indabauser;

--
-- Name: RolesRights; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "RolesRights" (
    "roleID" bigint NOT NULL,
    "rightID" bigint NOT NULL
);


ALTER TABLE "RolesRights" OWNER TO indabauser;

--
-- Name: SubindexWeights; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "SubindexWeights" (
    "subindexId" integer NOT NULL,
    "questionId" integer NOT NULL,
    weight numeric NOT NULL,
    type character varying NOT NULL
);


ALTER TABLE "SubindexWeights" OWNER TO indabauser;

--
-- Name: Subindex_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE "Subindex_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Subindex_id_seq" OWNER TO indabauser;

--
-- Name: Subindexes; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "Subindexes" (
    id integer DEFAULT nextval('"Subindex_id_seq"'::regclass) NOT NULL,
    "productId" integer NOT NULL,
    title character varying,
    description text,
    divisor numeric DEFAULT 1 NOT NULL
);


ALTER TABLE "Subindexes" OWNER TO indabauser;

--
-- Name: Tasks_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE "Tasks_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Tasks_id_seq" OWNER TO indabauser;

--
-- Name: Tasks; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "Tasks" (
    id integer DEFAULT nextval('"Tasks_id_seq"'::regclass) NOT NULL,
    title character varying,
    description text,
    "uoaId" integer NOT NULL,
    "stepId" integer NOT NULL,
    created timestamp with time zone DEFAULT now() NOT NULL,
    "productId" integer NOT NULL,
    "startDate" timestamp with time zone,
    "endDate" timestamp with time zone,
    "userId" integer,
    "langId" integer,
    "assessmentId" integer,
    "userIds" integer[],
    "groupIds" integer[],
    "isDeleted" timestamp(6) without time zone
);


ALTER TABLE "Tasks" OWNER TO indabauser;

--
-- Name: Translations; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "Translations" (
    "essenceId" integer NOT NULL,
    "entityId" integer NOT NULL,
    field character varying(100) NOT NULL,
    "langId" integer NOT NULL,
    value text
);


ALTER TABLE "Translations" OWNER TO indabauser;

--
-- Name: UnitOfAnalysis_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE "UnitOfAnalysis_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysis_id_seq" OWNER TO indabauser;

--
-- Name: UnitOfAnalysis; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "UnitOfAnalysis" (
    id integer DEFAULT nextval('"UnitOfAnalysis_id_seq"'::regclass) NOT NULL,
    "gadmId0" smallint,
    "gadmId1" smallint,
    "gadmId2" smallint,
    "gadmId3" smallint,
    "gadmObjectId" integer,
    "ISO" character varying(3),
    "ISO2" character varying(2),
    "nameISO" character varying(100),
    name character varying(100) NOT NULL,
    description character varying(255),
    "shortName" character varying(45),
    "HASC" character varying(20),
    "unitOfAnalysisType" smallint NOT NULL,
    "parentId" integer,
    "creatorId" integer NOT NULL,
    "ownerId" integer NOT NULL,
    visibility smallint DEFAULT 1 NOT NULL,
    status smallint DEFAULT 1 NOT NULL,
    created timestamp(6) without time zone DEFAULT now() NOT NULL,
    "isDeleted" timestamp(6) without time zone,
    "langId" smallint DEFAULT 1 NOT NULL,
    updated timestamp(6) without time zone
);


ALTER TABLE "UnitOfAnalysis" OWNER TO indabauser;

--
-- Name: COLUMN "UnitOfAnalysis"."gadmId0"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId0" IS 'ID0 for use with GADM shapefile';


--
-- Name: COLUMN "UnitOfAnalysis"."gadmId1"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId1" IS 'ID1 for use with GADM shapefile';


--
-- Name: COLUMN "UnitOfAnalysis"."gadmId2"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId2" IS 'ID2 for use with GADM shapefile';


--
-- Name: COLUMN "UnitOfAnalysis"."gadmId3"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId3" IS 'ID3 for use with GADM shapefile';


--
-- Name: COLUMN "UnitOfAnalysis"."gadmObjectId"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmObjectId" IS 'OBJECTID for use with GADM shapefile (only Global Shapefile)';


--
-- Name: COLUMN "UnitOfAnalysis"."ISO"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."ISO" IS 'only for Country level Unit Of Analysis';


--
-- Name: COLUMN "UnitOfAnalysis"."ISO2"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."ISO2" IS 'only for Country level Unit Of Analysis';


--
-- Name: COLUMN "UnitOfAnalysis"."nameISO"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."nameISO" IS 'only for Country level Unit Of Analysis';


--
-- Name: COLUMN "UnitOfAnalysis".name; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis".name IS 'Multilanguage';


--
-- Name: COLUMN "UnitOfAnalysis".description; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis".description IS 'Multilanguage';


--
-- Name: COLUMN "UnitOfAnalysis"."shortName"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."shortName" IS 'Multilanguage';


--
-- Name: COLUMN "UnitOfAnalysis"."HASC"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."HASC" IS '(example RU.AD.OK)';


--
-- Name: COLUMN "UnitOfAnalysis"."unitOfAnalysisType"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."unitOfAnalysisType" IS 'reference to table UnitOfAnalysisType';


--
-- Name: COLUMN "UnitOfAnalysis"."parentId"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."parentId" IS 'Link to Parent Unit of Analysis if exist';


--
-- Name: COLUMN "UnitOfAnalysis"."creatorId"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."creatorId" IS 'Creator Id (User Id)';


--
-- Name: COLUMN "UnitOfAnalysis"."ownerId"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."ownerId" IS 'Owner Id (User Id)';


--
-- Name: COLUMN "UnitOfAnalysis".visibility; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis".visibility IS '1 = public; 2 = private;';


--
-- Name: COLUMN "UnitOfAnalysis".status; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis".status IS '1 = active; 2 = inactive; 3 = deleted;';


--
-- Name: UnitOfAnalysisClassType_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE "UnitOfAnalysisClassType_id_seq"
    START WITH 9
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysisClassType_id_seq" OWNER TO indabauser;

--
-- Name: UnitOfAnalysisClassType; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "UnitOfAnalysisClassType" (
    id smallint DEFAULT nextval('"UnitOfAnalysisClassType_id_seq"'::regclass) NOT NULL,
    name character varying(45) NOT NULL,
    description character varying(255),
    "langId" smallint DEFAULT 1 NOT NULL
);


ALTER TABLE "UnitOfAnalysisClassType" OWNER TO indabauser;

--
-- Name: COLUMN "UnitOfAnalysisClassType".name; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysisClassType".name IS 'Classification Name (for example - World Bank classification) ';


--
-- Name: COLUMN "UnitOfAnalysisClassType".description; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysisClassType".description IS 'Classification Name description';


--
-- Name: UnitOfAnalysisTag_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE "UnitOfAnalysisTag_id_seq"
    START WITH 9
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysisTag_id_seq" OWNER TO indabauser;

--
-- Name: UnitOfAnalysisTag; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "UnitOfAnalysisTag" (
    id smallint DEFAULT nextval('"UnitOfAnalysisTag_id_seq"'::regclass) NOT NULL,
    name character varying(45) NOT NULL,
    description character varying(255),
    "langId" integer DEFAULT 1 NOT NULL,
    "classTypeId" smallint NOT NULL
);


ALTER TABLE "UnitOfAnalysisTag" OWNER TO indabauser;

--
-- Name: UnitOfAnalysisTagLink_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE "UnitOfAnalysisTagLink_id_seq"
    START WITH 18
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysisTagLink_id_seq" OWNER TO indabauser;

--
-- Name: UnitOfAnalysisTagLink; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "UnitOfAnalysisTagLink" (
    id integer DEFAULT nextval('"UnitOfAnalysisTagLink_id_seq"'::regclass) NOT NULL,
    "uoaId" integer NOT NULL,
    "uoaTagId" integer NOT NULL
);


ALTER TABLE "UnitOfAnalysisTagLink" OWNER TO indabauser;

--
-- Name: UnitOfAnalysisType_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE "UnitOfAnalysisType_id_seq"
    START WITH 9
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysisType_id_seq" OWNER TO indabauser;

--
-- Name: UnitOfAnalysisType; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "UnitOfAnalysisType" (
    id smallint DEFAULT nextval('"UnitOfAnalysisType_id_seq"'::regclass) NOT NULL,
    name character varying(40) NOT NULL,
    description character varying(255),
    "langId" integer DEFAULT 1 NOT NULL
);


ALTER TABLE "UnitOfAnalysisType" OWNER TO indabauser;

--
-- Name: UserGroups; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "UserGroups" (
    "userId" integer NOT NULL,
    "groupId" integer NOT NULL
);


ALTER TABLE "UserGroups" OWNER TO indabauser;

--
-- Name: UserRights; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "UserRights" (
    "userID" bigint NOT NULL,
    "rightID" bigint NOT NULL,
    "canDo" boolean
);


ALTER TABLE "UserRights" OWNER TO indabauser;

--
-- Name: UserUOA; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "UserUOA" (
    "UserId" integer NOT NULL,
    "UOAid" integer NOT NULL
);


ALTER TABLE "UserUOA" OWNER TO indabauser;

--
-- Name: user_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE user_id_seq OWNER TO indabauser;

--
-- Name: Users; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "Users" (
    "roleID" integer NOT NULL,
    id integer DEFAULT nextval('user_id_seq'::regclass) NOT NULL,
    email character varying(80) NOT NULL,
    "firstName" character varying(80) NOT NULL,
    "lastName" character varying(80),
    password character varying(200) NOT NULL,
    cell character varying(20),
    birthday date,
    "resetPasswordToken" character varying(100),
    "resetPasswordExpires" bigint,
    created timestamp with time zone DEFAULT now() NOT NULL,
    updated timestamp without time zone,
    "isActive" boolean,
    "activationToken" character varying(100),
    "organizationId" integer,
    location character varying,
    phone character varying,
    address character varying,
    lang character varying,
    bio text,
    "notifyLevel" smallint,
    timezone character varying,
    "lastActive" timestamp with time zone,
    affiliation character varying,
    "isAnonymous" boolean DEFAULT false NOT NULL,
    "langId" integer,
    salt character varying,
    "authId" integer NOT NULL,
    "isDeleted" timestamp(6) without time zone
);


ALTER TABLE "Users" OWNER TO indabauser;

--
-- Name: Visualizations_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE "Visualizations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Visualizations_id_seq" OWNER TO indabauser;

--
-- Name: Visualizations; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "Visualizations" (
    id integer DEFAULT nextval('"Visualizations_id_seq"'::regclass) NOT NULL,
    title character varying,
    "productId" integer,
    "topicIds" integer[],
    "indexCollection" character varying,
    "indexId" integer,
    "visualizationType" character varying,
    "comparativeTopicId" integer,
    "organizationId" integer NOT NULL
);


ALTER TABLE "Visualizations" OWNER TO indabauser;

--
-- Name: WorkflowStepGroups; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "WorkflowStepGroups" (
    "stepId" integer NOT NULL,
    "groupId" integer NOT NULL
);


ALTER TABLE "WorkflowStepGroups" OWNER TO indabauser;

--
-- Name: WorkflowSteps_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE "WorkflowSteps_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "WorkflowSteps_id_seq" OWNER TO indabauser;

--
-- Name: WorkflowSteps; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "WorkflowSteps" (
    "workflowId" integer NOT NULL,
    id integer DEFAULT nextval('"WorkflowSteps_id_seq"'::regclass) NOT NULL,
    "startDate" timestamp with time zone,
    "endDate" timestamp with time zone,
    title character varying,
    "provideResponses" boolean,
    "discussionParticipation" boolean,
    "blindReview" boolean,
    "seeOthersResponses" boolean,
    "allowTranslate" boolean,
    "position" integer,
    "writeToAnswers" boolean,
    "allowEdit" boolean DEFAULT false NOT NULL,
    role character varying,
    "langId" integer,
    "isDeleted" timestamp(6) without time zone
);


ALTER TABLE "WorkflowSteps" OWNER TO indabauser;

--
-- Name: Workflows_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE "Workflows_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Workflows_id_seq" OWNER TO indabauser;

--
-- Name: Workflows; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "Workflows" (
    id integer DEFAULT nextval('"Workflows_id_seq"'::regclass) NOT NULL,
    name character varying(200),
    description text,
    created timestamp with time zone DEFAULT now() NOT NULL,
    "productId" integer
);


ALTER TABLE "Workflows" OWNER TO indabauser;

--
-- Name: brand_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE brand_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE brand_id_seq OWNER TO indabauser;

--
-- Name: country_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE country_id_seq
    START WITH 240
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE country_id_seq OWNER TO indabauser;

--
-- Name: order_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE order_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE order_id_seq OWNER TO indabauser;

--
-- Name: transport_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE transport_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE transport_id_seq OWNER TO indabauser;

--
-- Name: transportmodel_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE transportmodel_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE transportmodel_id_seq OWNER TO indabauser;

SET search_path = test, pg_catalog;

--
-- Name: AccessMatix_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE "AccessMatix_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "AccessMatix_id_seq" OWNER TO indabauser;

--
-- Name: AccessMatrices; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "AccessMatrices" (
    id integer DEFAULT nextval('"AccessMatix_id_seq"'::regclass) NOT NULL,
    name character varying(100),
    description text,
    default_value smallint
);


ALTER TABLE "AccessMatrices" OWNER TO indabauser;

--
-- Name: AccessPermissions_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE "AccessPermissions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "AccessPermissions_id_seq" OWNER TO indabauser;

--
-- Name: AccessPermissions; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "AccessPermissions" (
    "matrixId" integer NOT NULL,
    "roleId" integer NOT NULL,
    "rightId" integer NOT NULL,
    permission smallint,
    id integer DEFAULT nextval('"AccessPermissions_id_seq"'::regclass) NOT NULL
);


ALTER TABLE "AccessPermissions" OWNER TO indabauser;

--
-- Name: AnswerAttachments_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE "AnswerAttachments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "AnswerAttachments_id_seq" OWNER TO indabauser;

--
-- Name: AnswerAttachments; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "AnswerAttachments" (
    id integer DEFAULT nextval('"AnswerAttachments_id_seq"'::regclass) NOT NULL,
    "answerId" integer,
    filename character varying,
    size integer,
    mimetype character varying,
    body bytea,
    created timestamp with time zone DEFAULT now() NOT NULL,
    owner integer,
    "amazonKey" character varying
);


ALTER TABLE "AnswerAttachments" OWNER TO indabauser;

--
-- Name: AttachmentAttempts; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "AttachmentAttempts" (
    key character varying NOT NULL,
    filename character varying,
    mimetype character varying,
    size integer,
    created timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE "AttachmentAttempts" OWNER TO indabauser;

--
-- Name: AttachmentLinks; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "AttachmentLinks" (
    "essenceId" integer NOT NULL,
    "entityId" integer NOT NULL,
    attachments integer[]
);


ALTER TABLE "AttachmentLinks" OWNER TO indabauser;

--
-- Name: Attachments_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE "Attachments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Attachments_id_seq" OWNER TO indabauser;

--
-- Name: Attachments; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "Attachments" (
    id integer DEFAULT nextval('"Attachments_id_seq"'::regclass) NOT NULL,
    filename character varying,
    size integer,
    mimetype character varying,
    body bytea,
    created timestamp with time zone,
    owner integer,
    "amazonKey" character varying
);


ALTER TABLE "Attachments" OWNER TO indabauser;

--
-- Name: Discussions_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE "Discussions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Discussions_id_seq" OWNER TO indabauser;

--
-- Name: Discussions; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "Discussions" (
    id integer DEFAULT nextval('"Discussions_id_seq"'::regclass) NOT NULL,
    "taskId" integer NOT NULL,
    "questionId" integer NOT NULL,
    "userId" integer,
    entry text NOT NULL,
    "isReturn" boolean DEFAULT false NOT NULL,
    created timestamp(6) with time zone DEFAULT now() NOT NULL,
    updated timestamp(6) with time zone,
    "isResolve" boolean DEFAULT false NOT NULL,
    "order" smallint DEFAULT 1 NOT NULL,
    "returnTaskId" integer,
    "userFromId" integer NOT NULL,
    "stepId" integer NOT NULL,
    "stepFromId" integer,
    activated boolean DEFAULT false NOT NULL
);


ALTER TABLE "Discussions" OWNER TO indabauser;

--
-- Name: Entities_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE "Entities_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Entities_id_seq" OWNER TO indabauser;

--
-- Name: EntityRoles_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE "EntityRoles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "EntityRoles_id_seq" OWNER TO indabauser;

--
-- Name: Essences; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "Essences" (
    id integer DEFAULT nextval('"Entities_id_seq"'::regclass) NOT NULL,
    "tableName" character varying(100),
    name character varying(100) NOT NULL,
    "fileName" character varying(100),
    "nameField" character varying NOT NULL
);


ALTER TABLE "Essences" OWNER TO indabauser;

--
-- Name: COLUMN "Essences".name; Type: COMMENT; Schema: test; Owner: indabauser
--

COMMENT ON COLUMN "Essences".name IS 'Human readable name of essence';


--
-- Name: COLUMN "Essences"."fileName"; Type: COMMENT; Schema: test; Owner: indabauser
--

COMMENT ON COLUMN "Essences"."fileName" IS 'File name in models path';


--
-- Name: Groups_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE "Groups_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Groups_id_seq" OWNER TO indabauser;

--
-- Name: Groups; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "Groups" (
    id integer DEFAULT nextval('"Groups_id_seq"'::regclass) NOT NULL,
    title character varying,
    "organizationId" integer,
    "langId" integer
);


ALTER TABLE "Groups" OWNER TO indabauser;

--
-- Name: IndexQuestionWeights; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "IndexQuestionWeights" (
    "indexId" integer NOT NULL,
    "questionId" integer NOT NULL,
    weight numeric NOT NULL,
    type character varying NOT NULL
);


ALTER TABLE "IndexQuestionWeights" OWNER TO indabauser;

--
-- Name: IndexSubindexWeights; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "IndexSubindexWeights" (
    "indexId" integer NOT NULL,
    "subindexId" integer NOT NULL,
    weight numeric NOT NULL,
    type character varying NOT NULL
);


ALTER TABLE "IndexSubindexWeights" OWNER TO indabauser;

--
-- Name: Index_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE "Index_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Index_id_seq" OWNER TO indabauser;

--
-- Name: Indexes; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "Indexes" (
    id integer DEFAULT nextval('"Index_id_seq"'::regclass) NOT NULL,
    "productId" integer NOT NULL,
    title character varying,
    description text,
    divisor numeric DEFAULT 1 NOT NULL
);


ALTER TABLE "Indexes" OWNER TO indabauser;

--
-- Name: JSON_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE "JSON_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "JSON_id_seq" OWNER TO indabauser;

--
-- Name: Languages_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE "Languages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Languages_id_seq" OWNER TO indabauser;

--
-- Name: Languages; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "Languages" (
    id integer DEFAULT nextval('"Languages_id_seq"'::regclass) NOT NULL,
    name character varying(100),
    "nativeName" character varying(255),
    code character varying(3)
);


ALTER TABLE "Languages" OWNER TO indabauser;

--
-- Name: Logs_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE "Logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Logs_id_seq" OWNER TO indabauser;

--
-- Name: Logs; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "Logs" (
    id integer DEFAULT nextval('"Logs_id_seq"'::regclass) NOT NULL,
    created timestamp(6) with time zone DEFAULT now(),
    "user" integer NOT NULL,
    action character varying,
    essence integer NOT NULL,
    entity integer,
    entities character varying,
    quantity integer DEFAULT 0,
    info text,
    error boolean DEFAULT false,
    result character varying
);


ALTER TABLE "Logs" OWNER TO indabauser;

--
-- Name: Notifications_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE "Notifications_id_seq"
    START WITH 167
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Notifications_id_seq" OWNER TO indabauser;

--
-- Name: Notifications; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "Notifications" (
    id integer DEFAULT nextval('"Notifications_id_seq"'::regclass) NOT NULL,
    "userFrom" integer NOT NULL,
    "userTo" integer NOT NULL,
    body text,
    email character varying,
    message text,
    subject character varying,
    "essenceId" integer,
    "entityId" integer,
    created timestamp(6) with time zone DEFAULT now() NOT NULL,
    reading timestamp(6) with time zone,
    sent timestamp(6) with time zone,
    read boolean DEFAULT false,
    "notifyLevel" smallint DEFAULT 0,
    result character varying,
    resent timestamp with time zone,
    note text,
    "userFromName" character varying,
    "userToName" character varying
);


ALTER TABLE "Notifications" OWNER TO indabauser;

--
-- Name: COLUMN "Notifications"."notifyLevel"; Type: COMMENT; Schema: test; Owner: indabauser
--

COMMENT ON COLUMN "Notifications"."notifyLevel" IS '0 - none, 1 - alert only, 2 - all notifications';


--
-- Name: Organizations_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE "Organizations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Organizations_id_seq" OWNER TO indabauser;

--
-- Name: Organizations; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "Organizations" (
    id integer DEFAULT nextval('"Organizations_id_seq"'::regclass) NOT NULL,
    name character varying(100),
    address character varying(200),
    "adminUserId" integer,
    url character varying(200),
    "enforceApiSecurity" smallint,
    "isActive" boolean,
    "langId" integer,
    realm character varying(80),
    "enableFeaturePolicy" boolean DEFAULT false NOT NULL
);


ALTER TABLE "Organizations" OWNER TO indabauser;

--
-- Name: ProductUOA; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "ProductUOA" (
    "productId" integer NOT NULL,
    "UOAid" integer NOT NULL,
    "currentStepId" integer,
    "isComplete" boolean DEFAULT false NOT NULL,
    "isDeleted" timestamp(6) without time zone
);


ALTER TABLE "ProductUOA" OWNER TO indabauser;

--
-- Name: Products_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE "Products_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Products_id_seq" OWNER TO indabauser;

--
-- Name: Products; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "Products" (
    id integer DEFAULT nextval('"Products_id_seq"'::regclass) NOT NULL,
    title character varying(100),
    description text,
    "originalLangId" integer,
    "projectId" integer,
    "surveyId" integer,
    status smallint DEFAULT 0 NOT NULL,
    "langId" integer
);


ALTER TABLE "Products" OWNER TO indabauser;

--
-- Name: ProjectUserGroups; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "ProjectUserGroups" (
    "projectId" integer NOT NULL,
    "groupId" integer NOT NULL
);


ALTER TABLE "ProjectUserGroups" OWNER TO indabauser;

--
-- Name: ProjectUsers; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "ProjectUsers" (
    "projectId" integer NOT NULL,
    "userId" integer NOT NULL
);


ALTER TABLE "ProjectUsers" OWNER TO indabauser;

--
-- Name: Projects_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE "Projects_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Projects_id_seq" OWNER TO indabauser;

--
-- Name: Projects; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "Projects" (
    id integer DEFAULT nextval('"Projects_id_seq"'::regclass) NOT NULL,
    "organizationId" integer,
    "codeName" character varying(100),
    description text,
    created timestamp(0) with time zone DEFAULT now() NOT NULL,
    "matrixId" integer,
    "startTime" timestamp with time zone,
    status smallint DEFAULT 0 NOT NULL,
    "adminUserId" integer,
    "closeTime" timestamp with time zone,
    "firstActivated" timestamp(6) without time zone,
    "langId" integer
);


ALTER TABLE "Projects" OWNER TO indabauser;

--
-- Name: Rights_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE "Rights_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Rights_id_seq" OWNER TO indabauser;

--
-- Name: Rights; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "Rights" (
    id integer DEFAULT nextval('"Rights_id_seq"'::regclass) NOT NULL,
    action character varying(80) NOT NULL,
    description text,
    "essenceId" integer
);


ALTER TABLE "Rights" OWNER TO indabauser;

--
-- Name: role_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE role_id_seq OWNER TO indabauser;

--
-- Name: Roles; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "Roles" (
    id integer DEFAULT nextval('role_id_seq'::regclass) NOT NULL,
    name character varying(20) NOT NULL,
    "isSystem" boolean DEFAULT false NOT NULL
);


ALTER TABLE "Roles" OWNER TO indabauser;

--
-- Name: RolesRights; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "RolesRights" (
    "roleID" bigint NOT NULL,
    "rightID" bigint NOT NULL
);


ALTER TABLE "RolesRights" OWNER TO indabauser;

--
-- Name: SubindexWeights; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "SubindexWeights" (
    "subindexId" integer NOT NULL,
    "questionId" integer NOT NULL,
    weight numeric NOT NULL,
    type character varying NOT NULL
);


ALTER TABLE "SubindexWeights" OWNER TO indabauser;

--
-- Name: Subindex_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE "Subindex_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Subindex_id_seq" OWNER TO indabauser;

--
-- Name: Subindexes; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "Subindexes" (
    id integer DEFAULT nextval('"Subindex_id_seq"'::regclass) NOT NULL,
    "productId" integer NOT NULL,
    title character varying,
    description text,
    divisor numeric DEFAULT 1 NOT NULL
);


ALTER TABLE "Subindexes" OWNER TO indabauser;

--
-- Name: Tasks_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE "Tasks_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Tasks_id_seq" OWNER TO indabauser;

--
-- Name: Tasks; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "Tasks" (
    id integer DEFAULT nextval('"Tasks_id_seq"'::regclass) NOT NULL,
    title character varying,
    description text,
    "uoaId" integer NOT NULL,
    "stepId" integer NOT NULL,
    created timestamp with time zone DEFAULT now() NOT NULL,
    "productId" integer NOT NULL,
    "startDate" timestamp with time zone,
    "endDate" timestamp with time zone,
    "userId" integer,
    "langId" integer,
    "assessmentId" integer,
    "userIds" integer[],
    "groupIds" integer[],
    "isDeleted" timestamp(6) without time zone
);


ALTER TABLE "Tasks" OWNER TO indabauser;

--
-- Name: Translations; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "Translations" (
    "essenceId" integer NOT NULL,
    "entityId" integer NOT NULL,
    field character varying(100) NOT NULL,
    "langId" integer NOT NULL,
    value text
);


ALTER TABLE "Translations" OWNER TO indabauser;

--
-- Name: UnitOfAnalysis_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE "UnitOfAnalysis_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysis_id_seq" OWNER TO indabauser;

--
-- Name: UnitOfAnalysis; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "UnitOfAnalysis" (
    id integer DEFAULT nextval('"UnitOfAnalysis_id_seq"'::regclass) NOT NULL,
    "gadmId0" smallint,
    "gadmId1" smallint,
    "gadmId2" smallint,
    "gadmId3" smallint,
    "gadmObjectId" integer,
    "ISO" character varying(3),
    "ISO2" character varying(2),
    "nameISO" character varying(100),
    name character varying(100) NOT NULL,
    description character varying(255),
    "shortName" character varying(45),
    "HASC" character varying(20),
    "unitOfAnalysisType" smallint NOT NULL,
    "parentId" integer,
    "creatorId" integer NOT NULL,
    "ownerId" integer NOT NULL,
    visibility smallint DEFAULT 1 NOT NULL,
    status smallint DEFAULT 1 NOT NULL,
    created timestamp(6) without time zone DEFAULT now() NOT NULL,
    "isDeleted" timestamp(6) without time zone,
    "langId" smallint DEFAULT 1 NOT NULL,
    updated timestamp(6) without time zone
);


ALTER TABLE "UnitOfAnalysis" OWNER TO indabauser;

--
-- Name: COLUMN "UnitOfAnalysis"."gadmId0"; Type: COMMENT; Schema: test; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId0" IS 'ID0 for use with GADM shapefile';


--
-- Name: COLUMN "UnitOfAnalysis"."gadmId1"; Type: COMMENT; Schema: test; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId1" IS 'ID1 for use with GADM shapefile';


--
-- Name: COLUMN "UnitOfAnalysis"."gadmId2"; Type: COMMENT; Schema: test; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId2" IS 'ID2 for use with GADM shapefile';


--
-- Name: COLUMN "UnitOfAnalysis"."gadmId3"; Type: COMMENT; Schema: test; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId3" IS 'ID3 for use with GADM shapefile';


--
-- Name: COLUMN "UnitOfAnalysis"."gadmObjectId"; Type: COMMENT; Schema: test; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmObjectId" IS 'OBJECTID for use with GADM shapefile (only Global Shapefile)';


--
-- Name: COLUMN "UnitOfAnalysis"."ISO"; Type: COMMENT; Schema: test; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."ISO" IS 'only for Country level Unit Of Analysis';


--
-- Name: COLUMN "UnitOfAnalysis"."ISO2"; Type: COMMENT; Schema: test; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."ISO2" IS 'only for Country level Unit Of Analysis';


--
-- Name: COLUMN "UnitOfAnalysis"."nameISO"; Type: COMMENT; Schema: test; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."nameISO" IS 'only for Country level Unit Of Analysis';


--
-- Name: COLUMN "UnitOfAnalysis".name; Type: COMMENT; Schema: test; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis".name IS 'Multilanguage';


--
-- Name: COLUMN "UnitOfAnalysis".description; Type: COMMENT; Schema: test; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis".description IS 'Multilanguage';


--
-- Name: COLUMN "UnitOfAnalysis"."shortName"; Type: COMMENT; Schema: test; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."shortName" IS 'Multilanguage';


--
-- Name: COLUMN "UnitOfAnalysis"."HASC"; Type: COMMENT; Schema: test; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."HASC" IS '(example RU.AD.OK)';


--
-- Name: COLUMN "UnitOfAnalysis"."unitOfAnalysisType"; Type: COMMENT; Schema: test; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."unitOfAnalysisType" IS 'reference to table UnitOfAnalysisType';


--
-- Name: COLUMN "UnitOfAnalysis"."parentId"; Type: COMMENT; Schema: test; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."parentId" IS 'Link to Parent Unit of Analysis if exist';


--
-- Name: COLUMN "UnitOfAnalysis"."creatorId"; Type: COMMENT; Schema: test; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."creatorId" IS 'Creator Id (User Id)';


--
-- Name: COLUMN "UnitOfAnalysis"."ownerId"; Type: COMMENT; Schema: test; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."ownerId" IS 'Owner Id (User Id)';


--
-- Name: COLUMN "UnitOfAnalysis".visibility; Type: COMMENT; Schema: test; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis".visibility IS '1 = public; 2 = private;';


--
-- Name: COLUMN "UnitOfAnalysis".status; Type: COMMENT; Schema: test; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis".status IS '1 = active; 2 = inactive; 3 = deleted;';


--
-- Name: UnitOfAnalysisClassType_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE "UnitOfAnalysisClassType_id_seq"
    START WITH 9
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysisClassType_id_seq" OWNER TO indabauser;

--
-- Name: UnitOfAnalysisClassType; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "UnitOfAnalysisClassType" (
    id smallint DEFAULT nextval('"UnitOfAnalysisClassType_id_seq"'::regclass) NOT NULL,
    name character varying(45) NOT NULL,
    description character varying(255),
    "langId" smallint DEFAULT 1 NOT NULL
);


ALTER TABLE "UnitOfAnalysisClassType" OWNER TO indabauser;

--
-- Name: COLUMN "UnitOfAnalysisClassType".name; Type: COMMENT; Schema: test; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysisClassType".name IS 'Classification Name (for example - World Bank classification) ';


--
-- Name: COLUMN "UnitOfAnalysisClassType".description; Type: COMMENT; Schema: test; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysisClassType".description IS 'Classification Name description';


--
-- Name: UnitOfAnalysisTag_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE "UnitOfAnalysisTag_id_seq"
    START WITH 9
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysisTag_id_seq" OWNER TO indabauser;

--
-- Name: UnitOfAnalysisTag; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "UnitOfAnalysisTag" (
    id smallint DEFAULT nextval('"UnitOfAnalysisTag_id_seq"'::regclass) NOT NULL,
    name character varying(45) NOT NULL,
    description character varying(255),
    "langId" integer DEFAULT 1 NOT NULL,
    "classTypeId" smallint NOT NULL
);


ALTER TABLE "UnitOfAnalysisTag" OWNER TO indabauser;

--
-- Name: UnitOfAnalysisTagLink_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE "UnitOfAnalysisTagLink_id_seq"
    START WITH 18
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysisTagLink_id_seq" OWNER TO indabauser;

--
-- Name: UnitOfAnalysisTagLink; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "UnitOfAnalysisTagLink" (
    id integer DEFAULT nextval('"UnitOfAnalysisTagLink_id_seq"'::regclass) NOT NULL,
    "uoaId" integer NOT NULL,
    "uoaTagId" integer NOT NULL
);


ALTER TABLE "UnitOfAnalysisTagLink" OWNER TO indabauser;

--
-- Name: UnitOfAnalysisType_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE "UnitOfAnalysisType_id_seq"
    START WITH 9
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysisType_id_seq" OWNER TO indabauser;

--
-- Name: UnitOfAnalysisType; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "UnitOfAnalysisType" (
    id smallint DEFAULT nextval('"UnitOfAnalysisType_id_seq"'::regclass) NOT NULL,
    name character varying(40) NOT NULL,
    description character varying(255),
    "langId" integer DEFAULT 1 NOT NULL
);


ALTER TABLE "UnitOfAnalysisType" OWNER TO indabauser;

--
-- Name: UserGroups; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "UserGroups" (
    "userId" integer NOT NULL,
    "groupId" integer NOT NULL
);


ALTER TABLE "UserGroups" OWNER TO indabauser;

--
-- Name: UserRights; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "UserRights" (
    "userID" bigint NOT NULL,
    "rightID" bigint NOT NULL,
    "canDo" boolean
);


ALTER TABLE "UserRights" OWNER TO indabauser;

--
-- Name: UserUOA; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "UserUOA" (
    "UserId" integer NOT NULL,
    "UOAid" integer NOT NULL
);


ALTER TABLE "UserUOA" OWNER TO indabauser;

--
-- Name: user_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE user_id_seq OWNER TO indabauser;

--
-- Name: Users; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "Users" (
    "roleID" integer NOT NULL,
    id integer DEFAULT nextval('user_id_seq'::regclass) NOT NULL,
    email character varying(80) NOT NULL,
    "firstName" character varying(80) NOT NULL,
    "lastName" character varying(80),
    password character varying(200) NOT NULL,
    cell character varying(20),
    birthday date,
    "resetPasswordToken" character varying(100),
    "resetPasswordExpires" bigint,
    created timestamp with time zone DEFAULT now() NOT NULL,
    updated timestamp without time zone,
    "isActive" boolean,
    "activationToken" character varying(100),
    "organizationId" integer,
    location character varying,
    phone character varying,
    address character varying,
    lang character varying,
    bio text,
    "notifyLevel" smallint,
    timezone character varying,
    "lastActive" timestamp with time zone,
    affiliation character varying,
    "isAnonymous" boolean DEFAULT false NOT NULL,
    "langId" integer,
    salt character varying,
    "authId" integer NOT NULL,
    "isDeleted" timestamp(6) without time zone
);


ALTER TABLE "Users" OWNER TO indabauser;

--
-- Name: Visualizations_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE "Visualizations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Visualizations_id_seq" OWNER TO indabauser;

--
-- Name: Visualizations; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "Visualizations" (
    id integer DEFAULT nextval('"Visualizations_id_seq"'::regclass) NOT NULL,
    title character varying,
    "productId" integer,
    "topicIds" integer[],
    "indexCollection" character varying,
    "indexId" integer,
    "visualizationType" character varying,
    "comparativeTopicId" integer,
    "organizationId" integer NOT NULL
);


ALTER TABLE "Visualizations" OWNER TO indabauser;

--
-- Name: WorkflowStepGroups; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "WorkflowStepGroups" (
    "stepId" integer NOT NULL,
    "groupId" integer NOT NULL
);


ALTER TABLE "WorkflowStepGroups" OWNER TO indabauser;

--
-- Name: WorkflowSteps_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE "WorkflowSteps_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "WorkflowSteps_id_seq" OWNER TO indabauser;

--
-- Name: WorkflowSteps; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "WorkflowSteps" (
    "workflowId" integer NOT NULL,
    id integer DEFAULT nextval('"WorkflowSteps_id_seq"'::regclass) NOT NULL,
    "startDate" timestamp with time zone,
    "endDate" timestamp with time zone,
    title character varying,
    "provideResponses" boolean,
    "discussionParticipation" boolean,
    "blindReview" boolean,
    "seeOthersResponses" boolean,
    "allowTranslate" boolean,
    "position" integer,
    "writeToAnswers" boolean,
    "allowEdit" boolean DEFAULT false NOT NULL,
    role character varying,
    "langId" integer,
    "isDeleted" timestamp(6) without time zone
);


ALTER TABLE "WorkflowSteps" OWNER TO indabauser;

--
-- Name: Workflows_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE "Workflows_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Workflows_id_seq" OWNER TO indabauser;

--
-- Name: Workflows; Type: TABLE; Schema: test; Owner: indabauser
--

CREATE TABLE "Workflows" (
    id integer DEFAULT nextval('"Workflows_id_seq"'::regclass) NOT NULL,
    name character varying(200),
    description text,
    created timestamp with time zone DEFAULT now() NOT NULL,
    "productId" integer
);


ALTER TABLE "Workflows" OWNER TO indabauser;

--
-- Name: brand_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE brand_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE brand_id_seq OWNER TO indabauser;

--
-- Name: country_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE country_id_seq
    START WITH 240
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE country_id_seq OWNER TO indabauser;

--
-- Name: order_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE order_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE order_id_seq OWNER TO indabauser;

--
-- Name: transport_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE transport_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE transport_id_seq OWNER TO indabauser;

--
-- Name: transportmodel_id_seq; Type: SEQUENCE; Schema: test; Owner: indabauser
--

CREATE SEQUENCE transportmodel_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE transportmodel_id_seq OWNER TO indabauser;

SET search_path = public, pg_catalog;

--
-- Name: Essences id; Type: DEFAULT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Essences" ALTER COLUMN id SET DEFAULT nextval('"Entities_id_seq"'::regclass);


--
-- Name: Languages id; Type: DEFAULT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Languages" ALTER COLUMN id SET DEFAULT nextval('"Languages_id_seq"'::regclass);


--
-- Name: Logs id; Type: DEFAULT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Logs" ALTER COLUMN id SET DEFAULT nextval('"Logs_id_seq"'::regclass);


--
-- Name: Rights id; Type: DEFAULT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Rights" ALTER COLUMN id SET DEFAULT nextval('"Rights_id_seq"'::regclass);


SET search_path = sceleton, pg_catalog;

--
-- Name: Attachments id; Type: DEFAULT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Attachments" ALTER COLUMN id SET DEFAULT nextval('"Attachments_id_seq"'::regclass);


SET search_path = public, pg_catalog;

--
-- Name: Entities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"Entities_id_seq"', 1, false);


--
-- Data for Name: Essences; Type: TABLE DATA; Schema: public; Owner: indabauser
--

COPY "Essences" (id, "tableName", name, "fileName", "nameField") FROM stdin;
\.


--
-- Name: Index_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"Index_id_seq"', 1, false);


--
-- Data for Name: Languages; Type: TABLE DATA; Schema: public; Owner: indabauser
--

COPY "Languages" (id, name, "nativeName", code) FROM stdin;
\.


--
-- Name: Languages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"Languages_id_seq"', 1, false);


--
-- Data for Name: Logs; Type: TABLE DATA; Schema: public; Owner: indabauser
--

COPY "Logs" (id, created, userid, action, essence, entity, entities, quantity, info, error, result) FROM stdin;
\.


--
-- Name: Logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"Logs_id_seq"', 1, false);


--
-- Data for Name: Notifications; Type: TABLE DATA; Schema: public; Owner: indabauser
--

COPY "Notifications" (id, "userFrom", "userTo", body, email, message, subject, "essenceId", "entityId", created, reading, sent, read, "notifyLevel", result, resent, note, "userFromName", "userToName") FROM stdin;
\.


--
-- Name: Notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"Notifications_id_seq"', 1, false);


--
-- Data for Name: Rights; Type: TABLE DATA; Schema: public; Owner: indabauser
--

COPY "Rights" (id, action, description, "essenceId") FROM stdin;
\.


--
-- Name: Rights_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"Rights_id_seq"', 1, false);


--
-- Data for Name: Roles; Type: TABLE DATA; Schema: public; Owner: indabauser
--

COPY "Roles" (id, name, "isSystem") FROM stdin;
\.


--
-- Data for Name: RolesRights; Type: TABLE DATA; Schema: public; Owner: indabauser
--

COPY "RolesRights" ("roleID", "rightID") FROM stdin;
\.


--
-- Name: Subindex_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"Subindex_id_seq"', 1, false);


--
-- Data for Name: Token; Type: TABLE DATA; Schema: public; Owner: indabauser
--

COPY "Token" ("userID", body, "issuedAt", realm) FROM stdin;
\.


--
-- Name: UnitOfAnalysisClassType_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysisClassType_id_seq"', 9, false);


--
-- Name: UnitOfAnalysisTagLink_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysisTagLink_id_seq"', 18, false);


--
-- Name: UnitOfAnalysisType_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysisType_id_seq"', 9, false);


--
-- Name: UnitOfAnalysis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysis_id_seq"', 1, false);


--
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: indabauser
--

COPY "Users" ("roleID", id, email, "firstName", "lastName", password, cell, birthday, "resetPasswordToken", "resetPasswordExpires", created, updated, "isActive", "activationToken", "organizationId", location, phone, address, lang, bio, "notifyLevel", timezone, "lastActive", affiliation, "isAnonymous", "langId", salt, "authId", "isDeleted") FROM stdin;
\.


--
-- Name: brand_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('brand_id_seq', 1, false);


--
-- Name: country_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('country_id_seq', 240, false);


--
-- Name: order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('order_id_seq', 1, false);


--
-- Name: role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('role_id_seq', 1, false);


--
-- Name: transport_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('transport_id_seq', 1, false);


--
-- Name: transportmodel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('transportmodel_id_seq', 1, false);


--
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indabauser
--

SELECT pg_catalog.setval('user_id_seq', 1, false);


SET search_path = sceleton, pg_catalog;

--
-- Name: AccessMatix_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"AccessMatix_id_seq"', 1, false);


--
-- Data for Name: AccessMatrices; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "AccessMatrices" (id, name, description, default_value) FROM stdin;
\.


--
-- Data for Name: AccessPermissions; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "AccessPermissions" ("matrixId", "roleId", "rightId", permission, id) FROM stdin;
\.


--
-- Name: AccessPermissions_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"AccessPermissions_id_seq"', 1, false);


--
-- Data for Name: AnswerAttachments; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "AnswerAttachments" (id, "answerId", filename, size, mimetype, body, created, owner, "amazonKey") FROM stdin;
\.


--
-- Name: AnswerAttachments_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"AnswerAttachments_id_seq"', 1, false);


--
-- Data for Name: AttachmentAttempts; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "AttachmentAttempts" (key, filename, mimetype, size, created) FROM stdin;
\.


--
-- Data for Name: AttachmentLinks; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "AttachmentLinks" ("essenceId", "entityId", attachments) FROM stdin;
\.


--
-- Data for Name: Attachments; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Attachments" (id, filename, size, mimetype, body, created, owner, "amazonKey") FROM stdin;
\.


--
-- Name: Attachments_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Attachments_id_seq"', 1, false);


--
-- Data for Name: Discussions; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Discussions" (id, "taskId", "questionId", "userId", entry, "isReturn", created, updated, "isResolve", "order", "returnTaskId", "userFromId", "stepId", "stepFromId", activated) FROM stdin;
\.


--
-- Name: Discussions_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Discussions_id_seq"', 1, false);


--
-- Name: Entities_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Entities_id_seq"', 1, false);


--
-- Name: EntityRoles_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"EntityRoles_id_seq"', 1, false);


--
-- Data for Name: Essences; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Essences" (id, "tableName", name, "fileName", "nameField") FROM stdin;
\.


--
-- Data for Name: Groups; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Groups" (id, title, "organizationId", "langId") FROM stdin;
\.


--
-- Name: Groups_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Groups_id_seq"', 1, false);


--
-- Data for Name: IndexQuestionWeights; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "IndexQuestionWeights" ("indexId", "questionId", weight, type) FROM stdin;
\.


--
-- Data for Name: IndexSubindexWeights; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "IndexSubindexWeights" ("indexId", "subindexId", weight, type) FROM stdin;
\.


--
-- Name: Index_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Index_id_seq"', 1, false);


--
-- Data for Name: Indexes; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Indexes" (id, "productId", title, description, divisor) FROM stdin;
\.


--
-- Name: JSON_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"JSON_id_seq"', 1, false);


--
-- Data for Name: Languages; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Languages" (id, name, "nativeName", code) FROM stdin;
\.


--
-- Name: Languages_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Languages_id_seq"', 1, false);


--
-- Data for Name: Logs; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Logs" (id, created, "user", action, essence, entity, entities, quantity, info, error, result) FROM stdin;
\.


--
-- Name: Logs_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Logs_id_seq"', 1, false);


--
-- Data for Name: Notifications; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Notifications" (id, "userFrom", "userTo", body, email, message, subject, "essenceId", "entityId", created, reading, sent, read, "notifyLevel", result, resent, note, "userFromName", "userToName") FROM stdin;
\.


--
-- Name: Notifications_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Notifications_id_seq"', 167, false);


--
-- Data for Name: Organizations; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Organizations" (id, name, address, "adminUserId", url, "enforceApiSecurity", "isActive", "langId", realm, "enableFeaturePolicy") FROM stdin;
\.


--
-- Name: Organizations_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Organizations_id_seq"', 1, false);


--
-- Data for Name: ProductUOA; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "ProductUOA" ("productId", "UOAid", "currentStepId", "isComplete", "isDeleted") FROM stdin;
\.


--
-- Data for Name: Products; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Products" (id, title, description, "originalLangId", "projectId", "surveyId", status, "langId") FROM stdin;
\.


--
-- Name: Products_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Products_id_seq"', 1, false);


--
-- Data for Name: ProjectUserGroups; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "ProjectUserGroups" ("projectId", "groupId") FROM stdin;
\.


--
-- Data for Name: ProjectUsers; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "ProjectUsers" ("projectId", "userId") FROM stdin;
\.


--
-- Data for Name: Projects; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Projects" (id, "organizationId", "codeName", description, created, "matrixId", "startTime", status, "adminUserId", "closeTime", "firstActivated", "langId") FROM stdin;
\.


--
-- Name: Projects_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Projects_id_seq"', 1, false);


--
-- Data for Name: Rights; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Rights" (id, action, description, "essenceId") FROM stdin;
\.


--
-- Name: Rights_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Rights_id_seq"', 1, false);


--
-- Data for Name: Roles; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Roles" (id, name, "isSystem") FROM stdin;
\.


--
-- Data for Name: RolesRights; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "RolesRights" ("roleID", "rightID") FROM stdin;
\.


--
-- Data for Name: SubindexWeights; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "SubindexWeights" ("subindexId", "questionId", weight, type) FROM stdin;
\.


--
-- Name: Subindex_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Subindex_id_seq"', 1, false);


--
-- Data for Name: Subindexes; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Subindexes" (id, "productId", title, description, divisor) FROM stdin;
\.


--
-- Data for Name: Tasks; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Tasks" (id, title, description, "uoaId", "stepId", created, "productId", "startDate", "endDate", "userId", "langId", "assessmentId", "userIds", "groupIds", "isDeleted") FROM stdin;
\.


--
-- Name: Tasks_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Tasks_id_seq"', 1, false);


--
-- Data for Name: Translations; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Translations" ("essenceId", "entityId", field, "langId", value) FROM stdin;
\.


--
-- Data for Name: UnitOfAnalysis; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "UnitOfAnalysis" (id, "gadmId0", "gadmId1", "gadmId2", "gadmId3", "gadmObjectId", "ISO", "ISO2", "nameISO", name, description, "shortName", "HASC", "unitOfAnalysisType", "parentId", "creatorId", "ownerId", visibility, status, created, "isDeleted", "langId", updated) FROM stdin;
\.


--
-- Data for Name: UnitOfAnalysisClassType; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "UnitOfAnalysisClassType" (id, name, description, "langId") FROM stdin;
\.


--
-- Name: UnitOfAnalysisClassType_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysisClassType_id_seq"', 9, false);


--
-- Data for Name: UnitOfAnalysisTag; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "UnitOfAnalysisTag" (id, name, description, "langId", "classTypeId") FROM stdin;
\.


--
-- Data for Name: UnitOfAnalysisTagLink; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "UnitOfAnalysisTagLink" (id, "uoaId", "uoaTagId") FROM stdin;
\.


--
-- Name: UnitOfAnalysisTagLink_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysisTagLink_id_seq"', 18, false);


--
-- Name: UnitOfAnalysisTag_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysisTag_id_seq"', 9, false);


--
-- Data for Name: UnitOfAnalysisType; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "UnitOfAnalysisType" (id, name, description, "langId") FROM stdin;
\.


--
-- Name: UnitOfAnalysisType_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysisType_id_seq"', 9, false);


--
-- Name: UnitOfAnalysis_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysis_id_seq"', 1, false);


--
-- Data for Name: UserGroups; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "UserGroups" ("userId", "groupId") FROM stdin;
\.


--
-- Data for Name: UserRights; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "UserRights" ("userID", "rightID", "canDo") FROM stdin;
\.


--
-- Data for Name: UserUOA; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "UserUOA" ("UserId", "UOAid") FROM stdin;
\.


--
-- Data for Name: Users; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Users" ("roleID", id, email, "firstName", "lastName", password, cell, birthday, "resetPasswordToken", "resetPasswordExpires", created, updated, "isActive", "activationToken", "organizationId", location, phone, address, lang, bio, "notifyLevel", timezone, "lastActive", affiliation, "isAnonymous", "langId", salt, "authId", "isDeleted") FROM stdin;
\.


--
-- Data for Name: Visualizations; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Visualizations" (id, title, "productId", "topicIds", "indexCollection", "indexId", "visualizationType", "comparativeTopicId", "organizationId") FROM stdin;
\.


--
-- Name: Visualizations_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Visualizations_id_seq"', 1, false);


--
-- Data for Name: WorkflowStepGroups; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "WorkflowStepGroups" ("stepId", "groupId") FROM stdin;
\.


--
-- Data for Name: WorkflowSteps; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "WorkflowSteps" ("workflowId", id, "startDate", "endDate", title, "provideResponses", "discussionParticipation", "blindReview", "seeOthersResponses", "allowTranslate", "position", "writeToAnswers", "allowEdit", role, "langId", "isDeleted") FROM stdin;
\.


--
-- Name: WorkflowSteps_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"WorkflowSteps_id_seq"', 1, false);


--
-- Data for Name: Workflows; Type: TABLE DATA; Schema: sceleton; Owner: indabauser
--

COPY "Workflows" (id, name, description, created, "productId") FROM stdin;
\.


--
-- Name: Workflows_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('"Workflows_id_seq"', 1, false);


--
-- Name: brand_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('brand_id_seq', 1, false);


--
-- Name: country_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('country_id_seq', 240, false);


--
-- Name: order_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('order_id_seq', 1, false);


--
-- Name: role_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('role_id_seq', 1, false);


--
-- Name: transport_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('transport_id_seq', 1, false);


--
-- Name: transportmodel_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('transportmodel_id_seq', 1, false);


--
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indabauser
--

SELECT pg_catalog.setval('user_id_seq', 1, false);


SET search_path = test, pg_catalog;

--
-- Name: AccessMatix_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('"AccessMatix_id_seq"', 1, false);


--
-- Data for Name: AccessMatrices; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "AccessMatrices" (id, name, description, default_value) FROM stdin;
\.


--
-- Data for Name: AccessPermissions; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "AccessPermissions" ("matrixId", "roleId", "rightId", permission, id) FROM stdin;
\.


--
-- Name: AccessPermissions_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('"AccessPermissions_id_seq"', 1, false);


--
-- Data for Name: AnswerAttachments; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "AnswerAttachments" (id, "answerId", filename, size, mimetype, body, created, owner, "amazonKey") FROM stdin;
\.


--
-- Name: AnswerAttachments_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('"AnswerAttachments_id_seq"', 1, false);


--
-- Data for Name: AttachmentAttempts; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "AttachmentAttempts" (key, filename, mimetype, size, created) FROM stdin;
\.


--
-- Data for Name: AttachmentLinks; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "AttachmentLinks" ("essenceId", "entityId", attachments) FROM stdin;
\.


--
-- Data for Name: Attachments; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "Attachments" (id, filename, size, mimetype, body, created, owner, "amazonKey") FROM stdin;
\.


--
-- Name: Attachments_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('"Attachments_id_seq"', 1, false);


--
-- Data for Name: Discussions; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "Discussions" (id, "taskId", "questionId", "userId", entry, "isReturn", created, updated, "isResolve", "order", "returnTaskId", "userFromId", "stepId", "stepFromId", activated) FROM stdin;
\.


--
-- Name: Discussions_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('"Discussions_id_seq"', 1, false);


--
-- Name: Entities_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('"Entities_id_seq"', 1, false);


--
-- Name: EntityRoles_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('"EntityRoles_id_seq"', 1, false);


--
-- Data for Name: Essences; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "Essences" (id, "tableName", name, "fileName", "nameField") FROM stdin;
\.


--
-- Data for Name: Groups; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "Groups" (id, title, "organizationId", "langId") FROM stdin;
\.


--
-- Name: Groups_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('"Groups_id_seq"', 1, false);


--
-- Data for Name: IndexQuestionWeights; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "IndexQuestionWeights" ("indexId", "questionId", weight, type) FROM stdin;
\.


--
-- Data for Name: IndexSubindexWeights; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "IndexSubindexWeights" ("indexId", "subindexId", weight, type) FROM stdin;
\.


--
-- Name: Index_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('"Index_id_seq"', 1, false);


--
-- Data for Name: Indexes; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "Indexes" (id, "productId", title, description, divisor) FROM stdin;
\.


--
-- Name: JSON_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('"JSON_id_seq"', 1, false);


--
-- Data for Name: Languages; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "Languages" (id, name, "nativeName", code) FROM stdin;
\.


--
-- Name: Languages_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('"Languages_id_seq"', 1, false);


--
-- Data for Name: Logs; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "Logs" (id, created, "user", action, essence, entity, entities, quantity, info, error, result) FROM stdin;
\.


--
-- Name: Logs_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('"Logs_id_seq"', 1, false);


--
-- Data for Name: Notifications; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "Notifications" (id, "userFrom", "userTo", body, email, message, subject, "essenceId", "entityId", created, reading, sent, read, "notifyLevel", result, resent, note, "userFromName", "userToName") FROM stdin;
\.


--
-- Name: Notifications_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('"Notifications_id_seq"', 167, false);


--
-- Data for Name: Organizations; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "Organizations" (id, name, address, "adminUserId", url, "enforceApiSecurity", "isActive", "langId", realm, "enableFeaturePolicy") FROM stdin;
\.


--
-- Name: Organizations_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('"Organizations_id_seq"', 1, false);


--
-- Data for Name: ProductUOA; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "ProductUOA" ("productId", "UOAid", "currentStepId", "isComplete", "isDeleted") FROM stdin;
\.


--
-- Data for Name: Products; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "Products" (id, title, description, "originalLangId", "projectId", "surveyId", status, "langId") FROM stdin;
\.


--
-- Name: Products_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('"Products_id_seq"', 1, false);


--
-- Data for Name: ProjectUserGroups; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "ProjectUserGroups" ("projectId", "groupId") FROM stdin;
\.


--
-- Data for Name: ProjectUsers; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "ProjectUsers" ("projectId", "userId") FROM stdin;
\.


--
-- Data for Name: Projects; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "Projects" (id, "organizationId", "codeName", description, created, "matrixId", "startTime", status, "adminUserId", "closeTime", "firstActivated", "langId") FROM stdin;
\.


--
-- Name: Projects_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('"Projects_id_seq"', 1, false);


--
-- Data for Name: Rights; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "Rights" (id, action, description, "essenceId") FROM stdin;
\.


--
-- Name: Rights_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('"Rights_id_seq"', 1, false);


--
-- Data for Name: Roles; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "Roles" (id, name, "isSystem") FROM stdin;
\.


--
-- Data for Name: RolesRights; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "RolesRights" ("roleID", "rightID") FROM stdin;
\.


--
-- Data for Name: SubindexWeights; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "SubindexWeights" ("subindexId", "questionId", weight, type) FROM stdin;
\.


--
-- Name: Subindex_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('"Subindex_id_seq"', 1, false);


--
-- Data for Name: Subindexes; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "Subindexes" (id, "productId", title, description, divisor) FROM stdin;
\.


--
-- Data for Name: Tasks; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "Tasks" (id, title, description, "uoaId", "stepId", created, "productId", "startDate", "endDate", "userId", "langId", "assessmentId", "userIds", "groupIds", "isDeleted") FROM stdin;
\.


--
-- Name: Tasks_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('"Tasks_id_seq"', 1, false);


--
-- Data for Name: Translations; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "Translations" ("essenceId", "entityId", field, "langId", value) FROM stdin;
\.


--
-- Data for Name: UnitOfAnalysis; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "UnitOfAnalysis" (id, "gadmId0", "gadmId1", "gadmId2", "gadmId3", "gadmObjectId", "ISO", "ISO2", "nameISO", name, description, "shortName", "HASC", "unitOfAnalysisType", "parentId", "creatorId", "ownerId", visibility, status, created, "isDeleted", "langId", updated) FROM stdin;
\.


--
-- Data for Name: UnitOfAnalysisClassType; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "UnitOfAnalysisClassType" (id, name, description, "langId") FROM stdin;
\.


--
-- Name: UnitOfAnalysisClassType_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysisClassType_id_seq"', 9, false);


--
-- Data for Name: UnitOfAnalysisTag; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "UnitOfAnalysisTag" (id, name, description, "langId", "classTypeId") FROM stdin;
\.


--
-- Data for Name: UnitOfAnalysisTagLink; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "UnitOfAnalysisTagLink" (id, "uoaId", "uoaTagId") FROM stdin;
\.


--
-- Name: UnitOfAnalysisTagLink_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysisTagLink_id_seq"', 18, false);


--
-- Name: UnitOfAnalysisTag_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysisTag_id_seq"', 9, false);


--
-- Data for Name: UnitOfAnalysisType; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "UnitOfAnalysisType" (id, name, description, "langId") FROM stdin;
\.


--
-- Name: UnitOfAnalysisType_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysisType_id_seq"', 9, false);


--
-- Name: UnitOfAnalysis_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('"UnitOfAnalysis_id_seq"', 1, false);


--
-- Data for Name: UserGroups; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "UserGroups" ("userId", "groupId") FROM stdin;
\.


--
-- Data for Name: UserRights; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "UserRights" ("userID", "rightID", "canDo") FROM stdin;
\.


--
-- Data for Name: UserUOA; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "UserUOA" ("UserId", "UOAid") FROM stdin;
\.


--
-- Data for Name: Users; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "Users" ("roleID", id, email, "firstName", "lastName", password, cell, birthday, "resetPasswordToken", "resetPasswordExpires", created, updated, "isActive", "activationToken", "organizationId", location, phone, address, lang, bio, "notifyLevel", timezone, "lastActive", affiliation, "isAnonymous", "langId", salt, "authId", "isDeleted") FROM stdin;
\.


--
-- Data for Name: Visualizations; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "Visualizations" (id, title, "productId", "topicIds", "indexCollection", "indexId", "visualizationType", "comparativeTopicId", "organizationId") FROM stdin;
\.


--
-- Name: Visualizations_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('"Visualizations_id_seq"', 1, false);


--
-- Data for Name: WorkflowStepGroups; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "WorkflowStepGroups" ("stepId", "groupId") FROM stdin;
\.


--
-- Data for Name: WorkflowSteps; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "WorkflowSteps" ("workflowId", id, "startDate", "endDate", title, "provideResponses", "discussionParticipation", "blindReview", "seeOthersResponses", "allowTranslate", "position", "writeToAnswers", "allowEdit", role, "langId", "isDeleted") FROM stdin;
\.


--
-- Name: WorkflowSteps_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('"WorkflowSteps_id_seq"', 1, false);


--
-- Data for Name: Workflows; Type: TABLE DATA; Schema: test; Owner: indabauser
--

COPY "Workflows" (id, name, description, created, "productId") FROM stdin;
\.


--
-- Name: Workflows_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('"Workflows_id_seq"', 1, false);


--
-- Name: brand_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('brand_id_seq', 1, false);


--
-- Name: country_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('country_id_seq', 240, false);


--
-- Name: order_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('order_id_seq', 1, false);


--
-- Name: role_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('role_id_seq', 1, false);


--
-- Name: transport_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('transport_id_seq', 1, false);


--
-- Name: transportmodel_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('transportmodel_id_seq', 1, false);


--
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: test; Owner: indabauser
--

SELECT pg_catalog.setval('user_id_seq', 1, false);


SET search_path = public, pg_catalog;

--
-- Name: Essences Entity_pkey; Type: CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Entity_pkey" PRIMARY KEY (id);


--
-- Name: Essences Essences_fileName_key; Type: CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_fileName_key" UNIQUE ("fileName");


--
-- Name: Essences Essences_tableName_key; Type: CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_tableName_key" UNIQUE ("tableName");


--
-- Name: Languages Languages_code_key; Type: CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Languages"
    ADD CONSTRAINT "Languages_code_key" UNIQUE (code);


--
-- Name: Languages Languages_pkey; Type: CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Languages"
    ADD CONSTRAINT "Languages_pkey" PRIMARY KEY (id);


--
-- Name: Logs Logs_pkey; Type: CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Logs"
    ADD CONSTRAINT "Logs_pkey" PRIMARY KEY (id);


--
-- Name: Notifications Notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_pkey" PRIMARY KEY (id);


--
-- Name: Rights Rights_pkey; Type: CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Rights"
    ADD CONSTRAINT "Rights_pkey" PRIMARY KEY (id);


--
-- Name: Token Token_pkey; Type: CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Token"
    ADD CONSTRAINT "Token_pkey" PRIMARY KEY ("userID", realm);


--
-- Name: Users Users_email_key; Type: CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- Name: Roles id; Type: CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Roles"
    ADD CONSTRAINT id PRIMARY KEY (id);


--
-- Name: RolesRights roleRight_pkey; Type: CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "roleRight_pkey" PRIMARY KEY ("roleID", "rightID");


--
-- Name: Users userID; Type: CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "userID" PRIMARY KEY (id);


SET search_path = sceleton, pg_catalog;

--
-- Name: AccessMatrices AccessMatrices_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "AccessMatrices"
    ADD CONSTRAINT "AccessMatrices_pkey" PRIMARY KEY (id);


--
-- Name: AccessPermissions AccessPermissions_matrixId_roleId_rightId_key; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "AccessPermissions"
    ADD CONSTRAINT "AccessPermissions_matrixId_roleId_rightId_key" UNIQUE ("matrixId", "roleId", "rightId");


--
-- Name: AccessPermissions AccessPermissions_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "AccessPermissions"
    ADD CONSTRAINT "AccessPermissions_pkey" PRIMARY KEY (id);


--
-- Name: AnswerAttachments AnswerAttachments_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "AnswerAttachments"
    ADD CONSTRAINT "AnswerAttachments_pkey" PRIMARY KEY (id);


--
-- Name: AttachmentAttempts AttachmentAttempts_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "AttachmentAttempts"
    ADD CONSTRAINT "AttachmentAttempts_pkey" PRIMARY KEY (key);


--
-- Name: AttachmentLinks AttachmentLinks_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "AttachmentLinks"
    ADD CONSTRAINT "AttachmentLinks_pkey" PRIMARY KEY ("essenceId", "entityId");


--
-- Name: Attachments Attachments_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Attachments"
    ADD CONSTRAINT "Attachments_pkey" PRIMARY KEY (id);


--
-- Name: Discussions Discussions_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_pkey" PRIMARY KEY (id);


--
-- Name: Essences Essences_fileName_key; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_fileName_key" UNIQUE ("fileName");


--
-- Name: Essences Essences_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_pkey" PRIMARY KEY (id);


--
-- Name: Essences Essences_tableName_key; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_tableName_key" UNIQUE ("tableName");


--
-- Name: Groups Groups_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Groups"
    ADD CONSTRAINT "Groups_pkey" PRIMARY KEY (id);


--
-- Name: IndexQuestionWeights IndexQuestionWeights_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "IndexQuestionWeights"
    ADD CONSTRAINT "IndexQuestionWeights_pkey" PRIMARY KEY ("indexId", "questionId");


--
-- Name: IndexSubindexWeights IndexSubindexWeights_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "IndexSubindexWeights"
    ADD CONSTRAINT "IndexSubindexWeights_pkey" PRIMARY KEY ("indexId", "subindexId");


--
-- Name: Indexes Indexes_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Indexes"
    ADD CONSTRAINT "Indexes_pkey" PRIMARY KEY (id);


--
-- Name: Languages Languages_code_key; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Languages"
    ADD CONSTRAINT "Languages_code_key" UNIQUE (code);


--
-- Name: Languages Languages_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Languages"
    ADD CONSTRAINT "Languages_pkey" PRIMARY KEY (id);


--
-- Name: Logs Logs_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Logs"
    ADD CONSTRAINT "Logs_pkey" PRIMARY KEY (id);


--
-- Name: Notifications Notifications_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_pkey" PRIMARY KEY (id);


--
-- Name: Organizations Organizations_adminUserId_key; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_adminUserId_key" UNIQUE ("adminUserId");


--
-- Name: Organizations Organizations_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_pkey" PRIMARY KEY (id);


--
-- Name: ProductUOA ProductUOA_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_pkey" PRIMARY KEY ("productId", "UOAid");


--
-- Name: Products Products_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_pkey" PRIMARY KEY (id);


--
-- Name: Projects Projects_codeName_key; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_codeName_key" UNIQUE ("codeName");


--
-- Name: Projects Projects_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_pkey" PRIMARY KEY (id);


--
-- Name: Rights Rights_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Rights"
    ADD CONSTRAINT "Rights_pkey" PRIMARY KEY (id);


--
-- Name: RolesRights RolesRights_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "RolesRights_pkey" PRIMARY KEY ("roleID", "rightID");


--
-- Name: Roles Roles_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Roles"
    ADD CONSTRAINT "Roles_pkey" PRIMARY KEY (id);


--
-- Name: SubindexWeights SubindexWeights_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "SubindexWeights"
    ADD CONSTRAINT "SubindexWeights_pkey" PRIMARY KEY ("subindexId", "questionId");


--
-- Name: Subindexes Subindexes_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Subindexes"
    ADD CONSTRAINT "Subindexes_pkey" PRIMARY KEY (id);


--
-- Name: Tasks Tasks_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_pkey" PRIMARY KEY (id);


--
-- Name: Translations Translations_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_pkey" PRIMARY KEY ("essenceId", "entityId", field, "langId");


--
-- Name: UnitOfAnalysisClassType UnitOfAnalysisClassType_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisClassType"
    ADD CONSTRAINT "UnitOfAnalysisClassType_pkey" PRIMARY KEY (id);


--
-- Name: UnitOfAnalysisTagLink UnitOfAnalysisTagLink_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_pkey" PRIMARY KEY (id);


--
-- Name: UnitOfAnalysisTagLink UnitOfAnalysisTagLink_uoaId_uoaTagId_key; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_uoaId_uoaTagId_key" UNIQUE ("uoaId", "uoaTagId");


--
-- Name: UnitOfAnalysisTag UnitOfAnalysisTag_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_pkey" PRIMARY KEY (id);


--
-- Name: UnitOfAnalysisType UnitOfAnalysisType_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisType"
    ADD CONSTRAINT "UnitOfAnalysisType_pkey" PRIMARY KEY (id);


--
-- Name: UnitOfAnalysis UnitOfAnalysis_name_key; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_name_key" UNIQUE (name);


--
-- Name: UnitOfAnalysis UnitOfAnalysis_name_key1; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_name_key1" UNIQUE (name);


--
-- Name: UnitOfAnalysis UnitOfAnalysis_name_key2; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_name_key2" UNIQUE (name);


--
-- Name: UnitOfAnalysis UnitOfAnalysis_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_pkey" PRIMARY KEY (id);


--
-- Name: UserGroups UserGroups_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UserGroups"
    ADD CONSTRAINT "UserGroups_pkey" PRIMARY KEY ("userId", "groupId");


--
-- Name: UserRights UserRights_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UserRights"
    ADD CONSTRAINT "UserRights_pkey" PRIMARY KEY ("userID", "rightID");


--
-- Name: UserUOA UserUOA_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UserUOA"
    ADD CONSTRAINT "UserUOA_pkey" PRIMARY KEY ("UserId", "UOAid");


--
-- Name: Users Users_email_key; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- Name: Visualizations Visualizations_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Visualizations"
    ADD CONSTRAINT "Visualizations_pkey" PRIMARY KEY (id);


--
-- Name: WorkflowStepGroups WorkflowStepGroups_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "WorkflowStepGroups"
    ADD CONSTRAINT "WorkflowStepGroups_pkey" PRIMARY KEY ("stepId", "groupId");


--
-- Name: WorkflowSteps WorkflowSteps_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "WorkflowSteps"
    ADD CONSTRAINT "WorkflowSteps_pkey" PRIMARY KEY (id);


--
-- Name: Workflows Workflows_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Workflows"
    ADD CONSTRAINT "Workflows_pkey" PRIMARY KEY (id);


--
-- Name: Workflows Workflows_productId_key; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Workflows"
    ADD CONSTRAINT "Workflows_productId_key" UNIQUE ("productId");


SET search_path = test, pg_catalog;

--
-- Name: AccessMatrices AccessMatrices_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "AccessMatrices"
    ADD CONSTRAINT "AccessMatrices_pkey" PRIMARY KEY (id);


--
-- Name: AccessPermissions AccessPermissions_matrixId_roleId_rightId_key; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "AccessPermissions"
    ADD CONSTRAINT "AccessPermissions_matrixId_roleId_rightId_key" UNIQUE ("matrixId", "roleId", "rightId");


--
-- Name: AccessPermissions AccessPermissions_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "AccessPermissions"
    ADD CONSTRAINT "AccessPermissions_pkey" PRIMARY KEY (id);


--
-- Name: AnswerAttachments AnswerAttachments_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "AnswerAttachments"
    ADD CONSTRAINT "AnswerAttachments_pkey" PRIMARY KEY (id);


--
-- Name: AttachmentAttempts AttachmentAttempts_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "AttachmentAttempts"
    ADD CONSTRAINT "AttachmentAttempts_pkey" PRIMARY KEY (key);


--
-- Name: AttachmentLinks AttachmentLinks_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "AttachmentLinks"
    ADD CONSTRAINT "AttachmentLinks_pkey" PRIMARY KEY ("essenceId", "entityId");


--
-- Name: Attachments Attachments_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Attachments"
    ADD CONSTRAINT "Attachments_pkey" PRIMARY KEY (id);


--
-- Name: Discussions Discussions_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_pkey" PRIMARY KEY (id);


--
-- Name: Essences Essences_fileName_key; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_fileName_key" UNIQUE ("fileName");


--
-- Name: Essences Essences_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_pkey" PRIMARY KEY (id);


--
-- Name: Essences Essences_tableName_key; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_tableName_key" UNIQUE ("tableName");


--
-- Name: Groups Groups_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Groups"
    ADD CONSTRAINT "Groups_pkey" PRIMARY KEY (id);


--
-- Name: IndexQuestionWeights IndexQuestionWeights_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "IndexQuestionWeights"
    ADD CONSTRAINT "IndexQuestionWeights_pkey" PRIMARY KEY ("indexId", "questionId");


--
-- Name: IndexSubindexWeights IndexSubindexWeights_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "IndexSubindexWeights"
    ADD CONSTRAINT "IndexSubindexWeights_pkey" PRIMARY KEY ("indexId", "subindexId");


--
-- Name: Indexes Indexes_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Indexes"
    ADD CONSTRAINT "Indexes_pkey" PRIMARY KEY (id);


--
-- Name: Languages Languages_code_key; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Languages"
    ADD CONSTRAINT "Languages_code_key" UNIQUE (code);


--
-- Name: Languages Languages_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Languages"
    ADD CONSTRAINT "Languages_pkey" PRIMARY KEY (id);


--
-- Name: Logs Logs_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Logs"
    ADD CONSTRAINT "Logs_pkey" PRIMARY KEY (id);


--
-- Name: Notifications Notifications_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_pkey" PRIMARY KEY (id);


--
-- Name: Organizations Organizations_adminUserId_key; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_adminUserId_key" UNIQUE ("adminUserId");


--
-- Name: Organizations Organizations_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_pkey" PRIMARY KEY (id);


--
-- Name: ProductUOA ProductUOA_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_pkey" PRIMARY KEY ("productId", "UOAid");


--
-- Name: Products Products_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_pkey" PRIMARY KEY (id);


--
-- Name: Projects Projects_codeName_key; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_codeName_key" UNIQUE ("codeName");


--
-- Name: Projects Projects_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_pkey" PRIMARY KEY (id);


--
-- Name: Rights Rights_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Rights"
    ADD CONSTRAINT "Rights_pkey" PRIMARY KEY (id);


--
-- Name: RolesRights RolesRights_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "RolesRights_pkey" PRIMARY KEY ("roleID", "rightID");


--
-- Name: Roles Roles_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Roles"
    ADD CONSTRAINT "Roles_pkey" PRIMARY KEY (id);


--
-- Name: SubindexWeights SubindexWeights_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "SubindexWeights"
    ADD CONSTRAINT "SubindexWeights_pkey" PRIMARY KEY ("subindexId", "questionId");


--
-- Name: Subindexes Subindexes_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Subindexes"
    ADD CONSTRAINT "Subindexes_pkey" PRIMARY KEY (id);


--
-- Name: Tasks Tasks_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_pkey" PRIMARY KEY (id);


--
-- Name: Translations Translations_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_pkey" PRIMARY KEY ("essenceId", "entityId", field, "langId");


--
-- Name: UnitOfAnalysisClassType UnitOfAnalysisClassType_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisClassType"
    ADD CONSTRAINT "UnitOfAnalysisClassType_pkey" PRIMARY KEY (id);


--
-- Name: UnitOfAnalysisTagLink UnitOfAnalysisTagLink_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_pkey" PRIMARY KEY (id);


--
-- Name: UnitOfAnalysisTagLink UnitOfAnalysisTagLink_uoaId_uoaTagId_key; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_uoaId_uoaTagId_key" UNIQUE ("uoaId", "uoaTagId");


--
-- Name: UnitOfAnalysisTag UnitOfAnalysisTag_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_pkey" PRIMARY KEY (id);


--
-- Name: UnitOfAnalysisType UnitOfAnalysisType_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisType"
    ADD CONSTRAINT "UnitOfAnalysisType_pkey" PRIMARY KEY (id);


--
-- Name: UnitOfAnalysis UnitOfAnalysis_name_key; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_name_key" UNIQUE (name);


--
-- Name: UnitOfAnalysis UnitOfAnalysis_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_pkey" PRIMARY KEY (id);


--
-- Name: UserGroups UserGroups_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "UserGroups"
    ADD CONSTRAINT "UserGroups_pkey" PRIMARY KEY ("userId", "groupId");


--
-- Name: UserRights UserRights_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "UserRights"
    ADD CONSTRAINT "UserRights_pkey" PRIMARY KEY ("userID", "rightID");


--
-- Name: UserUOA UserUOA_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "UserUOA"
    ADD CONSTRAINT "UserUOA_pkey" PRIMARY KEY ("UserId", "UOAid");


--
-- Name: Users Users_email_key; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- Name: Visualizations Visualizations_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Visualizations"
    ADD CONSTRAINT "Visualizations_pkey" PRIMARY KEY (id);


--
-- Name: WorkflowStepGroups WorkflowStepGroups_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "WorkflowStepGroups"
    ADD CONSTRAINT "WorkflowStepGroups_pkey" PRIMARY KEY ("stepId", "groupId");


--
-- Name: WorkflowSteps WorkflowSteps_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "WorkflowSteps"
    ADD CONSTRAINT "WorkflowSteps_pkey" PRIMARY KEY (id);


--
-- Name: Workflows Workflows_pkey; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Workflows"
    ADD CONSTRAINT "Workflows_pkey" PRIMARY KEY (id);


--
-- Name: Workflows Workflows_productId_key; Type: CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Workflows"
    ADD CONSTRAINT "Workflows_productId_key" UNIQUE ("productId");


SET search_path = public, pg_catalog;

--
-- Name: Essences_upper_idx; Type: INDEX; Schema: public; Owner: indabauser
--

CREATE UNIQUE INDEX "Essences_upper_idx" ON "Essences" USING btree (upper((name)::text));


--
-- Name: Rights_action_idx; Type: INDEX; Schema: public; Owner: indabauser
--

CREATE UNIQUE INDEX "Rights_action_idx" ON "Rights" USING btree (action);


--
-- Name: Token_body_idx; Type: INDEX; Schema: public; Owner: indabauser
--

CREATE UNIQUE INDEX "Token_body_idx" ON "Token" USING btree (body);


--
-- Name: fki_roleID; Type: INDEX; Schema: public; Owner: indabauser
--

CREATE INDEX "fki_roleID" ON "Users" USING btree ("roleID");


--
-- Name: fki_rolesrights_rightID; Type: INDEX; Schema: public; Owner: indabauser
--

CREATE INDEX "fki_rolesrights_rightID" ON "RolesRights" USING btree ("rightID");


SET search_path = sceleton, pg_catalog;

--
-- Name: Essences_upper_idx; Type: INDEX; Schema: sceleton; Owner: indabauser
--

CREATE UNIQUE INDEX "Essences_upper_idx" ON "Essences" USING btree (upper((name)::text));


--
-- Name: Indexes_productId_idx; Type: INDEX; Schema: sceleton; Owner: indabauser
--

CREATE INDEX "Indexes_productId_idx" ON "Indexes" USING btree ("productId");


--
-- Name: Rights_action_idx; Type: INDEX; Schema: sceleton; Owner: indabauser
--

CREATE UNIQUE INDEX "Rights_action_idx" ON "Rights" USING btree (action);


--
-- Name: RolesRights_rightID_idx; Type: INDEX; Schema: sceleton; Owner: indabauser
--

CREATE INDEX "RolesRights_rightID_idx" ON "RolesRights" USING btree ("rightID");


--
-- Name: Subindexes_productId_idx; Type: INDEX; Schema: sceleton; Owner: indabauser
--

CREATE INDEX "Subindexes_productId_idx" ON "Subindexes" USING btree ("productId");


--
-- Name: UnitOfAnalysisTagLink_uoaId_idx; Type: INDEX; Schema: sceleton; Owner: indabauser
--

CREATE INDEX "UnitOfAnalysisTagLink_uoaId_idx" ON "UnitOfAnalysisTagLink" USING btree ("uoaId");


--
-- Name: UnitOfAnalysisTagLink_uoaTagId_idx; Type: INDEX; Schema: sceleton; Owner: indabauser
--

CREATE INDEX "UnitOfAnalysisTagLink_uoaTagId_idx" ON "UnitOfAnalysisTagLink" USING btree ("uoaTagId");


--
-- Name: Users_roleID_idx; Type: INDEX; Schema: sceleton; Owner: indabauser
--

CREATE INDEX "Users_roleID_idx" ON "Users" USING btree ("roleID");


SET search_path = test, pg_catalog;

--
-- Name: Essences_upper_idx; Type: INDEX; Schema: test; Owner: indabauser
--

CREATE UNIQUE INDEX "Essences_upper_idx" ON "Essences" USING btree (upper((name)::text));


--
-- Name: Indexes_productId_idx; Type: INDEX; Schema: test; Owner: indabauser
--

CREATE INDEX "Indexes_productId_idx" ON "Indexes" USING btree ("productId");


--
-- Name: Rights_action_idx; Type: INDEX; Schema: test; Owner: indabauser
--

CREATE UNIQUE INDEX "Rights_action_idx" ON "Rights" USING btree (action);


--
-- Name: RolesRights_rightID_idx; Type: INDEX; Schema: test; Owner: indabauser
--

CREATE INDEX "RolesRights_rightID_idx" ON "RolesRights" USING btree ("rightID");


--
-- Name: Subindexes_productId_idx; Type: INDEX; Schema: test; Owner: indabauser
--

CREATE INDEX "Subindexes_productId_idx" ON "Subindexes" USING btree ("productId");


--
-- Name: UnitOfAnalysisTagLink_uoaId_idx; Type: INDEX; Schema: test; Owner: indabauser
--

CREATE INDEX "UnitOfAnalysisTagLink_uoaId_idx" ON "UnitOfAnalysisTagLink" USING btree ("uoaId");


--
-- Name: UnitOfAnalysisTagLink_uoaTagId_idx; Type: INDEX; Schema: test; Owner: indabauser
--

CREATE INDEX "UnitOfAnalysisTagLink_uoaTagId_idx" ON "UnitOfAnalysisTagLink" USING btree ("uoaTagId");


--
-- Name: Users_roleID_idx; Type: INDEX; Schema: test; Owner: indabauser
--

CREATE INDEX "Users_roleID_idx" ON "Users" USING btree ("roleID");


SET search_path = public, pg_catalog;

--
-- Name: Token tr_delete_token; Type: TRIGGER; Schema: public; Owner: indabauser
--

CREATE TRIGGER tr_delete_token BEFORE INSERT ON "Token" FOR EACH ROW EXECUTE PROCEDURE twc_delete_old_token();


--
-- Name: Users users_before_update; Type: TRIGGER; Schema: public; Owner: indabauser
--

CREATE TRIGGER users_before_update BEFORE UPDATE ON "Users" FOR EACH ROW EXECUTE PROCEDURE users_before_update();


--
-- Name: Logs Logs_essence_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Logs"
    ADD CONSTRAINT "Logs_essence_fkey" FOREIGN KEY (essence) REFERENCES "Essences"(id) ON DELETE SET NULL;


--
-- Name: Logs Logs_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Logs"
    ADD CONSTRAINT "Logs_user_fkey" FOREIGN KEY (userid) REFERENCES "Users"(id) ON DELETE SET NULL;


--
-- Name: Notifications Notifications_essenceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_essenceId_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id) ON DELETE SET NULL;


--
-- Name: Notifications Notifications_userFrom_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_userFrom_fkey" FOREIGN KEY ("userFrom") REFERENCES "Users"(id) ON DELETE CASCADE;


--
-- Name: Notifications Notifications_userTo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_userTo_fkey" FOREIGN KEY ("userTo") REFERENCES "Users"(id) ON DELETE CASCADE;


--
-- Name: Rights Rights_essence_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Rights"
    ADD CONSTRAINT "Rights_essence_id_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- Name: RolesRights RolesRights_roleID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "RolesRights_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "Roles"(id);


--
-- Name: Users Users_langId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Users Users_roleID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "Roles"(id);


--
-- Name: RolesRights rolesrights_rightID; Type: FK CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "rolesrights_rightID" FOREIGN KEY ("rightID") REFERENCES "Rights"(id);


SET search_path = sceleton, pg_catalog;

--
-- Name: AnswerAttachments AnswerAttachments_owner_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "AnswerAttachments"
    ADD CONSTRAINT "AnswerAttachments_owner_fkey" FOREIGN KEY (owner) REFERENCES "Users"(id);


--
-- Name: AttachmentLinks AttachmentLinks_essenceId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "AttachmentLinks"
    ADD CONSTRAINT "AttachmentLinks_essenceId_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- Name: Discussions Discussions_returnTaskId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_returnTaskId_fkey" FOREIGN KEY ("returnTaskId") REFERENCES "Tasks"(id);


--
-- Name: Discussions Discussions_stepFromId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_stepFromId_fkey" FOREIGN KEY ("stepFromId") REFERENCES "WorkflowSteps"(id);


--
-- Name: Discussions Discussions_stepId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowSteps"(id);


--
-- Name: Discussions Discussions_taskId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Tasks"(id);


--
-- Name: Discussions Discussions_userFromId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_userFromId_fkey" FOREIGN KEY ("userFromId") REFERENCES "Users"(id);


--
-- Name: Groups Groups_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Groups"
    ADD CONSTRAINT "Groups_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Groups Groups_organizationId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Groups"
    ADD CONSTRAINT "Groups_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- Name: IndexQuestionWeights IndexQuestionWeights_indexId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "IndexQuestionWeights"
    ADD CONSTRAINT "IndexQuestionWeights_indexId_fkey" FOREIGN KEY ("indexId") REFERENCES "Indexes"(id);


--
-- Name: IndexSubindexWeights IndexSubindexWeights_indexId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "IndexSubindexWeights"
    ADD CONSTRAINT "IndexSubindexWeights_indexId_fkey" FOREIGN KEY ("indexId") REFERENCES "Indexes"(id);


--
-- Name: IndexSubindexWeights IndexSubindexWeights_subindexId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "IndexSubindexWeights"
    ADD CONSTRAINT "IndexSubindexWeights_subindexId_fkey" FOREIGN KEY ("subindexId") REFERENCES "Subindexes"(id);


--
-- Name: Indexes Indexes_productId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Indexes"
    ADD CONSTRAINT "Indexes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: Logs Logs_essence_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Logs"
    ADD CONSTRAINT "Logs_essence_fkey" FOREIGN KEY (essence) REFERENCES "Essences"(id) ON DELETE SET NULL;


--
-- Name: Logs Logs_user_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Logs"
    ADD CONSTRAINT "Logs_user_fkey" FOREIGN KEY ("user") REFERENCES "Users"(id) ON DELETE SET NULL;


--
-- Name: Notifications Notifications_essenceId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_essenceId_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id) ON DELETE SET NULL;


--
-- Name: Notifications Notifications_userFrom_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_userFrom_fkey" FOREIGN KEY ("userFrom") REFERENCES "Users"(id) ON DELETE CASCADE;


--
-- Name: Notifications Notifications_userTo_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_userTo_fkey" FOREIGN KEY ("userTo") REFERENCES "Users"(id) ON DELETE CASCADE;


--
-- Name: Organizations Organizations_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: ProductUOA ProductUOA_UOAid_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_UOAid_fkey" FOREIGN KEY ("UOAid") REFERENCES "UnitOfAnalysis"(id);


--
-- Name: ProductUOA ProductUOA_currentStepId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_currentStepId_fkey" FOREIGN KEY ("currentStepId") REFERENCES "WorkflowSteps"(id);


--
-- Name: ProductUOA ProductUOA_productId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: Products Products_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Products Products_originalLangId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_originalLangId_fkey" FOREIGN KEY ("originalLangId") REFERENCES "Languages"(id);


--
-- Name: Products Products_projectId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Projects"(id);


--
-- Name: Projects Projects_accessMatrixId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_accessMatrixId_fkey" FOREIGN KEY ("matrixId") REFERENCES "AccessMatrices"(id);


--
-- Name: Projects Projects_adminUserId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "Users"(id);


--
-- Name: Projects Projects_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Projects Projects_organizationId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- Name: Rights Rights_essence_id_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Rights"
    ADD CONSTRAINT "Rights_essence_id_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- Name: RolesRights RolesRights_roleID_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "RolesRights_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "Roles"(id);


--
-- Name: SubindexWeights SubindexWeights_subindexId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "SubindexWeights"
    ADD CONSTRAINT "SubindexWeights_subindexId_fkey" FOREIGN KEY ("subindexId") REFERENCES "Subindexes"(id);


--
-- Name: Subindexes Subindexes_productId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Subindexes"
    ADD CONSTRAINT "Subindexes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: Tasks Tasks_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Tasks Tasks_productId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: Tasks Tasks_stepId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowSteps"(id);


--
-- Name: Tasks Tasks_uoaId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_uoaId_fkey" FOREIGN KEY ("uoaId") REFERENCES "UnitOfAnalysis"(id);


--
-- Name: Tasks Tasks_userId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"(id);


--
-- Name: Translations Translations_essence_id_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_essence_id_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- Name: Translations Translations_lang_id_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_lang_id_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysisClassType UnitOfAnalysisClassType_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisClassType"
    ADD CONSTRAINT "UnitOfAnalysisClassType_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysisTagLink UnitOfAnalysisTagLink_uoaId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_uoaId_fkey" FOREIGN KEY ("uoaId") REFERENCES "UnitOfAnalysis"(id);


--
-- Name: UnitOfAnalysisTagLink UnitOfAnalysisTagLink_uoaTagId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_uoaTagId_fkey" FOREIGN KEY ("uoaTagId") REFERENCES "UnitOfAnalysisTag"(id);


--
-- Name: UnitOfAnalysisTag UnitOfAnalysisTag_classTypeId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_classTypeId_fkey" FOREIGN KEY ("classTypeId") REFERENCES "UnitOfAnalysisClassType"(id);


--
-- Name: UnitOfAnalysisTag UnitOfAnalysisTag_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysisType UnitOfAnalysisType_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisType"
    ADD CONSTRAINT "UnitOfAnalysisType_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysis UnitOfAnalysis_creatorId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Users"(id);


--
-- Name: UnitOfAnalysis UnitOfAnalysis_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysis UnitOfAnalysis_ownerId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Users"(id);


--
-- Name: UnitOfAnalysis UnitOfAnalysis_unitOfAnalysisType_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_unitOfAnalysisType_fkey" FOREIGN KEY ("unitOfAnalysisType") REFERENCES "UnitOfAnalysisType"(id);


--
-- Name: UserGroups UserGroups_groupId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UserGroups"
    ADD CONSTRAINT "UserGroups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Groups"(id);


--
-- Name: UserGroups UserGroups_userId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UserGroups"
    ADD CONSTRAINT "UserGroups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"(id);


--
-- Name: UserUOA UserUOA_UOAid_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UserUOA"
    ADD CONSTRAINT "UserUOA_UOAid_fkey" FOREIGN KEY ("UOAid") REFERENCES "UnitOfAnalysis"(id);


--
-- Name: UserUOA UserUOA_UserId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UserUOA"
    ADD CONSTRAINT "UserUOA_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"(id);


--
-- Name: Users Users_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Users Users_organizationId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- Name: Users Users_roleID_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "Roles"(id);


--
-- Name: Visualizations Visualizations_organizationId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Visualizations"
    ADD CONSTRAINT "Visualizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- Name: Visualizations Visualizations_productId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Visualizations"
    ADD CONSTRAINT "Visualizations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: WorkflowStepGroups WorkflowStepGroups_groupId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "WorkflowStepGroups"
    ADD CONSTRAINT "WorkflowStepGroups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Groups"(id);


--
-- Name: WorkflowStepGroups WorkflowStepGroups_stepId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "WorkflowStepGroups"
    ADD CONSTRAINT "WorkflowStepGroups_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowSteps"(id);


--
-- Name: WorkflowSteps WorkflowSteps_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "WorkflowSteps"
    ADD CONSTRAINT "WorkflowSteps_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Workflows Workflows_productId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Workflows"
    ADD CONSTRAINT "Workflows_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: RolesRights rolesrights_rightID; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "rolesrights_rightID" FOREIGN KEY ("rightID") REFERENCES "Rights"(id);


SET search_path = test, pg_catalog;

--
-- Name: AnswerAttachments AnswerAttachments_owner_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "AnswerAttachments"
    ADD CONSTRAINT "AnswerAttachments_owner_fkey" FOREIGN KEY (owner) REFERENCES "Users"(id);


--
-- Name: AttachmentLinks AttachmentLinks_essenceId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "AttachmentLinks"
    ADD CONSTRAINT "AttachmentLinks_essenceId_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- Name: Discussions Discussions_returnTaskId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_returnTaskId_fkey" FOREIGN KEY ("returnTaskId") REFERENCES "Tasks"(id);


--
-- Name: Discussions Discussions_stepFromId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_stepFromId_fkey" FOREIGN KEY ("stepFromId") REFERENCES "WorkflowSteps"(id);


--
-- Name: Discussions Discussions_stepId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowSteps"(id);


--
-- Name: Discussions Discussions_taskId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Tasks"(id);


--
-- Name: Discussions Discussions_userFromId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_userFromId_fkey" FOREIGN KEY ("userFromId") REFERENCES "Users"(id);


--
-- Name: Groups Groups_langId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Groups"
    ADD CONSTRAINT "Groups_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Groups Groups_organizationId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Groups"
    ADD CONSTRAINT "Groups_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- Name: IndexQuestionWeights IndexQuestionWeights_indexId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "IndexQuestionWeights"
    ADD CONSTRAINT "IndexQuestionWeights_indexId_fkey" FOREIGN KEY ("indexId") REFERENCES "Indexes"(id);


--
-- Name: IndexSubindexWeights IndexSubindexWeights_indexId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "IndexSubindexWeights"
    ADD CONSTRAINT "IndexSubindexWeights_indexId_fkey" FOREIGN KEY ("indexId") REFERENCES "Indexes"(id);


--
-- Name: IndexSubindexWeights IndexSubindexWeights_subindexId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "IndexSubindexWeights"
    ADD CONSTRAINT "IndexSubindexWeights_subindexId_fkey" FOREIGN KEY ("subindexId") REFERENCES "Subindexes"(id);


--
-- Name: Indexes Indexes_productId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Indexes"
    ADD CONSTRAINT "Indexes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: Logs Logs_essence_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Logs"
    ADD CONSTRAINT "Logs_essence_fkey" FOREIGN KEY (essence) REFERENCES "Essences"(id) ON DELETE SET NULL;


--
-- Name: Logs Logs_user_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Logs"
    ADD CONSTRAINT "Logs_user_fkey" FOREIGN KEY ("user") REFERENCES "Users"(id) ON DELETE SET NULL;


--
-- Name: Notifications Notifications_essenceId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_essenceId_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id) ON DELETE SET NULL;


--
-- Name: Notifications Notifications_userFrom_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_userFrom_fkey" FOREIGN KEY ("userFrom") REFERENCES "Users"(id) ON DELETE CASCADE;


--
-- Name: Notifications Notifications_userTo_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_userTo_fkey" FOREIGN KEY ("userTo") REFERENCES "Users"(id) ON DELETE CASCADE;


--
-- Name: Organizations Organizations_langId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: ProductUOA ProductUOA_UOAid_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_UOAid_fkey" FOREIGN KEY ("UOAid") REFERENCES "UnitOfAnalysis"(id);


--
-- Name: ProductUOA ProductUOA_currentStepId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_currentStepId_fkey" FOREIGN KEY ("currentStepId") REFERENCES "WorkflowSteps"(id);


--
-- Name: ProductUOA ProductUOA_productId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: Products Products_langId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Products Products_originalLangId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_originalLangId_fkey" FOREIGN KEY ("originalLangId") REFERENCES "Languages"(id);


--
-- Name: Products Products_projectId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Projects"(id);


--
-- Name: ProjectUserGroups ProjectUserGroups_projectId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "ProjectUserGroups"
    ADD CONSTRAINT "ProjectUserGroups_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Projects"(id);


--
-- Name: ProjectUsers ProjectUsers_projectId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "ProjectUsers"
    ADD CONSTRAINT "ProjectUsers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Projects"(id);


--
-- Name: Projects Projects_accessMatrixId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_accessMatrixId_fkey" FOREIGN KEY ("matrixId") REFERENCES "AccessMatrices"(id);


--
-- Name: Projects Projects_adminUserId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "Users"(id);


--
-- Name: Projects Projects_langId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Projects Projects_organizationId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- Name: Rights Rights_essence_id_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Rights"
    ADD CONSTRAINT "Rights_essence_id_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- Name: RolesRights RolesRights_roleID_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "RolesRights_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "Roles"(id);


--
-- Name: SubindexWeights SubindexWeights_subindexId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "SubindexWeights"
    ADD CONSTRAINT "SubindexWeights_subindexId_fkey" FOREIGN KEY ("subindexId") REFERENCES "Subindexes"(id);


--
-- Name: Subindexes Subindexes_productId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Subindexes"
    ADD CONSTRAINT "Subindexes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: Tasks Tasks_langId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Tasks Tasks_productId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: Tasks Tasks_stepId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowSteps"(id);


--
-- Name: Tasks Tasks_uoaId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_uoaId_fkey" FOREIGN KEY ("uoaId") REFERENCES "UnitOfAnalysis"(id);


--
-- Name: Translations Translations_essence_id_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_essence_id_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- Name: Translations Translations_lang_id_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_lang_id_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysisClassType UnitOfAnalysisClassType_langId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisClassType"
    ADD CONSTRAINT "UnitOfAnalysisClassType_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysisTagLink UnitOfAnalysisTagLink_uoaId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_uoaId_fkey" FOREIGN KEY ("uoaId") REFERENCES "UnitOfAnalysis"(id);


--
-- Name: UnitOfAnalysisTagLink UnitOfAnalysisTagLink_uoaTagId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_uoaTagId_fkey" FOREIGN KEY ("uoaTagId") REFERENCES "UnitOfAnalysisTag"(id);


--
-- Name: UnitOfAnalysisTag UnitOfAnalysisTag_classTypeId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_classTypeId_fkey" FOREIGN KEY ("classTypeId") REFERENCES "UnitOfAnalysisClassType"(id);


--
-- Name: UnitOfAnalysisTag UnitOfAnalysisTag_langId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysisType UnitOfAnalysisType_langId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisType"
    ADD CONSTRAINT "UnitOfAnalysisType_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysis UnitOfAnalysis_creatorId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Users"(id);


--
-- Name: UnitOfAnalysis UnitOfAnalysis_langId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysis UnitOfAnalysis_ownerId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Users"(id);


--
-- Name: UnitOfAnalysis UnitOfAnalysis_unitOfAnalysisType_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_unitOfAnalysisType_fkey" FOREIGN KEY ("unitOfAnalysisType") REFERENCES "UnitOfAnalysisType"(id);


--
-- Name: UserGroups UserGroups_groupId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "UserGroups"
    ADD CONSTRAINT "UserGroups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Groups"(id);


--
-- Name: UserGroups UserGroups_userId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "UserGroups"
    ADD CONSTRAINT "UserGroups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"(id);


--
-- Name: UserUOA UserUOA_UOAid_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "UserUOA"
    ADD CONSTRAINT "UserUOA_UOAid_fkey" FOREIGN KEY ("UOAid") REFERENCES "UnitOfAnalysis"(id);


--
-- Name: UserUOA UserUOA_UserId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "UserUOA"
    ADD CONSTRAINT "UserUOA_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"(id);


--
-- Name: Users Users_langId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Users Users_organizationId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- Name: Users Users_roleID_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "Roles"(id);


--
-- Name: Visualizations Visualizations_organizationId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Visualizations"
    ADD CONSTRAINT "Visualizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- Name: Visualizations Visualizations_productId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Visualizations"
    ADD CONSTRAINT "Visualizations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: WorkflowStepGroups WorkflowStepGroups_groupId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "WorkflowStepGroups"
    ADD CONSTRAINT "WorkflowStepGroups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Groups"(id);


--
-- Name: WorkflowStepGroups WorkflowStepGroups_stepId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "WorkflowStepGroups"
    ADD CONSTRAINT "WorkflowStepGroups_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowSteps"(id);


--
-- Name: WorkflowSteps WorkflowSteps_langId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "WorkflowSteps"
    ADD CONSTRAINT "WorkflowSteps_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Workflows Workflows_productId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "Workflows"
    ADD CONSTRAINT "Workflows_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: RolesRights rolesrights_rightID; Type: FK CONSTRAINT; Schema: test; Owner: indabauser
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "rolesrights_rightID" FOREIGN KEY ("rightID") REFERENCES "Rights"(id);


--
-- Name: public; Type: ACL; Schema: -; Owner: postgres
--

GRANT ALL ON SCHEMA public TO indabauser;


--
-- PostgreSQL database dump complete
--

