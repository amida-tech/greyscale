lo--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

--
-- Name: sceleton; Type: SCHEMA; Schema: -; Owner: indaba
--

CREATE SCHEMA sceleton;


ALTER SCHEMA sceleton OWNER TO indaba;

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
-- Name: event_status; Type: TYPE; Schema: public; Owner: postgres
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


ALTER TYPE public.event_status OWNER TO postgres;

--
-- Name: order_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE order_status AS ENUM (
    'New',
    'Acknowledged',
    'Confirmed',
    'Fulfilled',
    'Cancelled'
);


ALTER TYPE public.order_status OWNER TO postgres;

--
-- Name: tour_status; Type: TYPE; Schema: public; Owner: postgres
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


ALTER TYPE public.tour_status OWNER TO postgres;

--
-- Name: transport_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE transport_status AS ENUM (
    'New',
    'Submitted',
    'Approved',
    'Available',
    'Rented',
    'Deleted'
);


ALTER TYPE public.transport_status OWNER TO postgres;

--
-- Name: clone_schema(text, text, boolean); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.clone_schema(source_schema text, dest_schema text, include_recs boolean) OWNER TO postgres;

--
-- Name: fix_schema_references(text); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.fix_schema_references(schema text) OWNER TO postgres;

--
-- Name: order_before_update(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION order_before_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   NEW."updated" = now();

   RETURN NEW;
END$$;


ALTER FUNCTION public.order_before_update() OWNER TO postgres;

--
-- Name: tours_before_insert(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION tours_before_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   new."created" = now();
new."updated" = now();

   RETURN NEW;
END;$$;


ALTER FUNCTION public.tours_before_insert() OWNER TO postgres;

--
-- Name: tours_before_update(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION tours_before_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   NEW."updated" = now();

   RETURN NEW;
END;$$;


ALTER FUNCTION public.tours_before_update() OWNER TO postgres;

--
-- Name: twc_delete_old_token(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION twc_delete_old_token() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   DELETE FROM "Token" 
   WHERE "userID" = NEW."userID"
   AND "realm" = NEW."realm";
   RETURN NEW;
END;$$;


ALTER FUNCTION public.twc_delete_old_token() OWNER TO postgres;

--
-- Name: user_company_check(); Type: FUNCTION; Schema: public; Owner: postgres
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


ALTER FUNCTION public.user_company_check() OWNER TO postgres;

--
-- Name: users_before_update(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION users_before_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   NEW."updated" = now();

   RETURN NEW;
END$$;


ALTER FUNCTION public.users_before_update() OWNER TO postgres;

SET search_path = sceleton, pg_catalog;

--
-- Name: clone_schema(text, text, boolean); Type: FUNCTION; Schema: sceleton; Owner: indaba
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


ALTER FUNCTION sceleton.clone_schema(source_schema text, dest_schema text, include_recs boolean) OWNER TO indaba;

--
-- Name: fix_schema_references(text); Type: FUNCTION; Schema: sceleton; Owner: indaba
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


ALTER FUNCTION sceleton.fix_schema_references(schema text) OWNER TO indaba;

--
-- Name: order_before_update(); Type: FUNCTION; Schema: sceleton; Owner: indaba
--

CREATE FUNCTION order_before_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   NEW."updated" = now();

   RETURN NEW;
END$$;


ALTER FUNCTION sceleton.order_before_update() OWNER TO indaba;

--
-- Name: tours_before_insert(); Type: FUNCTION; Schema: sceleton; Owner: indaba
--

CREATE FUNCTION tours_before_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   new."created" = now();
new."updated" = now();

   RETURN NEW;
END;$$;


ALTER FUNCTION sceleton.tours_before_insert() OWNER TO indaba;

--
-- Name: tours_before_update(); Type: FUNCTION; Schema: sceleton; Owner: indaba
--

CREATE FUNCTION tours_before_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   NEW."updated" = now();

   RETURN NEW;
END;$$;


ALTER FUNCTION sceleton.tours_before_update() OWNER TO indaba;

--
-- Name: twc_delete_old_token(); Type: FUNCTION; Schema: sceleton; Owner: indaba
--

CREATE FUNCTION twc_delete_old_token() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   DELETE FROM "Token" WHERE "userID" = NEW."userID";
   RETURN NEW;
END;$$;


ALTER FUNCTION sceleton.twc_delete_old_token() OWNER TO indaba;

--
-- Name: twc_get_token(character varying, character varying); Type: FUNCTION; Schema: sceleton; Owner: indaba
--

CREATE FUNCTION twc_get_token(body character varying, exp character varying) RETURNS character varying
    LANGUAGE plpgsql
    AS $$BEGIN

  SELECT t."body"
    FROM "Token" t
   where (t."body" = twc_get_token.body)
   and ((now() - t."issuedAt") < (twc_get_token.exp || ' milliseconds')::interval);
         
END$$;


ALTER FUNCTION sceleton.twc_get_token(body character varying, exp character varying) OWNER TO indaba;

--
-- Name: user_company_check(); Type: FUNCTION; Schema: sceleton; Owner: indaba
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


ALTER FUNCTION sceleton.user_company_check() OWNER TO indaba;

--
-- Name: users_before_update(); Type: FUNCTION; Schema: sceleton; Owner: indaba
--

CREATE FUNCTION users_before_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   NEW."updated" = now();

   RETURN NEW;
END$$;


ALTER FUNCTION sceleton.users_before_update() OWNER TO indaba;

SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: Essences; Type: TABLE; Schema: public; Owner: indaba; Tablespace: 
--

CREATE TABLE "Essences" (
    id integer NOT NULL,
    "tableName" character varying(100),
    name character varying(100) NOT NULL,
    "fileName" character varying(100),
    "nameField" character varying NOT NULL
);


ALTER TABLE public."Essences" OWNER TO indaba;

--
-- Name: COLUMN "Essences".name; Type: COMMENT; Schema: public; Owner: indaba
--

COMMENT ON COLUMN "Essences".name IS 'Human readable name of essence';


--
-- Name: COLUMN "Essences"."fileName"; Type: COMMENT; Schema: public; Owner: indaba
--

COMMENT ON COLUMN "Essences"."fileName" IS 'File name in models path';


--
-- Name: Entities_id_seq; Type: SEQUENCE; Schema: public; Owner: indaba
--

CREATE SEQUENCE "Entities_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Entities_id_seq" OWNER TO indaba;

--
-- Name: Entities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: indaba
--

ALTER SEQUENCE "Entities_id_seq" OWNED BY "Essences".id;


--
-- Name: Index_id_seq; Type: SEQUENCE; Schema: public; Owner: indaba
--

CREATE SEQUENCE "Index_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Index_id_seq" OWNER TO indaba;

--
-- Name: Languages; Type: TABLE; Schema: public; Owner: indaba; Tablespace: 
--

CREATE TABLE "Languages" (
    id integer NOT NULL,
    name character varying(100),
    "nativeName" character varying(255),
    code character varying(3)
);


ALTER TABLE public."Languages" OWNER TO indaba;

--
-- Name: Languages_id_seq; Type: SEQUENCE; Schema: public; Owner: indaba
--

CREATE SEQUENCE "Languages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Languages_id_seq" OWNER TO indaba;

--
-- Name: Languages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: indaba
--

ALTER SEQUENCE "Languages_id_seq" OWNED BY "Languages".id;


--
-- Name: Logs; Type: TABLE; Schema: public; Owner: indaba; Tablespace: 
--

CREATE TABLE "Logs" (
    id integer NOT NULL,
    created timestamp(6) with time zone DEFAULT now(),
    userid integer,
    action character varying,
    essence integer NOT NULL,
    entity integer,
    entities character varying,
    quantity integer DEFAULT 0,
    info text,
    error boolean DEFAULT false,
    result character varying
);


ALTER TABLE public."Logs" OWNER TO indaba;

--
-- Name: Logs_id_seq; Type: SEQUENCE; Schema: public; Owner: indaba
--

CREATE SEQUENCE "Logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Logs_id_seq" OWNER TO indaba;

--
-- Name: Logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: indaba
--

ALTER SEQUENCE "Logs_id_seq" OWNED BY "Logs".id;


--
-- Name: Notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: indaba
--

CREATE SEQUENCE "Notifications_id_seq"
    START WITH 1
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Notifications_id_seq" OWNER TO indaba;

--
-- Name: Notifications; Type: TABLE; Schema: public; Owner: indaba; Tablespace: 
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


ALTER TABLE public."Notifications" OWNER TO indaba;

--
-- Name: COLUMN "Notifications"."notifyLevel"; Type: COMMENT; Schema: public; Owner: indaba
--

COMMENT ON COLUMN "Notifications"."notifyLevel" IS '0 - none, 1 - alert only, 2 - all notifications';


--
-- Name: Rights; Type: TABLE; Schema: public; Owner: indaba; Tablespace: 
--

CREATE TABLE "Rights" (
    id integer NOT NULL,
    action character varying(80) NOT NULL,
    description text,
    "essenceId" integer
);


ALTER TABLE public."Rights" OWNER TO indaba;

--
-- Name: Rights_id_seq; Type: SEQUENCE; Schema: public; Owner: indaba
--

CREATE SEQUENCE "Rights_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Rights_id_seq" OWNER TO indaba;

--
-- Name: Rights_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: indaba
--

ALTER SEQUENCE "Rights_id_seq" OWNED BY "Rights".id;


--
-- Name: role_id_seq; Type: SEQUENCE; Schema: public; Owner: indaba
--

CREATE SEQUENCE role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.role_id_seq OWNER TO indaba;

--
-- Name: Roles; Type: TABLE; Schema: public; Owner: indaba; Tablespace: 
--

CREATE TABLE "Roles" (
    id integer DEFAULT nextval('role_id_seq'::regclass) NOT NULL,
    name character varying(20) NOT NULL,
    "isSystem" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Roles" OWNER TO indaba;

--
-- Name: RolesRights; Type: TABLE; Schema: public; Owner: indaba; Tablespace: 
--

CREATE TABLE "RolesRights" (
    "roleID" bigint NOT NULL,
    "rightID" bigint NOT NULL
);


ALTER TABLE public."RolesRights" OWNER TO indaba;

--
-- Name: Subindex_id_seq; Type: SEQUENCE; Schema: public; Owner: indaba
--

CREATE SEQUENCE "Subindex_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Subindex_id_seq" OWNER TO indaba;

--
-- Name: Token; Type: TABLE; Schema: public; Owner: indaba; Tablespace: 
--

CREATE TABLE "Token" (
    "userID" integer NOT NULL,
    body character varying(200) NOT NULL,
    "issuedAt" timestamp without time zone DEFAULT ('now'::text)::timestamp without time zone NOT NULL,
    realm character varying(80) NOT NULL
);


ALTER TABLE public."Token" OWNER TO indaba;

--
-- Name: UnitOfAnalysisClassType_id_seq; Type: SEQUENCE; Schema: public; Owner: indaba
--

CREATE SEQUENCE "UnitOfAnalysisClassType_id_seq"
    START WITH 9
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."UnitOfAnalysisClassType_id_seq" OWNER TO indaba;

--
-- Name: UnitOfAnalysisTagLink_id_seq; Type: SEQUENCE; Schema: public; Owner: indaba
--

CREATE SEQUENCE "UnitOfAnalysisTagLink_id_seq"
    START WITH 18
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."UnitOfAnalysisTagLink_id_seq" OWNER TO indaba;

--
-- Name: UnitOfAnalysisType_id_seq; Type: SEQUENCE; Schema: public; Owner: indaba
--

CREATE SEQUENCE "UnitOfAnalysisType_id_seq"
    START WITH 9
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."UnitOfAnalysisType_id_seq" OWNER TO indaba;

--
-- Name: UnitOfAnalysis_id_seq; Type: SEQUENCE; Schema: public; Owner: indaba
--

CREATE SEQUENCE "UnitOfAnalysis_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."UnitOfAnalysis_id_seq" OWNER TO indaba;

--
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: indaba
--

CREATE SEQUENCE user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_id_seq OWNER TO indaba;

--
-- Name: Users; Type: TABLE; Schema: public; Owner: indaba; Tablespace: 
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
    "notifyLevel" smallint DEFAULT 2,
    timezone character varying,
    "lastActive" timestamp with time zone,
    affiliation character varying,
    "isAnonymous" boolean DEFAULT false NOT NULL,
    "langId" integer,
    salt character varying
);


ALTER TABLE public."Users" OWNER TO indaba;

--
-- Name: brand_id_seq; Type: SEQUENCE; Schema: public; Owner: indaba
--

CREATE SEQUENCE brand_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.brand_id_seq OWNER TO indaba;

--
-- Name: country_id_seq; Type: SEQUENCE; Schema: public; Owner: indaba
--

CREATE SEQUENCE country_id_seq
    START WITH 240
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.country_id_seq OWNER TO indaba;

--
-- Name: order_id_seq; Type: SEQUENCE; Schema: public; Owner: indaba
--

CREATE SEQUENCE order_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_id_seq OWNER TO indaba;

--
-- Name: transport_id_seq; Type: SEQUENCE; Schema: public; Owner: indaba
--

CREATE SEQUENCE transport_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.transport_id_seq OWNER TO indaba;

--
-- Name: transportmodel_id_seq; Type: SEQUENCE; Schema: public; Owner: indaba
--

CREATE SEQUENCE transportmodel_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.transportmodel_id_seq OWNER TO indaba;

SET search_path = sceleton, pg_catalog;

--
-- Name: AccessMatix_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE "AccessMatix_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton."AccessMatix_id_seq" OWNER TO indaba;

--
-- Name: AccessMatrices; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE TABLE "AccessMatrices" (
    id integer DEFAULT nextval('"AccessMatix_id_seq"'::regclass) NOT NULL,
    name character varying(100),
    description text,
    default_value smallint
);


ALTER TABLE sceleton."AccessMatrices" OWNER TO indaba;

--
-- Name: AccessPermissions_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE "AccessPermissions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton."AccessPermissions_id_seq" OWNER TO indaba;

--
-- Name: AccessPermissions; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE TABLE "AccessPermissions" (
    "matrixId" integer NOT NULL,
    "roleId" integer NOT NULL,
    "rightId" integer NOT NULL,
    permission smallint,
    id integer DEFAULT nextval('"AccessPermissions_id_seq"'::regclass) NOT NULL
);


ALTER TABLE sceleton."AccessPermissions" OWNER TO indaba;

--
-- Name: AnswerAttachments_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE "AnswerAttachments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton."AnswerAttachments_id_seq" OWNER TO indaba;

--
-- Name: AnswerAttachments; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE TABLE "AnswerAttachments" (
    id integer DEFAULT nextval('"AnswerAttachments_id_seq"'::regclass) NOT NULL,
    "answerId" integer,
    filename character varying,
    size integer,
    mimetype character varying,
    body bytea,
    created timestamp with time zone DEFAULT now() NOT NULL,
    owner integer
);


ALTER TABLE sceleton."AnswerAttachments" OWNER TO indaba;

--
-- Name: Discussions_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE "Discussions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton."Discussions_id_seq" OWNER TO indaba;

--
-- Name: Discussions; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE TABLE "Discussions" (
    id integer DEFAULT nextval('"Discussions_id_seq"'::regclass) NOT NULL,
    "taskId" integer NOT NULL,
    "questionId" integer NOT NULL,
    "userId" integer NOT NULL,
    entry text NOT NULL,
    "isReturn" boolean DEFAULT false NOT NULL,
    created timestamp(6) with time zone DEFAULT now() NOT NULL,
    updated timestamp(6) with time zone,
    "isResolve" boolean DEFAULT false NOT NULL,
    "order" smallint DEFAULT 1 NOT NULL,
    "returnTaskId" integer,
    "userFromId" integer NOT NULL
);


ALTER TABLE sceleton."Discussions" OWNER TO indaba;

--
-- Name: Entities_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE "Entities_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton."Entities_id_seq" OWNER TO indaba;

--
-- Name: EntityRoles_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE "EntityRoles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton."EntityRoles_id_seq" OWNER TO indaba;

--
-- Name: Essences; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE TABLE "Essences" (
    id integer DEFAULT nextval('"Entities_id_seq"'::regclass) NOT NULL,
    "tableName" character varying(100),
    name character varying(100) NOT NULL,
    "fileName" character varying(100),
    "nameField" character varying NOT NULL
);


ALTER TABLE sceleton."Essences" OWNER TO indaba;

--
-- Name: COLUMN "Essences".name; Type: COMMENT; Schema: sceleton; Owner: indaba
--

COMMENT ON COLUMN "Essences".name IS 'Human readable name of essence';


--
-- Name: COLUMN "Essences"."fileName"; Type: COMMENT; Schema: sceleton; Owner: indaba
--

COMMENT ON COLUMN "Essences"."fileName" IS 'File name in models path';


--
-- Name: Groups_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE "Groups_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton."Groups_id_seq" OWNER TO indaba;

--
-- Name: Groups; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE TABLE "Groups" (
    id integer DEFAULT nextval('"Groups_id_seq"'::regclass) NOT NULL,
    title character varying,
    "organizationId" integer,
    "langId" integer
);


ALTER TABLE sceleton."Groups" OWNER TO indaba;

--
-- Name: IndexQuestionWeights; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE TABLE "IndexQuestionWeights" (
    "indexId" integer NOT NULL,
    "questionId" integer NOT NULL,
    weight numeric NOT NULL,
    type character varying NOT NULL
);


ALTER TABLE sceleton."IndexQuestionWeights" OWNER TO indaba;

--
-- Name: IndexSubindexWeights; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE TABLE "IndexSubindexWeights" (
    "indexId" integer NOT NULL,
    "subindexId" integer NOT NULL,
    weight numeric NOT NULL,
    type character varying NOT NULL
);


ALTER TABLE sceleton."IndexSubindexWeights" OWNER TO indaba;

--
-- Name: Index_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE "Index_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton."Index_id_seq" OWNER TO indaba;

--
-- Name: Indexes; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE TABLE "Indexes" (
    id integer DEFAULT nextval('"Index_id_seq"'::regclass) NOT NULL,
    "productId" integer NOT NULL,
    title character varying,
    description text,
    divisor numeric DEFAULT 1 NOT NULL
);


ALTER TABLE sceleton."Indexes" OWNER TO indaba;

--
-- Name: JSON_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE "JSON_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton."JSON_id_seq" OWNER TO indaba;

--
-- Name: Languages_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE "Languages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton."Languages_id_seq" OWNER TO indaba;

--
-- Name: Languages; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE TABLE "Languages" (
    id integer DEFAULT nextval('"Languages_id_seq"'::regclass) NOT NULL,
    name character varying(100),
    "nativeName" character varying(255),
    code character varying(3)
);


ALTER TABLE sceleton."Languages" OWNER TO indaba;

--
-- Name: Logs_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE "Logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton."Logs_id_seq" OWNER TO indaba;

--
-- Name: Logs; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE TABLE "Logs" (
    id integer DEFAULT nextval('"Logs_id_seq"'::regclass) NOT NULL,
    created timestamp(6) with time zone DEFAULT now(),
    "userid" integer,
    action character varying,
    essence integer NOT NULL,
    entity integer,
    entities character varying,
    quantity integer DEFAULT 0,
    info text,
    error boolean DEFAULT false,
    result character varying
);


ALTER TABLE sceleton."Logs" OWNER TO indaba;

--
-- Name: Notifications_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE "Notifications_id_seq"
    START WITH 167
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton."Notifications_id_seq" OWNER TO indaba;

--
-- Name: Notifications; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
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


ALTER TABLE sceleton."Notifications" OWNER TO indaba;

--
-- Name: COLUMN "Notifications"."notifyLevel"; Type: COMMENT; Schema: sceleton; Owner: indaba
--

COMMENT ON COLUMN "Notifications"."notifyLevel" IS '0 - none, 1 - alert only, 2 - all notifications';


--
-- Name: Organizations_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE "Organizations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton."Organizations_id_seq" OWNER TO indaba;

--
-- Name: Organizations; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
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
    realm character varying(80)
);


ALTER TABLE sceleton."Organizations" OWNER TO indaba;

--
-- Name: ProductUOA; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE TABLE "ProductUOA" (
    "productId" integer NOT NULL,
    "UOAid" integer NOT NULL,
    "currentStepId" integer,
    "isComplete" boolean DEFAULT false NOT NULL
);


ALTER TABLE sceleton."ProductUOA" OWNER TO indaba;

--
-- Name: Products_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE "Products_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton."Products_id_seq" OWNER TO indaba;

--
-- Name: Products; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
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


ALTER TABLE sceleton."Products" OWNER TO indaba;

--
-- Name: Projects_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE "Projects_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton."Projects_id_seq" OWNER TO indaba;

--
-- Name: Projects; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
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


ALTER TABLE sceleton."Projects" OWNER TO indaba;

--
-- Name: Rights_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE "Rights_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton."Rights_id_seq" OWNER TO indaba;

--
-- Name: Rights; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE TABLE "Rights" (
    id integer DEFAULT nextval('"Rights_id_seq"'::regclass) NOT NULL,
    action character varying(80) NOT NULL,
    description text,
    "essenceId" integer
);


ALTER TABLE sceleton."Rights" OWNER TO indaba;

--
-- Name: role_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton.role_id_seq OWNER TO indaba;

--
-- Name: Roles; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE TABLE "Roles" (
    id integer DEFAULT nextval('role_id_seq'::regclass) NOT NULL,
    name character varying(20) NOT NULL,
    "isSystem" boolean DEFAULT false NOT NULL
);


ALTER TABLE sceleton."Roles" OWNER TO indaba;

--
-- Name: RolesRights; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE TABLE "RolesRights" (
    "roleID" bigint NOT NULL,
    "rightID" bigint NOT NULL
);


ALTER TABLE sceleton."RolesRights" OWNER TO indaba;

--
-- Name: SubindexWeights; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE TABLE "SubindexWeights" (
    "subindexId" integer NOT NULL,
    "questionId" integer NOT NULL,
    weight numeric NOT NULL,
    type character varying NOT NULL
);


ALTER TABLE sceleton."SubindexWeights" OWNER TO indaba;

--
-- Name: Subindex_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE "Subindex_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton."Subindex_id_seq" OWNER TO indaba;

--
-- Name: Subindexes; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE TABLE "Subindexes" (
    id integer DEFAULT nextval('"Subindex_id_seq"'::regclass) NOT NULL,
    "productId" integer NOT NULL,
    title character varying,
    description text,
    divisor numeric DEFAULT 1 NOT NULL
);


ALTER TABLE sceleton."Subindexes" OWNER TO indaba;

--
-- Name: SurveyAnswerVersions_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE "SurveyAnswerVersions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton."SurveyAnswerVersions_id_seq" OWNER TO indaba;

--
-- Name: SurveyAnswers_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE "SurveyAnswers_id_seq"
    START WITH 1375
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton."SurveyAnswers_id_seq" OWNER TO indaba;

--
-- Name: SurveyAnswers; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
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
    attachments integer[]
);


ALTER TABLE sceleton."SurveyAnswers" OWNER TO indaba;

--
-- Name: surveyQuestionOptions_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE "surveyQuestionOptions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton."surveyQuestionOptions_id_seq" OWNER TO indaba;

--
-- Name: SurveyQuestionOptions; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
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


ALTER TABLE sceleton."SurveyQuestionOptions" OWNER TO indaba;

--
-- Name: SurveyQuestions_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE "SurveyQuestions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton."SurveyQuestions_id_seq" OWNER TO indaba;

--
-- Name: SurveyQuestions; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
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
    "langId" integer
);


ALTER TABLE sceleton."SurveyQuestions" OWNER TO indaba;

--
-- Name: Surveys; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
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


ALTER TABLE sceleton."Surveys" OWNER TO indaba;

--
-- Name: Tasks_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE "Tasks_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton."Tasks_id_seq" OWNER TO indaba;

--
-- Name: Tasks; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
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
    "langId" integer
);


ALTER TABLE sceleton."Tasks" OWNER TO indaba;

--
-- Name: Translations; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE TABLE "Translations" (
    "essenceId" integer NOT NULL,
    "entityId" integer NOT NULL,
    field character varying(100) NOT NULL,
    "langId" integer NOT NULL,
    value text
);


ALTER TABLE sceleton."Translations" OWNER TO indaba;

--
-- Name: UnitOfAnalysis_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE "UnitOfAnalysis_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton."UnitOfAnalysis_id_seq" OWNER TO indaba;

--
-- Name: UnitOfAnalysis; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
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


ALTER TABLE sceleton."UnitOfAnalysis" OWNER TO indaba;

--
-- Name: COLUMN "UnitOfAnalysis"."gadmId0"; Type: COMMENT; Schema: sceleton; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId0" IS 'ID0 for use with GADM shapefile';


--
-- Name: COLUMN "UnitOfAnalysis"."gadmId1"; Type: COMMENT; Schema: sceleton; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId1" IS 'ID1 for use with GADM shapefile';


--
-- Name: COLUMN "UnitOfAnalysis"."gadmId2"; Type: COMMENT; Schema: sceleton; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId2" IS 'ID2 for use with GADM shapefile';


--
-- Name: COLUMN "UnitOfAnalysis"."gadmId3"; Type: COMMENT; Schema: sceleton; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId3" IS 'ID3 for use with GADM shapefile';


--
-- Name: COLUMN "UnitOfAnalysis"."gadmObjectId"; Type: COMMENT; Schema: sceleton; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmObjectId" IS 'OBJECTID for use with GADM shapefile (only Global Shapefile)';


--
-- Name: COLUMN "UnitOfAnalysis"."ISO"; Type: COMMENT; Schema: sceleton; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."ISO" IS 'only for Country level Unit Of Analysis';


--
-- Name: COLUMN "UnitOfAnalysis"."ISO2"; Type: COMMENT; Schema: sceleton; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."ISO2" IS 'only for Country level Unit Of Analysis';


--
-- Name: COLUMN "UnitOfAnalysis"."nameISO"; Type: COMMENT; Schema: sceleton; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."nameISO" IS 'only for Country level Unit Of Analysis';


--
-- Name: COLUMN "UnitOfAnalysis".name; Type: COMMENT; Schema: sceleton; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis".name IS 'Multilanguage';


--
-- Name: COLUMN "UnitOfAnalysis".description; Type: COMMENT; Schema: sceleton; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis".description IS 'Multilanguage';


--
-- Name: COLUMN "UnitOfAnalysis"."shortName"; Type: COMMENT; Schema: sceleton; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."shortName" IS 'Multilanguage';


--
-- Name: COLUMN "UnitOfAnalysis"."HASC"; Type: COMMENT; Schema: sceleton; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."HASC" IS '(example RU.AD.OK)';


--
-- Name: COLUMN "UnitOfAnalysis"."unitOfAnalysisType"; Type: COMMENT; Schema: sceleton; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."unitOfAnalysisType" IS 'reference to table UnitOfAnalysisType';


--
-- Name: COLUMN "UnitOfAnalysis"."parentId"; Type: COMMENT; Schema: sceleton; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."parentId" IS 'Link to Parent Unit of Analysis if exist';


--
-- Name: COLUMN "UnitOfAnalysis"."creatorId"; Type: COMMENT; Schema: sceleton; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."creatorId" IS 'Creator Id (User Id)';


--
-- Name: COLUMN "UnitOfAnalysis"."ownerId"; Type: COMMENT; Schema: sceleton; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."ownerId" IS 'Owner Id (User Id)';


--
-- Name: COLUMN "UnitOfAnalysis".visibility; Type: COMMENT; Schema: sceleton; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis".visibility IS '1 = public; 2 = private;';


--
-- Name: COLUMN "UnitOfAnalysis".status; Type: COMMENT; Schema: sceleton; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis".status IS '1 = active; 2 = inactive; 3 = deleted;';


--
-- Name: UnitOfAnalysisClassType_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE "UnitOfAnalysisClassType_id_seq"
    START WITH 9
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton."UnitOfAnalysisClassType_id_seq" OWNER TO indaba;

--
-- Name: UnitOfAnalysisClassType; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE TABLE "UnitOfAnalysisClassType" (
    id smallint DEFAULT nextval('"UnitOfAnalysisClassType_id_seq"'::regclass) NOT NULL,
    name character varying(45) NOT NULL,
    description character varying(255),
    "langId" smallint DEFAULT 1 NOT NULL
);


ALTER TABLE sceleton."UnitOfAnalysisClassType" OWNER TO indaba;

--
-- Name: COLUMN "UnitOfAnalysisClassType".name; Type: COMMENT; Schema: sceleton; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysisClassType".name IS 'Classification Name (for example - World Bank classification) ';


--
-- Name: COLUMN "UnitOfAnalysisClassType".description; Type: COMMENT; Schema: sceleton; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysisClassType".description IS 'Classification Name description';


--
-- Name: UnitOfAnalysisTag_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE "UnitOfAnalysisTag_id_seq"
    START WITH 9
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton."UnitOfAnalysisTag_id_seq" OWNER TO indaba;

--
-- Name: UnitOfAnalysisTag; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE TABLE "UnitOfAnalysisTag" (
    id smallint DEFAULT nextval('"UnitOfAnalysisTag_id_seq"'::regclass) NOT NULL,
    name character varying(45) NOT NULL,
    description character varying(255),
    "langId" integer DEFAULT 1 NOT NULL,
    "classTypeId" smallint NOT NULL
);


ALTER TABLE sceleton."UnitOfAnalysisTag" OWNER TO indaba;

--
-- Name: UnitOfAnalysisTagLink_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE "UnitOfAnalysisTagLink_id_seq"
    START WITH 18
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton."UnitOfAnalysisTagLink_id_seq" OWNER TO indaba;

--
-- Name: UnitOfAnalysisTagLink; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE TABLE "UnitOfAnalysisTagLink" (
    id integer DEFAULT nextval('"UnitOfAnalysisTagLink_id_seq"'::regclass) NOT NULL,
    "uoaId" integer NOT NULL,
    "uoaTagId" integer NOT NULL
);


ALTER TABLE sceleton."UnitOfAnalysisTagLink" OWNER TO indaba;

--
-- Name: UnitOfAnalysisType_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE "UnitOfAnalysisType_id_seq"
    START WITH 9
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton."UnitOfAnalysisType_id_seq" OWNER TO indaba;

--
-- Name: UnitOfAnalysisType; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE TABLE "UnitOfAnalysisType" (
    id smallint DEFAULT nextval('"UnitOfAnalysisType_id_seq"'::regclass) NOT NULL,
    name character varying(40) NOT NULL,
    description character varying(255),
    "langId" integer DEFAULT 1 NOT NULL
);


ALTER TABLE sceleton."UnitOfAnalysisType" OWNER TO indaba;

--
-- Name: UserGroups; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE TABLE "UserGroups" (
    "userId" integer NOT NULL,
    "groupId" integer NOT NULL
);


ALTER TABLE sceleton."UserGroups" OWNER TO indaba;

--
-- Name: UserRights; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE TABLE "UserRights" (
    "userID" bigint NOT NULL,
    "rightID" bigint NOT NULL,
    "canDo" boolean
);


ALTER TABLE sceleton."UserRights" OWNER TO indaba;

--
-- Name: UserUOA; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE TABLE "UserUOA" (
    "UserId" integer NOT NULL,
    "UOAid" integer NOT NULL
);


ALTER TABLE sceleton."UserUOA" OWNER TO indaba;

--
-- Name: user_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton.user_id_seq OWNER TO indaba;

--
-- Name: Users; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
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


ALTER TABLE sceleton."Users" OWNER TO indaba;

--
-- Name: Visualizations_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE "Visualizations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton."Visualizations_id_seq" OWNER TO indaba;

--
-- Name: Visualizations; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
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


ALTER TABLE sceleton."Visualizations" OWNER TO indaba;

--
-- Name: WorkflowStepGroups; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE TABLE "WorkflowStepGroups" (
    "stepId" integer NOT NULL,
    "groupId" integer NOT NULL
);


ALTER TABLE sceleton."WorkflowStepGroups" OWNER TO indaba;

--
-- Name: WorkflowSteps_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE "WorkflowSteps_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton."WorkflowSteps_id_seq" OWNER TO indaba;

--
-- Name: WorkflowSteps; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
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


ALTER TABLE sceleton."WorkflowSteps" OWNER TO indaba;

--
-- Name: Workflows_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE "Workflows_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton."Workflows_id_seq" OWNER TO indaba;

--
-- Name: Workflows; Type: TABLE; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE TABLE "Workflows" (
    id integer DEFAULT nextval('"Workflows_id_seq"'::regclass) NOT NULL,
    name character varying(200),
    description text,
    created timestamp with time zone DEFAULT now() NOT NULL,
    "productId" integer
);


ALTER TABLE sceleton."Workflows" OWNER TO indaba;

--
-- Name: brand_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE brand_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton.brand_id_seq OWNER TO indaba;

--
-- Name: country_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE country_id_seq
    START WITH 240
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton.country_id_seq OWNER TO indaba;

--
-- Name: order_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE order_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton.order_id_seq OWNER TO indaba;

--
-- Name: transport_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE transport_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton.transport_id_seq OWNER TO indaba;

--
-- Name: transportmodel_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: indaba
--

CREATE SEQUENCE transportmodel_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE sceleton.transportmodel_id_seq OWNER TO indaba;

SET search_path = public, pg_catalog;

--
-- Name: id; Type: DEFAULT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "Essences" ALTER COLUMN id SET DEFAULT nextval('"Entities_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "Languages" ALTER COLUMN id SET DEFAULT nextval('"Languages_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "Logs" ALTER COLUMN id SET DEFAULT nextval('"Logs_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "Rights" ALTER COLUMN id SET DEFAULT nextval('"Rights_id_seq"'::regclass);


--
-- Name: Entities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indaba
--

SELECT pg_catalog.setval('"Entities_id_seq"', 57, true);


--
-- Data for Name: Essences; Type: TABLE DATA; Schema: public; Owner: indaba
--

COPY "Essences" (id, "tableName", name, "fileName", "nameField") FROM stdin;
23	WorflowSteps	WorflowSteps	worflowSteps	title
16	Surveys	Surveys	surveys	title
17	SurveyQuestions	Survey Questions	survey_questions	label
18	SurveyQuestionOptions	Survey Question Options	survey_question_options	label
19	SurveyAnswers	Survey Answers	survey_answers	value
20	Groups	Groups	groups	title
21	Organizations	Organizations	organizations	name
22	Tasks	Tasks	tasks	title
4	Products	Products	products	title
6	UnitOfAnalysis	UnitOfAnalysis	uoas	name
5	UnitOfAnalysisType	UnitOfAnalysisType	uoatypes	name
7	UnitOfAnalysisClassType	UnitOfAnalysisClassType	uoaclasstypes	name
8	UnitOfAnalysisTag	UnitOfAnalysisTag	uoatags	name
13	Projects	projects	projects	codeName
14	Discussions	Discussions	discussions	name
15	Users	Users	users	email
24	Notifications	notifications	notifications	body
25	ProductUOA	productUoa	product_uoa	productId
26	Indexes	Indexes	indexes	title
27	Subindexes	Subindexes	subindexes	title
28	IndexQuestionWeights	IndexQuestionWeights	index_question_weights	type
29	IndexSubindexWeights	IndexSubindexWeights	index_subindex_weights	type
36	Workflows	Workflows	workflows	name
37	WorfklowSteps	WorkflowSteps	workflow_steps	title
38	WorfklowStepGroups	WorkflowStepGroups	workflow_step_groups	stepId
31	UnitOfAnalysisTagLink	UnitOfAnalysisTagLink	uoataglinks	id
30	SubindexWeights	SubindexWeights	subindex_weights	type
32	Translations	Translations	translations	field
33	Roles	Roles	roles	name
34	Rights	Rights	rights	action
35	RoleRights	RoleRights	role_rights	roleId
39	Visualizations	Visualizations	visualizations	title
40	AccessMatrices	AccessMatrices	access_matrices	name
41	AccessPermissions	AccessPermissions	access_permissions	id
42	AnswerAttachments	AnswerAttachments	answer_attachments	filename
43	Token	Token	token	realm
44	UserUOA	UserUOA	user_uoa	UserId
45	UserGroups	UserGroups	user_groups	UserId
\.


--
-- Name: Index_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indaba
--

SELECT pg_catalog.setval('"Index_id_seq"', 2, true);


--
-- Data for Name: Languages; Type: TABLE DATA; Schema: public; Owner: indaba
--

COPY "Languages" (id, name, "nativeName", code) FROM stdin;
1	English	English	en
2	Russian	Русский	ru
9	Japanese	日本語	jp
12	Spanish	Español	es
13	French	Le français	fr
\.


--
-- Name: Languages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indaba
--

SELECT pg_catalog.setval('"Languages_id_seq"', 13, true);


--
-- Data for Name: Logs; Type: TABLE DATA; Schema: public; Owner: indaba
--

COPY "Logs" (id, created, userid, action, essence, entity, entities, quantity, info, error, result) FROM stdin;
1127	2016-04-04 14:40:54.671252+03	348	insert	43	\N	{"userID":348,"body":"37d903cd3d2c0adc50493f7c24bfb56f52200a6de1261bd0da4e4dfb1ce6ab00","realm":"public"}	1	Add new token	f	\N
1128	2016-04-04 15:05:06.457404+03	350	insert	43	\N	{"userID":350,"body":"e48ea9b21f0e1aef98709468e41a971c478df30b61c674964b7a185fb4f14f95","realm":"public"}	1	Add new token	f	\N
1129	2016-04-04 15:06:34.556405+03	350	delete	43	\N	{"userID":350,"realm":"google"}	1	Delete token	f	\N
1215	2016-04-05 13:12:59.670796+03	350	insert	43	\N	{"userID":350,"body":"c6aaea54cfce7cba7fb1da88e59017d37eeb53b55c2282fa88620cc12203a2cf","realm":"public"}	1	Add new token	f	\N
1141	2016-04-04 16:48:07.920901+03	350	delete	15	354	\N	0	Delete user	f	\N
1132	2016-04-04 16:02:24.952825+03	350	insert	43	\N	{"userID":350,"body":"e6f30ade91b04cfb2a49787534b4c7da6c46485720dcdd8d2e77bab63ddf41e0","realm":"google"}	1	Add new token	f	\N
1133	2016-04-04 16:02:32.89689+03	350	insert	43	\N	{"userID":350,"body":"974f274b0839c9f21213e69802fb92048b8fe7846ddd7ca591e020c07588986c","realm":"public"}	1	Add new token	f	\N
1134	2016-04-04 16:02:59.485753+03	350	delete	43	\N	{"userID":350,"realm":"yandex"}	1	Delete token	f	\N
1142	2016-04-04 16:53:41.713558+03	350	delete	43	\N	{"userID":350,"realm":"google"}	1	Delete token	f	\N
1144	2016-04-04 16:56:44.699562+03	350	delete	43	\N	{"userID":350,"realm":"google"}	1	Delete token	f	\N
1221	2016-04-05 13:47:02.662544+03	350	insert	43	\N	{"userID":350,"body":"9ff6368a78972137e4ebedafa66f66a36e134160e77760bae7c423509e5a88fb","realm":"public"}	1	Add new token	f	\N
1148	2016-04-04 17:01:16.200738+03	350	insert	43	\N	{"userID":350,"body":"f0e77ed8e91e98b5b00c16ec446ae1d34e1d942cb7182de05cdf9ef6e2cdd28c","realm":"google"}	1	Add new token	f	\N
1149	2016-04-04 17:01:26.215923+03	350	insert	43	\N	{"userID":350,"body":"d545173a7fb5e6bb193eb2e2fb9ed8691d1385f7d7d94d645cb9ca77171a6b62","realm":"public"}	1	Add new token	f	\N
1150	2016-04-04 17:02:10.70921+03	350	insert	43	\N	{"userID":350,"body":"162fbc865e7aa74263f56347736126ae6b6f87e60fb018496f72bd73753c3654","realm":"google"}	1	Add new token	f	\N
1151	2016-04-04 17:02:21.914697+03	350	insert	43	\N	{"userID":350,"body":"478cd2a57e14ac708bc47d9bb72e781d86073e1879e5b0b2c6535126b6ee13b8","realm":"public"}	1	Add new token	f	\N
1152	2016-04-04 17:02:50.161463+03	350	delete	43	\N	{"userID":350,"realm":"google"}	1	Delete token	f	\N
1225	2016-04-05 14:26:19.014371+03	350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1227	2016-04-05 15:17:41.938686+03	350	delete	43	\N	{"userID":350,"realm":"google"}	1	Delete token	f	\N
1156	2016-04-05 09:26:52.348367+03	350	delete	43	\N	{"userID":350,"realm":"google"}	1	Delete token	f	\N
1231	2016-04-05 15:29:17.676496+03	350	insert	43	\N	{"userID":350,"body":"b087c30832eebc3dcec30a2d2924dcc80ff30792ac69e710fe41f7e91e84b4e9","realm":"public"}	1	Add new token	f	\N
1233	2016-04-05 15:30:02.421579+03	350	insert	43	\N	{"userID":350,"body":"b0b7d34f2775f0cc5767d042de14681a22bd658182fc5a63a4ff6b179922f0d1","realm":"public"}	1	Add new token	f	\N
1159	2016-04-05 11:47:56.179954+03	350	insert	43	\N	{"userID":350,"body":"88657966e5ad480eaf74235b020e28634493876287ab182decde5d8f4d0580a4","realm":"google"}	1	Add new token	f	\N
1235	2016-04-05 15:30:59.604659+03	350	insert	43	\N	{"userID":350,"body":"064767b5e4c85a5aa85904dd95393f15a7a339f47832563a9eef032f8794f24d","realm":"public"}	1	Add new token	f	\N
1237	2016-04-05 15:31:31.857+03	350	insert	43	\N	{"userID":350,"body":"a98b7a9f71d1899ff504219e12cc3a8a28af7b5a4bd87832b8a23ae8580721e9","realm":"public"}	1	Add new token	f	\N
1239	2016-04-05 15:31:36.163607+03	350	insert	43	\N	{"userID":350,"body":"577450453955a4b800cf9fd1bc43c88a24876af9877c0404a7a3dce6a8abe2e1","realm":"public"}	1	Add new token	f	\N
1241	2016-04-05 15:32:12.431365+03	350	insert	43	\N	{"userID":350,"body":"97f0ce11c1006253aaf85806d12e1621556100e3015063e99c0404ccdc0d14ce","realm":"public"}	1	Add new token	f	\N
1243	2016-04-05 15:47:59.289332+03	350	insert	43	\N	{"userID":350,"body":"d6c6807ac509851dd70296b5f79f4f1520dc6c6f663d2ee6ff402848a7473968","realm":"public"}	1	Add new token	f	\N
1165	2016-04-05 11:50:03.058798+03	350	insert	43	\N	{"userID":350,"body":"b33af6c212e6dab4eb4a55b7fab0185efbe052a4359f6e0fadd9a0d599693798","realm":"public"}	1	Add new token	f	\N
1166	2016-04-05 11:51:00.308926+03	350	insert	43	\N	{"userID":350,"body":"859fa6ffded8ece7d215bd3c3b95e56912d0f3b264104820245f737405d67c8f","realm":"google"}	1	Add new token	f	\N
1167	2016-04-05 11:51:18.784843+03	350	insert	43	\N	{"userID":350,"body":"f1a3c4aabb8756b61edd2b391f770fec4dae175d24f69180187748a674595257","realm":"public"}	1	Add new token	f	\N
1168	2016-04-05 11:51:30.346104+03	350	insert	43	\N	{"userID":350,"body":"84618736548247a2909fbf8e120b9051bd8835ce5d63cb731c9f4bd742624602","realm":"google"}	1	Add new token	f	\N
1245	2016-04-05 17:55:21.745825+03	350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1247	2016-04-05 18:09:04.34454+03	350	insert	43	\N	{"userID":350,"body":"4ed704d9b5c0c30caca476b01075c63cc89c2e2e01360728b1dce93ebfb0b487","realm":"public"}	1	Add new token	f	\N
1171	2016-04-05 11:54:09.970071+03	350	insert	43	\N	{"userID":350,"body":"26fffdcb0d97b430ad4b38c7e11c93f6b954ddbaa21f77c7c550fe3d3665c037","realm":"public"}	1	Add new token	f	\N
1257	2016-04-06 09:44:28.302778+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1179	2016-04-05 11:55:32.433041+03	350	insert	43	\N	{"userID":350,"body":"2b433f0ea8942ab5b726c43f5a3862afd7bb0dbff2aee12d27db75daea8fac27","realm":"google"}	1	Add new token	f	\N
1180	2016-04-05 11:55:37.894356+03	350	insert	43	\N	{"userID":350,"body":"664bdb2e2a5f8a58534aeefa2265b5eac085be0a2380bddc02ff8ea71aab9e18","realm":"public"}	1	Add new token	f	\N
1181	2016-04-05 11:56:16.489448+03	350	insert	43	\N	{"userID":350,"body":"2abcaf31512f0c53ef8f332ad0b6940642b77455652c38dc606a879fdff382f5","realm":"google"}	1	Add new token	f	\N
1182	2016-04-05 11:56:23.961375+03	350	insert	43	\N	{"userID":350,"body":"a306015731d9949ea1300a0aef46806eb774f3a752cec0d216918c41ceee39fb","realm":"yahoo"}	1	Add new token	f	\N
1183	2016-04-05 11:56:25.701607+03	350	insert	43	\N	{"userID":350,"body":"d9a2984badaf2fd736d21e9d0b41fd8d30d3afac609f6046358e24fb5263eeed","realm":"public"}	1	Add new token	f	\N
1184	2016-04-05 11:56:26.300338+03	350	insert	43	\N	{"userID":350,"body":"863bc199acf973259197f48f2a745f3d811fa61f9af3b938130f757be82f4cf7","realm":"yahoo"}	1	Add new token	f	\N
1185	2016-04-05 11:56:41.919366+03	350	insert	43	\N	{"userID":350,"body":"04b0bf45dc7b3e8b32b32e48e4c364f30e1e31ed17c558830e1e59e5572cdc29","realm":"public"}	1	Add new token	f	\N
1220	2016-04-05 13:47:00.230274+03	350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1222	2016-04-05 13:47:04.751028+03	350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1224	2016-04-05 13:47:21.264928+03	350	insert	43	\N	{"userID":350,"body":"06c002c92e94c5039ba03d0ce7851663999efd2be0dffedeff54a493902278af","realm":"public"}	1	Add new token	f	\N
1226	2016-04-05 14:26:20.699151+03	350	insert	43	\N	{"userID":350,"body":"6945cdd73d3a9c3a0668d9d5bb3dd41567bd40fc1947bb2efd531801423c7a4e","realm":"public"}	1	Add new token	f	\N
1228	2016-04-05 15:22:51.182686+03	350	delete	43	\N	{"userID":350,"realm":"google"}	1	Delete token	f	\N
1230	2016-04-05 15:29:15.985265+03	350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1232	2016-04-05 15:30:00.599243+03	350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1234	2016-04-05 15:30:57.663226+03	350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1236	2016-04-05 15:31:30.525064+03	350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1238	2016-04-05 15:31:34.848692+03	350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1240	2016-04-05 15:32:11.091296+03	350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1242	2016-04-05 15:47:57.923283+03	350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1248	2016-04-05 20:29:59.521462+03	350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1205	2016-04-05 12:28:00.217882+03	350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1256	2016-04-05 22:35:14.384495+03	-350	insert	43	\N	{"userID":350,"body":"027e69890fa1f20703cf76b497ee5b337795155777798d670fb41bba39b23465","realm":"public"}	1	Add new token	f	\N
1258	2016-04-06 09:44:32.928048+03	2	insert	43	\N	{"userID":2,"body":"736a58011bb2619f4c878afd12e1e1729457d5537e74f8ce07c4a8a5ac762ac0","realm":"igiware"}	1	Add new token	f	\N
1259	2016-04-06 09:55:36.455657+03	2	insert	43	\N	{"userID":2,"body":"1e90de0d3e9308d037b8393cb4f1813dd9cd9b60673688c755a3c099e0634f40","realm":"google"}	1	Add new token	f	\N
1260	2016-04-06 10:08:58.052068+03	-350	insert	43	\N	{"userID":350,"body":"445ec12e35a1cb11e1d8ca3942bcf7a58b01259e8df89742570cf598c2f49a7b","realm":"public"}	1	Add new token	f	\N
1261	2016-04-06 10:16:26.871176+03	2	insert	43	\N	{"userID":2,"body":"7c612e2d5a8a43c7189bdaf60de4e66dcb6d6680f98bbc57444f0346a5028a77","realm":"igiware"}	1	Add new token	f	\N
1262	2016-04-06 10:18:19.078866+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1263	2016-04-06 10:18:20.570486+03	-350	insert	43	\N	{"userID":350,"body":"de68f0709bc94dd2cbb7d8fab89872c81cde1f5a2a8984fd8de5bbe933f9a9b9","realm":"public"}	1	Add new token	f	\N
1264	2016-04-06 10:31:34.373567+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1265	2016-04-06 10:31:37.397137+03	-350	insert	43	\N	{"userID":350,"body":"6d7ea52260a4f1a9ee979a9cdd705e61cf8755a96d5bb2b7123e18a6fe03d8e9","realm":"public"}	1	Add new token	f	\N
1266	2016-04-06 10:31:40.059459+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1267	2016-04-06 10:31:45.269336+03	2	insert	43	\N	{"userID":2,"body":"07c13fca47703b7e0ab05318533f468c32da508fcd706fce889e38facc73a802","realm":"google"}	1	Add new token	f	\N
1268	2016-04-06 11:00:05.147545+03	-350	insert	43	\N	{"userID":350,"body":"c0e203ebf04cf30c83f2fc514b03b002db21ca2e0dbb16c177b69e3a3fdc5d69","realm":"public"}	1	Add new token	f	\N
1269	2016-04-06 11:00:42.382351+03	2	delete	43	\N	{"userID":2,"realm":"google"}	1	Delete token	f	\N
1270	2016-04-06 11:00:49.553219+03	2	insert	43	\N	{"userID":2,"body":"c8ebd1794217a0ae45aab3878298169313bd15919b854bd260d24beb636d9109","realm":"google"}	1	Add new token	f	\N
1271	2016-04-06 11:01:01.999629+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1272	2016-04-06 11:01:51.267771+03	2	delete	43	\N	{"userID":2,"realm":"google"}	1	Delete token	f	\N
1273	2016-04-06 11:01:53.192448+03	-350	insert	43	\N	{"userID":350,"body":"75d203052f3dd08fb2068398c1c7571857aeac82b78e9e034a92925de7339978","realm":"public"}	1	Add new token	f	\N
1274	2016-04-06 11:02:00.197699+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1275	2016-04-06 11:02:04.955629+03	2	insert	43	\N	{"userID":2,"body":"b08dcdd2795fbf1320cea6ea3765d1a827c5968ab610336c9df0cbe3fe9fe5f1","realm":"google"}	1	Add new token	f	\N
1276	2016-04-06 11:08:32.208466+03	2	insert	43	\N	{"userID":2,"body":"6cbd47d07dbda7fb1a61abab7e842f54489888897c12088065568b33f5e2cfba","realm":"igiware"}	1	Add new token	f	\N
1277	2016-04-06 11:11:04.892503+03	2	insert	43	\N	{"userID":2,"body":"5364767cd01f60f6d3bf45452653570030f51c7b2efbb08d83ad73f96ec68f5f","realm":"google"}	1	Add new token	f	\N
1278	2016-04-06 13:31:15.759245+03	2	insert	43	\N	{"userID":2,"body":"792b0e75753e8ac3294084b28b2e05e80fc1e6780607fe8d79bd7926bd7aab0d","realm":"igiware"}	1	Add new token	f	\N
1279	2016-04-06 13:31:54.8946+03	2	delete	43	\N	{"userID":2,"realm":"igiware"}	1	Delete token	f	\N
1280	2016-04-06 13:31:56.449985+03	-350	insert	43	\N	{"userID":350,"body":"2e75edcd7af1137b055b8df662e6e70209bd6aad991847a6fba02d231b0d1868","realm":"public"}	1	Add new token	f	\N
1281	2016-04-06 13:58:51.831719+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1282	2016-04-06 13:58:57.680219+03	2	insert	43	\N	{"userID":2,"body":"04a15571b22e5ff274820fb092b141c61958d1c7d06c892b1d857763255b18d4","realm":"google"}	1	Add new token	f	\N
1283	2016-04-06 14:04:44.0626+03	-350	insert	43	\N	{"userID":350,"body":"6fba57c5c0a54487ca676287c4e20434035b0a9cd542d99dac0b03c06d926a3b","realm":"public"}	1	Add new token	f	\N
1284	2016-04-06 14:05:49.568464+03	2	insert	43	\N	{"userID":2,"body":"9712e0c6ac0db582b8c4de74925b2348a3ddec7783f053265a96688bd579932b","realm":"igiware"}	1	Add new token	f	\N
1285	2016-04-06 14:06:00.731503+03	2	delete	43	\N	{"userID":2,"realm":"igiware"}	1	Delete token	f	\N
1286	2016-04-06 14:10:22.107443+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1287	2016-04-06 14:10:27.194292+03	2	insert	43	\N	{"userID":2,"body":"018c0bdc1188abd904b8c6e7a5699e725b75ddf4d96c13e19f751cc57d276eb9","realm":"google"}	1	Add new token	f	\N
1288	2016-04-06 14:25:31.209445+03	-350	insert	43	\N	{"userID":350,"body":"040c292d50fc56f6ca4cc335a1877b2a74b6df76cb1737aee033504f6cb39923","realm":"public"}	1	Add new token	f	\N
1289	2016-04-06 16:52:56.412024+03	2	insert	43	\N	{"userID":2,"body":"40335877d73f326d4de8c86f3c353ae90ef94ba534ba612ec0827977281514d2","realm":"test3"}	1	Add new token	f	\N
1290	2016-04-07 09:12:53.255615+03	2	insert	43	\N	{"userID":2,"body":"282597a91cca45bdc53c9c3e9e9948cff60383e35fbc56429dab0bab3bd3508d","realm":"igiware"}	1	Add new token	f	\N
1291	2016-04-07 09:53:28.02989+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1292	2016-04-07 09:53:33.258336+03	2	insert	43	\N	{"userID":2,"body":"dcec8c21e9c93df1444051961e9a49303117d20934f0b50a938e070fca3aca9e","realm":"google"}	1	Add new token	f	\N
1293	2016-04-07 10:05:13.179295+03	2	insert	43	\N	{"userID":2,"body":"74ddfaeff8dd94281aece9994228065f8693bcb6747107b843e8d0b751a6d337","realm":"igiware"}	1	Add new token	f	\N
1294	2016-04-07 10:09:46.723372+03	-350	insert	43	\N	{"userID":350,"body":"1b126e987a327581e0ba98cd56689886e1212c780def6fa96ef11fe3981bb791","realm":"public"}	1	Add new token	f	\N
1295	2016-04-07 10:10:30.644744+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1296	2016-04-07 10:10:38.452882+03	2	insert	43	\N	{"userID":2,"body":"b088763cb70f41ca71f6687021fdcf986bffe508a017c2c4fb572fb1cad81267","realm":"google"}	1	Add new token	f	\N
1297	2016-04-07 11:00:25.862399+03	-350	insert	43	\N	{"userID":350,"body":"e7e9ded8716228e7e4aee28660652c8a2b9784b01acb8d581fbae0ae60f9c778","realm":"public"}	1	Add new token	f	\N
1298	2016-04-07 11:13:49.508401+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1299	2016-04-07 11:13:54.582212+03	2	insert	43	\N	{"userID":2,"body":"6babb461fa7ca9817a7684e7007349f3f53ef15b1cf02bbd75c53060ed018251","realm":"google"}	1	Add new token	f	\N
1300	2016-04-07 11:14:58.879089+03	2	delete	43	\N	{"userID":2,"realm":"google"}	1	Delete token	f	\N
1301	2016-04-07 11:15:04.12006+03	3	insert	43	\N	{"userID":3,"body":"74489e08ef44a22ac3f9eb58cbf128a12c27414aceb4f3618532b442b0443a3f","realm":"google"}	1	Add new token	f	\N
1302	2016-04-07 11:15:15.33056+03	2	insert	43	\N	{"userID":2,"body":"5244742509dcc438df7c846b6ec2a738919030277cb5eedba88475b01dbc26aa","realm":"igiware"}	1	Add new token	f	\N
1303	2016-04-07 11:15:15.950122+03	3	delete	43	\N	{"userID":3,"realm":"google"}	1	Delete token	f	\N
1304	2016-04-07 11:15:22.144996+03	2	insert	43	\N	{"userID":2,"body":"d3385c0687c3934423dc88d54db77ee4dce13a08b7e3f2b8390e4c11efca825f","realm":"google"}	1	Add new token	f	\N
1305	2016-04-07 11:17:18.889414+03	2	delete	43	\N	{"userID":2,"realm":"google"}	1	Delete token	f	\N
1306	2016-04-07 11:17:25.039804+03	2	insert	43	\N	{"userID":2,"body":"27e85c85cf5d403bcacfe2d3f151c1ecaaf7f962625ad7ba784add94d32065a1","realm":"google"}	1	Add new token	f	\N
1307	2016-04-07 11:17:29.432581+03	2	delete	43	\N	{"userID":2,"realm":"google"}	1	Delete token	f	\N
1308	2016-04-07 11:17:34.571211+03	3	insert	43	\N	{"userID":3,"body":"b9364990fad3498d343daae44527fbcbfc4167c960e0d3ff2e0b54900ded5577","realm":"google"}	1	Add new token	f	\N
1309	2016-04-07 11:21:13.459876+03	3	delete	43	\N	{"userID":3,"realm":"google"}	1	Delete token	f	\N
1310	2016-04-07 11:21:18.684638+03	3	insert	43	\N	{"userID":3,"body":"942b4c9381736a5698feeb57b0881ec2b99e4b6e0085cbc7990894b7a5a3ea43","realm":"google"}	1	Add new token	f	\N
1311	2016-04-07 11:21:50.43291+03	3	delete	43	\N	{"userID":3,"realm":"google"}	1	Delete token	f	\N
1312	2016-04-07 11:21:55.138989+03	2	insert	43	\N	{"userID":2,"body":"64420bdf246bb3e99d6a6f588a47b311719082467aa38f30688db29e15ec7d6b","realm":"google"}	1	Add new token	f	\N
1313	2016-04-07 11:22:31.189796+03	2	delete	43	\N	{"userID":2,"realm":"google"}	1	Delete token	f	\N
1314	2016-04-07 11:22:36.653812+03	3	insert	43	\N	{"userID":3,"body":"052db1dbbf222b1f9fac2f725fd3670077412ce633b33b698976f62f0812c6eb","realm":"google"}	1	Add new token	f	\N
1315	2016-04-07 11:23:05.342014+03	3	delete	43	\N	{"userID":3,"realm":"google"}	1	Delete token	f	\N
1316	2016-04-07 11:23:10.416036+03	2	insert	43	\N	{"userID":2,"body":"ff19b4afa7d2a3f79dacf3187f7d94998b2db44ce37a1dd2f9f110de3394f6b7","realm":"google"}	1	Add new token	f	\N
1317	2016-04-07 11:35:07.570335+03	2	insert	43	\N	{"userID":2,"body":"699d139efe3dc851af365c1731b3bf5aa64145b8265c649ee8ebebdd0348c797","realm":"igiware"}	1	Add new token	f	\N
1318	2016-04-07 11:39:43.308104+03	-350	insert	43	\N	{"userID":350,"body":"a2cb804641aae0b60d33a212b1a2cf9821b90de3fd9930377df02108c3fea578","realm":"public"}	1	Add new token	f	\N
1319	2016-04-07 11:39:50.052388+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1320	2016-04-07 11:39:56.532466+03	2	insert	43	\N	{"userID":2,"body":"4320c098d03b74025451e95a72867c04a895dd76916ba093bfc21db38ab500c6","realm":"google"}	1	Add new token	f	\N
1321	2016-04-07 11:40:08.480899+03	2	delete	43	\N	{"userID":2,"realm":"google"}	1	Delete token	f	\N
1322	2016-04-07 11:40:13.541683+03	3	insert	43	\N	{"userID":3,"body":"9cd51830585425367d0f15b7908cfccec07ae0bb2bc0317ed0bd08629745e537","realm":"google"}	1	Add new token	f	\N
1323	2016-04-07 11:42:47.060227+03	2	insert	43	\N	{"userID":2,"body":"2b44c3aeefa42bdb6a2560415f1943f4feb9cb0a37c455c33be8573f83e63aaf","realm":"igiware"}	1	Add new token	f	\N
1324	2016-04-07 11:45:09.665534+03	3	delete	43	\N	{"userID":3,"realm":"google"}	1	Delete token	f	\N
1325	2016-04-07 11:45:17.992125+03	2	insert	43	\N	{"userID":2,"body":"d76eac4403d612cdcccbfed099f4b75b89df854354e085ffb70ca3399d4c7c51","realm":"google"}	1	Add new token	f	\N
1326	2016-04-07 11:45:35.104317+03	2	delete	43	\N	{"userID":2,"realm":"google"}	1	Delete token	f	\N
1327	2016-04-07 11:47:51.549578+03	2	insert	43	\N	{"userID":2,"body":"adf50b2c2cb235444a273a1832468730b52fa0a10bc7d9452a0b0468d94b5090","realm":"igiware"}	1	Add new token	f	\N
1328	2016-04-07 11:50:19.103853+03	5	insert	43	\N	{"userID":5,"body":"648011c6510db8ecd70f0050e0de912a7760842f276fdc4de6c506315fd99b3c","realm":"igiware"}	1	Add new token	f	\N
1329	2016-04-07 11:50:32.539322+03	5	delete	43	\N	{"userID":5,"realm":"igiware"}	1	Delete token	f	\N
1330	2016-04-07 11:54:35.549597+03	2	insert	43	\N	{"userID":2,"body":"a6c0b4748b162686a197aa57987d117693c01979b41e29970f22ab722f9db31e","realm":"google"}	1	Add new token	f	\N
1331	2016-04-07 12:00:01.08877+03	2	insert	43	\N	{"userID":2,"body":"adf62d2d5c4a860e6120062d5dcf4362bcc44fdfa7883cddc9fbe0b300fd0ddb","realm":"igiware"}	1	Add new token	f	\N
1332	2016-04-07 12:47:01.357566+03	2	delete	43	\N	{"userID":2,"realm":"igiware"}	1	Delete token	f	\N
1333	2016-04-07 12:50:26.895631+03	2	insert	43	\N	{"userID":2,"body":"9e33df6574b3596b408cbb1126fd982850c86b04493c1c64dc7923fd8188377c","realm":"igiware"}	1	Add new token	f	\N
1334	2016-04-07 13:10:09.040093+03	2	insert	43	\N	{"userID":2,"body":"c16a4ed686983c80dacbe43bcbfa64487fb6b5e25f7730db9cc7377360d29aa9","realm":"yandex"}	1	Add new token	f	\N
1335	2016-04-07 13:20:02.935155+03	-350	insert	43	\N	{"userID":350,"body":"bde6665a874d6759fb1645ceccde9774ae0e1d2b103dd3863685e82eaac906e2","realm":"public"}	1	Add new token	f	\N
1336	2016-04-07 13:22:12.166648+03	-348	update	15	348	\N	0	Password forgot	f	\N
1337	2016-04-07 13:38:25.288624+03	2	insert	43	\N	{"userID":2,"body":"be3bf0a9ee768df3aca58a49307d340d5a2a0fb6538373cfccbafa57b63a2f43","realm":"igiware"}	1	Add new token	f	\N
1338	2016-04-07 13:39:53.887146+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1339	2016-04-07 13:39:55.677388+03	-350	insert	43	\N	{"userID":350,"body":"605a1049ca7953eb2651fdcc1d52e3cfedfb498b016e4b5e4fefc062c341d024","realm":"public"}	1	Add new token	f	\N
1340	2016-04-07 13:43:50.227477+03	2	delete	43	\N	{"userID":2,"realm":"igiware"}	1	Delete token	f	\N
1341	2016-04-07 13:44:31.268244+03	5	update	15	5	\N	0	Reset password	f	\N
1342	2016-04-07 13:55:33.999153+03	2	insert	43	\N	{"userID":2,"body":"6b9c399f1c8e5e5687509df5e681247038a3ed899b5fd1faf262a8f6b8faacc8","realm":"igiware"}	1	Add new token	f	\N
1343	2016-04-07 14:15:20.825069+03	2	delete	43	\N	{"userID":2,"realm":"igiware"}	1	Delete token	f	\N
1344	2016-04-07 14:15:26.364548+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1345	2016-04-07 14:15:34.732618+03	2	insert	43	\N	{"userID":2,"body":"51a4e0c61eba1735afffd19cf04a058062bcaf1fdc7541f907a960cd4e4e8394","realm":"igiware"}	1	Add new token	f	\N
1346	2016-04-07 14:15:48.584941+03	-350	insert	43	\N	{"userID":350,"body":"9472af27bb6927385e22646bbcb97d4af2c34b5c504ad166d2cc5c5ffbd885e2","realm":"public"}	1	Add new token	f	\N
1347	2016-04-07 14:15:48.974498+03	2	delete	43	\N	{"userID":2,"realm":"igiware"}	1	Delete token	f	\N
1348	2016-04-07 14:15:59.822069+03	2	insert	43	\N	{"userID":2,"body":"42ee0d605a89762365f8e6c1decfdc54a2d304aa90e608ef8a5269ad923a219b","realm":"google"}	1	Add new token	f	\N
1349	2016-04-07 14:16:04.287181+03	2	delete	43	\N	{"userID":2,"realm":"google"}	1	Delete token	f	\N
1350	2016-04-07 14:16:11.1455+03	3	insert	43	\N	{"userID":3,"body":"51fcfc9355f893e09cd186d7a5a3d451a766a6b69c3a70ba346af2b93e905f23","realm":"igiware"}	1	Add new token	f	\N
1351	2016-04-07 14:16:12.115694+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1352	2016-04-07 14:16:17.281605+03	2	insert	43	\N	{"userID":2,"body":"af4200775172e39993f82ee038712da10d1fc5969bc282b17e16457ef30ee404","realm":"google"}	1	Add new token	f	\N
1353	2016-04-07 14:17:00.930038+03	2	delete	43	\N	{"userID":2,"realm":"google"}	1	Delete token	f	\N
1354	2016-04-07 14:17:03.306448+03	-350	insert	43	\N	{"userID":350,"body":"2d8c49fbf3eb55899d1740054a5467e213d999847988499f8b5a4a7e625f5a7c","realm":"public"}	1	Add new token	f	\N
1355	2016-04-07 14:18:21.656998+03	2	insert	43	\N	{"userID":2,"body":"2111260c9e8ac73d02f5cec7f3628fe0daf881b0f925353f432609124bfbd42c","realm":"igiware"}	1	Add new token	f	\N
1356	2016-04-07 14:35:59.789187+03	2	delete	43	\N	{"userID":2,"realm":"igiware"}	1	Delete token	f	\N
1357	2016-04-07 15:00:46.11142+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1358	2016-04-07 15:00:50.135063+03	2	insert	43	\N	{"userID":2,"body":"88bbcc7d40b2139e44379b5b97e56f1486062bbe7decc910480b07cf8ac27324","realm":"igiware"}	1	Add new token	f	\N
1359	2016-04-07 15:03:51.347498+03	2	insert	43	\N	{"userID":2,"body":"3c8391158ca67f89716cc4c5c095e39a6033c0328b6f08aa33b49b7a8ea72b4f","realm":"google"}	1	Add new token	f	\N
1360	2016-04-07 15:04:00.307072+03	2	delete	43	\N	{"userID":2,"realm":"google"}	1	Delete token	f	\N
1361	2016-04-07 15:04:02.717879+03	-350	insert	43	\N	{"userID":350,"body":"de04db54b90486190650cf9e79c9d582a59386c337a15e772a4c530606297058","realm":"public"}	1	Add new token	f	\N
1362	2016-04-07 15:06:36.011822+03	2	insert	43	\N	{"userID":2,"body":"f7a8ae55f1fb3b227ebdf8bfa374654a251f9598cd0a7d5bc04c6e4e3a50430f","realm":"igiware"}	1	Add new token	f	\N
1363	2016-04-07 15:10:44.20729+03	3	delete	43	\N	{"userID":3,"realm":"igiware"}	1	Delete token	f	\N
1364	2016-04-07 15:21:10.542182+03	-350	update	15	348	\N	0	Update user	f	\N
1365	2016-04-07 15:21:25.223324+03	-350	update	15	350	\N	0	Update user	f	\N
1366	2016-04-07 15:23:41.720035+03	-350	insert	15	355	\N	0	Add new superuser (invite)	f	\N
1367	2016-04-07 15:24:15.386771+03	-350	update	15	350	\N	0	Update user	f	\N
1368	2016-04-07 15:29:55.722555+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1369	2016-04-07 15:29:57.54235+03	-350	insert	43	\N	{"userID":350,"body":"da2b954b1b54e19de65567a2e89a5687f76f6a4225ceb7b5c63eb5e97c03d89f","realm":"public"}	1	Add new token	f	\N
1370	2016-04-07 15:30:08.134203+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1371	2016-04-07 15:30:13.192939+03	2	insert	43	\N	{"userID":2,"body":"66e3d2b5aece0abe1f4dbd21e53b2863faa2c30d4e9b003df6e3d7ca8d974598","realm":"google"}	1	Add new token	f	\N
1372	2016-04-07 15:32:31.792274+03	-350	insert	43	\N	{"userID":350,"body":"3e9183aab69d0cd8bffa4e8a0d14a3bb1fe8b4ff88228aac00ce7419d98570a1","realm":"public"}	1	Add new token	f	\N
1373	2016-04-07 15:33:49.960464+03	2	insert	43	\N	{"userID":2,"body":"cf87ea44c22f3c713b79695846d8008c34aa83130de21d1ee3272f5b0ba10b60","realm":"igiware"}	1	Add new token	f	\N
1374	2016-04-07 15:45:37.431064+03	-350	update	15	355	\N	0	Update user	f	\N
1375	2016-04-07 15:47:10.173639+03	2	insert	43	\N	{"userID":2,"body":"81c172cd480dbc450c68bad7f6e3498a31769e6a70edc03f7b9aa07b7eb22a58","realm":"test3"}	1	Add new token	f	\N
1376	2016-04-07 15:50:23.501499+03	2	insert	43	\N	{"userID":2,"body":"3d495be8f09302a96f1f145ef300d1d434907ebf10eb0ac5076d6c7bed17b6ec","realm":"igiware"}	1	Add new token	f	\N
1377	2016-04-07 15:50:26.530246+03	2	insert	43	\N	{"userID":2,"body":"aebd4daa5edd731ff7dc4ece7473cf5040149c3871033176813b470ab58de2c2","realm":"test3"}	1	Add new token	f	\N
1378	2016-04-07 15:50:29.501932+03	2	insert	43	\N	{"userID":2,"body":"4ea1b8194e17c5ca26239f80c620bf584915c7fe557df4828548646399b21eec","realm":"igiware"}	1	Add new token	f	\N
1379	2016-04-07 15:50:32.368012+03	2	insert	43	\N	{"userID":2,"body":"a217a0e307798a0e8b4597f7101234c8723c67de5da5eaabd112adaeb6226136","realm":"test3"}	1	Add new token	f	\N
1380	2016-04-07 15:50:37.007697+03	2	insert	43	\N	{"userID":2,"body":"87df1a2525d69c81e2a1996e9960851b51e9a5fb36b3ebd700bcc39657487e41","realm":"igiware"}	1	Add new token	f	\N
1381	2016-04-07 15:50:40.874324+03	2	insert	43	\N	{"userID":2,"body":"f372d7f0d03a69cc0dd688d7fe38af469f3db6b3fa00bc0c61c786e41cb8faa8","realm":"test3"}	1	Add new token	f	\N
1382	2016-04-07 15:59:23.519446+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1383	2016-04-07 15:59:25.087598+03	-350	insert	43	\N	{"userID":350,"body":"0279afb15a01ff5e02832d55459ca46b78a7bdcd4c15712d416f2215d1c75526","realm":"public"}	1	Add new token	f	\N
1384	2016-04-07 16:02:30.477707+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1385	2016-04-07 16:02:31.997251+03	-350	insert	43	\N	{"userID":350,"body":"7a4f547839e4b415f4b134b0e1718765d656dbad64d67a119d78326f517129dc","realm":"public"}	1	Add new token	f	\N
1386	2016-04-07 16:05:23.685191+03	2	insert	43	\N	{"userID":2,"body":"57efd6bf41dfc41b5f30b2def0a719f2c9eca7dd7137bf753adefaedc83f780c","realm":"igiware"}	1	Add new token	f	\N
1387	2016-04-07 16:26:35.456736+03	-350	update	15	355	\N	0	Update user	f	\N
1388	2016-04-07 21:15:55.215244+03	2	delete	43	\N	{"userID":2,"realm":"igiware"}	1	Delete token	f	\N
1389	2016-04-07 21:16:02.39909+03	2	insert	43	\N	{"userID":2,"body":"83641073cd027669a80e4fba133ed617657d879cc2817444b08ed9fc2da55ef4","realm":"igiware"}	1	Add new token	f	\N
1390	2016-04-07 21:18:10.687023+03	2	delete	43	\N	{"userID":2,"realm":"igiware"}	1	Delete token	f	\N
1391	2016-04-07 21:18:17.554384+03	2	insert	43	\N	{"userID":2,"body":"d13d1000a5a5e81007d209c32548abce80be0596c9c20924bbb43ae6b6b4aeb8","realm":"igiware"}	1	Add new token	f	\N
1392	2016-04-07 21:19:41.463278+03	2	delete	43	\N	{"userID":2,"realm":"igiware"}	1	Delete token	f	\N
1393	2016-04-07 21:19:51.011395+03	2	insert	43	\N	{"userID":2,"body":"44342c747a9796ef0c3ffa23899590ad0ac0769aa0806fc719f4424f0112f44f","realm":"igiware"}	1	Add new token	f	\N
1394	2016-04-07 21:22:46.283508+03	2	delete	43	\N	{"userID":2,"realm":"igiware"}	1	Delete token	f	\N
1395	2016-04-07 21:22:53.638496+03	2	insert	43	\N	{"userID":2,"body":"b2bd1476e9a5acf13e9386ec148540e738b1b69e5d73554883fdbede343aec68","realm":"igiware"}	1	Add new token	f	\N
1396	2016-04-07 21:26:05.499485+03	2	delete	43	\N	{"userID":2,"realm":"igiware"}	1	Delete token	f	\N
1397	2016-04-07 21:26:42.375289+03	2	insert	43	\N	{"userID":2,"body":"e46bfd621012574b224bacbde5ce5ef497b6bb644b3dd53cc7a5bcdc0e5a46c0","realm":"igiware"}	1	Add new token	f	\N
1398	2016-04-07 22:35:55.772202+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1399	2016-04-07 22:36:04.49414+03	3	insert	43	\N	{"userID":3,"body":"8e4d21b80f5d77a4b58717966f9dd127b914af0394bd22ba75b4c44a01ab9049","realm":"google"}	1	Add new token	f	\N
1400	2016-04-07 22:38:18.813567+03	3	delete	43	\N	{"userID":3,"realm":"google"}	1	Delete token	f	\N
1401	2016-04-07 22:38:29.694614+03	2	insert	43	\N	{"userID":2,"body":"83c898f6046d26db77f02c28368ddb540da052eba3333e6cb3475ff597591c13","realm":"google"}	1	Add new token	f	\N
1402	2016-04-07 23:02:08.673726+03	-350	insert	43	\N	{"userID":350,"body":"c42f297018cbb144ee2256f956726b972ccf4016da975a7084b4adaaa52d884f","realm":"public"}	1	Add new token	f	\N
1403	2016-04-08 08:48:33.81233+03	2	delete	43	\N	{"userID":2,"realm":"igiware"}	1	Delete token	f	\N
1404	2016-04-08 09:39:11.816137+03	-350	update	15	348	\N	0	Update user	f	\N
1405	2016-04-08 09:39:25.382214+03	-350	update	15	348	\N	0	Update user	f	\N
1406	2016-04-08 09:51:29.95262+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1407	2016-04-08 09:58:24.391295+03	-350	insert	43	\N	{"userID":350,"body":"8823060c4beeeb560386b3aca3c1996e32ff0bb12c3c797dac191c3474d15d03","realm":"public"}	1	Add new token	f	\N
1408	2016-04-08 09:59:16.336483+03	2	delete	43	\N	{"userID":2,"realm":"google"}	1	Delete token	f	\N
1409	2016-04-08 09:59:23.55393+03	3	insert	43	\N	{"userID":3,"body":"8a848bd56b02453507c7d1b35056f975fab9941a8063c3bc19d93c58f1b9d379","realm":"google"}	1	Add new token	f	\N
1410	2016-04-08 10:00:17.038125+03	3	delete	43	\N	{"userID":3,"realm":"google"}	1	Delete token	f	\N
1411	2016-04-08 10:01:43.694379+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1412	2016-04-08 10:02:11.210503+03	-350	insert	43	\N	{"userID":350,"body":"c24685c2c9015559409ea5804d75f3fcec99d6f37acf3d65bae09cc2b8b40aac","realm":"public"}	1	Add new token	f	\N
1413	2016-04-08 10:02:25.557369+03	-350	update	15	355	\N	0	Update user	f	\N
1414	2016-04-08 10:02:33.188229+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1415	2016-04-08 10:02:39.317095+03	-355	insert	43	\N	{"userID":355,"body":"3d9effc07f1f8ba14f555ee4cf9b81d3e46214f481db5dc3f65aab15116c7781","realm":"public"}	1	Add new token	f	\N
1416	2016-04-08 10:06:49.35682+03	2	insert	43	\N	{"userID":2,"body":"ec8d2127208902240bebb3b44453bf38a6d6c355bf96057188d4530e9f0bf882","realm":"igiware"}	1	Add new token	f	\N
1417	2016-04-08 11:11:47.208105+03	-355	delete	43	\N	{"userID":355,"realm":"public"}	1	Delete token	f	\N
1418	2016-04-08 11:11:52.193293+03	2	insert	43	\N	{"userID":2,"body":"975c5c2f92b3a936c5ef06c0a1d87e0f2053c76d3b2b7d02304527d2665d0fae","realm":"google"}	1	Add new token	f	\N
1419	2016-04-08 11:25:03.772934+03	-350	insert	43	\N	{"userID":350,"body":"c1320bf4403a18000eb6ee56dc04247a70013b90445e4d6e12b8ea3a01f23f8f","realm":"public"}	1	Add new token	f	\N
1420	2016-04-08 11:25:51.876742+03	-350	update	15	352	\N	0	Update user	f	\N
1421	2016-04-08 11:28:39.337296+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1422	2016-04-08 11:28:50.773817+03	-352	insert	43	\N	{"userID":352,"body":"c705a16c345a242eef78486e31307560d8806ccf2a1a7ac38a70b8ec39417eb5","realm":"public"}	1	Add new token	f	\N
1423	2016-04-08 12:02:05.646323+03	2	delete	43	\N	{"userID":2,"realm":"igiware"}	1	Delete token	f	\N
1424	2016-04-08 12:27:52.65984+03	2	insert	43	\N	{"userID":2,"body":"d17111ca2a957e255700f89b6fcfc85944feb7910fcdac510bf03beb385e3ec5","realm":"igiware"}	1	Add new token	f	\N
1425	2016-04-08 13:32:17.505648+03	-348	update	15	348	\N	0	Update user	f	\N
1426	2016-04-08 13:34:21.067579+03	-348	update	15	348	\N	0	Update user	f	\N
1427	2016-04-08 13:35:55.263244+03	-348	update	15	348	\N	0	Update user	f	\N
1428	2016-04-08 13:47:02.87579+03	2	delete	43	\N	{"userID":2,"realm":"google"}	1	Delete token	f	\N
1429	2016-04-08 13:47:04.210227+03	-350	insert	43	\N	{"userID":350,"body":"8ce24460123ce80ef7bbb3c5aa9d05f2cbbb90fc30ed9ffde3c8a874fd03ba44","realm":"public"}	1	Add new token	f	\N
1430	2016-04-08 13:47:14.626353+03	-350	update	15	355	\N	0	Update user	f	\N
1431	2016-04-10 18:30:55.929638+03	-352	update	15	352	\N	0	Update user	f	\N
1432	2016-04-10 18:42:54.80381+03	-352	delete	43	\N	{"userID":352,"realm":"public"}	1	Delete token	f	\N
1433	2016-04-10 18:43:11.565103+03	-352	insert	43	\N	{"userID":352,"body":"545758b1295f3bd3d77963360c3118af6a51dfaa1b0657a5f9ede4b583829eef","realm":"public"}	1	Add new token	f	\N
1434	2016-04-10 18:43:50.967252+03	-352	delete	43	\N	{"userID":352,"realm":"public"}	1	Delete token	f	\N
1435	2016-04-10 18:44:03.326051+03	-352	insert	43	\N	{"userID":352,"body":"a744a540a94a09dc2a6eeef472a84090e363183fc07be4bf27cba77eab8a11e2","realm":"public"}	1	Add new token	f	\N
1436	2016-04-11 10:48:29.570619+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1437	2016-04-11 10:48:31.438947+03	-350	insert	43	\N	{"userID":350,"body":"d27f3458efeac851058852a1648fbf79aaffda6d6f1dca8a38c0f4f9b5345058","realm":"public"}	1	Add new token	f	\N
1438	2016-04-11 10:48:50.35078+03	-350	update	15	355	\N	0	Update user	f	\N
1439	2016-04-11 10:48:53.372231+03	-352	delete	43	\N	{"userID":352,"realm":"public"}	1	Delete token	f	\N
1440	2016-04-11 10:49:02.292523+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1441	2016-04-11 10:49:10.666253+03	-355	insert	43	\N	{"userID":355,"body":"5b116bb1cda3930e65dae08f1fda33d84efcc59600d43c663eb5be186b913bb7","realm":"public"}	1	Add new token	f	\N
1442	2016-04-11 10:49:19.25325+03	-352	insert	43	\N	{"userID":352,"body":"b856c08b80f957adfd000b296f18db34ef4cfc0b047a200277175214fc30aeaf","realm":"public"}	1	Add new token	f	\N
1443	2016-04-11 10:49:45.738521+03	-355	delete	43	\N	{"userID":355,"realm":"public"}	1	Delete token	f	\N
1444	2016-04-11 10:49:54.629737+03	5	insert	43	\N	{"userID":5,"body":"d9786218cb77e61734bf358992af7bd12fdcd59ccd2fb2a4f7108fae76d50dd6","realm":"google"}	1	Add new token	f	\N
1445	2016-04-11 10:49:55.951676+03	-352	delete	43	\N	{"userID":352,"realm":"public"}	1	Delete token	f	\N
1446	2016-04-11 10:50:08.430694+03	-352	insert	43	\N	{"userID":352,"body":"75eed0f952d6ab3f669902cc5c87d01c979e1865779360dedd15c540ad478fb2","realm":"public"}	1	Add new token	f	\N
1447	2016-04-11 10:50:57.752883+03	5	delete	43	\N	{"userID":5,"realm":"google"}	1	Delete token	f	\N
1448	2016-04-11 10:51:03.117068+03	3	insert	43	\N	{"userID":3,"body":"35471768c65e3addde53837f9030ee32371c8515bfce87a86ab42b6adeb9bd0f","realm":"google"}	1	Add new token	f	\N
1449	2016-04-11 10:51:06.399746+03	3	delete	43	\N	{"userID":3,"realm":"google"}	1	Delete token	f	\N
1450	2016-04-11 10:51:08.797406+03	-350	insert	43	\N	{"userID":350,"body":"866c481deeb971e19bc24caf68c08fe32353ba670ffd3199ef8c862833265ac6","realm":"public"}	1	Add new token	f	\N
1451	2016-04-11 10:51:28.315635+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1452	2016-04-11 10:51:42.724314+03	3	insert	43	\N	{"userID":3,"body":"e6da6b24a0b16f1aeefb94be0c320bbfd30f11696c53af230e44dbefbb570e40","realm":"google"}	1	Add new token	f	\N
1453	2016-04-11 10:51:46.566045+03	3	delete	43	\N	{"userID":3,"realm":"google"}	1	Delete token	f	\N
1454	2016-04-11 10:51:48.454373+03	-350	insert	43	\N	{"userID":350,"body":"c890aacd023c90dec8be73a2d180a3447b851ba64059c838f4c21f46f6421231","realm":"public"}	1	Add new token	f	\N
1455	2016-04-11 10:52:03.042174+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1456	2016-04-11 10:52:07.789833+03	3	insert	43	\N	{"userID":3,"body":"45f79b32827ee21c9cfeee9417a8d84f7fc7c3a993ee23734097a90b672e8f61","realm":"google"}	1	Add new token	f	\N
1457	2016-04-11 10:53:21.048682+03	3	delete	43	\N	{"userID":3,"realm":"google"}	1	Delete token	f	\N
1458	2016-04-11 10:53:50.085206+03	-355	insert	43	\N	{"userID":355,"body":"a5d2054fb7de33c1031e77265a030bdd3b95a01abf92fb71b463c91262fb9dfa","realm":"public"}	1	Add new token	f	\N
1459	2016-04-11 10:53:53.027029+03	-355	delete	43	\N	{"userID":355,"realm":"public"}	1	Delete token	f	\N
1460	2016-04-11 10:54:32.899357+03	-355	insert	43	\N	{"userID":355,"body":"9e7197a7577f71fe44195860f969655eb34fae73146d39ee58e2f61723689237","realm":"public"}	1	Add new token	f	\N
1461	2016-04-11 10:54:56.107407+03	-355	delete	43	\N	{"userID":355,"realm":"public"}	1	Delete token	f	\N
1462	2016-04-11 10:55:05.970675+03	-355	insert	43	\N	{"userID":355,"body":"13c5d02582210d59eeb8d20c8c0c569a1575de6ad74f6c6d8d2f5acdc962eea9","realm":"public"}	1	Add new token	f	\N
1463	2016-04-11 10:55:42.443625+03	-355	delete	43	\N	{"userID":355,"realm":"public"}	1	Delete token	f	\N
1464	2016-04-11 12:29:35.56493+03	-350	insert	43	\N	{"userID":350,"body":"359a5459856c2eaf2e9a1c67b5b4900641d7285f6bf9d2a854f1560e71025f3e","realm":"public"}	1	Add new token	f	\N
1465	2016-04-11 12:32:12.371822+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1466	2016-04-11 12:32:31.201728+03	3	insert	43	\N	{"userID":3,"body":"c5f16244fc4d8f8052da5c56e2e0773a16e1ec2dd9d9f081c2604218fcd8ada7","realm":"igiware"}	1	Add new token	f	\N
1467	2016-04-11 12:32:38.848621+03	2	insert	43	\N	{"userID":2,"body":"96a1810f611511e33968638e811971d36995c243275c260532b147a868d4125b","realm":"yandex"}	1	Add new token	f	\N
1468	2016-04-11 13:07:25.84696+03	-348	update	15	348	\N	0	Password forgot	f	\N
1469	2016-04-11 13:34:30.212883+03	9	update	15	9	\N	0	Reset password	f	\N
1470	2016-04-11 14:27:27.456497+03	-350	insert	43	\N	{"userID":350,"body":"b740c982d7eef3ca43315c4dcc37fb132ea9c8e5b7a0a70269ff4de9a21620cd","realm":"public"}	1	Add new token	f	\N
1471	2016-04-11 14:27:41.651761+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1472	2016-04-11 15:40:04.664463+03	10	insert	43	\N	{"userID":10,"body":"13e541114aa8364285c02143c09a0763f6a6209f7ad2526f5781c6708e2c8275","realm":"google"}	1	Add new token	f	\N
1473	2016-04-11 15:40:33.045197+03	10	delete	43	\N	{"userID":10,"realm":"google"}	1	Delete token	f	\N
1474	2016-04-11 15:42:36.141011+03	-352	delete	43	\N	{"userID":352,"realm":"public"}	1	Delete token	f	\N
1475	2016-04-11 15:43:24.458807+03	11	insert	43	\N	{"userID":11,"body":"4bd32c6f51783f26e6356a120e5cb40c946072cf7b4eff0822dffce4462523aa","realm":"google"}	1	Add new token	f	\N
1476	2016-04-11 15:43:59.18976+03	11	delete	43	\N	{"userID":11,"realm":"google"}	1	Delete token	f	\N
1477	2016-04-11 15:44:16.611728+03	11	insert	43	\N	{"userID":11,"body":"dadde335aedc239ce9c764f40b5a720224259197d1d19e48a0d5dfe5b5cc48ab","realm":"google"}	1	Add new token	f	\N
1478	2016-04-11 15:44:25.355927+03	11	delete	43	\N	{"userID":11,"realm":"google"}	1	Delete token	f	\N
1479	2016-04-11 15:45:39.825828+03	11	update	15	11	\N	0	Reset password	f	\N
1480	2016-04-11 15:50:25.76629+03	11	insert	43	\N	{"userID":11,"body":"87db363333c300daaf9294ee6c357353d1322ce9c7fce0657777df95c23b7cff","realm":"google"}	1	Add new token	f	\N
1481	2016-04-11 15:50:36.446148+03	11	delete	43	\N	{"userID":11,"realm":"google"}	1	Delete token	f	\N
1482	2016-04-11 15:50:51.973719+03	-350	insert	43	\N	{"userID":350,"body":"2e3561218984604eb7d2f85e17b276bd3cc618ed37c70e6f084b0e5eb4aa3d05","realm":"public"}	1	Add new token	f	\N
1483	2016-04-11 15:50:57.500868+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1484	2016-04-11 15:51:32.700165+03	-350	insert	43	\N	{"userID":350,"body":"732a585118162baf18a2737f7991aa7ae1ee59e1d1907012f49631223126dc42","realm":"public"}	1	Add new token	f	\N
1485	2016-04-11 15:52:36.317325+03	11	update	15	11	\N	0	Reset password	f	\N
1486	2016-04-11 15:59:14.288574+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1487	2016-04-11 16:09:01.627796+03	-350	insert	43	\N	{"userID":350,"body":"3386b88d137485a65010bd4569799cbe12ac3dc6a2884c583184cd3c9f57e53d","realm":"public"}	1	Add new token	f	\N
1488	2016-04-11 16:09:06.150546+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1489	2016-04-11 16:09:12.999345+03	3	insert	43	\N	{"userID":3,"body":"1a2984e66276d66bc849b57d4b641d2fc037b560057a14437a6e465ee472dbc5","realm":"google"}	1	Add new token	f	\N
1490	2016-04-11 16:18:41.508153+03	9	update	15	9	\N	0	Reset password	f	\N
1491	2016-04-11 16:39:53.269484+03	9	update	15	9	\N	0	Reset password	f	\N
1492	2016-04-11 16:40:20.620399+03	-350	insert	43	\N	{"userID":350,"body":"4be199de4aca9ae1adfcd27720ed2f4e2993b9d299339c4ca434a610c9b1e782","realm":"public"}	1	Add new token	f	\N
1493	2016-04-11 16:40:26.344812+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1494	2016-04-11 16:45:40.312471+03	9	update	15	9	\N	0	Reset password	f	\N
1495	2016-04-11 16:46:03.357137+03	9	insert	43	\N	{"userID":9,"body":"3dbef2f7649bd85019a9b678e9eec265982af194dc878ef3aedfb6f44e847125","realm":"google"}	1	Add new token	f	\N
1496	2016-04-11 16:48:01.408683+03	-350	insert	43	\N	{"userID":350,"body":"e1ac9c188238d8e1734d190f4438686d6bad446968720adaaaaeda666d032dce","realm":"public"}	1	Add new token	f	\N
1497	2016-04-11 17:21:10.00345+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1498	2016-04-11 17:21:28.763372+03	3	delete	43	\N	{"userID":3,"realm":"google"}	1	Delete token	f	\N
1499	2016-04-11 17:21:30.354764+03	-350	insert	43	\N	{"userID":350,"body":"45146c5f37f181323429a6ef4a21a694fdbca985cdb9549470cb011d8e760e71","realm":"public"}	1	Add new token	f	\N
1500	2016-04-11 17:22:15.033788+03	3	insert	43	\N	{"userID":3,"body":"af18b7ffffc5419dd4b676900d593115e3e68c8dcf9e1f11faff63d2a8849b41","realm":"google"}	1	Add new token	f	\N
1501	2016-04-12 07:57:04.392152+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1502	2016-04-12 10:52:53.35898+03	3	delete	43	\N	{"userID":3,"realm":"google"}	1	Delete token	f	\N
1503	2016-04-12 10:52:55.375223+03	-350	insert	43	\N	{"userID":350,"body":"6a2fcf21f7de653b288e432daba1ba6db21fe9beebf112590cd58704da4365fb","realm":"public"}	1	Add new token	f	\N
1504	2016-04-12 10:59:46.060072+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1505	2016-04-12 10:59:52.32799+03	3	insert	43	\N	{"userID":3,"body":"301e4cd856bac911c12907fa7dee47ec527a7f0ff665cf6f09345e09ca351ef5","realm":"google"}	1	Add new token	f	\N
1506	2016-04-12 11:50:45.711171+03	-350	insert	43	\N	{"userID":350,"body":"b500837fd7e965f52e3f56eed82d88c5d2702ef57c9e7e70c6f1997bd028bad1","realm":"public"}	1	Add new token	f	\N
1507	2016-04-12 15:02:42.486741+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1508	2016-04-12 15:02:50.164148+03	2	insert	43	\N	{"userID":2,"body":"f0a9e95d08b4b340fb16e452adb5b8e1632113e236becab9586f6f62c9550b6f","realm":"google"}	1	Add new token	f	\N
1509	2016-04-13 12:25:01.441134+03	-350	update	15	350	\N	0	Password forgot	f	\N
1510	2016-04-13 13:35:58.953492+03	3	delete	43	\N	{"userID":3,"realm":"google"}	1	Delete token	f	\N
1511	2016-04-13 13:36:01.228818+03	-350	insert	43	\N	{"userID":350,"body":"8e12bdb64a3067307d06cd9a6c3c7ce85f4635b8e0d037eec8f860870e96ac93","realm":"public"}	1	Add new token	f	\N
1512	2016-04-13 13:37:55.417895+03	-350	update	15	350	\N	0	Password forgot	f	\N
1513	2016-04-13 13:39:21.770379+03	3	insert	43	\N	{"userID":3,"body":"1ce539d3ec75c3f3b7d8841f72a08af0fd31b6b61a471f52e32ea421dac6d0a0","realm":"google"}	1	Add new token	f	\N
1514	2016-04-13 13:40:21.872722+03	-350	update	15	350	\N	0	Password forgot	f	\N
1515	2016-04-13 13:41:40.814491+03	-350	update	15	350	\N	0	Password forgot	f	\N
1516	2016-04-13 13:43:10.153152+03	-350	update	15	350	\N	0	Password forgot	f	\N
1517	2016-04-13 14:36:48.14619+03	-350	delete	43	\N	{"userID":350,"realm":"public"}	1	Delete token	f	\N
1518	2016-04-13 14:37:13.65272+03	-350	insert	43	\N	{"userID":350,"body":"f71923827f1c0af0139a52e0fdd30f2de9958087ef3ce9bc9bb59365aeb53ceb","realm":"public"}	1	Add new token	f	\N
\.


--
-- Name: Logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indaba
--

SELECT pg_catalog.setval('"Logs_id_seq"', 1518, true);


--
-- Data for Name: Notifications; Type: TABLE DATA; Schema: public; Owner: indaba
--

COPY "Notifications" (id, "userFrom", "userTo", body, email, message, subject, "essenceId", "entityId", created, reading, sent, read, "notifyLevel", result, resent, note, "userFromName", "userToName") FROM stdin;
4	350	350	Indaba. Restore password	su@mail.net	<p>Hello Test Super Admin!</p>\n\n<p>\n\tTo restore your password, please follow this\n\t<a href="http://indaba.ntrlab.ru/#/reset/public/c75fb0cc3fab05f13428a51aecae6d1bb75d04873b5ce95a1b134832da940991">link</a>\n</p>	Indaba. Restore password	15	350	2016-04-13 12:25:01.468979+03	\N	2016-04-13 12:25:01.499+03	f	2	\N	\N	<p>Hello Test Super Admin!</p>\n\n<p>\n\tTo restore your password, please follow this\n\t<a href="http://indaba.ntrlab.ru/#/reset/public/c75fb0cc3fab05f13428a51aecae6d1bb75d04873b5ce95a1b134832da940991">link</a>\n</p>	\N	\N
5	350	350	Indaba. Restore password	su@mail.net	<p>Hello Test Super Admin!</p>\n\n<p>\n\tTo restore your password, please follow this\n\t<a href="http://indaba.ntrlab.ru/#/reset/public/54c07d67cf666bc4ade3d82dd4cb6ba9bc073c50f951c5440f287fb4614f047a">link</a>\n</p>	Indaba. Restore password	15	350	2016-04-13 13:37:55.45191+03	\N	2016-04-13 13:37:55.47+03	f	2	\N	\N	<p>Hello Test Super Admin!</p>\n\n<p>\n\tTo restore your password, please follow this\n\t<a href="http://indaba.ntrlab.ru/#/reset/public/54c07d67cf666bc4ade3d82dd4cb6ba9bc073c50f951c5440f287fb4614f047a">link</a>\n</p>	\N	\N
6	350	350	Indaba. Restore password	su@mail.net	<p>Hello Test Super Admin!</p>\n\n<p>\n\tTo restore your password, please follow this\n\t<a href="http://indaba.ntrlab.ru/#/reset/public/d76388acf324aca898350265a4a25894a91bc8b489db86e20358636ed0ea9c16">link</a>\n</p>	Indaba. Restore password	15	350	2016-04-13 13:40:21.911859+03	\N	2016-04-13 13:40:21.932+03	f	2	\N	\N	<p>Hello Test Super Admin!</p>\n\n<p>\n\tTo restore your password, please follow this\n\t<a href="http://indaba.ntrlab.ru/#/reset/public/d76388acf324aca898350265a4a25894a91bc8b489db86e20358636ed0ea9c16">link</a>\n</p>	\N	\N
7	350	350	Indaba. Restore password	su@mail.net	<p>Hello Test Super Admin!</p>\n\n<p>\n\tTo restore your password, please follow this\n\t<a href="http://indaba.ntrlab.ru/#/reset/public/0f35ca22859336166ddb87879f419247c661230d0bd8be998668e549f7db64fe">link</a>\n</p>	Indaba. Restore password	15	350	2016-04-13 13:41:40.847477+03	\N	2016-04-13 13:41:40.886+03	f	2	\N	\N	<p>Hello Test Super Admin!</p>\n\n<p>\n\tTo restore your password, please follow this\n\t<a href="http://indaba.ntrlab.ru/#/reset/public/0f35ca22859336166ddb87879f419247c661230d0bd8be998668e549f7db64fe">link</a>\n</p>	\N	\N
8	350	350	Indaba. Restore password	su@mail.net	<p>Hello Test Super Admin!</p>\n\n<p>\n\tTo restore your password, please follow this\n\t<a href="http://indaba.ntrlab.ru/#/reset/public/1f211bb6cfd964dce1a4f8adfb3335f55edb7a283646fe43d211ca983668a1b6">link</a>\n</p>	Indaba. Restore password	15	350	2016-04-13 13:43:10.18528+03	\N	2016-04-13 13:43:10.204+03	f	2	\N	\N	<p>Hello Test Super Admin!</p>\n\n<p>\n\tTo restore your password, please follow this\n\t<a href="http://indaba.ntrlab.ru/#/reset/public/1f211bb6cfd964dce1a4f8adfb3335f55edb7a283646fe43d211ca983668a1b6">link</a>\n</p>	\N	\N
\.


--
-- Name: Notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indaba
--

SELECT pg_catalog.setval('"Notifications_id_seq"', 8, true);


--
-- Data for Name: Rights; Type: TABLE DATA; Schema: public; Owner: indaba
--

COPY "Rights" (id, action, description, "essenceId") FROM stdin;
20	rights_edit_one	Can edit one right	\N
24	users_view_all	Can view list of all users	\N
26	users_edit_one	Can edit the user	\N
27	users_view_one	Can see the user	\N
28	users_delete_one	Can delete the user	\N
29	users_token	\N	\N
30	users_logout_self	\N	\N
31	users_logout	\N	\N
32	users_view_self	\N	\N
33	users_edit_self	\N	\N
80	role_rights_view_one	\N	\N
81	role_rights_add	\N	\N
127	product_delete	Can delete products	4
16	rights_view_all	Can see list of all rights	\N
18	rights_view_one	Can see one right	\N
129	work	Have to work hard :)	\N
17	rights_add_one	Can add rights	\N
19	rights_delete_one	Can delete one right .	\N
131	users_uoa	Can assign units of analysis to user	\N
133	Bruce the mighty	fghftj	13
134	users_invite	Can invite users	\N
135	unitofanalysis_insert_one	\N	6
136	unitofanalysis_update_one	\N	6
137	unitofanalysis_delete_one	\N	6
132	product_uoa	Can get product uoa	4
138	groups_delete	Delete groups	\N
\.


--
-- Name: Rights_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indaba
--

SELECT pg_catalog.setval('"Rights_id_seq"', 138, true);


--
-- Data for Name: Roles; Type: TABLE DATA; Schema: public; Owner: indaba
--

COPY "Roles" (id, name, "isSystem") FROM stdin;
1	admin	t
\.


--
-- Data for Name: RolesRights; Type: TABLE DATA; Schema: public; Owner: indaba
--

COPY "RolesRights" ("roleID", "rightID") FROM stdin;
\.


--
-- Name: Subindex_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indaba
--

SELECT pg_catalog.setval('"Subindex_id_seq"', 1, true);


--
-- Data for Name: Token; Type: TABLE DATA; Schema: public; Owner: indaba
--

COPY "Token" ("userID", body, "issuedAt", realm) FROM stdin;
112	36c9dc245543902db51338dd3a59a527c3a4d39f1d0c67df3bf1087342d4e99f	2016-03-30 13:40:51.610742	public
140	210c894bb1ae1d48826584fb09a3ce3ec41653b4055867b19a5c1ab89afd547b	2016-04-03 11:53:55.033348	google
9	3dbef2f7649bd85019a9b678e9eec265982af194dc878ef3aedfb6f44e847125	2016-04-11 16:46:03.268469	google
2	f372d7f0d03a69cc0dd688d7fe38af469f3db6b3fa00bc0c61c786e41cb8faa8	2016-04-07 15:50:40.806584	test3
2	f0a9e95d08b4b340fb16e452adb5b8e1632113e236becab9586f6f62c9550b6f	2016-04-12 15:02:50.090343	google
214	40aeec5c6fc5386a3103a57d4e6a95c5ff6441c8c85a4f845cdc1c05625abf52	2016-03-25 18:06:07.484224	sceleton
3	1ce539d3ec75c3f3b7d8841f72a08af0fd31b6b61a471f52e32ea421dac6d0a0	2016-04-13 13:39:21.706076	google
350	f71923827f1c0af0139a52e0fdd30f2de9958087ef3ce9bc9bb59365aeb53ceb	2016-04-13 14:37:13.597287	public
334	c719db2c1f34d359a32a515dd6e2685fbd02a20f40fc5591f6c0e9e293186444	2016-04-04 12:02:14.931699	google
288	f1f12a7aa306ee60e1b151dba08276b75eaa49c78cc94f3fa32d2ce63a7098ad	2016-03-25 18:42:16.067433	sceleton
125	4af63616ad4a30eb4925d0c7ebfa199f5aa8c35da3d1712a79ca0c8aa371bd59	2016-04-04 12:07:01.050702	google
114	3fef0f3c591bc4b69fc0556989ed87f4094b497dd408adf21d2dc0311ab166c0	2016-03-25 19:46:05.488507	public
258	6d271df121fa961b6ec2156083e79c47d33c0e4c417372c38d4fdd0c06c76079	2016-03-31 01:00:06.495825	yandex
338	9a500022a62588c76610fd3f36cd41a176efeaf21becc33d2e97aa63e194d9b4	2016-03-31 20:40:23.368467	public
335	5c2cefe75e3d0b81ed20f5bc239399840a1e9cd7e6b6f3b0e2cdf7b47d3e0c2d	2016-04-04 14:19:00.046598	public
348	37d903cd3d2c0adc50493f7c24bfb56f52200a6de1261bd0da4e4dfb1ce6ab00	2016-04-04 14:40:54.545841	public
2	d17111ca2a957e255700f89b6fcfc85944feb7910fcdac510bf03beb385e3ec5	2016-04-08 12:27:52.598277	igiware
76	599d8a7baf376ee5c64db715c780b838f2dbe15ee52d2cc1fd8c541c39ede956	2016-03-28 16:59:52.854403	public
336	f11832263dd7d5fbeb95473fd8998f3ce224df8c3a0c5be22ab4efcc5f344a04	2016-04-01 16:57:43.999568	public
322	9cd2d400770cd4c3bb71900670f68f658606443a936405e086023f103712d263	2016-03-29 08:10:24.742154	sceleton
3	c5f16244fc4d8f8052da5c56e2e0773a16e1ec2dd9d9f081c2604218fcd8ada7	2016-04-11 12:32:31.141068	igiware
2	96a1810f611511e33968638e811971d36995c243275c260532b147a868d4125b	2016-04-11 12:32:38.814492	yandex
\.


--
-- Name: UnitOfAnalysisClassType_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indaba
--

SELECT pg_catalog.setval('"UnitOfAnalysisClassType_id_seq"', 4, true);


--
-- Name: UnitOfAnalysisTagLink_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indaba
--

SELECT pg_catalog.setval('"UnitOfAnalysisTagLink_id_seq"', 5, true);


--
-- Name: UnitOfAnalysisType_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indaba
--

SELECT pg_catalog.setval('"UnitOfAnalysisType_id_seq"', 10, true);


--
-- Name: UnitOfAnalysis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indaba
--

SELECT pg_catalog.setval('"UnitOfAnalysis_id_seq"', 268, true);


--
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: indaba
--

COPY "Users" ("roleID", id, email, "firstName", "lastName", password, cell, birthday, "resetPasswordToken", "resetPasswordExpires", created, updated, "isActive", "activationToken", "organizationId", location, phone, address, lang, bio, "notifyLevel", timezone, "lastActive", affiliation, "isAnonymous", "langId", salt) FROM stdin;
1	350	test-su@mail.net	Test	Super Admin	2d97fa50e82fb50e883dfd491565f276349eed70dbf0ed0c188b051018ede809	\N	\N	1f211bb6cfd964dce1a4f8adfb3335f55edb7a283646fe43d211ca983668a1b6	1460547790071	2016-04-04 14:37:54.284+03	2016-04-13 14:37:14.142147	t	\N	\N	\N	\N	\N	\N	\N	0	\N	2016-04-13 14:37:14.136+03	\N	f	\N	\N
\.


--
-- Name: brand_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indaba
--

SELECT pg_catalog.setval('brand_id_seq', 19, true);


--
-- Name: country_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indaba
--

SELECT pg_catalog.setval('country_id_seq', 248, true);


--
-- Name: order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indaba
--

SELECT pg_catalog.setval('order_id_seq', 320, true);


--
-- Name: role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indaba
--

SELECT pg_catalog.setval('role_id_seq', 16, true);


--
-- Name: transport_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indaba
--

SELECT pg_catalog.setval('transport_id_seq', 22, true);


--
-- Name: transportmodel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indaba
--

SELECT pg_catalog.setval('transportmodel_id_seq', 24, true);


--
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indaba
--

SELECT pg_catalog.setval('user_id_seq', 355, true);


SET search_path = sceleton, pg_catalog;

--
-- Name: AccessMatix_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('"AccessMatix_id_seq"', 8, true);


--
-- Data for Name: AccessMatrices; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "AccessMatrices" (id, name, description, default_value) FROM stdin;
8	Default	Default access matrix	0
\.


--
-- Data for Name: AccessPermissions; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "AccessPermissions" ("matrixId", "roleId", "rightId", permission, id) FROM stdin;
\.


--
-- Name: AccessPermissions_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('"AccessPermissions_id_seq"', 1, true);


--
-- Data for Name: AnswerAttachments; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "AnswerAttachments" (id, "answerId", filename, size, mimetype, body, created, owner) FROM stdin;
\.


--
-- Name: AnswerAttachments_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('"AnswerAttachments_id_seq"', 1, true);


--
-- Data for Name: Discussions; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "Discussions" (id, "taskId", "questionId", "userId", entry, "isReturn", created, updated, "isResolve", "order", "returnTaskId", "userFromId") FROM stdin;
\.


--
-- Name: Discussions_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('"Discussions_id_seq"', 1, true);


--
-- Name: Entities_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('"Entities_id_seq"', 45, true);


--
-- Name: EntityRoles_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('"EntityRoles_id_seq"', 1, true);


--
-- Data for Name: Essences; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "Essences" (id, "tableName", name, "fileName", "nameField") FROM stdin;
23	WorflowSteps	WorflowSteps	worflowSteps	title
16	Surveys	Surveys	surveys	title
17	SurveyQuestions	Survey Questions	survey_questions	label
18	SurveyQuestionOptions	Survey Question Options	survey_question_options	label
19	SurveyAnswers	Survey Answers	survey_answers	value
20	Groups	Groups	groups	title
21	Organizations	Organizations	organizations	name
22	Tasks	Tasks	tasks	title
4	Products	Products	products	title
6	UnitOfAnalysis	UnitOfAnalysis	uoas	name
5	UnitOfAnalysisType	UnitOfAnalysisType	uoatypes	name
7	UnitOfAnalysisClassType	UnitOfAnalysisClassType	uoaclasstypes	name
8	UnitOfAnalysisTag	UnitOfAnalysisTag	uoatags	name
13	Projects	projects	projects	codeName
14	Discussions	Discussions	discussions	name
15	Users	Users	users	email
24	Notifications	notifications	notifications	body
25	ProductUOA	productUoa	product_uoa	productId
26	Indexes	Indexes	indexes	title
27	Subindexes	Subindexes	subindexes	title
28	IndexQuestionWeights	IndexQuestionWeights	index_question_weights	type
29	IndexSubindexWeights	IndexSubindexWeights	index_subindex_weights	type
36	Workflows	Workflows	workflows	name
37	WorfklowSteps	WorkflowSteps	workflow_steps	title
38	WorfklowStepGroups	WorkflowStepGroups	workflow_step_groups	stepId
31	UnitOfAnalysisTagLink	UnitOfAnalysisTagLink	uoataglinks	id
30	SubindexWeights	SubindexWeights	subindex_weights	type
32	Translations	Translations	translations	field
33	Roles	Roles	roles	name
34	Rights	Rights	rights	action
35	RoleRights	RoleRights	role_rights	roleId
39	Visualizations	Visualizations	visualizations	title
40	AccessMatrices	AccessMatrices	access_matrices	name
41	AccessPermissions	AccessPermissions	access_permissions	id
42	AnswerAttachments	AnswerAttachments	answer_attachments	filename
43	Token	Token	token	realm
44	UserUOA	UserUOA	user_uoa	UserId
45	UserGroups	UserGroups	user_groups	UserId
\.


--
-- Data for Name: Groups; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "Groups" (id, title, "organizationId", "langId") FROM stdin;
\.


--
-- Name: Groups_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('"Groups_id_seq"', 1, true);


--
-- Data for Name: IndexQuestionWeights; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "IndexQuestionWeights" ("indexId", "questionId", weight, type) FROM stdin;
\.


--
-- Data for Name: IndexSubindexWeights; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "IndexSubindexWeights" ("indexId", "subindexId", weight, type) FROM stdin;
\.


--
-- Name: Index_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('"Index_id_seq"', 1, true);


--
-- Data for Name: Indexes; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "Indexes" (id, "productId", title, description, divisor) FROM stdin;
\.


--
-- Name: JSON_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('"JSON_id_seq"', 1, true);


--
-- Data for Name: Languages; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "Languages" (id, name, "nativeName", code) FROM stdin;
1	English	English	en
2	Russian	Русский	ru
9	Japanese	日本語	jp
12	Spanish	Español	es
13	French	Le français	fr
\.


--
-- Name: Languages_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('"Languages_id_seq"', 13, true);


--
-- Data for Name: Logs; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "Logs" (id, created, "user", action, essence, entity, entities, quantity, info, error, result) FROM stdin;
\.


--
-- Name: Logs_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('"Logs_id_seq"', 1020, true);


--
-- Data for Name: Notifications; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "Notifications" (id, "userFrom", "userTo", body, email, message, subject, "essenceId", "entityId", created, reading, sent, read, "notifyLevel", result, resent, note, "userFromName", "userToName") FROM stdin;
\.


--
-- Name: Notifications_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('"Notifications_id_seq"', 1, true);


--
-- Data for Name: Organizations; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "Organizations" (id, name, address, "adminUserId", url, "enforceApiSecurity", "isActive", "langId", realm) FROM stdin;
\.


--
-- Name: Organizations_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('"Organizations_id_seq"', 1, true);


--
-- Data for Name: ProductUOA; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "ProductUOA" ("productId", "UOAid", "currentStepId", "isComplete") FROM stdin;
\.


--
-- Data for Name: Products; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "Products" (id, title, description, "originalLangId", "projectId", "surveyId", status, "langId") FROM stdin;
\.


--
-- Name: Products_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('"Products_id_seq"', 1, true);


--
-- Data for Name: Projects; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "Projects" (id, "organizationId", "codeName", description, created, "matrixId", "startTime", status, "adminUserId", "closeTime", "langId") FROM stdin;
\.


--
-- Name: Projects_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('"Projects_id_seq"', 1, true);


--
-- Data for Name: Rights; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "Rights" (id, action, description, "essenceId") FROM stdin;
20	rights_edit_one	Can edit one right	\N
24	users_view_all	Can view list of all users	\N
26	users_edit_one	Can edit the user	\N
27	users_view_one	Can see the user	\N
28	users_delete_one	Can delete the user	\N
29	users_token	\N	\N
30	users_logout_self	\N	\N
31	users_logout	\N	\N
32	users_view_self	\N	\N
33	users_edit_self	\N	\N
80	role_rights_view_one	\N	\N
81	role_rights_add	\N	\N
127	product_delete	Can delete products	4
16	rights_view_all	Can see list of all rights	\N
18	rights_view_one	Can see one right	\N
129	work	Have to work hard :)	\N
17	rights_add_one	Can add rights	\N
19	rights_delete_one	Can delete one right .	\N
131	users_uoa	Can assign units of analysis to user	\N
133	Bruce the mighty	fghftj	13
134	users_invite	Can invite users	\N
135	unitofanalysis_insert_one	\N	6
136	unitofanalysis_update_one	\N	6
137	unitofanalysis_delete_one	\N	6
132	product_uoa	Can get product uoa	4
138	groups_delete	Delete groups	\N
\.


