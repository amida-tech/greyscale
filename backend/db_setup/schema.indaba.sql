--
-- PostgreSQL database dump
--

-- Dumped from database version 9.4.5
-- Dumped by pg_dump version 9.5.1

-- Started on 2017-04-11 13:34:39 EDT

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

--
-- TOC entry 7 (class 2615 OID 1599530)
-- Name: sceleton; Type: SCHEMA; Schema: -; Owner: indabauser
--

CREATE SCHEMA sceleton;


ALTER SCHEMA sceleton OWNER TO indabauser;

--
-- TOC entry 10 (class 2615 OID 1601601)
-- Name: test; Type: SCHEMA; Schema: -; Owner: indaba
--

CREATE SCHEMA test;


ALTER SCHEMA test OWNER TO indabauser;

SET search_path = public, pg_catalog;

--
-- TOC entry 833 (class 1247 OID 1599533)
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
-- TOC entry 836 (class 1247 OID 1599548)
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
-- TOC entry 839 (class 1247 OID 1599560)
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
-- TOC entry 842 (class 1247 OID 1599576)
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
-- TOC entry 458 (class 1255 OID 1599589)
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
-- TOC entry 459 (class 1255 OID 1599592)
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
-- TOC entry 460 (class 1255 OID 1599593)
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
-- TOC entry 461 (class 1255 OID 1599594)
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
-- TOC entry 462 (class 1255 OID 1599595)
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
-- TOC entry 463 (class 1255 OID 1599596)
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
-- TOC entry 464 (class 1255 OID 1599597)
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
-- TOC entry 465 (class 1255 OID 1599598)
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
-- TOC entry 466 (class 1255 OID 1599599)
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
-- TOC entry 467 (class 1255 OID 1599600)
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
-- TOC entry 477 (class 1255 OID 1599603)
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
-- TOC entry 478 (class 1255 OID 1599604)
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
-- TOC entry 479 (class 1255 OID 1599605)
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
-- TOC entry 480 (class 1255 OID 1599606)
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
-- TOC entry 481 (class 1255 OID 1599607)
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
-- TOC entry 482 (class 1255 OID 1599608)
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
-- TOC entry 483 (class 1255 OID 1599609)
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
-- TOC entry 484 (class 1255 OID 1599610)
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
-- TOC entry 468 (class 1255 OID 1602526)
-- Name: clone_schema(text, text, boolean); Type: FUNCTION; Schema: test; Owner: indaba
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
-- TOC entry 469 (class 1255 OID 1602528)
-- Name: fix_schema_references(text); Type: FUNCTION; Schema: test; Owner: indaba
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
-- TOC entry 470 (class 1255 OID 1602529)
-- Name: order_before_update(); Type: FUNCTION; Schema: test; Owner: indaba
--

CREATE FUNCTION order_before_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   NEW."updated" = now();

   RETURN NEW;
END$$;


ALTER FUNCTION test.order_before_update() OWNER TO indabauser;

--
-- TOC entry 471 (class 1255 OID 1602530)
-- Name: tours_before_insert(); Type: FUNCTION; Schema: test; Owner: indaba
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
-- TOC entry 472 (class 1255 OID 1602531)
-- Name: tours_before_update(); Type: FUNCTION; Schema: test; Owner: indaba
--

CREATE FUNCTION tours_before_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   NEW."updated" = now();

   RETURN NEW;
END;$$;


ALTER FUNCTION test.tours_before_update() OWNER TO indabauser;

--
-- TOC entry 473 (class 1255 OID 1602532)
-- Name: twc_delete_old_token(); Type: FUNCTION; Schema: test; Owner: indaba
--

CREATE FUNCTION twc_delete_old_token() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   DELETE FROM "Token" WHERE "userID" = NEW."userID";
   RETURN NEW;
END;$$;


ALTER FUNCTION test.twc_delete_old_token() OWNER TO indabauser;

--
-- TOC entry 474 (class 1255 OID 1602533)
-- Name: twc_get_token(character varying, character varying); Type: FUNCTION; Schema: test; Owner: indaba
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
-- TOC entry 475 (class 1255 OID 1602534)
-- Name: user_company_check(); Type: FUNCTION; Schema: test; Owner: indaba
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
-- TOC entry 476 (class 1255 OID 1602535)
-- Name: users_before_update(); Type: FUNCTION; Schema: test; Owner: indaba
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
-- TOC entry 176 (class 1259 OID 1599622)
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
-- TOC entry 3778 (class 0 OID 0)
-- Dependencies: 176
-- Name: COLUMN "Essences".name; Type: COMMENT; Schema: public; Owner: indabauser
--

COMMENT ON COLUMN "Essences".name IS 'Human readable name of essence';


--
-- TOC entry 3779 (class 0 OID 0)
-- Dependencies: 176
-- Name: COLUMN "Essences"."fileName"; Type: COMMENT; Schema: public; Owner: indabauser
--

COMMENT ON COLUMN "Essences"."fileName" IS 'File name in models path';


--
-- TOC entry 177 (class 1259 OID 1599628)
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
-- TOC entry 3780 (class 0 OID 0)
-- Dependencies: 177
-- Name: Entities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: indabauser
--

ALTER SEQUENCE "Entities_id_seq" OWNED BY "Essences".id;


--
-- TOC entry 178 (class 1259 OID 1599630)
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
-- TOC entry 179 (class 1259 OID 1599632)
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
-- TOC entry 180 (class 1259 OID 1599635)
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
-- TOC entry 3781 (class 0 OID 0)
-- Dependencies: 180
-- Name: Languages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: indabauser
--

ALTER SEQUENCE "Languages_id_seq" OWNED BY "Languages".id;


--
-- TOC entry 181 (class 1259 OID 1599637)
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
-- TOC entry 182 (class 1259 OID 1599646)
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
-- TOC entry 3782 (class 0 OID 0)
-- Dependencies: 182
-- Name: Logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: indabauser
--

ALTER SEQUENCE "Logs_id_seq" OWNED BY "Logs".id;


--
-- TOC entry 183 (class 1259 OID 1599648)
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
-- TOC entry 184 (class 1259 OID 1599650)
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
-- TOC entry 3783 (class 0 OID 0)
-- Dependencies: 184
-- Name: COLUMN "Notifications"."notifyLevel"; Type: COMMENT; Schema: public; Owner: indabauser
--

COMMENT ON COLUMN "Notifications"."notifyLevel" IS '0 - none, 1 - alert only, 2 - all notifications';


--
-- TOC entry 185 (class 1259 OID 1599660)
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
-- TOC entry 186 (class 1259 OID 1599666)
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
-- TOC entry 3784 (class 0 OID 0)
-- Dependencies: 186
-- Name: Rights_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: indabauser
--

ALTER SEQUENCE "Rights_id_seq" OWNED BY "Rights".id;


--
-- TOC entry 187 (class 1259 OID 1599668)
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
-- TOC entry 188 (class 1259 OID 1599670)
-- Name: Roles; Type: TABLE; Schema: public; Owner: indabauser
--

CREATE TABLE "Roles" (
    id integer DEFAULT nextval('role_id_seq'::regclass) NOT NULL,
    name character varying(20) NOT NULL,
    "isSystem" boolean DEFAULT false NOT NULL
);


ALTER TABLE "Roles" OWNER TO indabauser;

--
-- TOC entry 189 (class 1259 OID 1599675)
-- Name: RolesRights; Type: TABLE; Schema: public; Owner: indabauser
--

CREATE TABLE "RolesRights" (
    "roleID" bigint NOT NULL,
    "rightID" bigint NOT NULL
);


ALTER TABLE "RolesRights" OWNER TO indabauser;

--
-- TOC entry 190 (class 1259 OID 1599678)
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
-- TOC entry 191 (class 1259 OID 1599680)
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
-- TOC entry 192 (class 1259 OID 1599684)
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
-- TOC entry 193 (class 1259 OID 1599686)
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
-- TOC entry 194 (class 1259 OID 1599688)
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
-- TOC entry 195 (class 1259 OID 1599690)
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
-- TOC entry 196 (class 1259 OID 1599692)
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
-- TOC entry 197 (class 1259 OID 1599694)
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
    salt character varying
);


ALTER TABLE "Users" OWNER TO indabauser;

--
-- TOC entry 198 (class 1259 OID 1599703)
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
-- TOC entry 199 (class 1259 OID 1599705)
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
-- TOC entry 200 (class 1259 OID 1599707)
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
-- TOC entry 201 (class 1259 OID 1599709)
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
-- TOC entry 202 (class 1259 OID 1599711)
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
-- TOC entry 203 (class 1259 OID 1599713)
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
-- TOC entry 204 (class 1259 OID 1599715)
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
-- TOC entry 205 (class 1259 OID 1599722)
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
-- TOC entry 206 (class 1259 OID 1599724)
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
-- TOC entry 207 (class 1259 OID 1599728)
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
-- TOC entry 208 (class 1259 OID 1599730)
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
-- TOC entry 209 (class 1259 OID 1599738)
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
-- TOC entry 210 (class 1259 OID 1599745)
-- Name: AttachmentLinks; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "AttachmentLinks" (
    "essenceId" integer NOT NULL,
    "entityId" integer NOT NULL,
    attachments integer[]
);


ALTER TABLE "AttachmentLinks" OWNER TO indabauser;

--
-- TOC entry 211 (class 1259 OID 1599751)
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
-- TOC entry 212 (class 1259 OID 1599757)
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
-- TOC entry 3785 (class 0 OID 0)
-- Dependencies: 212
-- Name: Attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: sceleton; Owner: indabauser
--

ALTER SEQUENCE "Attachments_id_seq" OWNED BY "Attachments".id;


--
-- TOC entry 213 (class 1259 OID 1599759)
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
-- TOC entry 214 (class 1259 OID 1599761)
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
-- TOC entry 215 (class 1259 OID 1599773)
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
-- TOC entry 216 (class 1259 OID 1599775)
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
-- TOC entry 217 (class 1259 OID 1599777)
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
-- TOC entry 3786 (class 0 OID 0)
-- Dependencies: 217
-- Name: COLUMN "Essences".name; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "Essences".name IS 'Human readable name of essence';


--
-- TOC entry 3787 (class 0 OID 0)
-- Dependencies: 217
-- Name: COLUMN "Essences"."fileName"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "Essences"."fileName" IS 'File name in models path';


--
-- TOC entry 218 (class 1259 OID 1599784)
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
-- TOC entry 219 (class 1259 OID 1599786)
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
-- TOC entry 220 (class 1259 OID 1599793)
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
-- TOC entry 221 (class 1259 OID 1599799)
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
-- TOC entry 222 (class 1259 OID 1599805)
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
-- TOC entry 223 (class 1259 OID 1599807)
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
-- TOC entry 224 (class 1259 OID 1599815)
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
-- TOC entry 225 (class 1259 OID 1599817)
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
-- TOC entry 226 (class 1259 OID 1599819)
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
-- TOC entry 227 (class 1259 OID 1599823)
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
-- TOC entry 228 (class 1259 OID 1599825)
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
-- TOC entry 229 (class 1259 OID 1599835)
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
-- TOC entry 230 (class 1259 OID 1599837)
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
-- TOC entry 3788 (class 0 OID 0)
-- Dependencies: 230
-- Name: COLUMN "Notifications"."notifyLevel"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "Notifications"."notifyLevel" IS '0 - none, 1 - alert only, 2 - all notifications';


--
-- TOC entry 231 (class 1259 OID 1599847)
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
-- TOC entry 232 (class 1259 OID 1599849)
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
-- TOC entry 233 (class 1259 OID 1599857)
-- Name: ProductUOA; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "ProductUOA" (
    "productId" integer NOT NULL,
    "UOAid" integer NOT NULL,
    "currentStepId" integer,
    "isComplete" boolean DEFAULT false NOT NULL
);


ALTER TABLE "ProductUOA" OWNER TO indabauser;

--
-- TOC entry 234 (class 1259 OID 1599861)
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
-- TOC entry 235 (class 1259 OID 1599863)
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
-- TOC entry 236 (class 1259 OID 1599871)
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
-- TOC entry 237 (class 1259 OID 1599873)
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
    "langId" integer
);


ALTER TABLE "Projects" OWNER TO indabauser;

--
-- TOC entry 238 (class 1259 OID 1599882)
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
-- TOC entry 239 (class 1259 OID 1599884)
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
-- TOC entry 240 (class 1259 OID 1599891)
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
-- TOC entry 241 (class 1259 OID 1599893)
-- Name: Roles; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "Roles" (
    id integer DEFAULT nextval('role_id_seq'::regclass) NOT NULL,
    name character varying(20) NOT NULL,
    "isSystem" boolean DEFAULT false NOT NULL
);


ALTER TABLE "Roles" OWNER TO indabauser;

--
-- TOC entry 242 (class 1259 OID 1599898)
-- Name: RolesRights; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "RolesRights" (
    "roleID" bigint NOT NULL,
    "rightID" bigint NOT NULL
);


ALTER TABLE "RolesRights" OWNER TO indabauser;

--
-- TOC entry 243 (class 1259 OID 1599901)
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
-- TOC entry 244 (class 1259 OID 1599907)
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
-- TOC entry 245 (class 1259 OID 1599909)
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
-- TOC entry 246 (class 1259 OID 1599917)
-- Name: SurveyAnswerVersions_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE "SurveyAnswerVersions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "SurveyAnswerVersions_id_seq" OWNER TO indabauser;

--
-- TOC entry 247 (class 1259 OID 1599919)
-- Name: SurveyAnswers_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE "SurveyAnswers_id_seq"
    START WITH 1375
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "SurveyAnswers_id_seq" OWNER TO indabauser;

--
-- TOC entry 248 (class 1259 OID 1599921)
-- Name: SurveyAnswers; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "SurveyAnswers" (
    id integer DEFAULT nextval('"SurveyAnswers_id_seq"'::regclass) NOT NULL,
    "questionId" integer,
    "userId" integer,
    value text,
    created timestamp with time zone DEFAULT now() NOT NULL,
    "productId" integer,
    "UOAid" integer,
    "wfStepId" integer,
    version integer,
    "surveyId" integer,
    "optionId" integer[],
    "langId" integer,
    "isResponse" boolean DEFAULT false NOT NULL,
    "isAgree" boolean,
    comments character varying,
    attachments integer[],
    links character varying[],
    updated timestamp with time zone
);


