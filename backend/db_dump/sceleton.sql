--
-- PostgreSQL database dump
--

-- Dumped from database version 9.4.5
-- Dumped by pg_dump version 9.5.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: sceleton; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA sceleton;


ALTER SCHEMA sceleton OWNER TO postgres;

SET search_path = sceleton, pg_catalog;

--
-- Name: clone_schema(text, text, boolean); Type: FUNCTION; Schema: sceleton; Owner: postgres
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


ALTER FUNCTION sceleton.clone_schema(source_schema text, dest_schema text, include_recs boolean) OWNER TO postgres;

--
-- Name: fix_schema_references(text); Type: FUNCTION; Schema: sceleton; Owner: postgres
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


ALTER FUNCTION sceleton.fix_schema_references(schema text) OWNER TO postgres;

--
-- Name: order_before_update(); Type: FUNCTION; Schema: sceleton; Owner: postgres
--

CREATE FUNCTION order_before_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   NEW."updated" = now();

   RETURN NEW;
END$$;


ALTER FUNCTION sceleton.order_before_update() OWNER TO postgres;

--
-- Name: tours_before_insert(); Type: FUNCTION; Schema: sceleton; Owner: postgres
--

CREATE FUNCTION tours_before_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   new."created" = now();
new."updated" = now();

   RETURN NEW;
END;$$;


ALTER FUNCTION sceleton.tours_before_insert() OWNER TO postgres;

--
-- Name: tours_before_update(); Type: FUNCTION; Schema: sceleton; Owner: postgres
--

CREATE FUNCTION tours_before_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   NEW."updated" = now();

   RETURN NEW;
END;$$;


ALTER FUNCTION sceleton.tours_before_update() OWNER TO postgres;

--
-- Name: twc_delete_old_token(); Type: FUNCTION; Schema: sceleton; Owner: postgres
--

CREATE FUNCTION twc_delete_old_token() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   DELETE FROM "Token" WHERE "userID" = NEW."userID";
   RETURN NEW;
END;$$;


ALTER FUNCTION sceleton.twc_delete_old_token() OWNER TO postgres;

--
-- Name: twc_get_token(character varying, character varying); Type: FUNCTION; Schema: sceleton; Owner: postgres
--

CREATE FUNCTION twc_get_token(body character varying, exp character varying) RETURNS character varying
    LANGUAGE plpgsql
    AS $$BEGIN

  SELECT t."body"
    FROM "Token" t
   where (t."body" = twc_get_token.body)
   and ((now() - t."issuedAt") < (twc_get_token.exp || ' milliseconds')::interval);
         
END$$;


ALTER FUNCTION sceleton.twc_get_token(body character varying, exp character varying) OWNER TO postgres;

--
-- Name: user_company_check(); Type: FUNCTION; Schema: sceleton; Owner: postgres
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


ALTER FUNCTION sceleton.user_company_check() OWNER TO postgres;

--
-- Name: users_before_update(); Type: FUNCTION; Schema: sceleton; Owner: postgres
--

CREATE FUNCTION users_before_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   NEW."updated" = now();

   RETURN NEW;
END$$;


ALTER FUNCTION sceleton.users_before_update() OWNER TO postgres;

--
-- Name: AccessMatix_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE "AccessMatix_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "AccessMatix_id_seq" OWNER TO postgres;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: AccessMatrices; Type: TABLE; Schema: sceleton; Owner: postgres
--

CREATE TABLE "AccessMatrices" (
    id integer DEFAULT nextval('"AccessMatix_id_seq"'::regclass) NOT NULL,
    name character varying(100),
    description text,
    default_value smallint
);


ALTER TABLE "AccessMatrices" OWNER TO postgres;

--
-- Name: AccessPermissions_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE "AccessPermissions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "AccessPermissions_id_seq" OWNER TO postgres;

--
-- Name: AccessPermissions; Type: TABLE; Schema: sceleton; Owner: postgres
--

CREATE TABLE "AccessPermissions" (
    "matrixId" integer NOT NULL,
    "roleId" integer NOT NULL,
    "rightId" integer NOT NULL,
    permission smallint,
    id integer DEFAULT nextval('"AccessPermissions_id_seq"'::regclass) NOT NULL
);


ALTER TABLE "AccessPermissions" OWNER TO postgres;

--
-- Name: AnswerAttachments_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE "AnswerAttachments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "AnswerAttachments_id_seq" OWNER TO postgres;

--
-- Name: AnswerAttachments; Type: TABLE; Schema: sceleton; Owner: postgres
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


ALTER TABLE "AnswerAttachments" OWNER TO postgres;

--
-- Name: Discussions_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE "Discussions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Discussions_id_seq" OWNER TO postgres;

--
-- Name: Discussions; Type: TABLE; Schema: sceleton; Owner: postgres
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


ALTER TABLE "Discussions" OWNER TO postgres;

--
-- Name: Entities_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE "Entities_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Entities_id_seq" OWNER TO postgres;

--
-- Name: EntityRoles_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE "EntityRoles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "EntityRoles_id_seq" OWNER TO postgres;

--
-- Name: Essences; Type: TABLE; Schema: sceleton; Owner: postgres
--

CREATE TABLE "Essences" (
    id integer DEFAULT nextval('"Entities_id_seq"'::regclass) NOT NULL,
    "tableName" character varying(100),
    name character varying(100) NOT NULL,
    "fileName" character varying(100),
    "nameField" character varying NOT NULL
);


ALTER TABLE "Essences" OWNER TO postgres;

--
-- Name: COLUMN "Essences".name; Type: COMMENT; Schema: sceleton; Owner: postgres
--

COMMENT ON COLUMN "Essences".name IS 'Human readable name of essence';


--
-- Name: COLUMN "Essences"."fileName"; Type: COMMENT; Schema: sceleton; Owner: postgres
--

COMMENT ON COLUMN "Essences"."fileName" IS 'File name in models path';


--
-- Name: Groups_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE "Groups_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Groups_id_seq" OWNER TO postgres;

--
-- Name: Groups; Type: TABLE; Schema: sceleton; Owner: postgres
--

CREATE TABLE "Groups" (
    id integer DEFAULT nextval('"Groups_id_seq"'::regclass) NOT NULL,
    title character varying,
    "organizationId" integer,
    "langId" integer
);


ALTER TABLE "Groups" OWNER TO postgres;

--
-- Name: IndexQuestionWeights; Type: TABLE; Schema: sceleton; Owner: postgres
--