--
-- Name: Rights_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('"Rights_id_seq"', 138, true);


--
-- Data for Name: Roles; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "Roles" (id, name, "isSystem") FROM stdin;
1	admin	t
2	client	t
3	user	t
\.


--
-- Data for Name: RolesRights; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "RolesRights" ("roleID", "rightID") FROM stdin;
2	16
2	24
2	26
2	33
2	129
2	131
2	132
2	135
2	136
2	137
2	138
2	17
2	18
2	19
2	20
2	27
2	28
2	29
2	30
2	31
2	32
2	80
2	81
2	127
2	133
2	134
\.


--
-- Data for Name: SubindexWeights; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "SubindexWeights" ("subindexId", "questionId", weight, type) FROM stdin;
\.


--
-- Name: Subindex_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('"Subindex_id_seq"', 1, true);


--
-- Data for Name: Subindexes; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "Subindexes" (id, "productId", title, description, divisor) FROM stdin;
\.


--
-- Name: SurveyAnswerVersions_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('"SurveyAnswerVersions_id_seq"', 4, true);


--
-- Data for Name: SurveyAnswers; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "SurveyAnswers" (id, "questionId", "userId", value, created, "productId", "UOAid", "wfStepId", version, "surveyId", "optionId", "langId", "isResponse", "isAgree", comments, attachments) FROM stdin;
\.


