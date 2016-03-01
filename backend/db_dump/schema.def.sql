--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

--CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

-- COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


CREATE SCHEMA IF NOT EXISTS CLIENT_SCHEMA;

SET search_path = CLIENT_SCHEMA, pg_catalog;

--
-- Name: event_status; Type: TYPE; Schema: CLIENT_SCHEMA; Owner: indaba
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


ALTER TYPE event_status OWNER TO indaba;

--
-- Name: order_status; Type: TYPE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE TYPE order_status AS ENUM (
    'New',
    'Acknowledged',
    'Confirmed',
    'Fulfilled',
    'Cancelled'
);


ALTER TYPE order_status OWNER TO indaba;

--
-- Name: tour_status; Type: TYPE; Schema: CLIENT_SCHEMA; Owner: indaba
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


ALTER TYPE tour_status OWNER TO indaba;

--
-- Name: transport_status; Type: TYPE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE TYPE transport_status AS ENUM (
    'New',
    'Submitted',
    'Approved',
    'Available',
    'Rented',
    'Deleted'
);


ALTER TYPE transport_status OWNER TO indaba;

--
-- Name: order_before_update(); Type: FUNCTION; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE FUNCTION order_before_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   NEW."updated" = now();

   RETURN NEW;
END$$;


ALTER FUNCTION CLIENT_SCHEMA.order_before_update() OWNER TO indaba;

--
-- Name: tours_before_insert(); Type: FUNCTION; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE FUNCTION tours_before_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   new."created" = now();
new."updated" = now();

   RETURN NEW;
END;$$;


ALTER FUNCTION CLIENT_SCHEMA.tours_before_insert() OWNER TO indaba;

--
-- Name: tours_before_update(); Type: FUNCTION; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE FUNCTION tours_before_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   NEW."updated" = now();

   RETURN NEW;
END;$$;


ALTER FUNCTION CLIENT_SCHEMA.tours_before_update() OWNER TO indaba;

--
-- Name: twc_delete_old_token(); Type: FUNCTION; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE FUNCTION twc_delete_old_token() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   DELETE FROM "Token" WHERE "userID" = NEW."userID";
   RETURN NEW;
END;$$;


ALTER FUNCTION CLIENT_SCHEMA.twc_delete_old_token() OWNER TO indaba;

--
-- Name: twc_get_token(character varying, character varying); Type: FUNCTION; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE FUNCTION twc_get_token(body character varying, exp character varying) RETURNS character varying
    LANGUAGE plpgsql
    AS $$BEGIN

  SELECT t."body"
    FROM "Token" t
   where (t."body" = twc_get_token.body)
   and ((now() - t."issuedAt") < (twc_get_token.exp || ' milliseconds')::interval);
         
END$$;


ALTER FUNCTION CLIENT_SCHEMA.twc_get_token(body character varying, exp character varying) OWNER TO indaba;

--
-- Name: user_company_check(); Type: FUNCTION; Schema: CLIENT_SCHEMA; Owner: indaba
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


ALTER FUNCTION CLIENT_SCHEMA.user_company_check() OWNER TO indaba;

--
-- Name: users_before_update(); Type: FUNCTION; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE FUNCTION users_before_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   NEW."updated" = now();

   RETURN NEW;
END$$;


ALTER FUNCTION CLIENT_SCHEMA.users_before_update() OWNER TO indaba;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: AccessMatrices; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "AccessMatrices" (
    id integer NOT NULL,
    name character varying(100),
    description text,
    default_value smallint
);


ALTER TABLE "AccessMatrices" OWNER TO indaba;

--
-- Name: AccessMatix_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE "AccessMatix_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "AccessMatix_id_seq" OWNER TO indaba;

--
-- Name: AccessMatix_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER SEQUENCE "AccessMatix_id_seq" OWNED BY "AccessMatrices".id;


--
-- Name: AccessPermissions; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "AccessPermissions" (
    "matrixId" integer NOT NULL,
    "roleId" integer NOT NULL,
    "rightId" integer NOT NULL,
    permission smallint,
    id integer NOT NULL
);


ALTER TABLE "AccessPermissions" OWNER TO indaba;

--
-- Name: AccessPermissions_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE "AccessPermissions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "AccessPermissions_id_seq" OWNER TO indaba;

--
-- Name: AccessPermissions_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER SEQUENCE "AccessPermissions_id_seq" OWNED BY "AccessPermissions".id;


--
-- Name: AnswerAttachments; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "AnswerAttachments" (
    id integer NOT NULL,
    "answerId" integer,
    filename character varying,
    size integer,
    mimetype character varying,
    body bytea
);


ALTER TABLE "AnswerAttachments" OWNER TO indaba;

--
-- Name: AnswerAttachments_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE "AnswerAttachments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "AnswerAttachments_id_seq" OWNER TO indaba;

--
-- Name: AnswerAttachments_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER SEQUENCE "AnswerAttachments_id_seq" OWNED BY "AnswerAttachments".id;