CREATE TABLE "IndexQuestionWeights" (
    "indexId" integer NOT NULL,
    "questionId" integer NOT NULL,
    weight numeric NOT NULL,
    type character varying NOT NULL
);


ALTER TABLE "IndexQuestionWeights" OWNER TO postgres;

--
-- Name: IndexSubindexWeights; Type: TABLE; Schema: sceleton; Owner: postgres
--

CREATE TABLE "IndexSubindexWeights" (
    "indexId" integer NOT NULL,
    "subindexId" integer NOT NULL,
    weight numeric NOT NULL,
    type character varying NOT NULL
);


ALTER TABLE "IndexSubindexWeights" OWNER TO postgres;

--
-- Name: Index_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE "Index_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Index_id_seq" OWNER TO postgres;

--
-- Name: Indexes; Type: TABLE; Schema: sceleton; Owner: postgres
--

CREATE TABLE "Indexes" (
    id integer DEFAULT nextval('"Index_id_seq"'::regclass) NOT NULL,
    "productId" integer NOT NULL,
    title character varying,
    description text,
    divisor numeric DEFAULT 1 NOT NULL
);


ALTER TABLE "Indexes" OWNER TO postgres;

--
-- Name: JSON_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE "JSON_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "JSON_id_seq" OWNER TO postgres;

--
-- Name: Languages_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE "Languages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Languages_id_seq" OWNER TO postgres;

--
-- Name: Languages; Type: TABLE; Schema: sceleton; Owner: postgres
--

CREATE TABLE "Languages" (
    id integer DEFAULT nextval('"Languages_id_seq"'::regclass) NOT NULL,
    name character varying(100),
    "nativeName" character varying(255),
    code character varying(3)
);


ALTER TABLE "Languages" OWNER TO postgres;

--
-- Name: Logs_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE "Logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Logs_id_seq" OWNER TO postgres;

--
-- Name: Logs; Type: TABLE; Schema: sceleton; Owner: postgres
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


ALTER TABLE "Logs" OWNER TO postgres;

--
-- Name: Notifications_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE "Notifications_id_seq"
    START WITH 167
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Notifications_id_seq" OWNER TO postgres;

--
-- Name: Notifications; Type: TABLE; Schema: sceleton; Owner: postgres
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


ALTER TABLE "Notifications" OWNER TO postgres;

--
-- Name: COLUMN "Notifications"."notifyLevel"; Type: COMMENT; Schema: sceleton; Owner: postgres
--

COMMENT ON COLUMN "Notifications"."notifyLevel" IS '0 - none, 1 - alert only, 2 - all notifications';


--
-- Name: Organizations_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE "Organizations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Organizations_id_seq" OWNER TO postgres;

--
-- Name: Organizations; Type: TABLE; Schema: sceleton; Owner: postgres
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


ALTER TABLE "Organizations" OWNER TO postgres;

--
-- Name: ProductUOA; Type: TABLE; Schema: sceleton; Owner: postgres
--

CREATE TABLE "ProductUOA" (
    "productId" integer NOT NULL,
    "UOAid" integer NOT NULL,
    "currentStepId" integer,
    "isComplete" boolean DEFAULT false NOT NULL
);


ALTER TABLE "ProductUOA" OWNER TO postgres;

--
-- Name: Products_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE "Products_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Products_id_seq" OWNER TO postgres;

--
-- Name: Products; Type: TABLE; Schema: sceleton; Owner: postgres
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


ALTER TABLE "Products" OWNER TO postgres;

--
-- Name: Projects_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE "Projects_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Projects_id_seq" OWNER TO postgres;

--
-- Name: Projects; Type: TABLE; Schema: sceleton; Owner: postgres
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


ALTER TABLE "Projects" OWNER TO postgres;

--
-- Name: Rights_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE "Rights_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Rights_id_seq" OWNER TO postgres;

--
-- Name: Rights; Type: TABLE; Schema: sceleton; Owner: postgres
--

CREATE TABLE "Rights" (
    id integer DEFAULT nextval('"Rights_id_seq"'::regclass) NOT NULL,
    action character varying(80) NOT NULL,
    description text,
    "essenceId" integer
);


ALTER TABLE "Rights" OWNER TO postgres;

--
-- Name: role_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE role_id_seq OWNER TO postgres;

--
-- Name: Roles; Type: TABLE; Schema: sceleton; Owner: postgres
--

CREATE TABLE "Roles" (
    id integer DEFAULT nextval('role_id_seq'::regclass) NOT NULL,
    name character varying(20) NOT NULL,
    "isSystem" boolean DEFAULT false NOT NULL
);


ALTER TABLE "Roles" OWNER TO postgres;

--
-- Name: RolesRights; Type: TABLE; Schema: sceleton; Owner: postgres
--

CREATE TABLE "RolesRights" (
    "roleID" bigint NOT NULL,
    "rightID" bigint NOT NULL
);


ALTER TABLE "RolesRights" OWNER TO postgres;

--
-- Name: SubindexWeights; Type: TABLE; Schema: sceleton; Owner: postgres
--

CREATE TABLE "SubindexWeights" (
    "subindexId" integer NOT NULL,
    "questionId" integer NOT NULL,
    weight numeric NOT NULL,
    type character varying NOT NULL
);


ALTER TABLE "SubindexWeights" OWNER TO postgres;

--
-- Name: Subindex_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE "Subindex_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Subindex_id_seq" OWNER TO postgres;

--
-- Name: Subindexes; Type: TABLE; Schema: sceleton; Owner: postgres
--

CREATE TABLE "Subindexes" (
    id integer DEFAULT nextval('"Subindex_id_seq"'::regclass) NOT NULL,
    "productId" integer NOT NULL,
    title character varying,
    description text,
    divisor numeric DEFAULT 1 NOT NULL
);


ALTER TABLE "Subindexes" OWNER TO postgres;

--
-- Name: SurveyAnswerVersions_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE "SurveyAnswerVersions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "SurveyAnswerVersions_id_seq" OWNER TO postgres;

--
-- Name: SurveyAnswers_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE "SurveyAnswers_id_seq"
    START WITH 1375
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "SurveyAnswers_id_seq" OWNER TO postgres;

--
-- Name: SurveyAnswers; Type: TABLE; Schema: sceleton; Owner: postgres
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


ALTER TABLE "SurveyAnswers" OWNER TO postgres;

--
-- Name: surveyQuestionOptions_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE "surveyQuestionOptions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "surveyQuestionOptions_id_seq" OWNER TO postgres;

--
-- Name: SurveyQuestionOptions; Type: TABLE; Schema: sceleton; Owner: postgres
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