--
-- Name: SurveyAnswers_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('"SurveyAnswers_id_seq"', 1, true);


--
-- Data for Name: SurveyQuestionOptions; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "SurveyQuestionOptions" (id, "questionId", value, label, skip, "isSelected", "langId") FROM stdin;
\.


--
-- Data for Name: SurveyQuestions; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "SurveyQuestions" (id, "surveyId", type, label, "isRequired", "position", description, skip, size, "minLength", "maxLength", "isWordmml", "incOtherOpt", units, "intOnly", value, qid, links, attachment, "optionNumbering", "langId") FROM stdin;
\.


--
-- Name: SurveyQuestions_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('"SurveyQuestions_id_seq"', 1, true);


--
-- Data for Name: Surveys; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "Surveys" (id, title, description, created, "projectId", "isDraft", "langId") FROM stdin;
\.


--
-- Data for Name: Tasks; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "Tasks" (id, title, description, "uoaId", "stepId", created, "productId", "startDate", "endDate", "userId", "langId") FROM stdin;
\.


--
-- Name: Tasks_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('"Tasks_id_seq"', 1, true);


--
-- Data for Name: Translations; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "Translations" ("essenceId", "entityId", field, "langId", value) FROM stdin;
\.


--
-- Data for Name: UnitOfAnalysis; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "UnitOfAnalysis" (id, "gadmId0", "gadmId1", "gadmId2", "gadmId3", "gadmObjectId", "ISO", "ISO2", "nameISO", name, description, "shortName", "HASC", "unitOfAnalysisType", "parentId", "creatorId", "ownerId", visibility, status, created, deleted, "langId", updated) FROM stdin;
\.