ALTER TABLE "SurveyAnswers" OWNER TO indabauser;

--
-- TOC entry 249 (class 1259 OID 1599930)
-- Name: surveyQuestionOptions_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE "surveyQuestionOptions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "surveyQuestionOptions_id_seq" OWNER TO indabauser;

--
-- TOC entry 250 (class 1259 OID 1599932)
-- Name: SurveyQuestionOptions; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "SurveyQuestionOptions" (
    id integer DEFAULT nextval('"surveyQuestionOptions_id_seq"'::regclass) NOT NULL,
    "questionId" integer,
    value character varying,
    label character varying,
    skip smallint,
    "isSelected" boolean DEFAULT false NOT NULL,
    "langId" integer
);


ALTER TABLE "SurveyQuestionOptions" OWNER TO indabauser;

--
-- TOC entry 251 (class 1259 OID 1599940)
-- Name: SurveyQuestions_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indabauser
--

CREATE SEQUENCE "SurveyQuestions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "SurveyQuestions_id_seq" OWNER TO indabauser;

--
-- TOC entry 252 (class 1259 OID 1599942)
-- Name: SurveyQuestions; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "SurveyQuestions" (
    id integer DEFAULT nextval('"SurveyQuestions_id_seq"'::regclass) NOT NULL,
    "surveyId" integer,
    type smallint,
    label character varying,
    "isRequired" boolean DEFAULT false NOT NULL,
    "position" integer,
    description text,
    skip smallint,
    size smallint,
    "minLength" smallint,
    "maxLength" smallint,
    "isWordmml" boolean DEFAULT false NOT NULL,
    "incOtherOpt" boolean DEFAULT false NOT NULL,
    units character varying,
    "intOnly" boolean DEFAULT false NOT NULL,
    value character varying,
    qid character varying,
    links text,
    attachment boolean,
    "optionNumbering" character varying,
    "langId" integer,
    "withLinks" boolean DEFAULT false,
    "hasComments" boolean
);


ALTER TABLE "SurveyQuestions" OWNER TO indabauser;

--
-- TOC entry 253 (class 1259 OID 1599954)
-- Name: Surveys; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "Surveys" (
    id integer DEFAULT nextval('"JSON_id_seq"'::regclass) NOT NULL,
    title character varying,
    description text,
    created timestamp with time zone DEFAULT now() NOT NULL,
    "projectId" integer,
    "isDraft" boolean DEFAULT false NOT NULL,
    "langId" integer
);


ALTER TABLE "Surveys" OWNER TO indabauser;

--
-- TOC entry 254 (class 1259 OID 1599963)
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
-- TOC entry 255 (class 1259 OID 1599965)
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
    "isComplete" boolean DEFAULT false NOT NULL,
    "userIds" integer[],
    "groupIds" integer[]
);


ALTER TABLE "Tasks" OWNER TO indabauser;

--
-- TOC entry 256 (class 1259 OID 1599973)
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
-- TOC entry 257 (class 1259 OID 1599979)
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
-- TOC entry 258 (class 1259 OID 1599981)
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
    deleted timestamp(6) without time zone,
    "langId" smallint DEFAULT 1 NOT NULL,
    updated timestamp(6) without time zone
);


ALTER TABLE "UnitOfAnalysis" OWNER TO indabauser;

--
-- TOC entry 259 (class 1259 OID 1599882)
-- Name: ProjectUsers; Type: TABLE; Schema: sceleton; Owner: indabatestuser
--

CREATE TABLE "ProjectUsers" (
    "projectId" integer NOT NULL,
    "userId" integer NOT NULL
);


ALTER TABLE "ProjectUsers" OWNER TO indabauser;


CREATE TABLE "ProjectUserGroups" (
    "projectId" integer NOT NULL,
    "groupId" integer NOT NULL
);


ALTER TABLE "ProjectUserGroups" OWNER TO indabauser;

--
-- TOC entry 3789 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN "UnitOfAnalysis"."gadmId0"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId0" IS 'ID0 for use with GADM shapefile';


--
-- TOC entry 3790 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN "UnitOfAnalysis"."gadmId1"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId1" IS 'ID1 for use with GADM shapefile';


--
-- TOC entry 3791 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN "UnitOfAnalysis"."gadmId2"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId2" IS 'ID2 for use with GADM shapefile';


--
-- TOC entry 3792 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN "UnitOfAnalysis"."gadmId3"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId3" IS 'ID3 for use with GADM shapefile';


--
-- TOC entry 3793 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN "UnitOfAnalysis"."gadmObjectId"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmObjectId" IS 'OBJECTID for use with GADM shapefile (only Global Shapefile)';


--
-- TOC entry 3794 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN "UnitOfAnalysis"."ISO"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."ISO" IS 'only for Country level Unit Of Analysis';


--
-- TOC entry 3795 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN "UnitOfAnalysis"."ISO2"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."ISO2" IS 'only for Country level Unit Of Analysis';


--
-- TOC entry 3796 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN "UnitOfAnalysis"."nameISO"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."nameISO" IS 'only for Country level Unit Of Analysis';


--
-- TOC entry 3797 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN "UnitOfAnalysis".name; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis".name IS 'Multilanguage';


--
-- TOC entry 3798 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN "UnitOfAnalysis".description; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis".description IS 'Multilanguage';


--
-- TOC entry 3799 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN "UnitOfAnalysis"."shortName"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."shortName" IS 'Multilanguage';


--
-- TOC entry 3800 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN "UnitOfAnalysis"."HASC"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."HASC" IS '(example RU.AD.OK)';


--
-- TOC entry 3801 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN "UnitOfAnalysis"."unitOfAnalysisType"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."unitOfAnalysisType" IS 'reference to table UnitOfAnalysisType';


--
-- TOC entry 3802 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN "UnitOfAnalysis"."parentId"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."parentId" IS 'Link to Parent Unit of Analysis if exist';


--
-- TOC entry 3803 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN "UnitOfAnalysis"."creatorId"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."creatorId" IS 'Creator Id (User Id)';


--
-- TOC entry 3804 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN "UnitOfAnalysis"."ownerId"; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis"."ownerId" IS 'Owner Id (User Id)';


--
-- TOC entry 3805 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN "UnitOfAnalysis".visibility; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis".visibility IS '1 = public; 2 = private;';


--
-- TOC entry 3806 (class 0 OID 0)
-- Dependencies: 258
-- Name: COLUMN "UnitOfAnalysis".status; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysis".status IS '1 = active; 2 = inactive; 3 = deleted;';


--
-- TOC entry 259 (class 1259 OID 1599992)
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
-- TOC entry 260 (class 1259 OID 1599994)
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
-- TOC entry 3807 (class 0 OID 0)
-- Dependencies: 260
-- Name: COLUMN "UnitOfAnalysisClassType".name; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysisClassType".name IS 'Classification Name (for example - World Bank classification) ';


--
-- TOC entry 3808 (class 0 OID 0)
-- Dependencies: 260
-- Name: COLUMN "UnitOfAnalysisClassType".description; Type: COMMENT; Schema: sceleton; Owner: indabauser
--

COMMENT ON COLUMN "UnitOfAnalysisClassType".description IS 'Classification Name description';


--
-- TOC entry 261 (class 1259 OID 1599999)
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
-- TOC entry 262 (class 1259 OID 1600001)
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
-- TOC entry 263 (class 1259 OID 1600006)
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
-- TOC entry 264 (class 1259 OID 1600008)
-- Name: UnitOfAnalysisTagLink; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "UnitOfAnalysisTagLink" (
    id integer DEFAULT nextval('"UnitOfAnalysisTagLink_id_seq"'::regclass) NOT NULL,
    "uoaId" integer NOT NULL,
    "uoaTagId" integer NOT NULL
);


ALTER TABLE "UnitOfAnalysisTagLink" OWNER TO indabauser;

--
-- TOC entry 265 (class 1259 OID 1600012)
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
-- TOC entry 266 (class 1259 OID 1600014)
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
-- TOC entry 267 (class 1259 OID 1600019)
-- Name: UserGroups; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "UserGroups" (
    "userId" integer NOT NULL,
    "groupId" integer NOT NULL
);


ALTER TABLE "UserGroups" OWNER TO indabauser;

--
-- TOC entry 268 (class 1259 OID 1600022)
-- Name: UserRights; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "UserRights" (
    "userID" bigint NOT NULL,
    "rightID" bigint NOT NULL,
    "canDo" boolean
);


ALTER TABLE "UserRights" OWNER TO indabauser;

--
-- TOC entry 269 (class 1259 OID 1600025)
-- Name: UserUOA; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "UserUOA" (
    "UserId" integer NOT NULL,
    "UOAid" integer NOT NULL
);


ALTER TABLE "UserUOA" OWNER TO indabauser;

--
-- TOC entry 270 (class 1259 OID 1600028)
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
-- TOC entry 271 (class 1259 OID 1600030)
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
    salt character varying
);


ALTER TABLE "Users" OWNER TO indabauser;

--
-- TOC entry 272 (class 1259 OID 1600039)
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
-- TOC entry 273 (class 1259 OID 1600041)
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
-- TOC entry 274 (class 1259 OID 1600048)
-- Name: WorkflowStepGroups; Type: TABLE; Schema: sceleton; Owner: indabauser
--

CREATE TABLE "WorkflowStepGroups" (
    "stepId" integer NOT NULL,
    "groupId" integer NOT NULL
);


ALTER TABLE "WorkflowStepGroups" OWNER TO indabauser;

--
-- TOC entry 275 (class 1259 OID 1600051)
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
-- TOC entry 276 (class 1259 OID 1600053)
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
    "langId" integer
);


ALTER TABLE "WorkflowSteps" OWNER TO indabauser;

--
-- TOC entry 277 (class 1259 OID 1600061)
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
-- TOC entry 278 (class 1259 OID 1600063)
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
-- TOC entry 279 (class 1259 OID 1600071)
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
-- TOC entry 280 (class 1259 OID 1600073)
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
-- TOC entry 281 (class 1259 OID 1600075)
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
-- TOC entry 282 (class 1259 OID 1600077)
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
-- TOC entry 283 (class 1259 OID 1600079)
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
-- TOC entry 365 (class 1259 OID 1601602)
-- Name: AccessMatix_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE "AccessMatix_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "AccessMatix_id_seq" OWNER TO indabauser;

--
-- TOC entry 406 (class 1259 OID 1601707)
-- Name: AccessMatrices; Type: TABLE; Schema: test; Owner: indaba
--

CREATE TABLE "AccessMatrices" (
    id integer DEFAULT nextval('"AccessMatix_id_seq"'::regclass) NOT NULL,
    name character varying(100),
    description text,
    default_value smallint
);


ALTER TABLE "AccessMatrices" OWNER TO indabauser;

--
-- TOC entry 366 (class 1259 OID 1601604)
-- Name: AccessPermissions_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE "AccessPermissions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "AccessPermissions_id_seq" OWNER TO indabauser;

--
-- TOC entry 403 (class 1259 OID 1601678)
-- Name: AccessPermissions; Type: TABLE; Schema: test; Owner: indaba
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
-- TOC entry 367 (class 1259 OID 1601606)
-- Name: AnswerAttachments_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE "AnswerAttachments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "AnswerAttachments_id_seq" OWNER TO indabauser;

--
-- TOC entry 404 (class 1259 OID 1601687)
-- Name: AnswerAttachments; Type: TABLE; Schema: test; Owner: indaba
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
-- TOC entry 405 (class 1259 OID 1601698)
-- Name: AttachmentAttempts; Type: TABLE; Schema: test; Owner: indaba
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
-- TOC entry 442 (class 1259 OID 1602083)
-- Name: AttachmentLinks; Type: TABLE; Schema: test; Owner: indaba
--

CREATE TABLE "AttachmentLinks" (
    "essenceId" integer NOT NULL,
    "entityId" integer NOT NULL,
    attachments integer[]
);


ALTER TABLE "AttachmentLinks" OWNER TO indabauser;

--
-- TOC entry 368 (class 1259 OID 1601608)
-- Name: Attachments_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE "Attachments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Attachments_id_seq" OWNER TO indabauser;

--
-- TOC entry 409 (class 1259 OID 1601742)
-- Name: Attachments; Type: TABLE; Schema: test; Owner: indaba
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
-- TOC entry 369 (class 1259 OID 1601610)
-- Name: Discussions_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE "Discussions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Discussions_id_seq" OWNER TO indabauser;

--
-- TOC entry 407 (class 1259 OID 1601717)
-- Name: Discussions; Type: TABLE; Schema: test; Owner: indaba
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
-- TOC entry 370 (class 1259 OID 1601612)
-- Name: Entities_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE "Entities_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Entities_id_seq" OWNER TO indabauser;

--
-- TOC entry 371 (class 1259 OID 1601614)
-- Name: EntityRoles_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE "EntityRoles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "EntityRoles_id_seq" OWNER TO indabauser;

--
-- TOC entry 411 (class 1259 OID 1601760)
-- Name: Essences; Type: TABLE; Schema: test; Owner: indaba
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
-- TOC entry 3809 (class 0 OID 0)
-- Dependencies: 411
-- Name: COLUMN "Essences".name; Type: COMMENT; Schema: test; Owner: indaba
--

COMMENT ON COLUMN "Essences".name IS 'Human readable name of essence';


--
-- TOC entry 3810 (class 0 OID 0)
-- Dependencies: 411
-- Name: COLUMN "Essences"."fileName"; Type: COMMENT; Schema: test; Owner: indaba
--

COMMENT ON COLUMN "Essences"."fileName" IS 'File name in models path';


--
-- TOC entry 372 (class 1259 OID 1601616)
-- Name: Groups_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE "Groups_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Groups_id_seq" OWNER TO indabauser;

--
-- TOC entry 408 (class 1259 OID 1601732)
-- Name: Groups; Type: TABLE; Schema: test; Owner: indaba
--

CREATE TABLE "Groups" (
    id integer DEFAULT nextval('"Groups_id_seq"'::regclass) NOT NULL,
    title character varying,
    "organizationId" integer,
    "langId" integer
);


ALTER TABLE "Groups" OWNER TO indabauser;