ALTER TABLE "SurveyQuestionOptions" OWNER TO postgres;

--
-- Name: SurveyQuestions_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE "SurveyQuestions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "SurveyQuestions_id_seq" OWNER TO postgres;

--
-- Name: SurveyQuestions; Type: TABLE; Schema: sceleton; Owner: postgres
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


ALTER TABLE "SurveyQuestions" OWNER TO postgres;

--
-- Name: Surveys; Type: TABLE; Schema: sceleton; Owner: postgres
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


ALTER TABLE "Surveys" OWNER TO postgres;

--
-- Name: Tasks_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE "Tasks_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Tasks_id_seq" OWNER TO postgres;

--
-- Name: Tasks; Type: TABLE; Schema: sceleton; Owner: postgres
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


ALTER TABLE "Tasks" OWNER TO postgres;

--
-- Name: Translations; Type: TABLE; Schema: sceleton; Owner: postgres
--

CREATE TABLE "Translations" (
    "essenceId" integer NOT NULL,
    "entityId" integer NOT NULL,
    field character varying(100) NOT NULL,
    "langId" integer NOT NULL,
    value text
);


ALTER TABLE "Translations" OWNER TO postgres;

--
-- Name: UnitOfAnalysis_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE "UnitOfAnalysis_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysis_id_seq" OWNER TO postgres;

--
-- Name: UnitOfAnalysis; Type: TABLE; Schema: sceleton; Owner: postgres
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
    "unitOfAnalysisType" smallint,
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


ALTER TABLE "UnitOfAnalysis" OWNER TO postgres;

--
-- Name: COLUMN "UnitOfAnalysis"."gadmId0"; Type: COMMENT; Schema: sceleton; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId0" IS 'ID0 for use with GADM shapefile';


--
-- Name: COLUMN "UnitOfAnalysis"."gadmId1"; Type: COMMENT; Schema: sceleton; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId1" IS 'ID1 for use with GADM shapefile';


--
-- Name: COLUMN "UnitOfAnalysis"."gadmId2"; Type: COMMENT; Schema: sceleton; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId2" IS 'ID2 for use with GADM shapefile';


--
-- Name: COLUMN "UnitOfAnalysis"."gadmId3"; Type: COMMENT; Schema: sceleton; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId3" IS 'ID3 for use with GADM shapefile';


--
-- Name: COLUMN "UnitOfAnalysis"."gadmObjectId"; Type: COMMENT; Schema: sceleton; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmObjectId" IS 'OBJECTID for use with GADM shapefile (only Global Shapefile)';


--
-- Name: COLUMN "UnitOfAnalysis"."ISO"; Type: COMMENT; Schema: sceleton; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."ISO" IS 'only for Country level Unit Of Analysis';


--
-- Name: COLUMN "UnitOfAnalysis"."ISO2"; Type: COMMENT; Schema: sceleton; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."ISO2" IS 'only for Country level Unit Of Analysis';


--
-- Name: COLUMN "UnitOfAnalysis"."nameISO"; Type: COMMENT; Schema: sceleton; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."nameISO" IS 'only for Country level Unit Of Analysis';


--
-- Name: COLUMN "UnitOfAnalysis".name; Type: COMMENT; Schema: sceleton; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis".name IS 'Multilanguage';


--
-- Name: COLUMN "UnitOfAnalysis".description; Type: COMMENT; Schema: sceleton; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis".description IS 'Multilanguage';


--
-- Name: COLUMN "UnitOfAnalysis"."shortName"; Type: COMMENT; Schema: sceleton; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."shortName" IS 'Multilanguage';


--
-- Name: COLUMN "UnitOfAnalysis"."HASC"; Type: COMMENT; Schema: sceleton; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."HASC" IS '(example RU.AD.OK)';


--
-- Name: COLUMN "UnitOfAnalysis"."unitOfAnalysisType"; Type: COMMENT; Schema: sceleton; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."unitOfAnalysisType" IS 'reference to table UnitOfAnalysisType';


--
-- Name: COLUMN "UnitOfAnalysis"."parentId"; Type: COMMENT; Schema: sceleton; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."parentId" IS 'Link to Parent Unit of Analysis if exist';


--
-- Name: COLUMN "UnitOfAnalysis"."creatorId"; Type: COMMENT; Schema: sceleton; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."creatorId" IS 'Creator Id (User Id)';


--
-- Name: COLUMN "UnitOfAnalysis"."ownerId"; Type: COMMENT; Schema: sceleton; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."ownerId" IS 'Owner Id (User Id)';


--
-- Name: COLUMN "UnitOfAnalysis".visibility; Type: COMMENT; Schema: sceleton; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis".visibility IS '1 = public; 2 = private;';


--
-- Name: COLUMN "UnitOfAnalysis".status; Type: COMMENT; Schema: sceleton; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis".status IS '1 = active; 2 = inactive; 3 = deleted;';


--
-- Name: UnitOfAnalysisClassType_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE "UnitOfAnalysisClassType_id_seq"
    START WITH 9
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysisClassType_id_seq" OWNER TO postgres;

--
-- Name: UnitOfAnalysisClassType; Type: TABLE; Schema: sceleton; Owner: postgres
--

CREATE TABLE "UnitOfAnalysisClassType" (
    id smallint DEFAULT nextval('"UnitOfAnalysisClassType_id_seq"'::regclass) NOT NULL,
    name character varying(45) NOT NULL,
    description character varying(255),
    "langId" smallint DEFAULT 1 NOT NULL
);


ALTER TABLE "UnitOfAnalysisClassType" OWNER TO postgres;

--
-- Name: COLUMN "UnitOfAnalysisClassType".name; Type: COMMENT; Schema: sceleton; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysisClassType".name IS 'Classification Name (for example - World Bank classification) ';


--
-- Name: COLUMN "UnitOfAnalysisClassType".description; Type: COMMENT; Schema: sceleton; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysisClassType".description IS 'Classification Name description';


--
-- Name: UnitOfAnalysisTag_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE "UnitOfAnalysisTag_id_seq"
    START WITH 9
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysisTag_id_seq" OWNER TO postgres;

--
-- Name: UnitOfAnalysisTag; Type: TABLE; Schema: sceleton; Owner: postgres
--

CREATE TABLE "UnitOfAnalysisTag" (
    id smallint DEFAULT nextval('"UnitOfAnalysisTag_id_seq"'::regclass) NOT NULL,
    name character varying(45) NOT NULL,
    description character varying(255),
    "langId" integer DEFAULT 1 NOT NULL,
    "classTypeId" smallint NOT NULL
);