--
-- Data for Name: UnitOfAnalysisClassType; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "UnitOfAnalysisClassType" (id, name, description, "langId") FROM stdin;
\.


--
-- Name: UnitOfAnalysisClassType_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('"UnitOfAnalysisClassType_id_seq"', 1, true);


--
-- Data for Name: UnitOfAnalysisTag; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "UnitOfAnalysisTag" (id, name, description, "langId", "classTypeId") FROM stdin;
\.


--
-- Data for Name: UnitOfAnalysisTagLink; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "UnitOfAnalysisTagLink" (id, "uoaId", "uoaTagId") FROM stdin;
\.


--
-- Name: UnitOfAnalysisTagLink_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('"UnitOfAnalysisTagLink_id_seq"', 1, true);


--
-- Name: UnitOfAnalysisTag_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('"UnitOfAnalysisTag_id_seq"', 1, true);


--
-- Data for Name: UnitOfAnalysisType; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "UnitOfAnalysisType" (id, name, description, "langId") FROM stdin;
1	Country	\N	1
\.


--
-- Name: UnitOfAnalysisType_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('"UnitOfAnalysisType_id_seq"', 1, true);


--
-- Name: UnitOfAnalysis_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('"UnitOfAnalysis_id_seq"', 1, true);


--
-- Data for Name: UserGroups; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "UserGroups" ("userId", "groupId") FROM stdin;
\.