--
-- TOC entry 410 (class 1259 OID 1601752)
-- Name: IndexQuestionWeights; Type: TABLE; Schema: test; Owner: indaba
--

CREATE TABLE "IndexQuestionWeights" (
    "indexId" integer NOT NULL,
    "questionId" integer NOT NULL,
    weight numeric NOT NULL,
    type character varying NOT NULL
);


ALTER TABLE "IndexQuestionWeights" OWNER TO indabauser;

--
-- TOC entry 444 (class 1259 OID 1602096)
-- Name: IndexSubindexWeights; Type: TABLE; Schema: test; Owner: indaba
--

CREATE TABLE "IndexSubindexWeights" (
    "indexId" integer NOT NULL,
    "subindexId" integer NOT NULL,
    weight numeric NOT NULL,
    type character varying NOT NULL
);


ALTER TABLE "IndexSubindexWeights" OWNER TO indabauser;

--
-- TOC entry 373 (class 1259 OID 1601618)
-- Name: Index_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE "Index_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Index_id_seq" OWNER TO indabauser;

--
-- TOC entry 424 (class 1259 OID 1601899)
-- Name: Indexes; Type: TABLE; Schema: test; Owner: indaba
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
-- TOC entry 374 (class 1259 OID 1601620)
-- Name: JSON_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE "JSON_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "JSON_id_seq" OWNER TO indabauser;

--
-- TOC entry 375 (class 1259 OID 1601622)
-- Name: Languages_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE "Languages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Languages_id_seq" OWNER TO indabauser;

--
-- TOC entry 412 (class 1259 OID 1601775)
-- Name: Languages; Type: TABLE; Schema: test; Owner: indaba
--

CREATE TABLE "Languages" (
    id integer DEFAULT nextval('"Languages_id_seq"'::regclass) NOT NULL,
    name character varying(100),
    "nativeName" character varying(255),
    code character varying(3)
);


ALTER TABLE "Languages" OWNER TO indabauser;

--
-- TOC entry 376 (class 1259 OID 1601624)
-- Name: Logs_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE "Logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Logs_id_seq" OWNER TO indabauser;

--
-- TOC entry 415 (class 1259 OID 1601811)
-- Name: Logs; Type: TABLE; Schema: test; Owner: indaba
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
-- TOC entry 377 (class 1259 OID 1601626)
-- Name: Notifications_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE "Notifications_id_seq"
    START WITH 167
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Notifications_id_seq" OWNER TO indabauser;

--
-- TOC entry 413 (class 1259 OID 1601784)
-- Name: Notifications; Type: TABLE; Schema: test; Owner: indaba
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
-- TOC entry 3811 (class 0 OID 0)
-- Dependencies: 413
-- Name: COLUMN "Notifications"."notifyLevel"; Type: COMMENT; Schema: test; Owner: indaba
--

COMMENT ON COLUMN "Notifications"."notifyLevel" IS '0 - none, 1 - alert only, 2 - all notifications';


--
-- TOC entry 378 (class 1259 OID 1601628)
-- Name: Organizations_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE "Organizations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Organizations_id_seq" OWNER TO indabauser;

--
-- TOC entry 419 (class 1259 OID 1601854)
-- Name: Organizations; Type: TABLE; Schema: test; Owner: indaba
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
-- TOC entry 423 (class 1259 OID 1601893)
-- Name: ProductUOA; Type: TABLE; Schema: test; Owner: indaba
--

CREATE TABLE "ProductUOA" (
    "productId" integer NOT NULL,
    "UOAid" integer NOT NULL,
    "currentStepId" integer,
    "isComplete" boolean DEFAULT false NOT NULL
);


ALTER TABLE "ProductUOA" OWNER TO indabauser;

--
-- TOC entry 379 (class 1259 OID 1601630)
-- Name: Products_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE "Products_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Products_id_seq" OWNER TO indabauser;

--
-- TOC entry 418 (class 1259 OID 1601843)
-- Name: Products; Type: TABLE; Schema: test; Owner: indaba
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
-- TOC entry 380 (class 1259 OID 1601632)
-- Name: Projects_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE "Projects_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Projects_id_seq" OWNER TO indabauser;

--
-- TOC entry 414 (class 1259 OID 1601797)
-- Name: Projects; Type: TABLE; Schema: test; Owner: indaba
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
    "langId" integer
);


ALTER TABLE "Projects" OWNER TO indabauser;

--
-- TOC entry 381 (class 1259 OID 1601634)
-- Name: Rights_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE "Rights_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Rights_id_seq" OWNER TO indabauser;

--
-- TOC entry 417 (class 1259 OID 1601832)
-- Name: Rights; Type: TABLE; Schema: test; Owner: indaba
--

CREATE TABLE "Rights" (
    id integer DEFAULT nextval('"Rights_id_seq"'::regclass) NOT NULL,
    action character varying(80) NOT NULL,
    description text,
    "essenceId" integer
);


ALTER TABLE "Rights" OWNER TO indabauser;

--
-- TOC entry 382 (class 1259 OID 1601636)
-- Name: role_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE role_id_seq OWNER TO indabauser;

--
-- TOC entry 416 (class 1259 OID 1601824)
-- Name: Roles; Type: TABLE; Schema: test; Owner: indaba
--

CREATE TABLE "Roles" (
    id integer DEFAULT nextval('role_id_seq'::regclass) NOT NULL,
    name character varying(20) NOT NULL,
    "isSystem" boolean DEFAULT false NOT NULL
);


ALTER TABLE "Roles" OWNER TO indabauser;

--
-- TOC entry 420 (class 1259 OID 1601867)
-- Name: RolesRights; Type: TABLE; Schema: test; Owner: indaba
--

CREATE TABLE "RolesRights" (
    "roleID" bigint NOT NULL,
    "rightID" bigint NOT NULL
);


ALTER TABLE "RolesRights" OWNER TO indabauser;

--
-- TOC entry 422 (class 1259 OID 1601885)
-- Name: SubindexWeights; Type: TABLE; Schema: test; Owner: indaba
--

CREATE TABLE "SubindexWeights" (
    "subindexId" integer NOT NULL,
    "questionId" integer NOT NULL,
    weight numeric NOT NULL,
    type character varying NOT NULL
);


ALTER TABLE "SubindexWeights" OWNER TO indabauser;

--
-- TOC entry 383 (class 1259 OID 1601638)
-- Name: Subindex_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE "Subindex_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Subindex_id_seq" OWNER TO indabauser;

--
-- TOC entry 421 (class 1259 OID 1601873)
-- Name: Subindexes; Type: TABLE; Schema: test; Owner: indaba
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
-- TOC entry 384 (class 1259 OID 1601640)
-- Name: SurveyAnswerVersions_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE "SurveyAnswerVersions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "SurveyAnswerVersions_id_seq" OWNER TO indabauser;

--
-- TOC entry 385 (class 1259 OID 1601642)
-- Name: SurveyAnswers_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE "SurveyAnswers_id_seq"
    START WITH 1375
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "SurveyAnswers_id_seq" OWNER TO indabauser;

--
-- TOC entry 445 (class 1259 OID 1602104)
-- Name: SurveyAnswers; Type: TABLE; Schema: test; Owner: indaba
--

CREATE TABLE "SurveyAnswers" (
    id integer DEFAULT nextval('"SurveyAnswers_id_seq"'::regclass) NOT NULL,
    "questionId" integer,
    "userId" integer,
    value text,
    created timestamp with time zone DEFAULT now() NOT NULL,
    "productId" integer,
    "UOAid" integer,
    "wfStepId" integer,
    version integer,
    "surveyId" integer,
    "optionId" integer[],
    "langId" integer,
    "isResponse" boolean DEFAULT false NOT NULL,
    "isAgree" boolean,
    comments character varying,
    attachments integer[],
    links character varying[],
    updated timestamp with time zone
);


ALTER TABLE "SurveyAnswers" OWNER TO indabauser;

--
-- TOC entry 387 (class 1259 OID 1601646)
-- Name: surveyQuestionOptions_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE "surveyQuestionOptions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "surveyQuestionOptions_id_seq" OWNER TO indabauser;

--
-- TOC entry 433 (class 1259 OID 1602000)
-- Name: SurveyQuestionOptions; Type: TABLE; Schema: test; Owner: indaba
--

CREATE TABLE "SurveyQuestionOptions" (
    id integer DEFAULT nextval('"surveyQuestionOptions_id_seq"'::regclass) NOT NULL,
    "questionId" integer,
    value character varying,
    label character varying,
    skip smallint,
    "isSelected" boolean DEFAULT false NOT NULL,
    "langId" integer
);


ALTER TABLE "SurveyQuestionOptions" OWNER TO indabauser;

--
-- TOC entry 388 (class 1259 OID 1601648)
-- Name: SurveyQuestions_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE "SurveyQuestions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "SurveyQuestions_id_seq" OWNER TO indabauser;

--
-- TOC entry 429 (class 1259 OID 1601951)
-- Name: SurveyQuestions; Type: TABLE; Schema: test; Owner: indaba
--

CREATE TABLE "SurveyQuestions" (
    id integer DEFAULT nextval('"SurveyQuestions_id_seq"'::regclass) NOT NULL,
    "surveyId" integer,
    type smallint,
    label character varying,
    "isRequired" boolean DEFAULT false NOT NULL,
    "position" integer,
    description text,
    skip smallint,
    size smallint,
    "minLength" smallint,
    "maxLength" smallint,
    "isWordmml" boolean DEFAULT false NOT NULL,
    "incOtherOpt" boolean DEFAULT false NOT NULL,
    units character varying,
    "intOnly" boolean DEFAULT false NOT NULL,
    value character varying,
    qid character varying,
    links text,
    attachment boolean,
    "optionNumbering" character varying,
    "langId" integer,
    "withLinks" boolean DEFAULT false,
    "hasComments" boolean
);


ALTER TABLE "SurveyQuestions" OWNER TO indabauser;

--
-- TOC entry 436 (class 1259 OID 1602021)
-- Name: Surveys; Type: TABLE; Schema: test; Owner: indaba
--

CREATE TABLE "Surveys" (
    id integer DEFAULT nextval('"JSON_id_seq"'::regclass) NOT NULL,
    title character varying,
    description text,
    created timestamp with time zone DEFAULT now() NOT NULL,
    "projectId" integer,
    "isDraft" boolean DEFAULT false NOT NULL,
    "langId" integer
);


ALTER TABLE "Surveys" OWNER TO indabauser;

--
-- TOC entry 389 (class 1259 OID 1601650)
-- Name: Tasks_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE "Tasks_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Tasks_id_seq" OWNER TO indabauser;

--
-- TOC entry 437 (class 1259 OID 1602033)
-- Name: Tasks; Type: TABLE; Schema: test; Owner: indaba
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
    "isComplete" boolean DEFAULT false NOT NULL,
    "userIds" integer[],
    "groupIds" integer[]
);


ALTER TABLE "Tasks" OWNER TO indabauser;

--
-- TOC entry 428 (class 1259 OID 1601943)
-- Name: Translations; Type: TABLE; Schema: test; Owner: indaba
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
-- TOC entry 390 (class 1259 OID 1601652)
-- Name: UnitOfAnalysis_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE "UnitOfAnalysis_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysis_id_seq" OWNER TO indabauser;

--
-- TOC entry 427 (class 1259 OID 1601927)
-- Name: UnitOfAnalysis; Type: TABLE; Schema: test; Owner: indaba
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
    deleted timestamp(6) without time zone,
    "langId" smallint DEFAULT 1 NOT NULL,
    updated timestamp(6) without time zone
);


ALTER TABLE "UnitOfAnalysis" OWNER TO indabauser;

--
-- TOC entry 3812 (class 0 OID 0)
-- Dependencies: 427
-- Name: COLUMN "UnitOfAnalysis"."gadmId0"; Type: COMMENT; Schema: test; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId0" IS 'ID0 for use with GADM shapefile';


--
-- TOC entry 3813 (class 0 OID 0)
-- Dependencies: 427
-- Name: COLUMN "UnitOfAnalysis"."gadmId1"; Type: COMMENT; Schema: test; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId1" IS 'ID1 for use with GADM shapefile';


--
-- TOC entry 3814 (class 0 OID 0)
-- Dependencies: 427
-- Name: COLUMN "UnitOfAnalysis"."gadmId2"; Type: COMMENT; Schema: test; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId2" IS 'ID2 for use with GADM shapefile';


--
-- TOC entry 3815 (class 0 OID 0)
-- Dependencies: 427
-- Name: COLUMN "UnitOfAnalysis"."gadmId3"; Type: COMMENT; Schema: test; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId3" IS 'ID3 for use with GADM shapefile';


--
-- TOC entry 3816 (class 0 OID 0)
-- Dependencies: 427
-- Name: COLUMN "UnitOfAnalysis"."gadmObjectId"; Type: COMMENT; Schema: test; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmObjectId" IS 'OBJECTID for use with GADM shapefile (only Global Shapefile)';


--
-- TOC entry 3817 (class 0 OID 0)
-- Dependencies: 427
-- Name: COLUMN "UnitOfAnalysis"."ISO"; Type: COMMENT; Schema: test; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."ISO" IS 'only for Country level Unit Of Analysis';


--
-- TOC entry 3818 (class 0 OID 0)
-- Dependencies: 427
-- Name: COLUMN "UnitOfAnalysis"."ISO2"; Type: COMMENT; Schema: test; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."ISO2" IS 'only for Country level Unit Of Analysis';


--
-- TOC entry 3819 (class 0 OID 0)
-- Dependencies: 427
-- Name: COLUMN "UnitOfAnalysis"."nameISO"; Type: COMMENT; Schema: test; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."nameISO" IS 'only for Country level Unit Of Analysis';


--
-- TOC entry 3820 (class 0 OID 0)
-- Dependencies: 427
-- Name: COLUMN "UnitOfAnalysis".name; Type: COMMENT; Schema: test; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis".name IS 'Multilanguage';


--
-- TOC entry 3821 (class 0 OID 0)
-- Dependencies: 427
-- Name: COLUMN "UnitOfAnalysis".description; Type: COMMENT; Schema: test; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis".description IS 'Multilanguage';


--
-- TOC entry 3822 (class 0 OID 0)
-- Dependencies: 427
-- Name: COLUMN "UnitOfAnalysis"."shortName"; Type: COMMENT; Schema: test; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."shortName" IS 'Multilanguage';