ALTER TABLE "UnitOfAnalysisTag" OWNER TO postgres;

--
-- Name: UnitOfAnalysisTagLink_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE "UnitOfAnalysisTagLink_id_seq"
    START WITH 18
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysisTagLink_id_seq" OWNER TO postgres;

--
-- Name: UnitOfAnalysisTagLink; Type: TABLE; Schema: sceleton; Owner: postgres
--

CREATE TABLE "UnitOfAnalysisTagLink" (
    id integer DEFAULT nextval('"UnitOfAnalysisTagLink_id_seq"'::regclass) NOT NULL,
    "uoaId" integer NOT NULL,
    "uoaTagId" integer NOT NULL
);


ALTER TABLE "UnitOfAnalysisTagLink" OWNER TO postgres;

--
-- Name: UnitOfAnalysisType_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE "UnitOfAnalysisType_id_seq"
    START WITH 9
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysisType_id_seq" OWNER TO postgres;

--
-- Name: UnitOfAnalysisType; Type: TABLE; Schema: sceleton; Owner: postgres
--

CREATE TABLE "UnitOfAnalysisType" (
    id smallint DEFAULT nextval('"UnitOfAnalysisType_id_seq"'::regclass) NOT NULL,
    name character varying(40) NOT NULL,
    description character varying(255),
    "langId" integer DEFAULT 1 NOT NULL
);


ALTER TABLE "UnitOfAnalysisType" OWNER TO postgres;

--
-- Name: UserGroups; Type: TABLE; Schema: sceleton; Owner: postgres
--

CREATE TABLE "UserGroups" (
    "userId" integer NOT NULL,
    "groupId" integer NOT NULL
);


ALTER TABLE "UserGroups" OWNER TO postgres;

--
-- Name: UserRights; Type: TABLE; Schema: sceleton; Owner: postgres
--

CREATE TABLE "UserRights" (
    "userID" bigint NOT NULL,
    "rightID" bigint NOT NULL,
    "canDo" boolean
);


ALTER TABLE "UserRights" OWNER TO postgres;

--
-- Name: UserUOA; Type: TABLE; Schema: sceleton; Owner: postgres
--

CREATE TABLE "UserUOA" (
    "UserId" integer NOT NULL,
    "UOAid" integer NOT NULL
);


ALTER TABLE "UserUOA" OWNER TO postgres;

--
-- Name: user_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE user_id_seq OWNER TO postgres;

--
-- Name: Users; Type: TABLE; Schema: sceleton; Owner: postgres
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
    "langId" integer
);


ALTER TABLE "Users" OWNER TO postgres;

--
-- Name: Visualizations_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE "Visualizations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Visualizations_id_seq" OWNER TO postgres;

--
-- Name: Visualizations; Type: TABLE; Schema: sceleton; Owner: postgres
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


ALTER TABLE "Visualizations" OWNER TO postgres;

--
-- Name: WorkflowStepGroups; Type: TABLE; Schema: sceleton; Owner: postgres
--

CREATE TABLE "WorkflowStepGroups" (
    "stepId" integer NOT NULL,
    "groupId" integer NOT NULL
);


ALTER TABLE "WorkflowStepGroups" OWNER TO postgres;

--
-- Name: WorkflowSteps_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE "WorkflowSteps_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "WorkflowSteps_id_seq" OWNER TO postgres;

--
-- Name: WorkflowSteps; Type: TABLE; Schema: sceleton; Owner: postgres
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


ALTER TABLE "WorkflowSteps" OWNER TO postgres;

--
-- Name: Workflows_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE "Workflows_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Workflows_id_seq" OWNER TO postgres;

--
-- Name: Workflows; Type: TABLE; Schema: sceleton; Owner: postgres
--

CREATE TABLE "Workflows" (
    id integer DEFAULT nextval('"Workflows_id_seq"'::regclass) NOT NULL,
    name character varying(200),
    description text,
    created timestamp with time zone DEFAULT now() NOT NULL,
    "productId" integer
);


ALTER TABLE "Workflows" OWNER TO postgres;

--
-- Name: brand_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE brand_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE brand_id_seq OWNER TO postgres;

--
-- Name: country_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE country_id_seq
    START WITH 240
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE country_id_seq OWNER TO postgres;

--
-- Name: order_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE order_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE order_id_seq OWNER TO postgres;

--
-- Name: transport_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE transport_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE transport_id_seq OWNER TO postgres;

--
-- Name: transportmodel_id_seq; Type: SEQUENCE; Schema: sceleton; Owner: postgres
--

CREATE SEQUENCE transportmodel_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE transportmodel_id_seq OWNER TO postgres;

--
-- Name: AccessMatix_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('"AccessMatix_id_seq"', 8, true);


--
-- Data for Name: AccessMatrices; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "AccessMatrices" (id, name, description, default_value) FROM stdin;
8	Default	Default access matrix	0
\.


--
-- Data for Name: AccessPermissions; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "AccessPermissions" ("matrixId", "roleId", "rightId", permission, id) FROM stdin;
\.


--
-- Name: AccessPermissions_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('"AccessPermissions_id_seq"', 1, true);


--
-- Data for Name: AnswerAttachments; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "AnswerAttachments" (id, "answerId", filename, size, mimetype, body, created, owner) FROM stdin;
\.


--
-- Name: AnswerAttachments_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('"AnswerAttachments_id_seq"', 1, true);


--
-- Data for Name: Discussions; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "Discussions" (id, "taskId", "questionId", "userId", entry, "isReturn", created, updated, "isResolve", "order", "returnTaskId", "userFromId") FROM stdin;
\.


--
-- Name: Discussions_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('"Discussions_id_seq"', 1, true);


--
-- Name: Entities_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('"Entities_id_seq"', 45, true);


--
-- Name: EntityRoles_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('"EntityRoles_id_seq"', 1, true);


--
-- Data for Name: Essences; Type: TABLE DATA; Schema: sceleton; Owner: postgres
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
-- Data for Name: Groups; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "Groups" (id, title, "organizationId", "langId") FROM stdin;
\.


--
-- Name: Groups_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('"Groups_id_seq"', 1, true);


--
-- Data for Name: IndexQuestionWeights; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "IndexQuestionWeights" ("indexId", "questionId", weight, type) FROM stdin;
\.


--
-- Data for Name: IndexSubindexWeights; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "IndexSubindexWeights" ("indexId", "subindexId", weight, type) FROM stdin;
\.