--
-- Data for Name: UserRights; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "UserRights" ("userID", "rightID", "canDo") FROM stdin;
\.


--
-- Data for Name: UserUOA; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "UserUOA" ("UserId", "UOAid") FROM stdin;
\.


--
-- Data for Name: Users; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "Users" ("roleID", id, email, "firstName", "lastName", password, cell, birthday, "resetPasswordToken", "resetPasswordExpires", created, updated, "isActive", "activationToken", "organizationId", location, phone, address, lang, bio, "notifyLevel", timezone, "lastActive", affiliation, "isAnonymous", "langId") FROM stdin;
\.


--
-- Data for Name: Visualizations; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "Visualizations" (id, title, "productId", "topicIds", "indexCollection", "indexId", "visualizationType", "comparativeTopicId", "organizationId") FROM stdin;
\.


--
-- Name: Visualizations_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('"Visualizations_id_seq"', 1, true);


--
-- Data for Name: WorkflowStepGroups; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "WorkflowStepGroups" ("stepId", "groupId") FROM stdin;
\.


--
-- Data for Name: WorkflowSteps; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "WorkflowSteps" ("workflowId", id, "startDate", "endDate", title, "provideResponses", "discussionParticipation", "blindReview", "seeOthersResponses", "allowTranslate", "position", "writeToAnswers", "allowEdit", role, "langId") FROM stdin;
\.