--
-- TOC entry 3823 (class 0 OID 0)
-- Dependencies: 427
-- Name: COLUMN "UnitOfAnalysis"."HASC"; Type: COMMENT; Schema: test; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."HASC" IS '(example RU.AD.OK)';


--
-- TOC entry 3824 (class 0 OID 0)
-- Dependencies: 427
-- Name: COLUMN "UnitOfAnalysis"."unitOfAnalysisType"; Type: COMMENT; Schema: test; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."unitOfAnalysisType" IS 'reference to table UnitOfAnalysisType';


--
-- TOC entry 3825 (class 0 OID 0)
-- Dependencies: 427
-- Name: COLUMN "UnitOfAnalysis"."parentId"; Type: COMMENT; Schema: test; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."parentId" IS 'Link to Parent Unit of Analysis if exist';


--
-- TOC entry 3826 (class 0 OID 0)
-- Dependencies: 427
-- Name: COLUMN "UnitOfAnalysis"."creatorId"; Type: COMMENT; Schema: test; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."creatorId" IS 'Creator Id (User Id)';


--
-- TOC entry 3827 (class 0 OID 0)
-- Dependencies: 427
-- Name: COLUMN "UnitOfAnalysis"."ownerId"; Type: COMMENT; Schema: test; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."ownerId" IS 'Owner Id (User Id)';


--
-- TOC entry 3828 (class 0 OID 0)
-- Dependencies: 427
-- Name: COLUMN "UnitOfAnalysis".visibility; Type: COMMENT; Schema: test; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis".visibility IS '1 = public; 2 = private;';


--
-- TOC entry 3829 (class 0 OID 0)
-- Dependencies: 427
-- Name: COLUMN "UnitOfAnalysis".status; Type: COMMENT; Schema: test; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis".status IS '1 = active; 2 = inactive; 3 = deleted;';


--
-- TOC entry 386 (class 1259 OID 1601644)
-- Name: UnitOfAnalysisClassType_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE "UnitOfAnalysisClassType_id_seq"
    START WITH 9
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysisClassType_id_seq" OWNER TO indabauser;

--
-- TOC entry 430 (class 1259 OID 1601966)
-- Name: UnitOfAnalysisClassType; Type: TABLE; Schema: test; Owner: indaba
--

CREATE TABLE "UnitOfAnalysisClassType" (
    id smallint DEFAULT nextval('"UnitOfAnalysisClassType_id_seq"'::regclass) NOT NULL,
    name character varying(45) NOT NULL,
    description character varying(255),
    "langId" smallint DEFAULT 1 NOT NULL
);


ALTER TABLE "UnitOfAnalysisClassType" OWNER TO indabauser;

--
-- TOC entry 3830 (class 0 OID 0)
-- Dependencies: 430
-- Name: COLUMN "UnitOfAnalysisClassType".name; Type: COMMENT; Schema: test; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysisClassType".name IS 'Classification Name (for example - World Bank classification) ';


--
-- TOC entry 3831 (class 0 OID 0)
-- Dependencies: 430
-- Name: COLUMN "UnitOfAnalysisClassType".description; Type: COMMENT; Schema: test; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysisClassType".description IS 'Classification Name description';


--
-- TOC entry 391 (class 1259 OID 1601654)
-- Name: UnitOfAnalysisTag_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE "UnitOfAnalysisTag_id_seq"
    START WITH 9
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysisTag_id_seq" OWNER TO indabauser;

--
-- TOC entry 425 (class 1259 OID 1601911)
-- Name: UnitOfAnalysisTag; Type: TABLE; Schema: test; Owner: indaba
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
-- TOC entry 392 (class 1259 OID 1601656)
-- Name: UnitOfAnalysisTagLink_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE "UnitOfAnalysisTagLink_id_seq"
    START WITH 18
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysisTagLink_id_seq" OWNER TO indabauser;

--
-- TOC entry 432 (class 1259 OID 1601989)
-- Name: UnitOfAnalysisTagLink; Type: TABLE; Schema: test; Owner: indaba
--

CREATE TABLE "UnitOfAnalysisTagLink" (
    id integer DEFAULT nextval('"UnitOfAnalysisTagLink_id_seq"'::regclass) NOT NULL,
    "uoaId" integer NOT NULL,
    "uoaTagId" integer NOT NULL
);


ALTER TABLE "UnitOfAnalysisTagLink" OWNER TO indabauser;

--
-- TOC entry 393 (class 1259 OID 1601658)
-- Name: UnitOfAnalysisType_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE "UnitOfAnalysisType_id_seq"
    START WITH 9
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysisType_id_seq" OWNER TO indabauser;

--
-- TOC entry 426 (class 1259 OID 1601919)
-- Name: UnitOfAnalysisType; Type: TABLE; Schema: test; Owner: indaba
--

CREATE TABLE "UnitOfAnalysisType" (
    id smallint DEFAULT nextval('"UnitOfAnalysisType_id_seq"'::regclass) NOT NULL,
    name character varying(40) NOT NULL,
    description character varying(255),
    "langId" integer DEFAULT 1 NOT NULL
);


ALTER TABLE "UnitOfAnalysisType" OWNER TO indabauser;

--
-- TOC entry 438 (class 1259 OID 1602044)
-- Name: UserGroups; Type: TABLE; Schema: test; Owner: indaba
--

CREATE TABLE "UserGroups" (
    "userId" integer NOT NULL,
    "groupId" integer NOT NULL
);


ALTER TABLE "UserGroups" OWNER TO indabauser;

--
-- TOC entry 434 (class 1259 OID 1602011)
-- Name: UserRights; Type: TABLE; Schema: test; Owner: indaba
--

CREATE TABLE "UserRights" (
    "userID" bigint NOT NULL,
    "rightID" bigint NOT NULL,
    "canDo" boolean
);


ALTER TABLE "UserRights" OWNER TO indabauser;

--
-- TOC entry 435 (class 1259 OID 1602016)
-- Name: UserUOA; Type: TABLE; Schema: test; Owner: indaba
--

CREATE TABLE "UserUOA" (
    "UserId" integer NOT NULL,
    "UOAid" integer NOT NULL
);


ALTER TABLE "UserUOA" OWNER TO indabauser;

--
-- TOC entry 436 (class 1259 OID 1602016)
-- Name: ProjectUsers; Type: TABLE; Schema: testorg; Owner: indabatestuser
--

CREATE TABLE "ProjectUsers" (
    "projectId" integer NOT NULL,
    "userId" integer NOT NULL
);


ALTER TABLE "ProjectUsers" OWNER TO indabauser;


CREATE TABLE "ProjectUserGroups" (
    "projectId" integer NOT NULL,
    "groupId" integer NOT NULL
);


ALTER TABLE "ProjectUserGroups" OWNER TO indabauser;

--
-- TOC entry 394 (class 1259 OID 1601660)
-- Name: user_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE user_id_seq OWNER TO indabauser;

--
-- TOC entry 431 (class 1259 OID 1601974)
-- Name: Users; Type: TABLE; Schema: test; Owner: indaba
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
    salt character varying
);


ALTER TABLE "Users" OWNER TO indabauser;

--
-- TOC entry 395 (class 1259 OID 1601662)
-- Name: Visualizations_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE "Visualizations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Visualizations_id_seq" OWNER TO indabauser;

--
-- TOC entry 439 (class 1259 OID 1602049)
-- Name: Visualizations; Type: TABLE; Schema: test; Owner: indaba
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
-- TOC entry 443 (class 1259 OID 1602091)
-- Name: WorkflowStepGroups; Type: TABLE; Schema: test; Owner: indaba
--

CREATE TABLE "WorkflowStepGroups" (
    "stepId" integer NOT NULL,
    "groupId" integer NOT NULL
);


ALTER TABLE "WorkflowStepGroups" OWNER TO indabauser;

--
-- TOC entry 396 (class 1259 OID 1601664)
-- Name: WorkflowSteps_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE "WorkflowSteps_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "WorkflowSteps_id_seq" OWNER TO indabauser;

--
-- TOC entry 441 (class 1259 OID 1602072)
-- Name: WorkflowSteps; Type: TABLE; Schema: test; Owner: indaba
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
    "langId" integer
);


ALTER TABLE "WorkflowSteps" OWNER TO indabauser;

--
-- TOC entry 397 (class 1259 OID 1601666)
-- Name: Workflows_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE "Workflows_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Workflows_id_seq" OWNER TO indabauser;

--
-- TOC entry 440 (class 1259 OID 1602059)
-- Name: Workflows; Type: TABLE; Schema: test; Owner: indaba
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
-- TOC entry 398 (class 1259 OID 1601668)
-- Name: brand_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE brand_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE brand_id_seq OWNER TO indabauser;

--
-- TOC entry 399 (class 1259 OID 1601670)
-- Name: country_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE country_id_seq
    START WITH 240
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE country_id_seq OWNER TO indabauser;

--
-- TOC entry 400 (class 1259 OID 1601672)
-- Name: order_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE order_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE order_id_seq OWNER TO indabauser;

--
-- TOC entry 401 (class 1259 OID 1601674)
-- Name: transport_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
--

CREATE SEQUENCE transport_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE transport_id_seq OWNER TO indabauser;

--
-- TOC entry 402 (class 1259 OID 1601676)
-- Name: transportmodel_id_seq; Type: SEQUENCE; Schema: test; Owner: indaba
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
-- TOC entry 3060 (class 2604 OID 1600449)
-- Name: id; Type: DEFAULT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Essences" ALTER COLUMN id SET DEFAULT nextval('"Entities_id_seq"'::regclass);


--
-- TOC entry 3061 (class 2604 OID 1600450)
-- Name: id; Type: DEFAULT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Languages" ALTER COLUMN id SET DEFAULT nextval('"Languages_id_seq"'::regclass);


--
-- TOC entry 3065 (class 2604 OID 1600451)
-- Name: id; Type: DEFAULT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Logs" ALTER COLUMN id SET DEFAULT nextval('"Logs_id_seq"'::regclass);


--
-- TOC entry 3070 (class 2604 OID 1600452)
-- Name: id; Type: DEFAULT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Rights" ALTER COLUMN id SET DEFAULT nextval('"Rights_id_seq"'::regclass);


SET search_path = sceleton, pg_catalog;

--
-- TOC entry 3082 (class 2604 OID 1600453)
-- Name: id; Type: DEFAULT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Attachments" ALTER COLUMN id SET DEFAULT nextval('"Attachments_id_seq"'::regclass);


SET search_path = public, pg_catalog;

--
-- TOC entry 3226 (class 2606 OID 1600456)
-- Name: Entity_pkey; Type: CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Entity_pkey" PRIMARY KEY (id);


--
-- TOC entry 3228 (class 2606 OID 1600458)
-- Name: Essences_fileName_key; Type: CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_fileName_key" UNIQUE ("fileName");


--
-- TOC entry 3230 (class 2606 OID 1600460)
-- Name: Essences_tableName_key; Type: CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_tableName_key" UNIQUE ("tableName");


--
-- TOC entry 3233 (class 2606 OID 1600462)
-- Name: Languages_code_key; Type: CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Languages"
    ADD CONSTRAINT "Languages_code_key" UNIQUE (code);


--
-- TOC entry 3235 (class 2606 OID 1600464)
-- Name: Languages_pkey; Type: CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Languages"
    ADD CONSTRAINT "Languages_pkey" PRIMARY KEY (id);


--
-- TOC entry 3237 (class 2606 OID 1600466)
-- Name: Logs_pkey; Type: CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Logs"
    ADD CONSTRAINT "Logs_pkey" PRIMARY KEY (id);


--
-- TOC entry 3239 (class 2606 OID 1600468)
-- Name: Notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_pkey" PRIMARY KEY (id);


--
-- TOC entry 3242 (class 2606 OID 1600470)
-- Name: Rights_pkey; Type: CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Rights"
    ADD CONSTRAINT "Rights_pkey" PRIMARY KEY (id);


--
-- TOC entry 3250 (class 2606 OID 1600472)
-- Name: Token_pkey; Type: CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Token"
    ADD CONSTRAINT "Token_pkey" PRIMARY KEY ("userID", realm);


--
-- TOC entry 3252 (class 2606 OID 1600474)
-- Name: Users_email_key; Type: CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- TOC entry 3244 (class 2606 OID 1600476)
-- Name: id; Type: CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Roles"
    ADD CONSTRAINT id PRIMARY KEY (id);


--
-- TOC entry 3247 (class 2606 OID 1600478)
-- Name: roleRight_pkey; Type: CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "roleRight_pkey" PRIMARY KEY ("roleID", "rightID");


--
-- TOC entry 3255 (class 2606 OID 1600480)
-- Name: userID; Type: CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "userID" PRIMARY KEY (id);


SET search_path = sceleton, pg_catalog;

--
-- TOC entry 3257 (class 2606 OID 1600482)
-- Name: AccessMatrices_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "AccessMatrices"
    ADD CONSTRAINT "AccessMatrices_pkey" PRIMARY KEY (id);


--
-- TOC entry 3259 (class 2606 OID 1600484)
-- Name: AccessPermissions_matrixId_roleId_rightId_key; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "AccessPermissions"
    ADD CONSTRAINT "AccessPermissions_matrixId_roleId_rightId_key" UNIQUE ("matrixId", "roleId", "rightId");


--
-- TOC entry 3261 (class 2606 OID 1600486)
-- Name: AccessPermissions_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "AccessPermissions"
    ADD CONSTRAINT "AccessPermissions_pkey" PRIMARY KEY (id);


--
-- TOC entry 3263 (class 2606 OID 1600488)
-- Name: AnswerAttachments_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "AnswerAttachments"
    ADD CONSTRAINT "AnswerAttachments_pkey" PRIMARY KEY (id);


--
-- TOC entry 3265 (class 2606 OID 1600490)
-- Name: AttachmentAttempts_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "AttachmentAttempts"
    ADD CONSTRAINT "AttachmentAttempts_pkey" PRIMARY KEY (key);


--
-- TOC entry 3267 (class 2606 OID 1600492)
-- Name: AttachmentLinks_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "AttachmentLinks"
    ADD CONSTRAINT "AttachmentLinks_pkey" PRIMARY KEY ("essenceId", "entityId");