--
-- Name: Index_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('"Index_id_seq"', 1, true);


--
-- Data for Name: Indexes; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "Indexes" (id, "productId", title, description, divisor) FROM stdin;
\.


--
-- Name: JSON_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('"JSON_id_seq"', 1, true);


--
-- Data for Name: Languages; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "Languages" (id, name, "nativeName", code) FROM stdin;
1	English	English	en
2	Russian	Русский	ru
9	Japanese	日本語	jp
12	Spanish	Español	es
13	French	Le français	fr
\.


--
-- Name: Languages_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('"Languages_id_seq"', 13, true);


--
-- Data for Name: Logs; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "Logs" (id, created, "user", action, essence, entity, entities, quantity, info, error, result) FROM stdin;
\.


--
-- Name: Logs_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('"Logs_id_seq"', 1020, true);


--
-- Data for Name: Notifications; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "Notifications" (id, "userFrom", "userTo", body, email, message, subject, "essenceId", "entityId", created, reading, sent, read, "notifyLevel", result, resent, note, "userFromName", "userToName") FROM stdin;
\.


--
-- Name: Notifications_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('"Notifications_id_seq"', 1, true);


--
-- Data for Name: Organizations; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "Organizations" (id, name, address, "adminUserId", url, "enforceApiSecurity", "isActive", "langId", realm) FROM stdin;
\.


--
-- Name: Organizations_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('"Organizations_id_seq"', 1, true);


--
-- Data for Name: ProductUOA; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "ProductUOA" ("productId", "UOAid", "currentStepId", "isComplete") FROM stdin;
\.


--
-- Data for Name: Products; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "Products" (id, title, description, "originalLangId", "projectId", "surveyId", status, "langId") FROM stdin;
\.


--
-- Name: Products_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('"Products_id_seq"', 1, true);


--
-- Data for Name: Projects; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "Projects" (id, "organizationId", "codeName", description, created, "matrixId", "startTime", status, "adminUserId", "closeTime", "langId") FROM stdin;
\.


--
-- Name: Projects_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('"Projects_id_seq"', 1, true);


--
-- Data for Name: Rights; Type: TABLE DATA; Schema: sceleton; Owner: postgres
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
-- Name: Rights_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('"Rights_id_seq"', 138, true);


--
-- Data for Name: Roles; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "Roles" (id, name, "isSystem") FROM stdin;
1	admin	t
2	client	t
3	user	t
\.


--
-- Data for Name: RolesRights; Type: TABLE DATA; Schema: sceleton; Owner: postgres
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
-- Data for Name: SubindexWeights; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "SubindexWeights" ("subindexId", "questionId", weight, type) FROM stdin;
\.


--
-- Name: Subindex_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('"Subindex_id_seq"', 1, true);


--
-- Data for Name: Subindexes; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "Subindexes" (id, "productId", title, description, divisor) FROM stdin;
\.


--
-- Name: SurveyAnswerVersions_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('"SurveyAnswerVersions_id_seq"', 4, true);


--
-- Data for Name: SurveyAnswers; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "SurveyAnswers" (id, "questionId", "userId", value, created, "productId", "UOAid", "wfStepId", version, "surveyId", "optionId", "langId", "isResponse", "isAgree", comments, attachments) FROM stdin;
\.


--
-- Name: SurveyAnswers_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('"SurveyAnswers_id_seq"', 1, true);


--
-- Data for Name: SurveyQuestionOptions; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "SurveyQuestionOptions" (id, "questionId", value, label, skip, "isSelected", "langId") FROM stdin;
\.


--
-- Data for Name: SurveyQuestions; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "SurveyQuestions" (id, "surveyId", type, label, "isRequired", "position", description, skip, size, "minLength", "maxLength", "isWordmml", "incOtherOpt", units, "intOnly", value, qid, links, attachment, "optionNumbering", "langId") FROM stdin;
\.


--
-- Name: SurveyQuestions_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('"SurveyQuestions_id_seq"', 1, true);


--
-- Data for Name: Surveys; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "Surveys" (id, title, description, created, "projectId", "isDraft", "langId") FROM stdin;
\.


--
-- Data for Name: Tasks; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "Tasks" (id, title, description, "uoaId", "stepId", created, "productId", "startDate", "endDate", "userId", "langId") FROM stdin;
\.


--
-- Name: Tasks_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('"Tasks_id_seq"', 1, true);


--
-- Data for Name: Translations; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "Translations" ("essenceId", "entityId", field, "langId", value) FROM stdin;
\.


--
-- Data for Name: UnitOfAnalysis; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "UnitOfAnalysis" (id, "gadmId0", "gadmId1", "gadmId2", "gadmId3", "gadmObjectId", "ISO", "ISO2", "nameISO", name, description, "shortName", "HASC", "unitOfAnalysisType", "parentId", "creatorId", "ownerId", visibility, status, created, deleted, "langId", updated) FROM stdin;
\.


--
-- Data for Name: UnitOfAnalysisClassType; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "UnitOfAnalysisClassType" (id, name, description, "langId") FROM stdin;
\.


--
-- Name: UnitOfAnalysisClassType_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('"UnitOfAnalysisClassType_id_seq"', 1, true);


--
-- Data for Name: UnitOfAnalysisTag; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "UnitOfAnalysisTag" (id, name, description, "langId", "classTypeId") FROM stdin;
\.


--
-- Data for Name: UnitOfAnalysisTagLink; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "UnitOfAnalysisTagLink" (id, "uoaId", "uoaTagId") FROM stdin;
\.


--
-- Name: UnitOfAnalysisTagLink_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('"UnitOfAnalysisTagLink_id_seq"', 1, true);


--
-- Name: UnitOfAnalysisTag_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('"UnitOfAnalysisTag_id_seq"', 1, true);


--
-- Data for Name: UnitOfAnalysisType; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "UnitOfAnalysisType" (id, name, description, "langId") FROM stdin;
1	Country	\N	1
\.


--
-- Name: UnitOfAnalysisType_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('"UnitOfAnalysisType_id_seq"', 1, true);


--
-- Name: UnitOfAnalysis_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('"UnitOfAnalysis_id_seq"', 1, true);


--
-- Data for Name: UserGroups; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "UserGroups" ("userId", "groupId") FROM stdin;
\.


--
-- Data for Name: UserRights; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "UserRights" ("userID", "rightID", "canDo") FROM stdin;
\.


--
-- Data for Name: UserUOA; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "UserUOA" ("UserId", "UOAid") FROM stdin;
\.