--
-- Name: WorkflowSteps_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('"WorkflowSteps_id_seq"', 1, true);


--
-- Data for Name: Workflows; Type: TABLE DATA; Schema: sceleton; Owner: indaba
--

COPY "Workflows" (id, name, description, created, "productId") FROM stdin;
\.


--
-- Name: Workflows_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('"Workflows_id_seq"', 1, true);


--
-- Name: brand_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('brand_id_seq', 19, true);


--
-- Name: country_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('country_id_seq', 248, true);


--
-- Name: order_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('order_id_seq', 320, true);


--
-- Name: role_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('role_id_seq', 3, true);


--
-- Name: surveyQuestionOptions_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('"surveyQuestionOptions_id_seq"', 1, true);


--
-- Name: transport_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('transport_id_seq', 22, true);


--
-- Name: transportmodel_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('transportmodel_id_seq', 24, true);


--
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: indaba
--

SELECT pg_catalog.setval('user_id_seq', 1, true);


SET search_path = public, pg_catalog;

--
-- Name: Entity_pkey; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Entity_pkey" PRIMARY KEY (id);


--
-- Name: Essences_fileName_key; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_fileName_key" UNIQUE ("fileName");


--
-- Name: Essences_tableName_key; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_tableName_key" UNIQUE ("tableName");