--
-- TOC entry 3269 (class 2606 OID 1600494)
-- Name: Attachments_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Attachments"
    ADD CONSTRAINT "Attachments_pkey" PRIMARY KEY (id);


--
-- TOC entry 3271 (class 2606 OID 1600496)
-- Name: Discussions_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_pkey" PRIMARY KEY (id);


--
-- TOC entry 3273 (class 2606 OID 1600498)
-- Name: Essences_fileName_key; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_fileName_key" UNIQUE ("fileName");


--
-- TOC entry 3275 (class 2606 OID 1600500)
-- Name: Essences_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_pkey" PRIMARY KEY (id);


--
-- TOC entry 3277 (class 2606 OID 1600502)
-- Name: Essences_tableName_key; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_tableName_key" UNIQUE ("tableName");


--
-- TOC entry 3280 (class 2606 OID 1600504)
-- Name: Groups_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Groups"
    ADD CONSTRAINT "Groups_pkey" PRIMARY KEY (id);


--
-- TOC entry 3282 (class 2606 OID 1600506)
-- Name: IndexQuestionWeights_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "IndexQuestionWeights"
    ADD CONSTRAINT "IndexQuestionWeights_pkey" PRIMARY KEY ("indexId", "questionId");


--
-- TOC entry 3284 (class 2606 OID 1600508)
-- Name: IndexSubindexWeights_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "IndexSubindexWeights"
    ADD CONSTRAINT "IndexSubindexWeights_pkey" PRIMARY KEY ("indexId", "subindexId");


--
-- TOC entry 3286 (class 2606 OID 1600510)
-- Name: Indexes_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Indexes"
    ADD CONSTRAINT "Indexes_pkey" PRIMARY KEY (id);


--
-- TOC entry 3289 (class 2606 OID 1600512)
-- Name: Languages_code_key; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Languages"
    ADD CONSTRAINT "Languages_code_key" UNIQUE (code);


--
-- TOC entry 3291 (class 2606 OID 1600514)
-- Name: Languages_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Languages"
    ADD CONSTRAINT "Languages_pkey" PRIMARY KEY (id);


--
-- TOC entry 3293 (class 2606 OID 1600516)
-- Name: Logs_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Logs"
    ADD CONSTRAINT "Logs_pkey" PRIMARY KEY (id);


--
-- TOC entry 3295 (class 2606 OID 1600518)
-- Name: Notifications_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_pkey" PRIMARY KEY (id);


--
-- TOC entry 3297 (class 2606 OID 1600520)
-- Name: Organizations_adminUserId_key; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_adminUserId_key" UNIQUE ("adminUserId");


--
-- TOC entry 3299 (class 2606 OID 1600522)
-- Name: Organizations_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_pkey" PRIMARY KEY (id);


--
-- TOC entry 3301 (class 2606 OID 1600524)
-- Name: ProductUOA_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_pkey" PRIMARY KEY ("productId", "UOAid");


--
-- TOC entry 3303 (class 2606 OID 1600526)
-- Name: Products_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_pkey" PRIMARY KEY (id);


--
-- TOC entry 3305 (class 2606 OID 1600528)
-- Name: Projects_codeName_key; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_codeName_key" UNIQUE ("codeName");


--
-- TOC entry 3307 (class 2606 OID 1600530)
-- Name: Projects_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_pkey" PRIMARY KEY (id);


--
-- TOC entry 3310 (class 2606 OID 1600532)
-- Name: Rights_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Rights"
    ADD CONSTRAINT "Rights_pkey" PRIMARY KEY (id);


--
-- TOC entry 3314 (class 2606 OID 1600534)
-- Name: RolesRights_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "RolesRights_pkey" PRIMARY KEY ("roleID", "rightID");


--
-- TOC entry 3312 (class 2606 OID 1600536)
-- Name: Roles_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Roles"
    ADD CONSTRAINT "Roles_pkey" PRIMARY KEY (id);


--
-- TOC entry 3317 (class 2606 OID 1600538)
-- Name: SubindexWeights_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "SubindexWeights"
    ADD CONSTRAINT "SubindexWeights_pkey" PRIMARY KEY ("subindexId", "questionId");


--
-- TOC entry 3319 (class 2606 OID 1600540)
-- Name: Subindexes_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Subindexes"
    ADD CONSTRAINT "Subindexes_pkey" PRIMARY KEY (id);


--
-- TOC entry 3322 (class 2606 OID 1600542)
-- Name: SurveyAnswers_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_pkey" PRIMARY KEY (id);


--
-- TOC entry 3324 (class 2606 OID 1600544)
-- Name: SurveyQuestionOptions_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "SurveyQuestionOptions"
    ADD CONSTRAINT "SurveyQuestionOptions_pkey" PRIMARY KEY (id);


--
-- TOC entry 3326 (class 2606 OID 1600546)
-- Name: SurveyQuestions_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "SurveyQuestions"
    ADD CONSTRAINT "SurveyQuestions_pkey" PRIMARY KEY (id);


--
-- TOC entry 3328 (class 2606 OID 1600548)
-- Name: Surveys_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Surveys"
    ADD CONSTRAINT "Surveys_pkey" PRIMARY KEY (id);


--
-- TOC entry 3330 (class 2606 OID 1600550)
-- Name: Tasks_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_pkey" PRIMARY KEY (id);


--
-- TOC entry 3332 (class 2606 OID 1600552)
-- Name: Translations_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_pkey" PRIMARY KEY ("essenceId", "entityId", field, "langId");


--
-- TOC entry 3342 (class 2606 OID 1600554)
-- Name: UnitOfAnalysisClassType_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisClassType"
    ADD CONSTRAINT "UnitOfAnalysisClassType_pkey" PRIMARY KEY (id);


--
-- TOC entry 3346 (class 2606 OID 1600556)
-- Name: UnitOfAnalysisTagLink_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_pkey" PRIMARY KEY (id);


--
-- TOC entry 3349 (class 2606 OID 1600558)
-- Name: UnitOfAnalysisTagLink_uoaId_uoaTagId_key; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_uoaId_uoaTagId_key" UNIQUE ("uoaId", "uoaTagId");


--
-- TOC entry 3344 (class 2606 OID 1600560)
-- Name: UnitOfAnalysisTag_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_pkey" PRIMARY KEY (id);


--
-- TOC entry 3352 (class 2606 OID 1600562)
-- Name: UnitOfAnalysisType_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisType"
    ADD CONSTRAINT "UnitOfAnalysisType_pkey" PRIMARY KEY (id);


--
-- TOC entry 3334 (class 2606 OID 1600564)
-- Name: UnitOfAnalysis_name_key; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_name_key" UNIQUE (name);


--
-- TOC entry 3336 (class 2606 OID 1600566)
-- Name: UnitOfAnalysis_name_key1; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_name_key1" UNIQUE (name);


--
-- TOC entry 3338 (class 2606 OID 1600568)
-- Name: UnitOfAnalysis_name_key2; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_name_key2" UNIQUE (name);


--
-- TOC entry 3340 (class 2606 OID 1600570)
-- Name: UnitOfAnalysis_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_pkey" PRIMARY KEY (id);


--
-- TOC entry 3354 (class 2606 OID 1600572)
-- Name: UserGroups_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UserGroups"
    ADD CONSTRAINT "UserGroups_pkey" PRIMARY KEY ("userId", "groupId");


--
-- TOC entry 3356 (class 2606 OID 1600574)
-- Name: UserRights_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UserRights"
    ADD CONSTRAINT "UserRights_pkey" PRIMARY KEY ("userID", "rightID");


--
-- TOC entry 3358 (class 2606 OID 1600576)
-- Name: UserUOA_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UserUOA"
    ADD CONSTRAINT "UserUOA_pkey" PRIMARY KEY ("UserId", "UOAid");


--
-- TOC entry 3360 (class 2606 OID 1600578)
-- Name: Users_email_key; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- TOC entry 3362 (class 2606 OID 1600580)
-- Name: Users_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- TOC entry 3365 (class 2606 OID 1600582)
-- Name: Visualizations_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Visualizations"
    ADD CONSTRAINT "Visualizations_pkey" PRIMARY KEY (id);


--
-- TOC entry 3367 (class 2606 OID 1600584)
-- Name: WorkflowStepGroups_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "WorkflowStepGroups"
    ADD CONSTRAINT "WorkflowStepGroups_pkey" PRIMARY KEY ("stepId", "groupId");


--
-- TOC entry 3369 (class 2606 OID 1600586)
-- Name: WorkflowSteps_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "WorkflowSteps"
    ADD CONSTRAINT "WorkflowSteps_pkey" PRIMARY KEY (id);


--
-- TOC entry 3371 (class 2606 OID 1600588)
-- Name: Workflows_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Workflows"
    ADD CONSTRAINT "Workflows_pkey" PRIMARY KEY (id);


--
-- TOC entry 3373 (class 2606 OID 1600590)
-- Name: Workflows_productId_key; Type: CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Workflows"
    ADD CONSTRAINT "Workflows_productId_key" UNIQUE ("productId");


SET search_path = test, pg_catalog;

--
-- TOC entry 3383 (class 2606 OID 1601715)
-- Name: AccessMatrices_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "AccessMatrices"
    ADD CONSTRAINT "AccessMatrices_pkey" PRIMARY KEY (id);


--
-- TOC entry 3375 (class 2606 OID 1601685)
-- Name: AccessPermissions_matrixId_roleId_rightId_key; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "AccessPermissions"
    ADD CONSTRAINT "AccessPermissions_matrixId_roleId_rightId_key" UNIQUE ("matrixId", "roleId", "rightId");


--
-- TOC entry 3377 (class 2606 OID 1601683)
-- Name: AccessPermissions_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "AccessPermissions"
    ADD CONSTRAINT "AccessPermissions_pkey" PRIMARY KEY (id);


--
-- TOC entry 3379 (class 2606 OID 1601696)
-- Name: AnswerAttachments_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "AnswerAttachments"
    ADD CONSTRAINT "AnswerAttachments_pkey" PRIMARY KEY (id);


--
-- TOC entry 3381 (class 2606 OID 1601706)
-- Name: AttachmentAttempts_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "AttachmentAttempts"
    ADD CONSTRAINT "AttachmentAttempts_pkey" PRIMARY KEY (key);


--
-- TOC entry 3481 (class 2606 OID 1602090)
-- Name: AttachmentLinks_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "AttachmentLinks"
    ADD CONSTRAINT "AttachmentLinks_pkey" PRIMARY KEY ("essenceId", "entityId");


--
-- TOC entry 3389 (class 2606 OID 1601750)
-- Name: Attachments_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Attachments"
    ADD CONSTRAINT "Attachments_pkey" PRIMARY KEY (id);


--
-- TOC entry 3385 (class 2606 OID 1601730)
-- Name: Discussions_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_pkey" PRIMARY KEY (id);


--
-- TOC entry 3393 (class 2606 OID 1601770)
-- Name: Essences_fileName_key; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_fileName_key" UNIQUE ("fileName");


--
-- TOC entry 3395 (class 2606 OID 1601768)
-- Name: Essences_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_pkey" PRIMARY KEY (id);


--
-- TOC entry 3397 (class 2606 OID 1601772)
-- Name: Essences_tableName_key; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_tableName_key" UNIQUE ("tableName");


--
-- TOC entry 3387 (class 2606 OID 1601740)
-- Name: Groups_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Groups"
    ADD CONSTRAINT "Groups_pkey" PRIMARY KEY (id);


--
-- TOC entry 3391 (class 2606 OID 1601759)
-- Name: IndexQuestionWeights_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "IndexQuestionWeights"
    ADD CONSTRAINT "IndexQuestionWeights_pkey" PRIMARY KEY ("indexId", "questionId");


--
-- TOC entry 3485 (class 2606 OID 1602103)
-- Name: IndexSubindexWeights_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "IndexSubindexWeights"
    ADD CONSTRAINT "IndexSubindexWeights_pkey" PRIMARY KEY ("indexId", "subindexId");


--
-- TOC entry 3433 (class 2606 OID 1601908)
-- Name: Indexes_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Indexes"
    ADD CONSTRAINT "Indexes_pkey" PRIMARY KEY (id);


--
-- TOC entry 3400 (class 2606 OID 1601782)
-- Name: Languages_code_key; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Languages"
    ADD CONSTRAINT "Languages_code_key" UNIQUE (code);


--
-- TOC entry 3402 (class 2606 OID 1601780)
-- Name: Languages_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Languages"
    ADD CONSTRAINT "Languages_pkey" PRIMARY KEY (id);


--
-- TOC entry 3410 (class 2606 OID 1601822)
-- Name: Logs_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Logs"
    ADD CONSTRAINT "Logs_pkey" PRIMARY KEY (id);


--
-- TOC entry 3404 (class 2606 OID 1601795)
-- Name: Notifications_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_pkey" PRIMARY KEY (id);


--
-- TOC entry 3419 (class 2606 OID 1601865)
-- Name: Organizations_adminUserId_key; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_adminUserId_key" UNIQUE ("adminUserId");


--
-- TOC entry 3421 (class 2606 OID 1601863)
-- Name: Organizations_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_pkey" PRIMARY KEY (id);


--
-- TOC entry 3431 (class 2606 OID 1601898)
-- Name: ProductUOA_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_pkey" PRIMARY KEY ("productId", "UOAid");


--
-- TOC entry 3417 (class 2606 OID 1601852)
-- Name: Products_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_pkey" PRIMARY KEY (id);


--
-- TOC entry 3406 (class 2606 OID 1601809)
-- Name: Projects_codeName_key; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_codeName_key" UNIQUE ("codeName");


--
-- TOC entry 3408 (class 2606 OID 1601807)
-- Name: Projects_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_pkey" PRIMARY KEY (id);


--
-- TOC entry 3415 (class 2606 OID 1601840)
-- Name: Rights_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Rights"
    ADD CONSTRAINT "Rights_pkey" PRIMARY KEY (id);


--
-- TOC entry 3423 (class 2606 OID 1601871)
-- Name: RolesRights_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "RolesRights_pkey" PRIMARY KEY ("roleID", "rightID");


--
-- TOC entry 3412 (class 2606 OID 1601830)
-- Name: Roles_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Roles"
    ADD CONSTRAINT "Roles_pkey" PRIMARY KEY (id);