--
-- Data for Name: Users; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "Users" ("roleID", id, email, "firstName", "lastName", password, cell, birthday, "resetPasswordToken", "resetPasswordExpires", created, updated, "isActive", "activationToken", "organizationId", location, phone, address, lang, bio, "notifyLevel", timezone, "lastActive", affiliation, "isAnonymous", "langId") FROM stdin;
\.


--
-- Data for Name: Visualizations; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "Visualizations" (id, title, "productId", "topicIds", "indexCollection", "indexId", "visualizationType", "comparativeTopicId", "organizationId") FROM stdin;
\.


--
-- Name: Visualizations_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('"Visualizations_id_seq"', 1, true);


--
-- Data for Name: WorkflowStepGroups; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "WorkflowStepGroups" ("stepId", "groupId") FROM stdin;
\.


--
-- Data for Name: WorkflowSteps; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "WorkflowSteps" ("workflowId", id, "startDate", "endDate", title, "provideResponses", "discussionParticipation", "blindReview", "seeOthersResponses", "allowTranslate", "position", "writeToAnswers", "allowEdit", role, "langId") FROM stdin;
\.


--
-- Name: WorkflowSteps_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('"WorkflowSteps_id_seq"', 1, true);


--
-- Data for Name: Workflows; Type: TABLE DATA; Schema: sceleton; Owner: postgres
--

COPY "Workflows" (id, name, description, created, "productId") FROM stdin;
\.


--
-- Name: Workflows_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('"Workflows_id_seq"', 1, true);


--
-- Name: brand_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('brand_id_seq', 19, true);


--
-- Name: country_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('country_id_seq', 248, true);


--
-- Name: order_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('order_id_seq', 320, true);


--
-- Name: role_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('role_id_seq', 3, true);


--
-- Name: surveyQuestionOptions_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('"surveyQuestionOptions_id_seq"', 1, true);


--
-- Name: transport_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('transport_id_seq', 22, true);


--
-- Name: transportmodel_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('transportmodel_id_seq', 24, true);


--
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: sceleton; Owner: postgres
--

SELECT pg_catalog.setval('user_id_seq', 1, true);


--
-- Name: AccessMatrices_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "AccessMatrices"
    ADD CONSTRAINT "AccessMatrices_pkey" PRIMARY KEY (id);


--
-- Name: AccessPermissions_matrixId_roleId_rightId_key; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "AccessPermissions"
    ADD CONSTRAINT "AccessPermissions_matrixId_roleId_rightId_key" UNIQUE ("matrixId", "roleId", "rightId");


--
-- Name: AccessPermissions_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "AccessPermissions"
    ADD CONSTRAINT "AccessPermissions_pkey" PRIMARY KEY (id);


--
-- Name: AnswerAttachments_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "AnswerAttachments"
    ADD CONSTRAINT "AnswerAttachments_pkey" PRIMARY KEY (id);


--
-- Name: Discussions_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_pkey" PRIMARY KEY (id);


--
-- Name: Essences_fileName_key; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_fileName_key" UNIQUE ("fileName");


--
-- Name: Essences_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_pkey" PRIMARY KEY (id);


--
-- Name: Essences_tableName_key; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_tableName_key" UNIQUE ("tableName");


--
-- Name: Groups_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Groups"
    ADD CONSTRAINT "Groups_pkey" PRIMARY KEY (id);


--
-- Name: IndexQuestionWeights_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "IndexQuestionWeights"
    ADD CONSTRAINT "IndexQuestionWeights_pkey" PRIMARY KEY ("indexId", "questionId");


--
-- Name: IndexSubindexWeights_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "IndexSubindexWeights"
    ADD CONSTRAINT "IndexSubindexWeights_pkey" PRIMARY KEY ("indexId", "subindexId");


--
-- Name: Indexes_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Indexes"
    ADD CONSTRAINT "Indexes_pkey" PRIMARY KEY (id);


--
-- Name: Languages_code_key; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Languages"
    ADD CONSTRAINT "Languages_code_key" UNIQUE (code);


--
-- Name: Languages_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Languages"
    ADD CONSTRAINT "Languages_pkey" PRIMARY KEY (id);


--
-- Name: Logs_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Logs"
    ADD CONSTRAINT "Logs_pkey" PRIMARY KEY (id);


--
-- Name: Notifications_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_pkey" PRIMARY KEY (id);


--
-- Name: Organizations_adminUserId_key; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_adminUserId_key" UNIQUE ("adminUserId");


--
-- Name: Organizations_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_pkey" PRIMARY KEY (id);


--
-- Name: ProductUOA_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_pkey" PRIMARY KEY ("productId", "UOAid");


--
-- Name: Products_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_pkey" PRIMARY KEY (id);


--
-- Name: Projects_codeName_key; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_codeName_key" UNIQUE ("codeName");


--
-- Name: Projects_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_pkey" PRIMARY KEY (id);


--
-- Name: Rights_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Rights"
    ADD CONSTRAINT "Rights_pkey" PRIMARY KEY (id);


--
-- Name: RolesRights_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "RolesRights_pkey" PRIMARY KEY ("roleID", "rightID");


--
-- Name: Roles_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Roles"
    ADD CONSTRAINT "Roles_pkey" PRIMARY KEY (id);


--
-- Name: SubindexWeights_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "SubindexWeights"
    ADD CONSTRAINT "SubindexWeights_pkey" PRIMARY KEY ("subindexId", "questionId");


--
-- Name: Subindexes_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Subindexes"
    ADD CONSTRAINT "Subindexes_pkey" PRIMARY KEY (id);


--
-- Name: SurveyAnswers_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_pkey" PRIMARY KEY (id);


--
-- Name: SurveyQuestionOptions_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "SurveyQuestionOptions"
    ADD CONSTRAINT "SurveyQuestionOptions_pkey" PRIMARY KEY (id);


--
-- Name: SurveyQuestions_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "SurveyQuestions"
    ADD CONSTRAINT "SurveyQuestions_pkey" PRIMARY KEY (id);


--
-- Name: Surveys_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Surveys"
    ADD CONSTRAINT "Surveys_pkey" PRIMARY KEY (id);


--
-- Name: Tasks_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_pkey" PRIMARY KEY (id);


--
-- Name: Translations_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_pkey" PRIMARY KEY ("essenceId", "entityId", field, "langId");


--
-- Name: UnitOfAnalysisClassType_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysisClassType"
    ADD CONSTRAINT "UnitOfAnalysisClassType_pkey" PRIMARY KEY (id);


--
-- Name: UnitOfAnalysisTagLink_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_pkey" PRIMARY KEY (id);