--
-- Name: Languages_code_key; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Languages"
    ADD CONSTRAINT "Languages_code_key" UNIQUE (code);


--
-- Name: Languages_pkey; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Languages"
    ADD CONSTRAINT "Languages_pkey" PRIMARY KEY (id);


--
-- Name: Logs_pkey; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Logs"
    ADD CONSTRAINT "Logs_pkey" PRIMARY KEY (id);


--
-- Name: Notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_pkey" PRIMARY KEY (id);


--
-- Name: Rights_pkey; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Rights"
    ADD CONSTRAINT "Rights_pkey" PRIMARY KEY (id);


--
-- Name: Token_pkey; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Token"
    ADD CONSTRAINT "Token_pkey" PRIMARY KEY ("userID", realm);


--
-- Name: Users_email_key; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- Name: id; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Roles"
    ADD CONSTRAINT id PRIMARY KEY (id);


--
-- Name: roleRight_pkey; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "roleRight_pkey" PRIMARY KEY ("roleID", "rightID");


--
-- Name: userID; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "userID" PRIMARY KEY (id);


SET search_path = sceleton, pg_catalog;

--
-- Name: AccessMatrices_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "AccessMatrices"
    ADD CONSTRAINT "AccessMatrices_pkey" PRIMARY KEY (id);


--
-- Name: AccessPermissions_matrixId_roleId_rightId_key; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "AccessPermissions"
    ADD CONSTRAINT "AccessPermissions_matrixId_roleId_rightId_key" UNIQUE ("matrixId", "roleId", "rightId");


--
-- Name: AccessPermissions_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "AccessPermissions"
    ADD CONSTRAINT "AccessPermissions_pkey" PRIMARY KEY (id);


--
-- Name: AnswerAttachments_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "AnswerAttachments"
    ADD CONSTRAINT "AnswerAttachments_pkey" PRIMARY KEY (id);


--
-- Name: Discussions_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_pkey" PRIMARY KEY (id);


--
-- Name: Essences_fileName_key; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_fileName_key" UNIQUE ("fileName");


--
-- Name: Essences_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_pkey" PRIMARY KEY (id);


--
-- Name: Essences_tableName_key; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_tableName_key" UNIQUE ("tableName");


--
-- Name: Groups_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Groups"
    ADD CONSTRAINT "Groups_pkey" PRIMARY KEY (id);


--
-- Name: IndexQuestionWeights_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "IndexQuestionWeights"
    ADD CONSTRAINT "IndexQuestionWeights_pkey" PRIMARY KEY ("indexId", "questionId");