--
-- TOC entry 3429 (class 2606 OID 1601892)
-- Name: SubindexWeights_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "SubindexWeights"
    ADD CONSTRAINT "SubindexWeights_pkey" PRIMARY KEY ("subindexId", "questionId");


--
-- TOC entry 3426 (class 2606 OID 1601882)
-- Name: Subindexes_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Subindexes"
    ADD CONSTRAINT "Subindexes_pkey" PRIMARY KEY (id);


--
-- TOC entry 3487 (class 2606 OID 1602114)
-- Name: SurveyAnswers_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_pkey" PRIMARY KEY (id);


--
-- TOC entry 3461 (class 2606 OID 1602009)
-- Name: SurveyQuestionOptions_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "SurveyQuestionOptions"
    ADD CONSTRAINT "SurveyQuestionOptions_pkey" PRIMARY KEY (id);


--
-- TOC entry 3446 (class 2606 OID 1601964)
-- Name: SurveyQuestions_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "SurveyQuestions"
    ADD CONSTRAINT "SurveyQuestions_pkey" PRIMARY KEY (id);


--
-- TOC entry 3467 (class 2606 OID 1602031)
-- Name: Surveys_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Surveys"
    ADD CONSTRAINT "Surveys_pkey" PRIMARY KEY (id);


--
-- TOC entry 3469 (class 2606 OID 1602042)
-- Name: Tasks_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_pkey" PRIMARY KEY (id);


--
-- TOC entry 3444 (class 2606 OID 1601950)
-- Name: Translations_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_pkey" PRIMARY KEY ("essenceId", "entityId", field, "langId");


--
-- TOC entry 3448 (class 2606 OID 1601972)
-- Name: UnitOfAnalysisClassType_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysisClassType"
    ADD CONSTRAINT "UnitOfAnalysisClassType_pkey" PRIMARY KEY (id);


--
-- TOC entry 3455 (class 2606 OID 1601994)
-- Name: UnitOfAnalysisTagLink_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_pkey" PRIMARY KEY (id);


--
-- TOC entry 3458 (class 2606 OID 1601996)
-- Name: UnitOfAnalysisTagLink_uoaId_uoaTagId_key; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_uoaId_uoaTagId_key" UNIQUE ("uoaId", "uoaTagId");


--
-- TOC entry 3436 (class 2606 OID 1601917)
-- Name: UnitOfAnalysisTag_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_pkey" PRIMARY KEY (id);


--
-- TOC entry 3438 (class 2606 OID 1601925)
-- Name: UnitOfAnalysisType_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysisType"
    ADD CONSTRAINT "UnitOfAnalysisType_pkey" PRIMARY KEY (id);


--
-- TOC entry 3440 (class 2606 OID 1601941)
-- Name: UnitOfAnalysis_name_key; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_name_key" UNIQUE (name);


--
-- TOC entry 3442 (class 2606 OID 1601939)
-- Name: UnitOfAnalysis_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_pkey" PRIMARY KEY (id);


--
-- TOC entry 3471 (class 2606 OID 1602048)
-- Name: UserGroups_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "UserGroups"
    ADD CONSTRAINT "UserGroups_pkey" PRIMARY KEY ("userId", "groupId");


--
-- TOC entry 3463 (class 2606 OID 1602015)
-- Name: UserRights_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "UserRights"
    ADD CONSTRAINT "UserRights_pkey" PRIMARY KEY ("userID", "rightID");


--
-- TOC entry 3465 (class 2606 OID 1602020)
-- Name: UserUOA_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "UserUOA"
    ADD CONSTRAINT "UserUOA_pkey" PRIMARY KEY ("UserId", "UOAid");


--
-- TOC entry 3450 (class 2606 OID 1601986)
-- Name: Users_email_key; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- TOC entry 3452 (class 2606 OID 1601984)
-- Name: Users_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- TOC entry 3473 (class 2606 OID 1602057)
-- Name: Visualizations_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Visualizations"
    ADD CONSTRAINT "Visualizations_pkey" PRIMARY KEY (id);


--
-- TOC entry 3483 (class 2606 OID 1602095)
-- Name: WorkflowStepGroups_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "WorkflowStepGroups"
    ADD CONSTRAINT "WorkflowStepGroups_pkey" PRIMARY KEY ("stepId", "groupId");


--
-- TOC entry 3479 (class 2606 OID 1602081)
-- Name: WorkflowSteps_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "WorkflowSteps"
    ADD CONSTRAINT "WorkflowSteps_pkey" PRIMARY KEY (id);


--
-- TOC entry 3475 (class 2606 OID 1602068)
-- Name: Workflows_pkey; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Workflows"
    ADD CONSTRAINT "Workflows_pkey" PRIMARY KEY (id);


--
-- TOC entry 3477 (class 2606 OID 1602070)
-- Name: Workflows_productId_key; Type: CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Workflows"
    ADD CONSTRAINT "Workflows_productId_key" UNIQUE ("productId");


SET search_path = public, pg_catalog;

--
-- TOC entry 3231 (class 1259 OID 1600701)
-- Name: Essences_upper_idx; Type: INDEX; Schema: public; Owner: indabauser
--

CREATE UNIQUE INDEX "Essences_upper_idx" ON "Essences" USING btree (upper((name)::text));


--
-- TOC entry 3240 (class 1259 OID 1600702)
-- Name: Rights_action_idx; Type: INDEX; Schema: public; Owner: indabauser
--

CREATE UNIQUE INDEX "Rights_action_idx" ON "Rights" USING btree (action);


--
-- TOC entry 3248 (class 1259 OID 1600703)
-- Name: Token_body_idx; Type: INDEX; Schema: public; Owner: indabauser
--

CREATE UNIQUE INDEX "Token_body_idx" ON "Token" USING btree (body);


--
-- TOC entry 3253 (class 1259 OID 1600704)
-- Name: fki_roleID; Type: INDEX; Schema: public; Owner: indabauser
--

CREATE INDEX "fki_roleID" ON "Users" USING btree ("roleID");


--
-- TOC entry 3245 (class 1259 OID 1600705)
-- Name: fki_rolesrights_rightID; Type: INDEX; Schema: public; Owner: indabauser
--

CREATE INDEX "fki_rolesrights_rightID" ON "RolesRights" USING btree ("rightID");


SET search_path = sceleton, pg_catalog;

--
-- TOC entry 3278 (class 1259 OID 1600706)
-- Name: Essences_upper_idx; Type: INDEX; Schema: sceleton; Owner: indabauser
--

CREATE UNIQUE INDEX "Essences_upper_idx" ON "Essences" USING btree (upper((name)::text));


--
-- TOC entry 3287 (class 1259 OID 1600707)
-- Name: Indexes_productId_idx; Type: INDEX; Schema: sceleton; Owner: indabauser
--

CREATE INDEX "Indexes_productId_idx" ON "Indexes" USING btree ("productId");


--
-- TOC entry 3308 (class 1259 OID 1600708)
-- Name: Rights_action_idx; Type: INDEX; Schema: sceleton; Owner: indabauser
--

CREATE UNIQUE INDEX "Rights_action_idx" ON "Rights" USING btree (action);


--
-- TOC entry 3315 (class 1259 OID 1600709)
-- Name: RolesRights_rightID_idx; Type: INDEX; Schema: sceleton; Owner: indabauser
--

CREATE INDEX "RolesRights_rightID_idx" ON "RolesRights" USING btree ("rightID");


--
-- TOC entry 3320 (class 1259 OID 1600710)
-- Name: Subindexes_productId_idx; Type: INDEX; Schema: sceleton; Owner: indabauser
--

CREATE INDEX "Subindexes_productId_idx" ON "Subindexes" USING btree ("productId");


--
-- TOC entry 3347 (class 1259 OID 1600711)
-- Name: UnitOfAnalysisTagLink_uoaId_idx; Type: INDEX; Schema: sceleton; Owner: indabauser
--

CREATE INDEX "UnitOfAnalysisTagLink_uoaId_idx" ON "UnitOfAnalysisTagLink" USING btree ("uoaId");


--
-- TOC entry 3350 (class 1259 OID 1600712)
-- Name: UnitOfAnalysisTagLink_uoaTagId_idx; Type: INDEX; Schema: sceleton; Owner: indabauser
--

CREATE INDEX "UnitOfAnalysisTagLink_uoaTagId_idx" ON "UnitOfAnalysisTagLink" USING btree ("uoaTagId");


--
-- TOC entry 3363 (class 1259 OID 1600713)
-- Name: Users_roleID_idx; Type: INDEX; Schema: sceleton; Owner: indabauser
--

CREATE INDEX "Users_roleID_idx" ON "Users" USING btree ("roleID");


SET search_path = test, pg_catalog;

--
-- TOC entry 3398 (class 1259 OID 1601773)
-- Name: Essences_upper_idx; Type: INDEX; Schema: test; Owner: indaba
--

CREATE UNIQUE INDEX "Essences_upper_idx" ON "Essences" USING btree (upper((name)::text));


--
-- TOC entry 3434 (class 1259 OID 1601909)
-- Name: Indexes_productId_idx; Type: INDEX; Schema: test; Owner: indaba
--

CREATE INDEX "Indexes_productId_idx" ON "Indexes" USING btree ("productId");


--
-- TOC entry 3413 (class 1259 OID 1601841)
-- Name: Rights_action_idx; Type: INDEX; Schema: test; Owner: indaba
--

CREATE UNIQUE INDEX "Rights_action_idx" ON "Rights" USING btree (action);


--
-- TOC entry 3424 (class 1259 OID 1601872)
-- Name: RolesRights_rightID_idx; Type: INDEX; Schema: test; Owner: indaba
--

CREATE INDEX "RolesRights_rightID_idx" ON "RolesRights" USING btree ("rightID");


--
-- TOC entry 3427 (class 1259 OID 1601883)
-- Name: Subindexes_productId_idx; Type: INDEX; Schema: test; Owner: indaba
--

CREATE INDEX "Subindexes_productId_idx" ON "Subindexes" USING btree ("productId");


--
-- TOC entry 3456 (class 1259 OID 1601997)
-- Name: UnitOfAnalysisTagLink_uoaId_idx; Type: INDEX; Schema: test; Owner: indaba
--

CREATE INDEX "UnitOfAnalysisTagLink_uoaId_idx" ON "UnitOfAnalysisTagLink" USING btree ("uoaId");


--
-- TOC entry 3459 (class 1259 OID 1601998)
-- Name: UnitOfAnalysisTagLink_uoaTagId_idx; Type: INDEX; Schema: test; Owner: indaba
--

CREATE INDEX "UnitOfAnalysisTagLink_uoaTagId_idx" ON "UnitOfAnalysisTagLink" USING btree ("uoaTagId");


--
-- TOC entry 3453 (class 1259 OID 1601987)
-- Name: Users_roleID_idx; Type: INDEX; Schema: test; Owner: indaba
--

CREATE INDEX "Users_roleID_idx" ON "Users" USING btree ("roleID");


SET search_path = public, pg_catalog;

--
-- TOC entry 3661 (class 2620 OID 1600722)
-- Name: tr_delete_token; Type: TRIGGER; Schema: public; Owner: indabauser
--

CREATE TRIGGER tr_delete_token BEFORE INSERT ON "Token" FOR EACH ROW EXECUTE PROCEDURE twc_delete_old_token();


--
-- TOC entry 3662 (class 2620 OID 1600723)
-- Name: users_before_update; Type: TRIGGER; Schema: public; Owner: indabauser
--

CREATE TRIGGER users_before_update BEFORE UPDATE ON "Users" FOR EACH ROW EXECUTE PROCEDURE users_before_update();


--
-- TOC entry 3489 (class 2606 OID 1600724)
-- Name: Logs_essence_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Logs"
    ADD CONSTRAINT "Logs_essence_fkey" FOREIGN KEY (essence) REFERENCES "Essences"(id) ON DELETE SET NULL;


--
-- TOC entry 3488 (class 2606 OID 1600729)
-- Name: Logs_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Logs"
    ADD CONSTRAINT "Logs_user_fkey" FOREIGN KEY (userid) REFERENCES "Users"(id) ON DELETE SET NULL;


--
-- TOC entry 3492 (class 2606 OID 1600734)
-- Name: Notifications_essenceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_essenceId_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id) ON DELETE SET NULL;


--
-- TOC entry 3491 (class 2606 OID 1600739)
-- Name: Notifications_userFrom_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_userFrom_fkey" FOREIGN KEY ("userFrom") REFERENCES "Users"(id) ON DELETE CASCADE;


--
-- TOC entry 3490 (class 2606 OID 1600744)
-- Name: Notifications_userTo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_userTo_fkey" FOREIGN KEY ("userTo") REFERENCES "Users"(id) ON DELETE CASCADE;


--
-- TOC entry 3493 (class 2606 OID 1600749)
-- Name: Rights_essence_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Rights"
    ADD CONSTRAINT "Rights_essence_id_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- TOC entry 3495 (class 2606 OID 1600754)
-- Name: RolesRights_roleID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "RolesRights_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "Roles"(id);


--
-- TOC entry 3497 (class 2606 OID 1600759)
-- Name: Users_langId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3496 (class 2606 OID 1600764)
-- Name: Users_roleID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "Roles"(id);


--
-- TOC entry 3494 (class 2606 OID 1600769)
-- Name: rolesrights_rightID; Type: FK CONSTRAINT; Schema: public; Owner: indabauser
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "rolesrights_rightID" FOREIGN KEY ("rightID") REFERENCES "Rights"(id);


SET search_path = sceleton, pg_catalog;

--
-- TOC entry 3499 (class 2606 OID 1600774)
-- Name: AnswerAttachments_answerId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "AnswerAttachments"
    ADD CONSTRAINT "AnswerAttachments_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "SurveyAnswers"(id);


--
-- TOC entry 3498 (class 2606 OID 1600779)
-- Name: AnswerAttachments_owner_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "AnswerAttachments"
    ADD CONSTRAINT "AnswerAttachments_owner_fkey" FOREIGN KEY (owner) REFERENCES "Users"(id);


--
-- TOC entry 3500 (class 2606 OID 1600784)
-- Name: AttachmentLinks_essenceId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "AttachmentLinks"
    ADD CONSTRAINT "AttachmentLinks_essenceId_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- TOC entry 3506 (class 2606 OID 1600789)