--
-- Name: UnitOfAnalysisTagLink_uoaId_uoaTagId_key; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_uoaId_uoaTagId_key" UNIQUE ("uoaId", "uoaTagId");


--
-- Name: UnitOfAnalysisTag_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_pkey" PRIMARY KEY (id);


--
-- Name: UnitOfAnalysisType_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysisType"
    ADD CONSTRAINT "UnitOfAnalysisType_pkey" PRIMARY KEY (id);


--
-- Name: UnitOfAnalysis_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_pkey" PRIMARY KEY (id);


--
-- Name: UserGroups_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "UserGroups"
    ADD CONSTRAINT "UserGroups_pkey" PRIMARY KEY ("userId", "groupId");


--
-- Name: UserRights_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "UserRights"
    ADD CONSTRAINT "UserRights_pkey" PRIMARY KEY ("userID", "rightID");


--
-- Name: UserUOA_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "UserUOA"
    ADD CONSTRAINT "UserUOA_pkey" PRIMARY KEY ("UserId", "UOAid");


--
-- Name: Users_email_key; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- Name: Users_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- Name: Visualizations_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Visualizations"
    ADD CONSTRAINT "Visualizations_pkey" PRIMARY KEY (id);


--
-- Name: WorkflowStepGroups_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "WorkflowStepGroups"
    ADD CONSTRAINT "WorkflowStepGroups_pkey" PRIMARY KEY ("stepId", "groupId");


--
-- Name: WorkflowSteps_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "WorkflowSteps"
    ADD CONSTRAINT "WorkflowSteps_pkey" PRIMARY KEY (id);


--
-- Name: Workflows_pkey; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Workflows"
    ADD CONSTRAINT "Workflows_pkey" PRIMARY KEY (id);


--
-- Name: Workflows_productId_key; Type: CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Workflows"
    ADD CONSTRAINT "Workflows_productId_key" UNIQUE ("productId");


--
-- Name: Essences_upper_idx; Type: INDEX; Schema: sceleton; Owner: postgres
--

CREATE UNIQUE INDEX "Essences_upper_idx" ON "Essences" USING btree (upper((name)::text));


--
-- Name: Indexes_productId_idx; Type: INDEX; Schema: sceleton; Owner: postgres
--

CREATE INDEX "Indexes_productId_idx" ON "Indexes" USING btree ("productId");


--
-- Name: Rights_action_idx; Type: INDEX; Schema: sceleton; Owner: postgres
--

CREATE UNIQUE INDEX "Rights_action_idx" ON "Rights" USING btree (action);


--
-- Name: RolesRights_rightID_idx; Type: INDEX; Schema: sceleton; Owner: postgres
--

CREATE INDEX "RolesRights_rightID_idx" ON "RolesRights" USING btree ("rightID");


--
-- Name: Subindexes_productId_idx; Type: INDEX; Schema: sceleton; Owner: postgres
--

CREATE INDEX "Subindexes_productId_idx" ON "Subindexes" USING btree ("productId");


--
-- Name: UnitOfAnalysisTagLink_uoaId_idx; Type: INDEX; Schema: sceleton; Owner: postgres
--

CREATE INDEX "UnitOfAnalysisTagLink_uoaId_idx" ON "UnitOfAnalysisTagLink" USING btree ("uoaId");


--
-- Name: UnitOfAnalysisTagLink_uoaTagId_idx; Type: INDEX; Schema: sceleton; Owner: postgres
--

CREATE INDEX "UnitOfAnalysisTagLink_uoaTagId_idx" ON "UnitOfAnalysisTagLink" USING btree ("uoaTagId");


--
-- Name: Users_roleID_idx; Type: INDEX; Schema: sceleton; Owner: postgres
--

CREATE INDEX "Users_roleID_idx" ON "Users" USING btree ("roleID");


--
-- Name: AnswerAttachments_answerId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "AnswerAttachments"
    ADD CONSTRAINT "AnswerAttachments_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "SurveyAnswers"(id);


--
-- Name: AnswerAttachments_owner_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "AnswerAttachments"
    ADD CONSTRAINT "AnswerAttachments_owner_fkey" FOREIGN KEY (owner) REFERENCES "Users"(id);


--
-- Name: Discussions_questionId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions"(id);


--
-- Name: Discussions_returnTaskId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_returnTaskId_fkey" FOREIGN KEY ("returnTaskId") REFERENCES "Tasks"(id);


--
-- Name: Discussions_taskId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Tasks"(id);


--
-- Name: Discussions_userFromId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_userFromId_fkey" FOREIGN KEY ("userFromId") REFERENCES "Users"(id);


--
-- Name: Discussions_userId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"(id);


--
-- Name: Groups_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Groups"
    ADD CONSTRAINT "Groups_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Groups_organizationId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Groups"
    ADD CONSTRAINT "Groups_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- Name: IndexQuestionWeights_indexId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "IndexQuestionWeights"
    ADD CONSTRAINT "IndexQuestionWeights_indexId_fkey" FOREIGN KEY ("indexId") REFERENCES "Indexes"(id);


--
-- Name: IndexQuestionWeights_questionId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "IndexQuestionWeights"
    ADD CONSTRAINT "IndexQuestionWeights_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions"(id);


--
-- Name: IndexSubindexWeights_indexId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "IndexSubindexWeights"
    ADD CONSTRAINT "IndexSubindexWeights_indexId_fkey" FOREIGN KEY ("indexId") REFERENCES "Indexes"(id);


--
-- Name: IndexSubindexWeights_subindexId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "IndexSubindexWeights"
    ADD CONSTRAINT "IndexSubindexWeights_subindexId_fkey" FOREIGN KEY ("subindexId") REFERENCES "Subindexes"(id);


--
-- Name: Indexes_productId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Indexes"
    ADD CONSTRAINT "Indexes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: Logs_essence_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Logs"
    ADD CONSTRAINT "Logs_essence_fkey" FOREIGN KEY (essence) REFERENCES "Essences"(id) ON DELETE SET NULL;


--
-- Name: Logs_user_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Logs"
    ADD CONSTRAINT "Logs_user_fkey" FOREIGN KEY ("user") REFERENCES "Users"(id) ON DELETE SET NULL;


--
-- Name: Notifications_essenceId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_essenceId_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id) ON DELETE SET NULL;


--
-- Name: Notifications_userFrom_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_userFrom_fkey" FOREIGN KEY ("userFrom") REFERENCES "Users"(id) ON DELETE CASCADE;