--
-- Name: IndexSubindexWeights_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "IndexSubindexWeights"
    ADD CONSTRAINT "IndexSubindexWeights_pkey" PRIMARY KEY ("indexId", "subindexId");


--
-- Name: Indexes_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Indexes"
    ADD CONSTRAINT "Indexes_pkey" PRIMARY KEY (id);


--
-- Name: Languages_code_key; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Languages"
    ADD CONSTRAINT "Languages_code_key" UNIQUE (code);


--
-- Name: Languages_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Languages"
    ADD CONSTRAINT "Languages_pkey" PRIMARY KEY (id);


--
-- Name: Logs_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Logs"
    ADD CONSTRAINT "Logs_pkey" PRIMARY KEY (id);


--
-- Name: Notifications_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_pkey" PRIMARY KEY (id);


--
-- Name: Organizations_adminUserId_key; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_adminUserId_key" UNIQUE ("adminUserId");


--
-- Name: Organizations_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_pkey" PRIMARY KEY (id);


--
-- Name: ProductUOA_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_pkey" PRIMARY KEY ("productId", "UOAid");


--
-- Name: Products_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_pkey" PRIMARY KEY (id);


--
-- Name: Projects_codeName_key; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_codeName_key" UNIQUE ("codeName");


--
-- Name: Projects_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_pkey" PRIMARY KEY (id);


--
-- Name: Rights_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Rights"
    ADD CONSTRAINT "Rights_pkey" PRIMARY KEY (id);


--
-- Name: RolesRights_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "RolesRights_pkey" PRIMARY KEY ("roleID", "rightID");


--
-- Name: Roles_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Roles"
    ADD CONSTRAINT "Roles_pkey" PRIMARY KEY (id);


--
-- Name: SubindexWeights_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "SubindexWeights"
    ADD CONSTRAINT "SubindexWeights_pkey" PRIMARY KEY ("subindexId", "questionId");


--
-- Name: Subindexes_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Subindexes"
    ADD CONSTRAINT "Subindexes_pkey" PRIMARY KEY (id);


--
-- Name: SurveyAnswers_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_pkey" PRIMARY KEY (id);


--
-- Name: SurveyQuestionOptions_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "SurveyQuestionOptions"
    ADD CONSTRAINT "SurveyQuestionOptions_pkey" PRIMARY KEY (id);


--
-- Name: SurveyQuestions_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "SurveyQuestions"
    ADD CONSTRAINT "SurveyQuestions_pkey" PRIMARY KEY (id);


--
-- Name: Surveys_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Surveys"
    ADD CONSTRAINT "Surveys_pkey" PRIMARY KEY (id);


--
-- Name: Tasks_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_pkey" PRIMARY KEY (id);


--
-- Name: Translations_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_pkey" PRIMARY KEY ("essenceId", "entityId", field, "langId");


--
-- Name: UnitOfAnalysisClassType_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysisClassType"
    ADD CONSTRAINT "UnitOfAnalysisClassType_pkey" PRIMARY KEY (id);


--
-- Name: UnitOfAnalysisTagLink_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_pkey" PRIMARY KEY (id);


--
-- Name: UnitOfAnalysisTagLink_uoaId_uoaTagId_key; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_uoaId_uoaTagId_key" UNIQUE ("uoaId", "uoaTagId");


--
-- Name: UnitOfAnalysisTag_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_pkey" PRIMARY KEY (id);


--
-- Name: UnitOfAnalysisType_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysisType"
    ADD CONSTRAINT "UnitOfAnalysisType_pkey" PRIMARY KEY (id);


--
-- Name: UnitOfAnalysis_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_pkey" PRIMARY KEY (id);

--
-- Name: UnitOfAnalysis_name_key; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_name_key" UNIQUE ("name");

--
-- Name: UserGroups_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "UserGroups"
    ADD CONSTRAINT "UserGroups_pkey" PRIMARY KEY ("userId", "groupId");


--
-- Name: UserRights_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "UserRights"
    ADD CONSTRAINT "UserRights_pkey" PRIMARY KEY ("userID", "rightID");


--
-- Name: UserUOA_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "UserUOA"
    ADD CONSTRAINT "UserUOA_pkey" PRIMARY KEY ("UserId", "UOAid");


--
-- Name: Users_email_key; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- Name: Users_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- Name: Visualizations_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Visualizations"
    ADD CONSTRAINT "Visualizations_pkey" PRIMARY KEY (id);


--
-- Name: WorkflowStepGroups_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "WorkflowStepGroups"
    ADD CONSTRAINT "WorkflowStepGroups_pkey" PRIMARY KEY ("stepId", "groupId");


--
-- Name: WorkflowSteps_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "WorkflowSteps"
    ADD CONSTRAINT "WorkflowSteps_pkey" PRIMARY KEY (id);


--
-- Name: Workflows_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Workflows"
    ADD CONSTRAINT "Workflows_pkey" PRIMARY KEY (id);


--
-- Name: Workflows_productId_key; Type: CONSTRAINT; Schema: sceleton; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Workflows"
    ADD CONSTRAINT "Workflows_productId_key" UNIQUE ("productId");


SET search_path = public, pg_catalog;

--
-- Name: Essences_upper_idx; Type: INDEX; Schema: public; Owner: indaba; Tablespace: 
--

CREATE UNIQUE INDEX "Essences_upper_idx" ON "Essences" USING btree (upper((name)::text));


--
-- Name: Rights_action_idx; Type: INDEX; Schema: public; Owner: indaba; Tablespace: 
--

CREATE UNIQUE INDEX "Rights_action_idx" ON "Rights" USING btree (action);


--
-- Name: Token_body_idx; Type: INDEX; Schema: public; Owner: indaba; Tablespace: 
--

CREATE UNIQUE INDEX "Token_body_idx" ON "Token" USING btree (body);


--
-- Name: fki_roleID; Type: INDEX; Schema: public; Owner: indaba; Tablespace: 
--

CREATE INDEX "fki_roleID" ON "Users" USING btree ("roleID");


--
-- Name: fki_rolesrights_rightID; Type: INDEX; Schema: public; Owner: indaba; Tablespace: 
--

CREATE INDEX "fki_rolesrights_rightID" ON "RolesRights" USING btree ("rightID");


SET search_path = sceleton, pg_catalog;

--
-- Name: Essences_upper_idx; Type: INDEX; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE UNIQUE INDEX "Essences_upper_idx" ON "Essences" USING btree (upper((name)::text));


--
-- Name: Indexes_productId_idx; Type: INDEX; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE INDEX "Indexes_productId_idx" ON "Indexes" USING btree ("productId");


--
-- Name: Rights_action_idx; Type: INDEX; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE UNIQUE INDEX "Rights_action_idx" ON "Rights" USING btree (action);


--
-- Name: RolesRights_rightID_idx; Type: INDEX; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE INDEX "RolesRights_rightID_idx" ON "RolesRights" USING btree ("rightID");


--
-- Name: Subindexes_productId_idx; Type: INDEX; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE INDEX "Subindexes_productId_idx" ON "Subindexes" USING btree ("productId");


--
-- Name: UnitOfAnalysisTagLink_uoaId_idx; Type: INDEX; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE INDEX "UnitOfAnalysisTagLink_uoaId_idx" ON "UnitOfAnalysisTagLink" USING btree ("uoaId");


--
-- Name: UnitOfAnalysisTagLink_uoaTagId_idx; Type: INDEX; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE INDEX "UnitOfAnalysisTagLink_uoaTagId_idx" ON "UnitOfAnalysisTagLink" USING btree ("uoaTagId");


--
-- Name: Users_roleID_idx; Type: INDEX; Schema: sceleton; Owner: indaba; Tablespace: 
--

CREATE INDEX "Users_roleID_idx" ON "Users" USING btree ("roleID");


SET search_path = public, pg_catalog;

--
-- Name: tr_delete_token; Type: TRIGGER; Schema: public; Owner: indaba
--

CREATE TRIGGER tr_delete_token BEFORE INSERT ON "Token" FOR EACH ROW EXECUTE PROCEDURE twc_delete_old_token();


--
-- Name: users_before_update; Type: TRIGGER; Schema: public; Owner: indaba
--

CREATE TRIGGER users_before_update BEFORE UPDATE ON "Users" FOR EACH ROW EXECUTE PROCEDURE users_before_update();


--
-- Name: Logs_essence_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "Logs"
    ADD CONSTRAINT "Logs_essence_fkey" FOREIGN KEY (essence) REFERENCES "Essences"(id) ON DELETE SET NULL;


--
-- Name: Notifications_essenceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_essenceId_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id) ON DELETE SET NULL;


--
-- Name: Notifications_userFrom_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_userFrom_fkey" FOREIGN KEY ("userFrom") REFERENCES "Users"(id) ON DELETE CASCADE;


--
-- Name: Notifications_userTo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_userTo_fkey" FOREIGN KEY ("userTo") REFERENCES "Users"(id) ON DELETE CASCADE;


--
-- Name: Rights_essence_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "Rights"
    ADD CONSTRAINT "Rights_essence_id_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- Name: RolesRights_roleID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "RolesRights_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "Roles"(id);


--
-- Name: Users_langId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Users_roleID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "Roles"(id);


--
-- Name: rolesrights_rightID; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "rolesrights_rightID" FOREIGN KEY ("rightID") REFERENCES "Rights"(id);


SET search_path = sceleton, pg_catalog;

--
-- Name: AnswerAttachments_answerId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "AnswerAttachments"
    ADD CONSTRAINT "AnswerAttachments_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "SurveyAnswers"(id);


--
-- Name: AnswerAttachments_owner_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "AnswerAttachments"
    ADD CONSTRAINT "AnswerAttachments_owner_fkey" FOREIGN KEY (owner) REFERENCES "Users"(id);


--
-- Name: Discussions_questionId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions"(id);


--
-- Name: Discussions_returnTaskId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_returnTaskId_fkey" FOREIGN KEY ("returnTaskId") REFERENCES "Tasks"(id);


--
-- Name: Discussions_taskId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Tasks"(id);


--
-- Name: Discussions_userFromId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_userFromId_fkey" FOREIGN KEY ("userFromId") REFERENCES "Users"(id);


--
-- Name: Discussions_userId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"(id);


--
-- Name: Groups_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Groups"
    ADD CONSTRAINT "Groups_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Groups_organizationId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Groups"
    ADD CONSTRAINT "Groups_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- Name: IndexQuestionWeights_indexId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "IndexQuestionWeights"
    ADD CONSTRAINT "IndexQuestionWeights_indexId_fkey" FOREIGN KEY ("indexId") REFERENCES "Indexes"(id);


--
-- Name: IndexQuestionWeights_questionId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "IndexQuestionWeights"
    ADD CONSTRAINT "IndexQuestionWeights_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions"(id);


--
-- Name: IndexSubindexWeights_indexId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "IndexSubindexWeights"
    ADD CONSTRAINT "IndexSubindexWeights_indexId_fkey" FOREIGN KEY ("indexId") REFERENCES "Indexes"(id);


--
-- Name: IndexSubindexWeights_subindexId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "IndexSubindexWeights"
    ADD CONSTRAINT "IndexSubindexWeights_subindexId_fkey" FOREIGN KEY ("subindexId") REFERENCES "Subindexes"(id);


--
-- Name: Indexes_productId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Indexes"
    ADD CONSTRAINT "Indexes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: Logs_essence_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Logs"
    ADD CONSTRAINT "Logs_essence_fkey" FOREIGN KEY (essence) REFERENCES "Essences"(id) ON DELETE SET NULL;


--
-- Name: Notifications_essenceId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_essenceId_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id) ON DELETE SET NULL;


--
-- Name: Notifications_userFrom_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_userFrom_fkey" FOREIGN KEY ("userFrom") REFERENCES "Users"(id) ON DELETE CASCADE;


--
-- Name: Notifications_userTo_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_userTo_fkey" FOREIGN KEY ("userTo") REFERENCES "Users"(id) ON DELETE CASCADE;


--
-- Name: Organizations_adminUserId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "Users"(id);


--
-- Name: Organizations_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: ProductUOA_UOAid_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_UOAid_fkey" FOREIGN KEY ("UOAid") REFERENCES "UnitOfAnalysis"(id);


--
-- Name: ProductUOA_currentStepId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_currentStepId_fkey" FOREIGN KEY ("currentStepId") REFERENCES "WorkflowSteps"(id);


--
-- Name: ProductUOA_productId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: Products_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Products_originalLangId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_originalLangId_fkey" FOREIGN KEY ("originalLangId") REFERENCES "Languages"(id);


--
-- Name: Products_projectId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Projects"(id);


--
-- Name: Products_surveyId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Surveys"(id);


--
-- Name: Projects_accessMatrixId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_accessMatrixId_fkey" FOREIGN KEY ("matrixId") REFERENCES "AccessMatrices"(id);


--
-- Name: Projects_adminUserId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "Users"(id);


--
-- Name: Projects_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Projects_organizationId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- Name: Rights_essence_id_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Rights"
    ADD CONSTRAINT "Rights_essence_id_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- Name: RolesRights_roleID_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "RolesRights_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "Roles"(id);


--
-- Name: SubindexWeights_questionId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "SubindexWeights"
    ADD CONSTRAINT "SubindexWeights_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions"(id);


--
-- Name: SubindexWeights_subindexId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "SubindexWeights"
    ADD CONSTRAINT "SubindexWeights_subindexId_fkey" FOREIGN KEY ("subindexId") REFERENCES "Subindexes"(id);


--
-- Name: Subindexes_productId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Subindexes"
    ADD CONSTRAINT "Subindexes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: SurveyAnswers_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: SurveyAnswers_productId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: SurveyAnswers_questionId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions"(id);


--
-- Name: SurveyAnswers_surveyId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Surveys"(id);


--
-- Name: SurveyAnswers_userId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"(id);


--
-- Name: SurveyAnswers_wfStepId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_wfStepId_fkey" FOREIGN KEY ("wfStepId") REFERENCES "WorkflowSteps"(id);


--
-- Name: SurveyQuestionOptions_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "SurveyQuestionOptions"
    ADD CONSTRAINT "SurveyQuestionOptions_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: SurveyQuestions_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "SurveyQuestions"
    ADD CONSTRAINT "SurveyQuestions_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: SurveyQuestions_surveyId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "SurveyQuestions"
    ADD CONSTRAINT "SurveyQuestions_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Surveys"(id);


--
-- Name: Surveys_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Surveys"
    ADD CONSTRAINT "Surveys_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Surveys_projectId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Surveys"
    ADD CONSTRAINT "Surveys_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Projects"(id);


--
-- Name: Tasks_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Tasks_productId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: Tasks_stepId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowSteps"(id);


--
-- Name: Tasks_uoaId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_uoaId_fkey" FOREIGN KEY ("uoaId") REFERENCES "UnitOfAnalysis"(id);


--
-- Name: Tasks_userId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"(id);


--
-- Name: Translations_essence_id_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_essence_id_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- Name: Translations_lang_id_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_lang_id_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysisClassType_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysisClassType"
    ADD CONSTRAINT "UnitOfAnalysisClassType_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysisTagLink_uoaId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_uoaId_fkey" FOREIGN KEY ("uoaId") REFERENCES "UnitOfAnalysis"(id);


--
-- Name: UnitOfAnalysisTagLink_uoaTagId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_uoaTagId_fkey" FOREIGN KEY ("uoaTagId") REFERENCES "UnitOfAnalysisTag"(id);


--
-- Name: UnitOfAnalysisTag_classTypeId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_classTypeId_fkey" FOREIGN KEY ("classTypeId") REFERENCES "UnitOfAnalysisClassType"(id);


--
-- Name: UnitOfAnalysisTag_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysisType_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysisType"
    ADD CONSTRAINT "UnitOfAnalysisType_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysis_creatorId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Users"(id);


--
-- Name: UnitOfAnalysis_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysis_ownerId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Users"(id);


--
-- Name: UnitOfAnalysis_unitOfAnalysisType_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_unitOfAnalysisType_fkey" FOREIGN KEY ("unitOfAnalysisType") REFERENCES "UnitOfAnalysisType"(id);


--
-- Name: UserGroups_groupId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "UserGroups"
    ADD CONSTRAINT "UserGroups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Groups"(id);


--
-- Name: UserGroups_userId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "UserGroups"
    ADD CONSTRAINT "UserGroups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"(id);


--
-- Name: UserUOA_UOAid_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "UserUOA"
    ADD CONSTRAINT "UserUOA_UOAid_fkey" FOREIGN KEY ("UOAid") REFERENCES "UnitOfAnalysis"(id);


--
-- Name: UserUOA_UserId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "UserUOA"
    ADD CONSTRAINT "UserUOA_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"(id);


--
-- Name: Users_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Users_organizationId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- Name: Users_roleID_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "Roles"(id);


--
-- Name: Visualizations_organizationId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Visualizations"
    ADD CONSTRAINT "Visualizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- Name: Visualizations_productId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Visualizations"
    ADD CONSTRAINT "Visualizations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: WorkflowStepGroups_groupId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "WorkflowStepGroups"
    ADD CONSTRAINT "WorkflowStepGroups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Groups"(id);


--
-- Name: WorkflowStepGroups_stepId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "WorkflowStepGroups"
    ADD CONSTRAINT "WorkflowStepGroups_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowSteps"(id);


--
-- Name: WorkflowSteps_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "WorkflowSteps"
    ADD CONSTRAINT "WorkflowSteps_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: WorkflowSteps_worflowId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "WorkflowSteps"
    ADD CONSTRAINT "WorkflowSteps_worflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflows"(id);


--
-- Name: Workflows_productId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "Workflows"
    ADD CONSTRAINT "Workflows_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: rolesrights_rightID; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "rolesrights_rightID" FOREIGN KEY ("rightID") REFERENCES "Rights"(id);


--
-- Name: surveyQuestionOptions_questionId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: indaba
--

ALTER TABLE ONLY "SurveyQuestionOptions"
    ADD CONSTRAINT "surveyQuestionOptions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions"(id);


--
-- Name: public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