--
-- Name: Discussions; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "Discussions" (
    id integer NOT NULL,
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


ALTER TABLE "Discussions" OWNER TO indaba;

--
-- Name: Discussions_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE "Discussions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Discussions_id_seq" OWNER TO indaba;

--
-- Name: Discussions_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER SEQUENCE "Discussions_id_seq" OWNED BY "Discussions".id;


--
-- Name: Essences; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "Essences" (
    id integer NOT NULL,
    "tableName" character varying(100),
    name character varying(100),
    "fileName" character varying(100),
    "nameField" character varying NOT NULL
);


ALTER TABLE "Essences" OWNER TO indaba;

--
-- Name: COLUMN "Essences".name; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: indaba
--

COMMENT ON COLUMN "Essences".name IS 'Human readable name of essence';


--
-- Name: COLUMN "Essences"."fileName"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: indaba
--

COMMENT ON COLUMN "Essences"."fileName" IS 'File name in models path';


--
-- Name: Entities_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE "Entities_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Entities_id_seq" OWNER TO indaba;

--
-- Name: Entities_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER SEQUENCE "Entities_id_seq" OWNED BY "Essences".id;


--
-- Name: EssenceRoles; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "EssenceRoles" (
    id integer NOT NULL,
    "roleId" integer,
    "userId" integer,
    "essenceId" integer,
    "entityId" integer
);


ALTER TABLE "EssenceRoles" OWNER TO indaba;

--
-- Name: EntityRoles_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE "EntityRoles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "EntityRoles_id_seq" OWNER TO indaba;

--
-- Name: EntityRoles_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER SEQUENCE "EntityRoles_id_seq" OWNED BY "EssenceRoles".id;


--
-- Name: Groups; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "Groups" (
    id integer NOT NULL,
    title character varying,
    "organizationId" integer,
    "langId" integer
);


ALTER TABLE "Groups" OWNER TO indaba;

--
-- Name: Groups_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE "Groups_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Groups_id_seq" OWNER TO indaba;

--
-- Name: Groups_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER SEQUENCE "Groups_id_seq" OWNED BY "Groups".id;


--
-- Name: Surveys; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "Surveys" (
    id integer NOT NULL,
    title character varying,
    description text,
    created timestamp with time zone DEFAULT now() NOT NULL,
    "projectId" integer,
    "isDraft" boolean DEFAULT false NOT NULL,
    "langId" integer
);


ALTER TABLE "Surveys" OWNER TO indaba;

--
-- Name: JSON_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE "JSON_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "JSON_id_seq" OWNER TO indaba;

--
-- Name: JSON_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER SEQUENCE "JSON_id_seq" OWNED BY "Surveys".id;


--
-- Name: Languages; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "Languages" (
    id integer NOT NULL,
    name character varying(100),
    "nativeName" character varying(255),
    code character varying(3)
);


ALTER TABLE "Languages" OWNER TO indaba;

--
-- Name: Languages_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE "Languages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Languages_id_seq" OWNER TO indaba;

--
-- Name: Languages_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER SEQUENCE "Languages_id_seq" OWNED BY "Languages".id;


--
-- Name: Notifications; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "Notifications" (
    id integer NOT NULL,
    "userFrom" integer NOT NULL,
    "userTo" integer NOT NULL,
    body text,
    email character varying,
    message text,
    "sentResult" character varying,
    "essenceId" integer,
    "entityId" integer,
    created timestamp(6) with time zone DEFAULT now() NOT NULL,
    "readingTime" timestamp(6) with time zone,
    sent timestamp(6) with time zone,
    read boolean DEFAULT false
);


ALTER TABLE "Notifications" OWNER TO indaba;

--
-- Name: Notifications_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE "Notifications_id_seq"
    START WITH 167
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Notifications_id_seq" OWNER TO indaba;

--
-- Name: Notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER SEQUENCE "Notifications_id_seq" OWNED BY "Notifications".id;


--
-- Name: Organizations; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "Organizations" (
    id integer NOT NULL,
    name character varying(100),
    address character varying(200),
    "adminUserId" integer,
    url character varying(200),
    "enforceApiSecurity" smallint,
    "isActive" boolean,
    "langId" integer
);


ALTER TABLE "Organizations" OWNER TO indaba;

--
-- Name: Organizations_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE "Organizations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Organizations_id_seq" OWNER TO indaba;

--
-- Name: Organizations_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER SEQUENCE "Organizations_id_seq" OWNED BY "Organizations".id;


--
-- Name: ProductUOA; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "ProductUOA" (
    "productId" integer NOT NULL,
    "UOAid" integer NOT NULL,
    "currentStepId" integer,
    "isComplete" boolean DEFAULT false NOT NULL
);


ALTER TABLE "ProductUOA" OWNER TO indaba;

--
-- Name: Products; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "Products" (
    id integer NOT NULL,
    title character varying(100),
    description text,
    "originalLangId" integer,
    "projectId" integer,
    "surveyId" integer,
    status smallint DEFAULT 0 NOT NULL,
    "langId" integer
);


ALTER TABLE "Products" OWNER TO indaba;

--
-- Name: Products_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE "Products_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Products_id_seq" OWNER TO indaba;

--
-- Name: Products_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER SEQUENCE "Products_id_seq" OWNED BY "Products".id;


--
-- Name: Projects; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "Projects" (
    id integer NOT NULL,
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


ALTER TABLE "Projects" OWNER TO indaba;

--
-- Name: Projects_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE "Projects_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Projects_id_seq" OWNER TO indaba;

--
-- Name: Projects_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER SEQUENCE "Projects_id_seq" OWNED BY "Projects".id;


--
-- Name: Rights; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "Rights" (
    id integer NOT NULL,
    action character varying(80) NOT NULL,
    description text,
    "essenceId" integer
);


ALTER TABLE "Rights" OWNER TO indaba;

--
-- Name: Rights_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE "Rights_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Rights_id_seq" OWNER TO indaba;

--
-- Name: Rights_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER SEQUENCE "Rights_id_seq" OWNED BY "Rights".id;


--
-- Name: role_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE role_id_seq OWNER TO indaba;

--
-- Name: Roles; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "Roles" (
    id integer DEFAULT nextval('role_id_seq'::regclass) NOT NULL,
    name character varying(20) NOT NULL,
    "isSystem" boolean DEFAULT false NOT NULL
);


ALTER TABLE "Roles" OWNER TO indaba;

--
-- Name: RolesRights; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "RolesRights" (
    "roleID" bigint NOT NULL,
    "rightID" bigint NOT NULL
);


ALTER TABLE "RolesRights" OWNER TO indaba;

--
-- Name: SurveyAnswers; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "SurveyAnswers" (
    id integer NOT NULL,
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
    comments character varying
);


ALTER TABLE "SurveyAnswers" OWNER TO indaba;

--
-- Name: SurveyAnswers_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE "SurveyAnswers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "SurveyAnswers_id_seq" OWNER TO indaba;

--
-- Name: SurveyAnswers_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER SEQUENCE "SurveyAnswers_id_seq" OWNED BY "SurveyAnswers".id;


--
-- Name: SurveyQuestionOptions; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "SurveyQuestionOptions" (
    id integer NOT NULL,
    "questionId" integer,
    value character varying,
    label character varying,
    skip smallint,
    "isSelected" boolean DEFAULT false NOT NULL,
    "langId" integer
);


ALTER TABLE "SurveyQuestionOptions" OWNER TO indaba;

--
-- Name: SurveyQuestions; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "SurveyQuestions" (
    id integer NOT NULL,
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


ALTER TABLE "SurveyQuestions" OWNER TO indaba;

--
-- Name: SurveyQuestions_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE "SurveyQuestions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "SurveyQuestions_id_seq" OWNER TO indaba;

--
-- Name: SurveyQuestions_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER SEQUENCE "SurveyQuestions_id_seq" OWNED BY "SurveyQuestions".id;


--
-- Name: Tasks; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "Tasks" (
    id integer NOT NULL,
    title character varying,
    description text,
    "uoaId" integer NOT NULL,
    "stepId" integer NOT NULL,
    created timestamp with time zone DEFAULT now() NOT NULL,
    "productId" integer NOT NULL,
    "startDate" timestamp with time zone,
    "endDate" timestamp with time zone,
    "accessToResponses" boolean DEFAULT false NOT NULL,
    "accessToDiscussions" boolean DEFAULT false NOT NULL,
    "writeToAnswers" boolean DEFAULT false NOT NULL,
    "userId" integer,
    "langId" integer
);


ALTER TABLE "Tasks" OWNER TO indaba;

--
-- Name: Tasks_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE "Tasks_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Tasks_id_seq" OWNER TO indaba;

--
-- Name: Tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER SEQUENCE "Tasks_id_seq" OWNED BY "Tasks".id;


--
-- Name: Token; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "Token" (
    "userID" integer NOT NULL,
    body character varying(200) NOT NULL,
    "issuedAt" timestamp without time zone DEFAULT ('now'::text)::timestamp without time zone NOT NULL
);


ALTER TABLE "Token" OWNER TO indaba;

--
-- Name: Translations; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "Translations" (
    "essenceId" integer NOT NULL,
    "entityId" integer NOT NULL,
    field character varying(100) NOT NULL,
    "langId" integer NOT NULL,
    value text
);


ALTER TABLE "Translations" OWNER TO indaba;

--
-- Name: UnitOfAnalysis_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE "UnitOfAnalysis_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysis_id_seq" OWNER TO indaba;

--
-- Name: UnitOfAnalysis; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
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


ALTER TABLE "UnitOfAnalysis" OWNER TO indaba;

--
-- Name: COLUMN "UnitOfAnalysis"."gadmId0"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId0" IS 'ID0 for use with GADM shapefile';


--
-- Name: COLUMN "UnitOfAnalysis"."gadmId1"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId1" IS 'ID1 for use with GADM shapefile';


--
-- Name: COLUMN "UnitOfAnalysis"."gadmId2"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId2" IS 'ID2 for use with GADM shapefile';


--
-- Name: COLUMN "UnitOfAnalysis"."gadmId3"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId3" IS 'ID3 for use with GADM shapefile';


--
-- Name: COLUMN "UnitOfAnalysis"."gadmObjectId"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmObjectId" IS 'OBJECTID for use with GADM shapefile (only Global Shapefile)';


--
-- Name: COLUMN "UnitOfAnalysis"."ISO"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."ISO" IS 'only for Country level Unit Of Analysis';


--
-- Name: COLUMN "UnitOfAnalysis"."ISO2"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."ISO2" IS 'only for Country level Unit Of Analysis';


--
-- Name: COLUMN "UnitOfAnalysis"."nameISO"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."nameISO" IS 'only for Country level Unit Of Analysis';


--
-- Name: COLUMN "UnitOfAnalysis".name; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis".name IS 'Multilanguage';


--
-- Name: COLUMN "UnitOfAnalysis".description; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis".description IS 'Multilanguage';


--
-- Name: COLUMN "UnitOfAnalysis"."shortName"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."shortName" IS 'Multilanguage';


--
-- Name: COLUMN "UnitOfAnalysis"."HASC"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."HASC" IS '(example RU.AD.OK)';


--
-- Name: COLUMN "UnitOfAnalysis"."unitOfAnalysisType"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."unitOfAnalysisType" IS 'reference to table UnitOfAnalysisType';


--
-- Name: COLUMN "UnitOfAnalysis"."parentId"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."parentId" IS 'Link to Parent Unit of Analysis if exist';


--
-- Name: COLUMN "UnitOfAnalysis"."creatorId"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."creatorId" IS 'Creator Id (User Id)';


--
-- Name: COLUMN "UnitOfAnalysis"."ownerId"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."ownerId" IS 'Owner Id (User Id)';


--
-- Name: COLUMN "UnitOfAnalysis".visibility; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis".visibility IS '1 = CLIENT_SCHEMA; 2 = private;';


--
-- Name: COLUMN "UnitOfAnalysis".status; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis".status IS '1 = active; 2 = inactive; 3 = deleted;';


--
-- Name: UnitOfAnalysisClassType_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE "UnitOfAnalysisClassType_id_seq"
    START WITH 9
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysisClassType_id_seq" OWNER TO indaba;

--
-- Name: UnitOfAnalysisClassType; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "UnitOfAnalysisClassType" (
    id smallint DEFAULT nextval('"UnitOfAnalysisClassType_id_seq"'::regclass) NOT NULL,
    name character varying(45) NOT NULL,
    description character varying(255),
    "langId" smallint DEFAULT 1 NOT NULL
);


ALTER TABLE "UnitOfAnalysisClassType" OWNER TO indaba;

--
-- Name: COLUMN "UnitOfAnalysisClassType".name; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysisClassType".name IS 'Classification Name (for example - World Bank classification) ';


--
-- Name: COLUMN "UnitOfAnalysisClassType".description; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysisClassType".description IS 'Classification Name description';


--
-- Name: UnitOfAnalysisTag; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "UnitOfAnalysisTag" (
    id smallint NOT NULL,
    name character varying(45) NOT NULL,
    description character varying(255),
    "langId" integer DEFAULT 1 NOT NULL,
    "classTypeId" smallint NOT NULL
);


ALTER TABLE "UnitOfAnalysisTag" OWNER TO indaba;

--
-- Name: UnitOfAnalysisTagLink_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE "UnitOfAnalysisTagLink_id_seq"
    START WITH 18
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysisTagLink_id_seq" OWNER TO indaba;

--
-- Name: UnitOfAnalysisTagLink; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "UnitOfAnalysisTagLink" (
    id integer DEFAULT nextval('"UnitOfAnalysisTagLink_id_seq"'::regclass) NOT NULL,
    "uoaId" integer NOT NULL,
    "uoaTagId" integer NOT NULL
);


ALTER TABLE "UnitOfAnalysisTagLink" OWNER TO indaba;

--
-- Name: UnitOfAnalysisTag_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE "UnitOfAnalysisTag_id_seq"
    START WITH 9
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysisTag_id_seq" OWNER TO indaba;

--
-- Name: UnitOfAnalysisTag_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER SEQUENCE "UnitOfAnalysisTag_id_seq" OWNED BY "UnitOfAnalysisTag".id;


--
-- Name: UnitOfAnalysisType_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE "UnitOfAnalysisType_id_seq"
    START WITH 9
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysisType_id_seq" OWNER TO indaba;

--
-- Name: UnitOfAnalysisType; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "UnitOfAnalysisType" (
    id smallint DEFAULT nextval('"UnitOfAnalysisType_id_seq"'::regclass) NOT NULL,
    name character varying(40) NOT NULL,
    description character varying(255),
    "langId" integer DEFAULT 1 NOT NULL
);


ALTER TABLE "UnitOfAnalysisType" OWNER TO indaba;

--
-- Name: UserGroups; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "UserGroups" (
    "userId" integer NOT NULL,
    "groupId" integer NOT NULL
);


ALTER TABLE "UserGroups" OWNER TO indaba;

--
-- Name: UserRights; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "UserRights" (
    "userID" bigint NOT NULL,
    "rightID" bigint NOT NULL,
    "canDo" boolean
);


ALTER TABLE "UserRights" OWNER TO indaba;

--
-- Name: UserUOA; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "UserUOA" (
    "UserId" integer NOT NULL,
    "UOAid" integer NOT NULL
);


ALTER TABLE "UserUOA" OWNER TO indaba;

--
-- Name: user_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE user_id_seq OWNER TO indaba;

--
-- Name: Users; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
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


ALTER TABLE "Users" OWNER TO indaba;

--
-- Name: WorkflowStepGroups; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "WorkflowStepGroups" (
    "stepId" integer NOT NULL,
    "groupId" integer NOT NULL
);


ALTER TABLE "WorkflowStepGroups" OWNER TO indaba;

--
-- Name: WorkflowSteps; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "WorkflowSteps" (
    "workflowId" integer NOT NULL,
    id integer NOT NULL,
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


ALTER TABLE "WorkflowSteps" OWNER TO indaba;

--
-- Name: WorkflowSteps_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE "WorkflowSteps_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "WorkflowSteps_id_seq" OWNER TO indaba;

--
-- Name: WorkflowSteps_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER SEQUENCE "WorkflowSteps_id_seq" OWNED BY "WorkflowSteps".id;


--
-- Name: Workflows; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE TABLE "Workflows" (
    id integer NOT NULL,
    name character varying(200),
    description text,
    created timestamp with time zone DEFAULT now() NOT NULL,
    "productId" integer
);


ALTER TABLE "Workflows" OWNER TO indaba;

--
-- Name: Workflows_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE "Workflows_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Workflows_id_seq" OWNER TO indaba;

--
-- Name: Workflows_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER SEQUENCE "Workflows_id_seq" OWNED BY "Workflows".id;


--
-- Name: brand_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE brand_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE brand_id_seq OWNER TO indaba;

--
-- Name: country_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE country_id_seq
    START WITH 240
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE country_id_seq OWNER TO indaba;

--
-- Name: order_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE order_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE order_id_seq OWNER TO indaba;

--
-- Name: surveyQuestionOptions_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE "surveyQuestionOptions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "surveyQuestionOptions_id_seq" OWNER TO indaba;

--
-- Name: surveyQuestionOptions_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER SEQUENCE "surveyQuestionOptions_id_seq" OWNED BY "SurveyQuestionOptions".id;


--
-- Name: transport_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE transport_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE transport_id_seq OWNER TO indaba;

--
-- Name: transportmodel_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE SEQUENCE transportmodel_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE transportmodel_id_seq OWNER TO indaba;

--
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "AccessMatrices" ALTER COLUMN id SET DEFAULT nextval('"AccessMatix_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "AccessPermissions" ALTER COLUMN id SET DEFAULT nextval('"AccessPermissions_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "AnswerAttachments" ALTER COLUMN id SET DEFAULT nextval('"AnswerAttachments_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Discussions" ALTER COLUMN id SET DEFAULT nextval('"Discussions_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "EssenceRoles" ALTER COLUMN id SET DEFAULT nextval('"EntityRoles_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Essences" ALTER COLUMN id SET DEFAULT nextval('"Entities_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Groups" ALTER COLUMN id SET DEFAULT nextval('"Groups_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Languages" ALTER COLUMN id SET DEFAULT nextval('"Languages_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Notifications" ALTER COLUMN id SET DEFAULT nextval('"Notifications_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Organizations" ALTER COLUMN id SET DEFAULT nextval('"Organizations_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Products" ALTER COLUMN id SET DEFAULT nextval('"Products_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Projects" ALTER COLUMN id SET DEFAULT nextval('"Projects_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Rights" ALTER COLUMN id SET DEFAULT nextval('"Rights_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "SurveyAnswers" ALTER COLUMN id SET DEFAULT nextval('"SurveyAnswers_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "SurveyQuestionOptions" ALTER COLUMN id SET DEFAULT nextval('"surveyQuestionOptions_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "SurveyQuestions" ALTER COLUMN id SET DEFAULT nextval('"SurveyQuestions_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Surveys" ALTER COLUMN id SET DEFAULT nextval('"JSON_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Tasks" ALTER COLUMN id SET DEFAULT nextval('"Tasks_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysisTag" ALTER COLUMN id SET DEFAULT nextval('"UnitOfAnalysisTag_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "WorkflowSteps" ALTER COLUMN id SET DEFAULT nextval('"WorkflowSteps_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Workflows" ALTER COLUMN id SET DEFAULT nextval('"Workflows_id_seq"'::regclass);


--
-- Name: AccessMatrix_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "AccessMatrices"
    ADD CONSTRAINT "AccessMatrix_pkey" PRIMARY KEY (id);


--
-- Name: AccessPermissions_accessMatrixId_roleId_rightId_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "AccessPermissions"
    ADD CONSTRAINT "AccessPermissions_accessMatrixId_roleId_rightId_key" UNIQUE ("matrixId", "roleId", "rightId");


--
-- Name: AccessPermissoins_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "AccessPermissions"
    ADD CONSTRAINT "AccessPermissoins_pkey" PRIMARY KEY (id);


--
-- Name: AnswerAttachments_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "AnswerAttachments"
    ADD CONSTRAINT "AnswerAttachments_pkey" PRIMARY KEY (id);


--
-- Name: Discussions_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_pkey" PRIMARY KEY (id);


--
-- Name: EntityRoles_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "EssenceRoles"
    ADD CONSTRAINT "EntityRoles_pkey" PRIMARY KEY (id);


--
-- Name: Entity_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Entity_pkey" PRIMARY KEY (id);


--
-- Name: EssenceRoles_essenceId_entityId_userId_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "EssenceRoles"
    ADD CONSTRAINT "EssenceRoles_essenceId_entityId_userId_key" UNIQUE ("essenceId", "entityId", "userId");


--
-- Name: Essences_fileName_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_fileName_key" UNIQUE ("fileName");


--
-- Name: Essences_tableName_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_tableName_key" UNIQUE ("tableName");


--
-- Name: Groups_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Groups"
    ADD CONSTRAINT "Groups_pkey" PRIMARY KEY (id);


--
-- Name: JSON_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Surveys"
    ADD CONSTRAINT "JSON_pkey" PRIMARY KEY (id);


--
-- Name: Languages_code_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Languages"
    ADD CONSTRAINT "Languages_code_key" UNIQUE (code);


--
-- Name: Languages_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Languages"
    ADD CONSTRAINT "Languages_pkey" PRIMARY KEY (id);


--
-- Name: Notifications_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_pkey" PRIMARY KEY (id);


--
-- Name: Organizations_adminUserId_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_adminUserId_key" UNIQUE ("adminUserId");


--
-- Name: Organizations_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_pkey" PRIMARY KEY (id);


--
-- Name: ProductUOA_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_pkey" PRIMARY KEY ("productId", "UOAid");


--
-- Name: ProductUOA_productId_UOAid_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_productId_UOAid_key" UNIQUE ("productId", "UOAid");


--
-- Name: Product_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: Projects_codeName_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_codeName_key" UNIQUE ("codeName");


--
-- Name: Projects_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_pkey" PRIMARY KEY (id);


--
-- Name: Rights_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Rights"
    ADD CONSTRAINT "Rights_pkey" PRIMARY KEY (id);


--
-- Name: SurveyAnswers_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_pkey" PRIMARY KEY (id);


--
-- Name: SurveyQuestions_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "SurveyQuestions"
    ADD CONSTRAINT "SurveyQuestions_pkey" PRIMARY KEY (id);


--
-- Name: Tasks_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_pkey" PRIMARY KEY (id);


--
-- Name: Translations_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_pkey" PRIMARY KEY ("essenceId", "entityId", field, "langId");


--
-- Name: UnitOfAnalysisClassType_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysisClassType"
    ADD CONSTRAINT "UnitOfAnalysisClassType_pkey" PRIMARY KEY (id);


--
-- Name: UnitOfAnalysisTagLink_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_pkey" PRIMARY KEY (id);


--
-- Name: UnitOfAnalysisTagLink_uoaId_uoaTagId_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_uoaId_uoaTagId_key" UNIQUE ("uoaId", "uoaTagId");


--
-- Name: UnitOfAnalysisTag_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_pkey" PRIMARY KEY (id);


--
-- Name: UnitOfAnalysisType_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysisType"
    ADD CONSTRAINT "UnitOfAnalysisType_pkey" PRIMARY KEY (id);


--
-- Name: UnitOfAnalysis_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_pkey" PRIMARY KEY (id);


--
-- Name: UserGroups_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "UserGroups"
    ADD CONSTRAINT "UserGroups_pkey" PRIMARY KEY ("userId", "groupId");


--
-- Name: UserUOA_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "UserUOA"
    ADD CONSTRAINT "UserUOA_pkey" PRIMARY KEY ("UserId", "UOAid");


--
-- Name: Users_email_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- Name: WorkflowStepGroups_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "WorkflowStepGroups"
    ADD CONSTRAINT "WorkflowStepGroups_pkey" PRIMARY KEY ("stepId", "groupId");


--
-- Name: WorkflowSteps_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "WorkflowSteps"
    ADD CONSTRAINT "WorkflowSteps_pkey" PRIMARY KEY (id);


--
-- Name: Workflows_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Workflows"
    ADD CONSTRAINT "Workflows_pkey" PRIMARY KEY (id);


--
-- Name: Workflows_productId_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Workflows"
    ADD CONSTRAINT "Workflows_productId_key" UNIQUE ("productId");


--
-- Name: id; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Roles"
    ADD CONSTRAINT id PRIMARY KEY (id);


--
-- Name: roleRight_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "roleRight_pkey" PRIMARY KEY ("roleID", "rightID");


--
-- Name: surveyQuestionOptions_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "SurveyQuestionOptions"
    ADD CONSTRAINT "surveyQuestionOptions_pkey" PRIMARY KEY (id);


--
-- Name: userID; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "userID" PRIMARY KEY (id);


--
-- Name: userRights_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "UserRights"
    ADD CONSTRAINT "userRights_pkey" PRIMARY KEY ("userID", "rightID");


--
-- Name: Rights_action_idx; Type: INDEX; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE UNIQUE INDEX "Rights_action_idx" ON "Rights" USING btree (action);


--
-- Name: Token_body_idx; Type: INDEX; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE UNIQUE INDEX "Token_body_idx" ON "Token" USING btree (body);


--
-- Name: UnitOfAnalysisTagLink_uoaId_idx; Type: INDEX; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE INDEX "UnitOfAnalysisTagLink_uoaId_idx" ON "UnitOfAnalysisTagLink" USING btree ("uoaId");


--
-- Name: UnitOfAnalysisTagLink_uoaTagId_idx; Type: INDEX; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE INDEX "UnitOfAnalysisTagLink_uoaTagId_idx" ON "UnitOfAnalysisTagLink" USING btree ("uoaTagId");


--
-- Name: fki_roleID; Type: INDEX; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE INDEX "fki_roleID" ON "Users" USING btree ("roleID");


--
-- Name: fki_rolesrights_rightID; Type: INDEX; Schema: CLIENT_SCHEMA; Owner: indaba; Tablespace: 
--

CREATE INDEX "fki_rolesrights_rightID" ON "RolesRights" USING btree ("rightID");


--
-- Name: tr_delete_token; Type: TRIGGER; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE TRIGGER tr_delete_token BEFORE INSERT ON "Token" FOR EACH ROW EXECUTE PROCEDURE twc_delete_old_token();


--
-- Name: users_before_update; Type: TRIGGER; Schema: CLIENT_SCHEMA; Owner: indaba
--

CREATE TRIGGER users_before_update BEFORE UPDATE ON "Users" FOR EACH ROW EXECUTE PROCEDURE users_before_update();


--
-- Name: AnswerAttachments_answerId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "AnswerAttachments"
    ADD CONSTRAINT "AnswerAttachments_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "SurveyAnswers"(id);


--
-- Name: Discussions_questionId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions"(id);


--
-- Name: Discussions_returnTaskId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_returnTaskId_fkey" FOREIGN KEY ("returnTaskId") REFERENCES "Tasks"(id);


--
-- Name: Discussions_taskId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Tasks"(id);


--
-- Name: Discussions_userFromId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_userFromId_fkey" FOREIGN KEY ("userFromId") REFERENCES "Tasks"(id);


--
-- Name: Discussions_userId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Discussions"
    ADD CONSTRAINT "Discussions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"(id);


--
-- Name: Groups_langId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Groups"
    ADD CONSTRAINT "Groups_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Groups_organizationId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Groups"
    ADD CONSTRAINT "Groups_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- Name: Notifications_essenceId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_essenceId_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- Name: Notifications_userFrom_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_userFrom_fkey" FOREIGN KEY ("userFrom") REFERENCES "Users"(id);


--
-- Name: Notifications_userTo_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Notifications"
    ADD CONSTRAINT "Notifications_userTo_fkey" FOREIGN KEY ("userTo") REFERENCES "Users"(id);


--
-- Name: Organizations_adminUserId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "Users"(id);


--
-- Name: Organizations_langId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: ProductUOA_UOAid_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_UOAid_fkey" FOREIGN KEY ("UOAid") REFERENCES "UnitOfAnalysis"(id);


--
-- Name: ProductUOA_currentStepId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_currentStepId_fkey" FOREIGN KEY ("currentStepId") REFERENCES "WorkflowSteps"(id);


--
-- Name: ProductUOA_productId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: Products_langId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Products_originalLangId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_originalLangId_fkey" FOREIGN KEY ("originalLangId") REFERENCES "Languages"(id);


--
-- Name: Products_projectId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Projects"(id);


--
-- Name: Products_surveyId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Surveys"(id);


--
-- Name: Projects_accessMatrixId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_accessMatrixId_fkey" FOREIGN KEY ("matrixId") REFERENCES "AccessMatrices"(id);


--
-- Name: Projects_adminUserId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "Users"(id);


--
-- Name: Projects_langId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Projects_organizationId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- Name: Rights_essence_id_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Rights"
    ADD CONSTRAINT "Rights_essence_id_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- Name: RolesRights_roleID_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "RolesRights_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "Roles"(id);


--
-- Name: SurveyAnswers_langId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: SurveyAnswers_productId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: SurveyAnswers_questionId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions"(id);


--
-- Name: SurveyAnswers_surveyId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Surveys"(id);


--
-- Name: SurveyAnswers_userId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"(id);


--
-- Name: SurveyAnswers_wfStepId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_wfStepId_fkey" FOREIGN KEY ("wfStepId") REFERENCES "WorkflowSteps"(id);


--
-- Name: SurveyQuestionOptions_langId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "SurveyQuestionOptions"
    ADD CONSTRAINT "SurveyQuestionOptions_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: SurveyQuestions_langId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "SurveyQuestions"
    ADD CONSTRAINT "SurveyQuestions_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: SurveyQuestions_surveyId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "SurveyQuestions"
    ADD CONSTRAINT "SurveyQuestions_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Surveys"(id);


--
-- Name: Surveys_langId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Surveys"
    ADD CONSTRAINT "Surveys_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Surveys_projectId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Surveys"
    ADD CONSTRAINT "Surveys_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Projects"(id);


--
-- Name: Tasks_langId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Tasks_productId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: Tasks_stepId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowSteps"(id);


--
-- Name: Tasks_uoaId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_uoaId_fkey" FOREIGN KEY ("uoaId") REFERENCES "UnitOfAnalysis"(id);


--
-- Name: Tasks_userId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"(id);


--
-- Name: Translations_essence_id_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_essence_id_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- Name: Translations_lang_id_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_lang_id_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysisClassType_langId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysisClassType"
    ADD CONSTRAINT "UnitOfAnalysisClassType_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysisTagLink_uoaId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_uoaId_fkey" FOREIGN KEY ("uoaId") REFERENCES "UnitOfAnalysis"(id);


--
-- Name: UnitOfAnalysisTagLink_uoaTagId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_uoaTagId_fkey" FOREIGN KEY ("uoaTagId") REFERENCES "UnitOfAnalysisTag"(id);


--
-- Name: UnitOfAnalysisTag_classTypeId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_classTypeId_fkey" FOREIGN KEY ("classTypeId") REFERENCES "UnitOfAnalysisClassType"(id);


--
-- Name: UnitOfAnalysisTag_langId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysisType_langId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysisType"
    ADD CONSTRAINT "UnitOfAnalysisType_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysis_creatorId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Users"(id);


--
-- Name: UnitOfAnalysis_langId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysis_ownerId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Users"(id);


--
-- Name: UnitOfAnalysis_unitOfAnalysisType_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_unitOfAnalysisType_fkey" FOREIGN KEY ("unitOfAnalysisType") REFERENCES "UnitOfAnalysisType"(id);


--
-- Name: UserGroups_groupId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "UserGroups"
    ADD CONSTRAINT "UserGroups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Groups"(id);


--
-- Name: UserGroups_userId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "UserGroups"
    ADD CONSTRAINT "UserGroups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"(id);


--
-- Name: UserUOA_UOAid_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "UserUOA"
    ADD CONSTRAINT "UserUOA_UOAid_fkey" FOREIGN KEY ("UOAid") REFERENCES "UnitOfAnalysis"(id);


--
-- Name: UserUOA_UserId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "UserUOA"
    ADD CONSTRAINT "UserUOA_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"(id);


--
-- Name: Users_langId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: Users_organizationId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- Name: Users_roleID_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "Roles"(id);


--
-- Name: WorkflowStepGroups_groupId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "WorkflowStepGroups"
    ADD CONSTRAINT "WorkflowStepGroups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Groups"(id);


--
-- Name: WorkflowStepGroups_stepId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "WorkflowStepGroups"
    ADD CONSTRAINT "WorkflowStepGroups_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowSteps"(id);


--
-- Name: WorkflowSteps_langId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "WorkflowSteps"
    ADD CONSTRAINT "WorkflowSteps_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: WorkflowSteps_worflowId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "WorkflowSteps"
    ADD CONSTRAINT "WorkflowSteps_worflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflows"(id);


--
-- Name: Workflows_productId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "Workflows"
    ADD CONSTRAINT "Workflows_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: essence_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "EssenceRoles"
    ADD CONSTRAINT essence_fkey FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- Name: role_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "EssenceRoles"
    ADD CONSTRAINT role_fkey FOREIGN KEY ("roleId") REFERENCES "Roles"(id);


--
-- Name: rolesrights_rightID; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "rolesrights_rightID" FOREIGN KEY ("rightID") REFERENCES "Rights"(id);


--
-- Name: surveyQuestionOptions_questionId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "SurveyQuestionOptions"
    ADD CONSTRAINT "surveyQuestionOptions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions"(id);


--
-- Name: user_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: indaba
--

ALTER TABLE ONLY "EssenceRoles"
    ADD CONSTRAINT user_fkey FOREIGN KEY ("userId") REFERENCES "Users"(id);


--
-- Name: CLIENT_SCHEMA; Type: ACL; Schema: -; Owner: indaba
--

REVOKE ALL ON SCHEMA CLIENT_SCHEMA FROM PUBLIC;
REVOKE ALL ON SCHEMA CLIENT_SCHEMA FROM indaba;
GRANT ALL ON SCHEMA CLIENT_SCHEMA TO indaba;
GRANT ALL ON SCHEMA CLIENT_SCHEMA TO PUBLIC;


--
-- PostgreSQL database dump complete
--