--
-- Name: Notifications_userTo_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_userTo_fkey" FOREIGN KEY ("userTo") REFERENCES "Users"(id) ON DELETE CASCADE;


--
-- Name: Organizations_adminUserId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "Users"(id);


--
-- Name: Organizations_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: ProductUOA_UOAid_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_UOAid_fkey" FOREIGN KEY ("UOAid") REFERENCES "UnitOfAnalysis"(id);


--
-- Name: ProductUOA_currentStepId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_currentStepId_fkey" FOREIGN KEY ("currentStepId") REFERENCES "WorkflowSteps"(id);


--
-- Name: ProductUOA_productId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: Products_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Products_originalLangId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_originalLangId_fkey" FOREIGN KEY ("originalLangId") REFERENCES "Languages"(id);


--
-- Name: Products_projectId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Projects"(id);


--
-- Name: Products_surveyId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Surveys"(id);


--
-- Name: Projects_accessMatrixId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_accessMatrixId_fkey" FOREIGN KEY ("matrixId") REFERENCES "AccessMatrices"(id);


--
-- Name: Projects_adminUserId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "Users"(id);


--
-- Name: Projects_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Projects_organizationId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- Name: Rights_essence_id_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Rights"
    ADD CONSTRAINT "Rights_essence_id_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- Name: RolesRights_roleID_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "RolesRights_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "Roles"(id);


--
-- Name: SubindexWeights_questionId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "SubindexWeights"
    ADD CONSTRAINT "SubindexWeights_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions"(id);


--
-- Name: SubindexWeights_subindexId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "SubindexWeights"
    ADD CONSTRAINT "SubindexWeights_subindexId_fkey" FOREIGN KEY ("subindexId") REFERENCES "Subindexes"(id);


--
-- Name: Subindexes_productId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Subindexes"
    ADD CONSTRAINT "Subindexes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: SurveyAnswers_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: SurveyAnswers_productId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: SurveyAnswers_questionId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions"(id);


--
-- Name: SurveyAnswers_surveyId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Surveys"(id);


--
-- Name: SurveyAnswers_userId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"(id);


--
-- Name: SurveyAnswers_wfStepId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_wfStepId_fkey" FOREIGN KEY ("wfStepId") REFERENCES "WorkflowSteps"(id);


--
-- Name: SurveyQuestionOptions_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "SurveyQuestionOptions"
    ADD CONSTRAINT "SurveyQuestionOptions_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: SurveyQuestions_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "SurveyQuestions"
    ADD CONSTRAINT "SurveyQuestions_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: SurveyQuestions_surveyId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "SurveyQuestions"
    ADD CONSTRAINT "SurveyQuestions_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Surveys"(id);


--
-- Name: Surveys_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Surveys"
    ADD CONSTRAINT "Surveys_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Surveys_projectId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Surveys"
    ADD CONSTRAINT "Surveys_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Projects"(id);


--
-- Name: Tasks_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Tasks_productId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: Tasks_stepId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowSteps"(id);


--
-- Name: Tasks_uoaId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_uoaId_fkey" FOREIGN KEY ("uoaId") REFERENCES "UnitOfAnalysis"(id);


--
-- Name: Tasks_userId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"(id);


--
-- Name: Translations_essence_id_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_essence_id_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- Name: Translations_lang_id_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_lang_id_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysisClassType_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysisClassType"
    ADD CONSTRAINT "UnitOfAnalysisClassType_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysisTagLink_uoaId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_uoaId_fkey" FOREIGN KEY ("uoaId") REFERENCES "UnitOfAnalysis"(id);


--
-- Name: UnitOfAnalysisTagLink_uoaTagId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_uoaTagId_fkey" FOREIGN KEY ("uoaTagId") REFERENCES "UnitOfAnalysisTag"(id);


--
-- Name: UnitOfAnalysisTag_classTypeId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_classTypeId_fkey" FOREIGN KEY ("classTypeId") REFERENCES "UnitOfAnalysisClassType"(id);


--
-- Name: UnitOfAnalysisTag_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysisType_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysisType"
    ADD CONSTRAINT "UnitOfAnalysisType_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysis_creatorId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Users"(id);


--
-- Name: UnitOfAnalysis_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysis_ownerId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Users"(id);


--
-- Name: UnitOfAnalysis_unitOfAnalysisType_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_unitOfAnalysisType_fkey" FOREIGN KEY ("unitOfAnalysisType") REFERENCES "UnitOfAnalysisType"(id);


--
-- Name: UserGroups_groupId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "UserGroups"
    ADD CONSTRAINT "UserGroups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Groups"(id);


--
-- Name: UserGroups_userId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "UserGroups"
    ADD CONSTRAINT "UserGroups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"(id);


--
-- Name: UserUOA_UOAid_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "UserUOA"
    ADD CONSTRAINT "UserUOA_UOAid_fkey" FOREIGN KEY ("UOAid") REFERENCES "UnitOfAnalysis"(id);


--
-- Name: UserUOA_UserId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "UserUOA"
    ADD CONSTRAINT "UserUOA_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"(id);


--
-- Name: Users_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Users_organizationId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- Name: Users_roleID_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "Roles"(id);


--
-- Name: Visualizations_organizationId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Visualizations"
    ADD CONSTRAINT "Visualizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- Name: Visualizations_productId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Visualizations"
    ADD CONSTRAINT "Visualizations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: WorkflowStepGroups_groupId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "WorkflowStepGroups"
    ADD CONSTRAINT "WorkflowStepGroups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Groups"(id);


--
-- Name: WorkflowStepGroups_stepId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "WorkflowStepGroups"
    ADD CONSTRAINT "WorkflowStepGroups_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowSteps"(id);


--
-- Name: WorkflowSteps_langId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "WorkflowSteps"
    ADD CONSTRAINT "WorkflowSteps_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: WorkflowSteps_worflowId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "WorkflowSteps"
    ADD CONSTRAINT "WorkflowSteps_worflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflows"(id);


--
-- Name: Workflows_productId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "Workflows"
    ADD CONSTRAINT "Workflows_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: rolesrights_rightID; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "rolesrights_rightID" FOREIGN KEY ("rightID") REFERENCES "Rights"(id);


--
-- Name: surveyQuestionOptions_questionId_fkey; Type: FK CONSTRAINT; Schema: sceleton; Owner: postgres
--

ALTER TABLE ONLY "SurveyQuestionOptions"
    ADD CONSTRAINT "surveyQuestionOptions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions"(id);


--
-- PostgreSQL database dump complete
--