-- Name: Discussions_questionId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions"(id);


--
-- TOC entry 3505 (class 2606 OID 1600794)
-- Name: Discussions_returnTaskId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_returnTaskId_fkey" FOREIGN KEY ("returnTaskId") REFERENCES "Tasks"(id);


--
-- TOC entry 3504 (class 2606 OID 1600799)
-- Name: Discussions_stepFromId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_stepFromId_fkey" FOREIGN KEY ("stepFromId") REFERENCES "WorkflowSteps"(id);


--
-- TOC entry 3503 (class 2606 OID 1600804)
-- Name: Discussions_stepId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowSteps"(id);


--
-- TOC entry 3502 (class 2606 OID 1600809)
-- Name: Discussions_taskId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Tasks"(id);


--
-- TOC entry 3501 (class 2606 OID 1600814)
-- Name: Discussions_userFromId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_userFromId_fkey" FOREIGN KEY ("userFromId") REFERENCES "Users"(id);


--
-- TOC entry 3508 (class 2606 OID 1600819)
-- Name: Groups_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Groups"
    ADD CONSTRAINT "Groups_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3507 (class 2606 OID 1600824)
-- Name: Groups_organizationId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Groups"
    ADD CONSTRAINT "Groups_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- TOC entry 3510 (class 2606 OID 1600829)
-- Name: IndexQuestionWeights_indexId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "IndexQuestionWeights"
    ADD CONSTRAINT "IndexQuestionWeights_indexId_fkey" FOREIGN KEY ("indexId") REFERENCES "Indexes"(id);


--
-- TOC entry 3509 (class 2606 OID 1600834)
-- Name: IndexQuestionWeights_questionId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "IndexQuestionWeights"
    ADD CONSTRAINT "IndexQuestionWeights_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions"(id);


--
-- TOC entry 3512 (class 2606 OID 1600839)
-- Name: IndexSubindexWeights_indexId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "IndexSubindexWeights"
    ADD CONSTRAINT "IndexSubindexWeights_indexId_fkey" FOREIGN KEY ("indexId") REFERENCES "Indexes"(id);


--
-- TOC entry 3511 (class 2606 OID 1600844)
-- Name: IndexSubindexWeights_subindexId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "IndexSubindexWeights"
    ADD CONSTRAINT "IndexSubindexWeights_subindexId_fkey" FOREIGN KEY ("subindexId") REFERENCES "Subindexes"(id);


--
-- TOC entry 3513 (class 2606 OID 1600849)
-- Name: Indexes_productId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Indexes"
    ADD CONSTRAINT "Indexes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- TOC entry 3515 (class 2606 OID 1600854)
-- Name: Logs_essence_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Logs"
    ADD CONSTRAINT "Logs_essence_fkey" FOREIGN KEY (essence) REFERENCES "Essences"(id) ON DELETE SET NULL;


--
-- TOC entry 3514 (class 2606 OID 1600859)
-- Name: Logs_user_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Logs"
    ADD CONSTRAINT "Logs_user_fkey" FOREIGN KEY ("user") REFERENCES "Users"(id) ON DELETE SET NULL;


--
-- TOC entry 3518 (class 2606 OID 1600864)
-- Name: Notifications_essenceId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_essenceId_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id) ON DELETE SET NULL;


--
-- TOC entry 3517 (class 2606 OID 1600869)
-- Name: Notifications_userFrom_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_userFrom_fkey" FOREIGN KEY ("userFrom") REFERENCES "Users"(id) ON DELETE CASCADE;


--
-- TOC entry 3516 (class 2606 OID 1600874)
-- Name: Notifications_userTo_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_userTo_fkey" FOREIGN KEY ("userTo") REFERENCES "Users"(id) ON DELETE CASCADE;


--
-- TOC entry 3519 (class 2606 OID 1600879)
-- Name: Organizations_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3522 (class 2606 OID 1600884)
-- Name: ProductUOA_UOAid_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_UOAid_fkey" FOREIGN KEY ("UOAid") REFERENCES "UnitOfAnalysis"(id);


--
-- TOC entry 3521 (class 2606 OID 1600889)
-- Name: ProductUOA_currentStepId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_currentStepId_fkey" FOREIGN KEY ("currentStepId") REFERENCES "WorkflowSteps"(id);


--
-- TOC entry 3520 (class 2606 OID 1600894)
-- Name: ProductUOA_productId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- TOC entry 3526 (class 2606 OID 1600899)
-- Name: Products_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3525 (class 2606 OID 1600904)
-- Name: Products_originalLangId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_originalLangId_fkey" FOREIGN KEY ("originalLangId") REFERENCES "Languages"(id);


--
-- TOC entry 3524 (class 2606 OID 1600909)
-- Name: Products_projectId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Projects"(id);


--
-- TOC entry 3523 (class 2606 OID 1600914)
-- Name: Products_surveyId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Surveys"(id);


--
-- TOC entry 3530 (class 2606 OID 1600919)
-- Name: Projects_accessMatrixId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_accessMatrixId_fkey" FOREIGN KEY ("matrixId") REFERENCES "AccessMatrices"(id);


--
-- TOC entry 3529 (class 2606 OID 1600924)
-- Name: Projects_adminUserId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "Users"(id);


--
-- TOC entry 3528 (class 2606 OID 1600929)
-- Name: Projects_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3527 (class 2606 OID 1600934)
-- Name: Projects_organizationId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- TOC entry 3531 (class 2606 OID 1600939)
-- Name: Rights_essence_id_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Rights"
    ADD CONSTRAINT "Rights_essence_id_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- TOC entry 3533 (class 2606 OID 1600944)
-- Name: RolesRights_roleID_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "RolesRights_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "Roles"(id);


--
-- TOC entry 3535 (class 2606 OID 1600949)
-- Name: SubindexWeights_questionId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "SubindexWeights"
    ADD CONSTRAINT "SubindexWeights_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions"(id);


--
-- TOC entry 3534 (class 2606 OID 1600954)
-- Name: SubindexWeights_subindexId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "SubindexWeights"
    ADD CONSTRAINT "SubindexWeights_subindexId_fkey" FOREIGN KEY ("subindexId") REFERENCES "Subindexes"(id);


--
-- TOC entry 3536 (class 2606 OID 1600959)
-- Name: Subindexes_productId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Subindexes"
    ADD CONSTRAINT "Subindexes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- TOC entry 3542 (class 2606 OID 1600964)
-- Name: SurveyAnswers_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3541 (class 2606 OID 1600969)
-- Name: SurveyAnswers_productId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- TOC entry 3540 (class 2606 OID 1600974)
-- Name: SurveyAnswers_questionId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions"(id);


--
-- TOC entry 3539 (class 2606 OID 1600979)
-- Name: SurveyAnswers_surveyId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Surveys"(id);


--
-- TOC entry 3538 (class 2606 OID 1600984)
-- Name: SurveyAnswers_userId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"(id);


--
-- TOC entry 3537 (class 2606 OID 1600989)
-- Name: SurveyAnswers_wfStepId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_wfStepId_fkey" FOREIGN KEY ("wfStepId") REFERENCES "WorkflowSteps"(id);


--
-- TOC entry 3544 (class 2606 OID 1600994)
-- Name: SurveyQuestionOptions_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "SurveyQuestionOptions"
    ADD CONSTRAINT "SurveyQuestionOptions_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3546 (class 2606 OID 1600999)
-- Name: SurveyQuestions_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "SurveyQuestions"
    ADD CONSTRAINT "SurveyQuestions_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3545 (class 2606 OID 1601004)
-- Name: SurveyQuestions_surveyId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "SurveyQuestions"
    ADD CONSTRAINT "SurveyQuestions_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Surveys"(id);


--
-- TOC entry 3548 (class 2606 OID 1601009)
-- Name: Surveys_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Surveys"
    ADD CONSTRAINT "Surveys_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3547 (class 2606 OID 1601014)
-- Name: Surveys_projectId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Surveys"
    ADD CONSTRAINT "Surveys_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Projects"(id);


--
-- TOC entry 3553 (class 2606 OID 1601019)
-- Name: Tasks_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3552 (class 2606 OID 1601024)
-- Name: Tasks_productId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- TOC entry 3551 (class 2606 OID 1601029)
-- Name: Tasks_stepId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowSteps"(id);


--
-- TOC entry 3550 (class 2606 OID 1601034)
-- Name: Tasks_uoaId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_uoaId_fkey" FOREIGN KEY ("uoaId") REFERENCES "UnitOfAnalysis"(id);


--
-- TOC entry 3549 (class 2606 OID 1601039)
-- Name: Tasks_userId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"(id);


--
-- TOC entry 3555 (class 2606 OID 1601044)
-- Name: Translations_essence_id_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_essence_id_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- TOC entry 3554 (class 2606 OID 1601049)
-- Name: Translations_lang_id_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_lang_id_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3560 (class 2606 OID 1601054)
-- Name: UnitOfAnalysisClassType_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisClassType"
    ADD CONSTRAINT "UnitOfAnalysisClassType_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3564 (class 2606 OID 1601059)
-- Name: UnitOfAnalysisTagLink_uoaId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_uoaId_fkey" FOREIGN KEY ("uoaId") REFERENCES "UnitOfAnalysis"(id);


--
-- TOC entry 3563 (class 2606 OID 1601064)
-- Name: UnitOfAnalysisTagLink_uoaTagId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_uoaTagId_fkey" FOREIGN KEY ("uoaTagId") REFERENCES "UnitOfAnalysisTag"(id);


--
-- TOC entry 3562 (class 2606 OID 1601069)
-- Name: UnitOfAnalysisTag_classTypeId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_classTypeId_fkey" FOREIGN KEY ("classTypeId") REFERENCES "UnitOfAnalysisClassType"(id);


--
-- TOC entry 3561 (class 2606 OID 1601074)
-- Name: UnitOfAnalysisTag_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3565 (class 2606 OID 1601079)
-- Name: UnitOfAnalysisType_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysisType"
    ADD CONSTRAINT "UnitOfAnalysisType_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3559 (class 2606 OID 1601084)
-- Name: UnitOfAnalysis_creatorId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Users"(id);


--
-- TOC entry 3558 (class 2606 OID 1601089)
-- Name: UnitOfAnalysis_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3557 (class 2606 OID 1601094)
-- Name: UnitOfAnalysis_ownerId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Users"(id);


--
-- TOC entry 3556 (class 2606 OID 1601099)
-- Name: UnitOfAnalysis_unitOfAnalysisType_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_unitOfAnalysisType_fkey" FOREIGN KEY ("unitOfAnalysisType") REFERENCES "UnitOfAnalysisType"(id);


--
-- TOC entry 3567 (class 2606 OID 1601104)
-- Name: UserGroups_groupId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UserGroups"
    ADD CONSTRAINT "UserGroups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Groups"(id);


--
-- TOC entry 3566 (class 2606 OID 1601109)
-- Name: UserGroups_userId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UserGroups"
    ADD CONSTRAINT "UserGroups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"(id);


--
-- TOC entry 3569 (class 2606 OID 1601114)
-- Name: UserUOA_UOAid_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UserUOA"
    ADD CONSTRAINT "UserUOA_UOAid_fkey" FOREIGN KEY ("UOAid") REFERENCES "UnitOfAnalysis"(id);


--
-- TOC entry 3568 (class 2606 OID 1601119)
-- Name: UserUOA_UserId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "UserUOA"
    ADD CONSTRAINT "UserUOA_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"(id);


--
-- TOC entry 3572 (class 2606 OID 1601124)
-- Name: Users_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3571 (class 2606 OID 1601129)
-- Name: Users_organizationId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- TOC entry 3570 (class 2606 OID 1601134)
-- Name: Users_roleID_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "Roles"(id);


--
-- TOC entry 3574 (class 2606 OID 1601139)
-- Name: Visualizations_organizationId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Visualizations"
    ADD CONSTRAINT "Visualizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- TOC entry 3573 (class 2606 OID 1601144)
-- Name: Visualizations_productId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Visualizations"
    ADD CONSTRAINT "Visualizations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- TOC entry 3576 (class 2606 OID 1601149)
-- Name: WorkflowStepGroups_groupId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "WorkflowStepGroups"
    ADD CONSTRAINT "WorkflowStepGroups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Groups"(id);


--
-- TOC entry 3575 (class 2606 OID 1601154)
-- Name: WorkflowStepGroups_stepId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "WorkflowStepGroups"
    ADD CONSTRAINT "WorkflowStepGroups_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowSteps"(id);


--
-- TOC entry 3578 (class 2606 OID 1601159)
-- Name: WorkflowSteps_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "WorkflowSteps"
    ADD CONSTRAINT "WorkflowSteps_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3577 (class 2606 OID 1601164)
-- Name: WorkflowSteps_worflowId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "WorkflowSteps"
    ADD CONSTRAINT "WorkflowSteps_worflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflows"(id);


--
-- TOC entry 3579 (class 2606 OID 1601169)
-- Name: Workflows_productId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "Workflows"
    ADD CONSTRAINT "Workflows_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- TOC entry 3532 (class 2606 OID 1601174)
-- Name: rolesrights_rightID; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "rolesrights_rightID" FOREIGN KEY ("rightID") REFERENCES "Rights"(id);


--
-- TOC entry 3543 (class 2606 OID 1601179)
-- Name: surveyQuestionOptions_questionId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indabauser
--

ALTER TABLE ONLY "SurveyQuestionOptions"
    ADD CONSTRAINT "surveyQuestionOptions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions"(id);


SET search_path = test, pg_catalog;

--
-- TOC entry 3581 (class 2606 OID 1602116)
-- Name: AnswerAttachments_answerId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "AnswerAttachments"
    ADD CONSTRAINT "AnswerAttachments_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "SurveyAnswers"(id);


--
-- TOC entry 3580 (class 2606 OID 1602121)
-- Name: AnswerAttachments_owner_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "AnswerAttachments"
    ADD CONSTRAINT "AnswerAttachments_owner_fkey" FOREIGN KEY (owner) REFERENCES "Users"(id);


--
-- TOC entry 3650 (class 2606 OID 1602126)
-- Name: AttachmentLinks_essenceId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "AttachmentLinks"
    ADD CONSTRAINT "AttachmentLinks_essenceId_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- TOC entry 3587 (class 2606 OID 1602131)
-- Name: Discussions_questionId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions"(id);


--
-- TOC entry 3586 (class 2606 OID 1602136)
-- Name: Discussions_returnTaskId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_returnTaskId_fkey" FOREIGN KEY ("returnTaskId") REFERENCES "Tasks"(id);


--
-- TOC entry 3585 (class 2606 OID 1602141)
-- Name: Discussions_stepFromId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_stepFromId_fkey" FOREIGN KEY ("stepFromId") REFERENCES "WorkflowSteps"(id);


--
-- TOC entry 3584 (class 2606 OID 1602146)
-- Name: Discussions_stepId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowSteps"(id);


--
-- TOC entry 3583 (class 2606 OID 1602151)
-- Name: Discussions_taskId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Tasks"(id);


--
-- TOC entry 3582 (class 2606 OID 1602156)
-- Name: Discussions_userFromId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_userFromId_fkey" FOREIGN KEY ("userFromId") REFERENCES "Users"(id);


--
-- TOC entry 3589 (class 2606 OID 1602161)
-- Name: Groups_langId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Groups"
    ADD CONSTRAINT "Groups_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3588 (class 2606 OID 1602166)
-- Name: Groups_organizationId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Groups"
    ADD CONSTRAINT "Groups_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- TOC entry 3591 (class 2606 OID 1602171)
-- Name: IndexQuestionWeights_indexId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "IndexQuestionWeights"
    ADD CONSTRAINT "IndexQuestionWeights_indexId_fkey" FOREIGN KEY ("indexId") REFERENCES "Indexes"(id);


--
-- TOC entry 3590 (class 2606 OID 1602176)
-- Name: IndexQuestionWeights_questionId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "IndexQuestionWeights"
    ADD CONSTRAINT "IndexQuestionWeights_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions"(id);


--
-- TOC entry 3654 (class 2606 OID 1602181)
-- Name: IndexSubindexWeights_indexId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "IndexSubindexWeights"
    ADD CONSTRAINT "IndexSubindexWeights_indexId_fkey" FOREIGN KEY ("indexId") REFERENCES "Indexes"(id);


--
-- TOC entry 3653 (class 2606 OID 1602186)
-- Name: IndexSubindexWeights_subindexId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "IndexSubindexWeights"
    ADD CONSTRAINT "IndexSubindexWeights_subindexId_fkey" FOREIGN KEY ("subindexId") REFERENCES "Subindexes"(id);


--
-- TOC entry 3615 (class 2606 OID 1602191)
-- Name: Indexes_productId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Indexes"
    ADD CONSTRAINT "Indexes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- TOC entry 3600 (class 2606 OID 1602196)
-- Name: Logs_essence_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Logs"
    ADD CONSTRAINT "Logs_essence_fkey" FOREIGN KEY (essence) REFERENCES "Essences"(id) ON DELETE SET NULL;


--
-- TOC entry 3599 (class 2606 OID 1602201)
-- Name: Logs_user_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Logs"
    ADD CONSTRAINT "Logs_user_fkey" FOREIGN KEY ("user") REFERENCES "Users"(id) ON DELETE SET NULL;


--
-- TOC entry 3594 (class 2606 OID 1602206)
-- Name: Notifications_essenceId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_essenceId_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id) ON DELETE SET NULL;


--
-- TOC entry 3593 (class 2606 OID 1602211)
-- Name: Notifications_userFrom_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_userFrom_fkey" FOREIGN KEY ("userFrom") REFERENCES "Users"(id) ON DELETE CASCADE;


--
-- TOC entry 3592 (class 2606 OID 1602216)
-- Name: Notifications_userTo_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_userTo_fkey" FOREIGN KEY ("userTo") REFERENCES "Users"(id) ON DELETE CASCADE;


--
-- TOC entry 3606 (class 2606 OID 1602221)
-- Name: Organizations_langId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3614 (class 2606 OID 1602226)
-- Name: ProductUOA_UOAid_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_UOAid_fkey" FOREIGN KEY ("UOAid") REFERENCES "UnitOfAnalysis"(id);


--
-- TOC entry 3613 (class 2606 OID 1602231)
-- Name: ProductUOA_currentStepId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_currentStepId_fkey" FOREIGN KEY ("currentStepId") REFERENCES "WorkflowSteps"(id);


--
-- TOC entry 3612 (class 2606 OID 1602236)
-- Name: ProductUOA_productId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- TOC entry 3605 (class 2606 OID 1602241)
-- Name: Products_langId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3604 (class 2606 OID 1602246)
-- Name: Products_originalLangId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_originalLangId_fkey" FOREIGN KEY ("originalLangId") REFERENCES "Languages"(id);


--
-- TOC entry 3603 (class 2606 OID 1602251)
-- Name: Products_projectId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Projects"(id);


--
-- TOC entry 3602 (class 2606 OID 1602256)
-- Name: Products_surveyId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Surveys"(id);


--
-- TOC entry 3598 (class 2606 OID 1602261)
-- Name: Projects_accessMatrixId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_accessMatrixId_fkey" FOREIGN KEY ("matrixId") REFERENCES "AccessMatrices"(id);


--
-- TOC entry 3597 (class 2606 OID 1602266)
-- Name: Projects_adminUserId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "Users"(id);


--
-- TOC entry 3596 (class 2606 OID 1602271)
-- Name: Projects_langId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3595 (class 2606 OID 1602276)
-- Name: Projects_organizationId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- TOC entry 3601 (class 2606 OID 1602281)
-- Name: Rights_essence_id_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Rights"
    ADD CONSTRAINT "Rights_essence_id_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- TOC entry 3608 (class 2606 OID 1602286)
-- Name: RolesRights_roleID_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "RolesRights_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "Roles"(id);


--
-- TOC entry 3611 (class 2606 OID 1602291)
-- Name: SubindexWeights_questionId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "SubindexWeights"
    ADD CONSTRAINT "SubindexWeights_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions"(id);


--
-- TOC entry 3610 (class 2606 OID 1602296)
-- Name: SubindexWeights_subindexId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "SubindexWeights"
    ADD CONSTRAINT "SubindexWeights_subindexId_fkey" FOREIGN KEY ("subindexId") REFERENCES "Subindexes"(id);


--
-- TOC entry 3609 (class 2606 OID 1602301)
-- Name: Subindexes_productId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Subindexes"
    ADD CONSTRAINT "Subindexes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- TOC entry 3660 (class 2606 OID 1602306)
-- Name: SurveyAnswers_langId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3659 (class 2606 OID 1602311)
-- Name: SurveyAnswers_productId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- TOC entry 3658 (class 2606 OID 1602316)
-- Name: SurveyAnswers_questionId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions"(id);


--
-- TOC entry 3657 (class 2606 OID 1602321)
-- Name: SurveyAnswers_surveyId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Surveys"(id);


--
-- TOC entry 3656 (class 2606 OID 1602326)
-- Name: SurveyAnswers_userId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"(id);


--
-- TOC entry 3655 (class 2606 OID 1602331)
-- Name: SurveyAnswers_wfStepId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_wfStepId_fkey" FOREIGN KEY ("wfStepId") REFERENCES "WorkflowSteps"(id);


--
-- TOC entry 3634 (class 2606 OID 1602336)
-- Name: SurveyQuestionOptions_langId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "SurveyQuestionOptions"
    ADD CONSTRAINT "SurveyQuestionOptions_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3626 (class 2606 OID 1602341)
-- Name: SurveyQuestions_langId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "SurveyQuestions"
    ADD CONSTRAINT "SurveyQuestions_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3625 (class 2606 OID 1602346)
-- Name: SurveyQuestions_surveyId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "SurveyQuestions"
    ADD CONSTRAINT "SurveyQuestions_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Surveys"(id);


--
-- TOC entry 3638 (class 2606 OID 1602351)
-- Name: Surveys_langId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Surveys"
    ADD CONSTRAINT "Surveys_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3637 (class 2606 OID 1602356)
-- Name: Surveys_projectId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Surveys"
    ADD CONSTRAINT "Surveys_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Projects"(id);


--
-- TOC entry 3642 (class 2606 OID 1602361)
-- Name: Tasks_langId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3641 (class 2606 OID 1602366)
-- Name: Tasks_productId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- TOC entry 3640 (class 2606 OID 1602371)
-- Name: Tasks_stepId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowSteps"(id);


--
-- TOC entry 3639 (class 2606 OID 1602376)
-- Name: Tasks_uoaId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_uoaId_fkey" FOREIGN KEY ("uoaId") REFERENCES "UnitOfAnalysis"(id);


--
-- TOC entry 3624 (class 2606 OID 1602386)
-- Name: Translations_essence_id_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_essence_id_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- TOC entry 3623 (class 2606 OID 1602391)
-- Name: Translations_lang_id_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_lang_id_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3627 (class 2606 OID 1602396)
-- Name: UnitOfAnalysisClassType_langId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysisClassType"
    ADD CONSTRAINT "UnitOfAnalysisClassType_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3632 (class 2606 OID 1602401)
-- Name: UnitOfAnalysisTagLink_uoaId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_uoaId_fkey" FOREIGN KEY ("uoaId") REFERENCES "UnitOfAnalysis"(id);


--
-- TOC entry 3631 (class 2606 OID 1602406)
-- Name: UnitOfAnalysisTagLink_uoaTagId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_uoaTagId_fkey" FOREIGN KEY ("uoaTagId") REFERENCES "UnitOfAnalysisTag"(id);


--
-- TOC entry 3617 (class 2606 OID 1602411)
-- Name: UnitOfAnalysisTag_classTypeId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_classTypeId_fkey" FOREIGN KEY ("classTypeId") REFERENCES "UnitOfAnalysisClassType"(id);


--
-- TOC entry 3616 (class 2606 OID 1602416)
-- Name: UnitOfAnalysisTag_langId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3618 (class 2606 OID 1602421)
-- Name: UnitOfAnalysisType_langId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysisType"
    ADD CONSTRAINT "UnitOfAnalysisType_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3622 (class 2606 OID 1602426)
-- Name: UnitOfAnalysis_creatorId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Users"(id);


--
-- TOC entry 3621 (class 2606 OID 1602431)
-- Name: UnitOfAnalysis_langId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3620 (class 2606 OID 1602436)
-- Name: UnitOfAnalysis_ownerId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Users"(id);


--
-- TOC entry 3619 (class 2606 OID 1602441)
-- Name: UnitOfAnalysis_unitOfAnalysisType_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_unitOfAnalysisType_fkey" FOREIGN KEY ("unitOfAnalysisType") REFERENCES "UnitOfAnalysisType"(id);


--
-- TOC entry 3644 (class 2606 OID 1602446)
-- Name: UserGroups_groupId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "UserGroups"
    ADD CONSTRAINT "UserGroups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Groups"(id);


--
-- TOC entry 3643 (class 2606 OID 1602451)
-- Name: UserGroups_userId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "UserGroups"
    ADD CONSTRAINT "UserGroups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"(id);


--
-- TOC entry 3636 (class 2606 OID 1602456)
-- Name: UserUOA_UOAid_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "UserUOA"
    ADD CONSTRAINT "UserUOA_UOAid_fkey" FOREIGN KEY ("UOAid") REFERENCES "UnitOfAnalysis"(id);


--
-- TOC entry 3635 (class 2606 OID 1602461)
-- Name: UserUOA_UserId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "UserUOA"
    ADD CONSTRAINT "UserUOA_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"(id);


--
-- TOC entry 3630 (class 2606 OID 1602466)
-- Name: Users_langId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3629 (class 2606 OID 1602471)
-- Name: Users_organizationId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- TOC entry 3628 (class 2606 OID 1602476)
-- Name: Users_roleID_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "Roles"(id);


--
-- TOC entry 3646 (class 2606 OID 1602481)
-- Name: Visualizations_organizationId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Visualizations"
    ADD CONSTRAINT "Visualizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- TOC entry 3645 (class 2606 OID 1602486)
-- Name: Visualizations_productId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Visualizations"
    ADD CONSTRAINT "Visualizations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- TOC entry 3652 (class 2606 OID 1602491)
-- Name: WorkflowStepGroups_groupId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "WorkflowStepGroups"
    ADD CONSTRAINT "WorkflowStepGroups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Groups"(id);


--
-- TOC entry 3651 (class 2606 OID 1602496)
-- Name: WorkflowStepGroups_stepId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "WorkflowStepGroups"
    ADD CONSTRAINT "WorkflowStepGroups_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowSteps"(id);


--
-- TOC entry 3649 (class 2606 OID 1602501)
-- Name: WorkflowSteps_langId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "WorkflowSteps"
    ADD CONSTRAINT "WorkflowSteps_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 3648 (class 2606 OID 1602506)
-- Name: WorkflowSteps_worflowId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "WorkflowSteps"
    ADD CONSTRAINT "WorkflowSteps_worflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflows"(id);


--
-- TOC entry 3647 (class 2606 OID 1602511)
-- Name: Workflows_productId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "Workflows"
    ADD CONSTRAINT "Workflows_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- TOC entry 3607 (class 2606 OID 1602516)
-- Name: rolesrights_rightID; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "rolesrights_rightID" FOREIGN KEY ("rightID") REFERENCES "Rights"(id);


--
-- TOC entry 3633 (class 2606 OID 1602521)
-- Name: surveyQuestionOptions_questionId_fkey; Type: FK CONSTRAINT; Schema: test; Owner: indaba
--

ALTER TABLE ONLY "SurveyQuestionOptions"
    ADD CONSTRAINT "surveyQuestionOptions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions"(id);


ALTER TABLE ONLY "ProjectUsers"
    ADD CONSTRAINT "ProjectUsers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Projects"(id);



ALTER TABLE ONLY "ProjectUserGroups"
    ADD CONSTRAINT "ProjectUserGroups_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Projects"(id);
--
-- TOC entry 3777 (class 0 OID 0)
-- Dependencies: 9
-- Name: public; Type: ACL; Schema: -; Owner: sean
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO indabauser;
GRANT ALL ON SCHEMA public TO PUBLIC;


-- Completed on 2017-04-11 13:34:40 EDT

--
-- PostgreSQL database dump complete
--

