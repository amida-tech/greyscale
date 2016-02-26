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
-- TOC entry 234 (class 3079 OID 11861)
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- TOC entry 2399 (class 0 OID 0)
-- Dependencies: 234
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


CREATE SCHEMA IF NOT EXISTS CLIENT_SCHEMA;

SET search_path = CLIENT_SCHEMA, pg_catalog;

--
-- TOC entry 593 (class 1247 OID 42713)
-- Name: event_status; Type: TYPE; Schema: CLIENT_SCHEMA; Owner: postgres
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


ALTER TYPE event_status OWNER TO postgres;

--
-- TOC entry 596 (class 1247 OID 42728)
-- Name: order_status; Type: TYPE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE TYPE order_status AS ENUM (
    'New',
    'Acknowledged',
    'Confirmed',
    'Fulfilled',
    'Cancelled'
);


ALTER TYPE order_status OWNER TO postgres;

--
-- TOC entry 599 (class 1247 OID 42740)
-- Name: tour_status; Type: TYPE; Schema: CLIENT_SCHEMA; Owner: postgres
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


ALTER TYPE tour_status OWNER TO postgres;

--
-- TOC entry 602 (class 1247 OID 42756)
-- Name: transport_status; Type: TYPE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE TYPE transport_status AS ENUM (
    'New',
    'Submitted',
    'Approved',
    'Available',
    'Rented',
    'Deleted'
);


ALTER TYPE transport_status OWNER TO postgres;

--
-- TOC entry 235 (class 1255 OID 42769)
-- Name: order_before_update(); Type: FUNCTION; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE FUNCTION order_before_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   NEW."updated" = now();

   RETURN NEW;
END$$;


ALTER FUNCTION CLIENT_SCHEMA.order_before_update() OWNER TO postgres;

--
-- TOC entry 248 (class 1255 OID 42770)
-- Name: tours_before_insert(); Type: FUNCTION; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE FUNCTION tours_before_insert() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   new."created" = now();
new."updated" = now();

   RETURN NEW;
END;$$;


ALTER FUNCTION CLIENT_SCHEMA.tours_before_insert() OWNER TO postgres;

--
-- TOC entry 249 (class 1255 OID 42771)
-- Name: tours_before_update(); Type: FUNCTION; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE FUNCTION tours_before_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   NEW."updated" = now();

   RETURN NEW;
END;$$;


ALTER FUNCTION CLIENT_SCHEMA.tours_before_update() OWNER TO postgres;

--
-- TOC entry 250 (class 1255 OID 42772)
-- Name: twc_delete_old_token(); Type: FUNCTION; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE FUNCTION twc_delete_old_token() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   DELETE FROM "Token" WHERE "userID" = NEW."userID";
   RETURN NEW;
END;$$;


ALTER FUNCTION CLIENT_SCHEMA.twc_delete_old_token() OWNER TO postgres;

--
-- TOC entry 251 (class 1255 OID 42773)
-- Name: twc_get_token(character varying, character varying); Type: FUNCTION; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE FUNCTION twc_get_token(body character varying, exp character varying) RETURNS character varying
    LANGUAGE plpgsql
    AS $$BEGIN

  SELECT t."body"
    FROM "Token" t
   where (t."body" = twc_get_token.body)
   and ((now() - t."issuedAt") < (twc_get_token.exp || ' milliseconds')::interval);
         
END$$;


ALTER FUNCTION CLIENT_SCHEMA.twc_get_token(body character varying, exp character varying) OWNER TO postgres;

--
-- TOC entry 252 (class 1255 OID 42774)
-- Name: user_company_check(); Type: FUNCTION; Schema: CLIENT_SCHEMA; Owner: postgres
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


ALTER FUNCTION CLIENT_SCHEMA.user_company_check() OWNER TO postgres;

--
-- TOC entry 253 (class 1255 OID 42775)
-- Name: users_before_update(); Type: FUNCTION; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE FUNCTION users_before_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$BEGIN
   NEW."updated" = now();

   RETURN NEW;
END$$;


ALTER FUNCTION CLIENT_SCHEMA.users_before_update() OWNER TO postgres;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- TOC entry 172 (class 1259 OID 42776)
-- Name: AccessMatrices; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "AccessMatrices" (
    id integer NOT NULL,
    name character varying(100),
    description text,
    default_value smallint
);


ALTER TABLE "AccessMatrices" OWNER TO postgres;

--
-- TOC entry 173 (class 1259 OID 42782)
-- Name: AccessMatix_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE SEQUENCE "AccessMatix_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "AccessMatix_id_seq" OWNER TO postgres;

--
-- TOC entry 2400 (class 0 OID 0)
-- Dependencies: 173
-- Name: AccessMatix_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "AccessMatix_id_seq" OWNED BY "AccessMatrices".id;


--
-- TOC entry 174 (class 1259 OID 42784)
-- Name: AccessPermissions; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "AccessPermissions" (
    "matrixId" integer NOT NULL,
    "roleId" integer NOT NULL,
    "rightId" integer NOT NULL,
    permission smallint,
    id integer NOT NULL
);


ALTER TABLE "AccessPermissions" OWNER TO postgres;

--
-- TOC entry 175 (class 1259 OID 42787)
-- Name: AccessPermissions_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE SEQUENCE "AccessPermissions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "AccessPermissions_id_seq" OWNER TO postgres;

--
-- TOC entry 2401 (class 0 OID 0)
-- Dependencies: 175
-- Name: AccessPermissions_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "AccessPermissions_id_seq" OWNED BY "AccessPermissions".id;


--
-- TOC entry 176 (class 1259 OID 42789)
-- Name: country_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE SEQUENCE country_id_seq
    START WITH 240
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE country_id_seq OWNER TO postgres;

--
-- TOC entry 177 (class 1259 OID 42791)
-- Name: Countries; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "Countries" (
    id integer DEFAULT nextval('country_id_seq'::regclass) NOT NULL,
    name character varying(75) NOT NULL,
    alpha2 character varying(2) NOT NULL,
    alpha3 character varying(3) NOT NULL,
    nbr integer NOT NULL
);


ALTER TABLE "Countries" OWNER TO postgres;

--
-- TOC entry 178 (class 1259 OID 42795)
-- Name: Essences; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "Essences" (
    id integer NOT NULL,
    "tableName" character varying(100),
    name character varying(100),
    "fileName" character varying(100),
    "nameField" character varying NOT NULL
);


ALTER TABLE "Essences" OWNER TO postgres;

--
-- TOC entry 2402 (class 0 OID 0)
-- Dependencies: 178
-- Name: COLUMN "Essences".name; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "Essences".name IS 'Human readable name of essence';


--
-- TOC entry 2403 (class 0 OID 0)
-- Dependencies: 178
-- Name: COLUMN "Essences"."fileName"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "Essences"."fileName" IS 'File name in models path';


--
-- TOC entry 179 (class 1259 OID 42801)
-- Name: Entities_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE SEQUENCE "Entities_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Entities_id_seq" OWNER TO postgres;

--
-- TOC entry 2404 (class 0 OID 0)
-- Dependencies: 179
-- Name: Entities_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "Entities_id_seq" OWNED BY "Essences".id;


--
-- TOC entry 180 (class 1259 OID 42803)
-- Name: EssenceRoles; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "EssenceRoles" (
    id integer NOT NULL,
    "roleId" integer,
    "userId" integer,
    "essenceId" integer,
    "entityId" integer
);


ALTER TABLE "EssenceRoles" OWNER TO postgres;

--
-- TOC entry 181 (class 1259 OID 42806)
-- Name: EntityRoles_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE SEQUENCE "EntityRoles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "EntityRoles_id_seq" OWNER TO postgres;

--
-- TOC entry 2405 (class 0 OID 0)
-- Dependencies: 181
-- Name: EntityRoles_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "EntityRoles_id_seq" OWNED BY "EssenceRoles".id;


--
-- TOC entry 182 (class 1259 OID 42808)
-- Name: Surveys; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "Surveys" (
    id integer NOT NULL,
    title character varying,
    description text,
    created timestamp with time zone DEFAULT now() NOT NULL,
    "projectId" integer
);


ALTER TABLE "Surveys" OWNER TO postgres;

--
-- TOC entry 183 (class 1259 OID 42815)
-- Name: JSON_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE SEQUENCE "JSON_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "JSON_id_seq" OWNER TO postgres;

--
-- TOC entry 2406 (class 0 OID 0)
-- Dependencies: 183
-- Name: JSON_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "JSON_id_seq" OWNED BY "Surveys".id;


--
-- TOC entry 184 (class 1259 OID 42817)
-- Name: Languages; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "Languages" (
    id integer NOT NULL,
    name character varying(100),
    "nativeName" character varying(255),
    code character varying(3)
);


ALTER TABLE "Languages" OWNER TO postgres;

--
-- TOC entry 185 (class 1259 OID 42820)
-- Name: Languages_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE SEQUENCE "Languages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Languages_id_seq" OWNER TO postgres;

--
-- TOC entry 2407 (class 0 OID 0)
-- Dependencies: 185
-- Name: Languages_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "Languages_id_seq" OWNED BY "Languages".id;


--
-- TOC entry 186 (class 1259 OID 42822)
-- Name: Organizations; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "Organizations" (
    id integer NOT NULL,
    name character varying(100),
    address character varying(200),
    "adminUserId" integer,
    url character varying(200),
    "enforceApiSecurity" smallint,
    "isActive" boolean
);


ALTER TABLE "Organizations" OWNER TO postgres;

--
-- TOC entry 187 (class 1259 OID 42828)
-- Name: Organizations_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE SEQUENCE "Organizations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Organizations_id_seq" OWNER TO postgres;

--
-- TOC entry 2408 (class 0 OID 0)
-- Dependencies: 187
-- Name: Organizations_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "Organizations_id_seq" OWNED BY "Organizations".id;


--
-- TOC entry 188 (class 1259 OID 42830)
-- Name: ProductUOA; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "ProductUOA" (
    "productId" integer NOT NULL,
    "UOAid" integer NOT NULL
);


ALTER TABLE "ProductUOA" OWNER TO postgres;

--
-- TOC entry 189 (class 1259 OID 42833)
-- Name: Products; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "Products" (
    id integer NOT NULL,
    title character varying(100),
    description text,
    "originalLangId" integer,
    "projectId" integer,
    "surveyId" integer
);


ALTER TABLE "Products" OWNER TO postgres;

--
-- TOC entry 190 (class 1259 OID 42839)
-- Name: Products_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE SEQUENCE "Products_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Products_id_seq" OWNER TO postgres;

--
-- TOC entry 2409 (class 0 OID 0)
-- Dependencies: 190
-- Name: Products_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "Products_id_seq" OWNED BY "Products".id;


--
-- TOC entry 191 (class 1259 OID 42841)
-- Name: Projects; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "Projects" (
    id integer NOT NULL,
    "organizationId" integer,
    "codeName" character varying(100),
    description text,
    created timestamp(0) with time zone DEFAULT now() NOT NULL,
    "matrixId" integer,
    "startTime" timestamp with time zone,
    status smallint,
    "adminUserId" integer,
    "closeTime" timestamp with time zone
);


ALTER TABLE "Projects" OWNER TO postgres;

--
-- TOC entry 192 (class 1259 OID 42848)
-- Name: Projects_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE SEQUENCE "Projects_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Projects_id_seq" OWNER TO postgres;

--
-- TOC entry 2410 (class 0 OID 0)
-- Dependencies: 192
-- Name: Projects_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "Projects_id_seq" OWNED BY "Projects".id;


--
-- TOC entry 193 (class 1259 OID 42850)
-- Name: Rights; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "Rights" (
    id integer NOT NULL,
    action character varying(80) NOT NULL,
    description text,
    "essenceId" integer
);


ALTER TABLE "Rights" OWNER TO postgres;

--
-- TOC entry 194 (class 1259 OID 42856)
-- Name: Rights_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE SEQUENCE "Rights_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Rights_id_seq" OWNER TO postgres;

--
-- TOC entry 2411 (class 0 OID 0)
-- Dependencies: 194
-- Name: Rights_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "Rights_id_seq" OWNED BY "Rights".id;


--
-- TOC entry 195 (class 1259 OID 42858)
-- Name: role_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE SEQUENCE role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE role_id_seq OWNER TO postgres;

--
-- TOC entry 196 (class 1259 OID 42860)
-- Name: Roles; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "Roles" (
    id integer DEFAULT nextval('role_id_seq'::regclass) NOT NULL,
    name character varying(20) NOT NULL,
    "isSystem" boolean DEFAULT false NOT NULL
);


ALTER TABLE "Roles" OWNER TO postgres;

--
-- TOC entry 197 (class 1259 OID 42865)
-- Name: RolesRights; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "RolesRights" (
    "roleID" bigint NOT NULL,
    "rightID" bigint NOT NULL
);


ALTER TABLE "RolesRights" OWNER TO postgres;

--
-- TOC entry 198 (class 1259 OID 42868)
-- Name: SurveyAnswerVersions; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "SurveyAnswerVersions" (
    value character varying,
    "optionId" integer,
    created timestamp with time zone DEFAULT now() NOT NULL,
    "userId" integer,
    comment character varying,
    id integer NOT NULL
);


ALTER TABLE "SurveyAnswerVersions" OWNER TO postgres;

--
-- TOC entry 199 (class 1259 OID 42875)
-- Name: SurveyAnswerVersions_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE SEQUENCE "SurveyAnswerVersions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "SurveyAnswerVersions_id_seq" OWNER TO postgres;

--
-- TOC entry 2412 (class 0 OID 0)
-- Dependencies: 199
-- Name: SurveyAnswerVersions_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "SurveyAnswerVersions_id_seq" OWNED BY "SurveyAnswerVersions".id;


--
-- TOC entry 200 (class 1259 OID 42877)
-- Name: SurveyAnswers; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "SurveyAnswers" (
    id integer NOT NULL,
    "questionId" integer,
    "userId" integer,
    value text,
    created timestamp with time zone DEFAULT now() NOT NULL,
    "optionId" integer,
    "productId" integer,
    "UOAid" integer,
    "wfStepId" integer,
    version integer
);


ALTER TABLE "SurveyAnswers" OWNER TO postgres;

--
-- TOC entry 201 (class 1259 OID 42884)
-- Name: SurveyAnswers_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE SEQUENCE "SurveyAnswers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "SurveyAnswers_id_seq" OWNER TO postgres;

--
-- TOC entry 2413 (class 0 OID 0)
-- Dependencies: 201
-- Name: SurveyAnswers_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "SurveyAnswers_id_seq" OWNED BY "SurveyAnswers".id;


--
-- TOC entry 202 (class 1259 OID 42886)
-- Name: SurveyQuestionOptions; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "SurveyQuestionOptions" (
    id integer NOT NULL,
    "questionId" integer,
    value character varying
);


ALTER TABLE "SurveyQuestionOptions" OWNER TO postgres;

--
-- TOC entry 203 (class 1259 OID 42892)
-- Name: SurveyQuestions; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "SurveyQuestions" (
    id integer NOT NULL,
    "surveyId" integer,
    type smallint,
    label character varying,
    "isRequired" boolean DEFAULT false NOT NULL,
    "position" integer
);


ALTER TABLE "SurveyQuestions" OWNER TO postgres;

--
-- TOC entry 204 (class 1259 OID 42899)
-- Name: SurveyQuestions_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE SEQUENCE "SurveyQuestions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "SurveyQuestions_id_seq" OWNER TO postgres;

--
-- TOC entry 2414 (class 0 OID 0)
-- Dependencies: 204
-- Name: SurveyQuestions_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "SurveyQuestions_id_seq" OWNED BY "SurveyQuestions".id;


--
-- TOC entry 205 (class 1259 OID 42901)
-- Name: Tasks; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "Tasks" (
    id integer NOT NULL,
    title character varying,
    description text,
    "uoaId" integer NOT NULL,
    "stepId" integer NOT NULL,
    "entityTypeRoleId" integer NOT NULL,
    created timestamp with time zone DEFAULT now() NOT NULL,
    "productId" integer NOT NULL,
    "startDate" timestamp with time zone,
    "endDate" timestamp with time zone,
    "accessToResponses" boolean DEFAULT false NOT NULL,
    "accessToDiscussions" boolean DEFAULT false NOT NULL,
    "writeToAnswers" boolean DEFAULT false NOT NULL
);


ALTER TABLE "Tasks" OWNER TO postgres;

--
-- TOC entry 2415 (class 0 OID 0)
-- Dependencies: 205
-- Name: COLUMN "Tasks"."entityTypeRoleId"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "Tasks"."entityTypeRoleId" IS 'table EssenceRoles';


--
-- TOC entry 206 (class 1259 OID 42911)
-- Name: Tasks_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE SEQUENCE "Tasks_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Tasks_id_seq" OWNER TO postgres;

--
-- TOC entry 2416 (class 0 OID 0)
-- Dependencies: 206
-- Name: Tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "Tasks_id_seq" OWNED BY "Tasks".id;


--
-- TOC entry 207 (class 1259 OID 42913)
-- Name: Token; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "Token" (
    "userID" integer NOT NULL,
    body character varying(200) NOT NULL,
    "issuedAt" timestamp without time zone DEFAULT ('now'::text)::timestamp without time zone NOT NULL
);


ALTER TABLE "Token" OWNER TO postgres;

--
-- TOC entry 208 (class 1259 OID 42917)
-- Name: Translations; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
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
-- TOC entry 209 (class 1259 OID 42923)
-- Name: UnitOfAnalysis_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE SEQUENCE "UnitOfAnalysis_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysis_id_seq" OWNER TO postgres;

--
-- TOC entry 210 (class 1259 OID 42925)
-- Name: UnitOfAnalysis; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
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
    "createTime" timestamp(6) without time zone NOT NULL,
    "deleteTime" timestamp(6) without time zone,
    "langId" smallint DEFAULT 1 NOT NULL
);


ALTER TABLE "UnitOfAnalysis" OWNER TO postgres;

--
-- TOC entry 2417 (class 0 OID 0)
-- Dependencies: 210
-- Name: COLUMN "UnitOfAnalysis"."gadmId0"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId0" IS 'ID0 for use with GADM shapefile';


--
-- TOC entry 2418 (class 0 OID 0)
-- Dependencies: 210
-- Name: COLUMN "UnitOfAnalysis"."gadmId1"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId1" IS 'ID1 for use with GADM shapefile';


--
-- TOC entry 2419 (class 0 OID 0)
-- Dependencies: 210
-- Name: COLUMN "UnitOfAnalysis"."gadmId2"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId2" IS 'ID2 for use with GADM shapefile';


--
-- TOC entry 2420 (class 0 OID 0)
-- Dependencies: 210
-- Name: COLUMN "UnitOfAnalysis"."gadmId3"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId3" IS 'ID3 for use with GADM shapefile';


--
-- TOC entry 2421 (class 0 OID 0)
-- Dependencies: 210
-- Name: COLUMN "UnitOfAnalysis"."gadmObjectId"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmObjectId" IS 'OBJECTID for use with GADM shapefile (only Global Shapefile)';


--
-- TOC entry 2422 (class 0 OID 0)
-- Dependencies: 210
-- Name: COLUMN "UnitOfAnalysis"."ISO"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."ISO" IS 'only for Country level Unit Of Analysis';


--
-- TOC entry 2423 (class 0 OID 0)
-- Dependencies: 210
-- Name: COLUMN "UnitOfAnalysis"."ISO2"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."ISO2" IS 'only for Country level Unit Of Analysis';


--
-- TOC entry 2424 (class 0 OID 0)
-- Dependencies: 210
-- Name: COLUMN "UnitOfAnalysis"."nameISO"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."nameISO" IS 'only for Country level Unit Of Analysis';


--
-- TOC entry 2425 (class 0 OID 0)
-- Dependencies: 210
-- Name: COLUMN "UnitOfAnalysis".name; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis".name IS 'Multilanguage';


--
-- TOC entry 2426 (class 0 OID 0)
-- Dependencies: 210
-- Name: COLUMN "UnitOfAnalysis".description; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis".description IS 'Multilanguage';


--
-- TOC entry 2427 (class 0 OID 0)
-- Dependencies: 210
-- Name: COLUMN "UnitOfAnalysis"."shortName"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."shortName" IS 'Multilanguage';


--
-- TOC entry 2428 (class 0 OID 0)
-- Dependencies: 210
-- Name: COLUMN "UnitOfAnalysis"."HASC"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."HASC" IS '(example RU.AD.OK)';


--
-- TOC entry 2429 (class 0 OID 0)
-- Dependencies: 210
-- Name: COLUMN "UnitOfAnalysis"."unitOfAnalysisType"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."unitOfAnalysisType" IS 'reference to table UnitOfAnalysisType';


--
-- TOC entry 2430 (class 0 OID 0)
-- Dependencies: 210
-- Name: COLUMN "UnitOfAnalysis"."parentId"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."parentId" IS 'Link to Parent Unit of Analysis if exist';


--
-- TOC entry 2431 (class 0 OID 0)
-- Dependencies: 210
-- Name: COLUMN "UnitOfAnalysis"."creatorId"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."creatorId" IS 'Creator Id (User Id)';


--
-- TOC entry 2432 (class 0 OID 0)
-- Dependencies: 210
-- Name: COLUMN "UnitOfAnalysis"."ownerId"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."ownerId" IS 'Owner Id (User Id)';


--
-- TOC entry 2433 (class 0 OID 0)
-- Dependencies: 210
-- Name: COLUMN "UnitOfAnalysis".visibility; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis".visibility IS '1 = Public; 2 = private;';


--
-- TOC entry 2434 (class 0 OID 0)
-- Dependencies: 210
-- Name: COLUMN "UnitOfAnalysis".status; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis".status IS '1 = active; 2 = inactive; 3 = deleted;';


--
-- TOC entry 211 (class 1259 OID 42935)
-- Name: UnitOfAnalysisClassType_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE SEQUENCE "UnitOfAnalysisClassType_id_seq"
    START WITH 9
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysisClassType_id_seq" OWNER TO postgres;

--
-- TOC entry 212 (class 1259 OID 42937)
-- Name: UnitOfAnalysisClassType; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "UnitOfAnalysisClassType" (
    id smallint DEFAULT nextval('"UnitOfAnalysisClassType_id_seq"'::regclass) NOT NULL,
    name character varying(45) NOT NULL,
    description character varying(255),
    "langId" smallint DEFAULT 1 NOT NULL
);


ALTER TABLE "UnitOfAnalysisClassType" OWNER TO postgres;

--
-- TOC entry 2435 (class 0 OID 0)
-- Dependencies: 212
-- Name: COLUMN "UnitOfAnalysisClassType".name; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysisClassType".name IS 'Classification Name (for example - World Bank classification) ';


--
-- TOC entry 2436 (class 0 OID 0)
-- Dependencies: 212
-- Name: COLUMN "UnitOfAnalysisClassType".description; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysisClassType".description IS 'Classification Name description';


--
-- TOC entry 213 (class 1259 OID 42942)
-- Name: UnitOfAnalysisTag; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "UnitOfAnalysisTag" (
    id smallint NOT NULL,
    name character varying(45) NOT NULL,
    description character varying(255),
    "langId" integer DEFAULT 1 NOT NULL,
    "classTypeId" smallint NOT NULL
);


ALTER TABLE "UnitOfAnalysisTag" OWNER TO postgres;

--
-- TOC entry 214 (class 1259 OID 42946)
-- Name: UnitOfAnalysisTagLink_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE SEQUENCE "UnitOfAnalysisTagLink_id_seq"
    START WITH 18
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysisTagLink_id_seq" OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 42948)
-- Name: UnitOfAnalysisTagLink; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "UnitOfAnalysisTagLink" (
    id integer DEFAULT nextval('"UnitOfAnalysisTagLink_id_seq"'::regclass) NOT NULL,
    "uoaId" integer NOT NULL,
    "uoaTagId" integer NOT NULL
);


ALTER TABLE "UnitOfAnalysisTagLink" OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 42952)
-- Name: UnitOfAnalysisTag_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE SEQUENCE "UnitOfAnalysisTag_id_seq"
    START WITH 9
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysisTag_id_seq" OWNER TO postgres;

--
-- TOC entry 2437 (class 0 OID 0)
-- Dependencies: 216
-- Name: UnitOfAnalysisTag_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "UnitOfAnalysisTag_id_seq" OWNED BY "UnitOfAnalysisTag".id;


--
-- TOC entry 217 (class 1259 OID 42954)
-- Name: UnitOfAnalysisType_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE SEQUENCE "UnitOfAnalysisType_id_seq"
    START WITH 9
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysisType_id_seq" OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 42956)
-- Name: UnitOfAnalysisType; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "UnitOfAnalysisType" (
    id smallint DEFAULT nextval('"UnitOfAnalysisType_id_seq"'::regclass) NOT NULL,
    name character varying(40) NOT NULL,
    description character varying(255),
    "langId" integer DEFAULT 1 NOT NULL
);


ALTER TABLE "UnitOfAnalysisType" OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 42961)
-- Name: UserRights; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "UserRights" (
    "userID" bigint NOT NULL,
    "rightID" bigint NOT NULL,
    "canDo" boolean
);


ALTER TABLE "UserRights" OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 42964)
-- Name: UserUOA; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "UserUOA" (
    "UserId" integer NOT NULL,
    "UOAid" integer NOT NULL
);


ALTER TABLE "UserUOA" OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 42967)
-- Name: user_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE SEQUENCE user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE user_id_seq OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 42969)
-- Name: Users; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "Users" (
    "roleID" integer NOT NULL,
    id integer DEFAULT nextval('user_id_seq'::regclass) NOT NULL,
    email character varying(80) NOT NULL,
    "firstName" character varying(80) NOT NULL,
    "lastName" character varying(80),
    password character varying(200) NOT NULL,
    mobile character varying(20),
    birthday date,
    "resetPasswordToken" character varying(100),
    "resetPasswordExpires" bigint,
    created timestamp with time zone DEFAULT now() NOT NULL,
    updated timestamp without time zone,
    "isActive" boolean,
    "activationToken" character varying(100),
    "organizationId" integer
);


ALTER TABLE "Users" OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 42977)
-- Name: WorkflowStepList; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "WorkflowStepList" (
    id integer NOT NULL,
    title character varying(100),
    description text
);


ALTER TABLE "WorkflowStepList" OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 42983)
-- Name: WorkflowStepList_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE SEQUENCE "WorkflowStepList_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "WorkflowStepList_id_seq" OWNER TO postgres;

--
-- TOC entry 2438 (class 0 OID 0)
-- Dependencies: 224
-- Name: WorkflowStepList_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "WorkflowStepList_id_seq" OWNED BY "WorkflowStepList".id;


--
-- TOC entry 225 (class 1259 OID 42985)
-- Name: WorkflowSteps; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "WorkflowSteps" (
    "workflowId" integer NOT NULL,
    "stepId" integer NOT NULL,
    id integer NOT NULL,
    "startDate" timestamp with time zone,
    "endDate" timestamp with time zone,
    "roleId" integer
);


ALTER TABLE "WorkflowSteps" OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 42988)
-- Name: WorkflowSteps_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE SEQUENCE "WorkflowSteps_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "WorkflowSteps_id_seq" OWNER TO postgres;

--
-- TOC entry 2439 (class 0 OID 0)
-- Dependencies: 226
-- Name: WorkflowSteps_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "WorkflowSteps_id_seq" OWNED BY "WorkflowSteps".id;


--
-- TOC entry 227 (class 1259 OID 42990)
-- Name: Workflows; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "Workflows" (
    id integer NOT NULL,
    name character varying(200),
    description text,
    created timestamp with time zone DEFAULT now() NOT NULL,
    "productId" integer
);


ALTER TABLE "Workflows" OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 42997)
-- Name: Workflows_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE SEQUENCE "Workflows_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Workflows_id_seq" OWNER TO postgres;

--
-- TOC entry 2440 (class 0 OID 0)
-- Dependencies: 228
-- Name: Workflows_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "Workflows_id_seq" OWNED BY "Workflows".id;


--
-- TOC entry 229 (class 1259 OID 42999)
-- Name: brand_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE SEQUENCE brand_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE brand_id_seq OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 43001)
-- Name: order_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE SEQUENCE order_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE order_id_seq OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 43003)
-- Name: surveyQuestionOptions_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE SEQUENCE "surveyQuestionOptions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "surveyQuestionOptions_id_seq" OWNER TO postgres;

--
-- TOC entry 2441 (class 0 OID 0)
-- Dependencies: 231
-- Name: surveyQuestionOptions_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "surveyQuestionOptions_id_seq" OWNED BY "SurveyQuestionOptions".id;


--
-- TOC entry 232 (class 1259 OID 43005)
-- Name: transport_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE SEQUENCE transport_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE transport_id_seq OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 43007)
-- Name: transportmodel_id_seq; Type: SEQUENCE; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE SEQUENCE transportmodel_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE transportmodel_id_seq OWNER TO postgres;

--
-- TOC entry 2103 (class 2604 OID 43009)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "AccessMatrices" ALTER COLUMN id SET DEFAULT nextval('"AccessMatix_id_seq"'::regclass);


--
-- TOC entry 2104 (class 2604 OID 43010)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "AccessPermissions" ALTER COLUMN id SET DEFAULT nextval('"AccessPermissions_id_seq"'::regclass);


--
-- TOC entry 2107 (class 2604 OID 43011)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "EssenceRoles" ALTER COLUMN id SET DEFAULT nextval('"EntityRoles_id_seq"'::regclass);


--
-- TOC entry 2106 (class 2604 OID 43012)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Essences" ALTER COLUMN id SET DEFAULT nextval('"Entities_id_seq"'::regclass);


--
-- TOC entry 2110 (class 2604 OID 43013)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Languages" ALTER COLUMN id SET DEFAULT nextval('"Languages_id_seq"'::regclass);


--
-- TOC entry 2111 (class 2604 OID 43014)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Organizations" ALTER COLUMN id SET DEFAULT nextval('"Organizations_id_seq"'::regclass);


--
-- TOC entry 2112 (class 2604 OID 43015)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Products" ALTER COLUMN id SET DEFAULT nextval('"Products_id_seq"'::regclass);


--
-- TOC entry 2114 (class 2604 OID 43016)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Projects" ALTER COLUMN id SET DEFAULT nextval('"Projects_id_seq"'::regclass);


--
-- TOC entry 2115 (class 2604 OID 43017)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Rights" ALTER COLUMN id SET DEFAULT nextval('"Rights_id_seq"'::regclass);


--
-- TOC entry 2119 (class 2604 OID 43018)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SurveyAnswerVersions" ALTER COLUMN id SET DEFAULT nextval('"SurveyAnswerVersions_id_seq"'::regclass);


--
-- TOC entry 2121 (class 2604 OID 43019)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SurveyAnswers" ALTER COLUMN id SET DEFAULT nextval('"SurveyAnswers_id_seq"'::regclass);


--
-- TOC entry 2122 (class 2604 OID 43020)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SurveyQuestionOptions" ALTER COLUMN id SET DEFAULT nextval('"surveyQuestionOptions_id_seq"'::regclass);


--
-- TOC entry 2124 (class 2604 OID 43021)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SurveyQuestions" ALTER COLUMN id SET DEFAULT nextval('"SurveyQuestions_id_seq"'::regclass);


--
-- TOC entry 2109 (class 2604 OID 43022)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Surveys" ALTER COLUMN id SET DEFAULT nextval('"JSON_id_seq"'::regclass);


--
-- TOC entry 2129 (class 2604 OID 43023)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Tasks" ALTER COLUMN id SET DEFAULT nextval('"Tasks_id_seq"'::regclass);


--
-- TOC entry 2138 (class 2604 OID 43024)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysisTag" ALTER COLUMN id SET DEFAULT nextval('"UnitOfAnalysisTag_id_seq"'::regclass);


--
-- TOC entry 2144 (class 2604 OID 43025)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "WorkflowStepList" ALTER COLUMN id SET DEFAULT nextval('"WorkflowStepList_id_seq"'::regclass);


--
-- TOC entry 2145 (class 2604 OID 43026)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "WorkflowSteps" ALTER COLUMN id SET DEFAULT nextval('"WorkflowSteps_id_seq"'::regclass);


--
-- TOC entry 2147 (class 2604 OID 43027)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Workflows" ALTER COLUMN id SET DEFAULT nextval('"Workflows_id_seq"'::regclass);


--
-- TOC entry 2149 (class 2606 OID 43029)
-- Name: AccessMatrix_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "AccessMatrices"
    ADD CONSTRAINT "AccessMatrix_pkey" PRIMARY KEY (id);


--
-- TOC entry 2151 (class 2606 OID 43031)
-- Name: AccessPermissions_accessMatrixId_roleId_rightId_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "AccessPermissions"
    ADD CONSTRAINT "AccessPermissions_accessMatrixId_roleId_rightId_key" UNIQUE ("matrixId", "roleId", "rightId");


--
-- TOC entry 2153 (class 2606 OID 43033)
-- Name: AccessPermissoins_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "AccessPermissions"
    ADD CONSTRAINT "AccessPermissoins_pkey" PRIMARY KEY (id);


--
-- TOC entry 2155 (class 2606 OID 43035)
-- Name: Countries_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Countries"
    ADD CONSTRAINT "Countries_pkey" PRIMARY KEY (id);


--
-- TOC entry 2163 (class 2606 OID 43037)
-- Name: EntityRoles_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "EssenceRoles"
    ADD CONSTRAINT "EntityRoles_pkey" PRIMARY KEY (id);


--
-- TOC entry 2157 (class 2606 OID 43039)
-- Name: Entity_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Entity_pkey" PRIMARY KEY (id);


--
-- TOC entry 2165 (class 2606 OID 43041)
-- Name: EssenceRoles_essenceId_entityId_userId_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "EssenceRoles"
    ADD CONSTRAINT "EssenceRoles_essenceId_entityId_userId_key" UNIQUE ("essenceId", "entityId", "userId");


--
-- TOC entry 2159 (class 2606 OID 43043)
-- Name: Essences_fileName_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_fileName_key" UNIQUE ("fileName");


--
-- TOC entry 2161 (class 2606 OID 43045)
-- Name: Essences_tableName_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_tableName_key" UNIQUE ("tableName");


--
-- TOC entry 2167 (class 2606 OID 43047)
-- Name: JSON_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Surveys"
    ADD CONSTRAINT "JSON_pkey" PRIMARY KEY (id);


--
-- TOC entry 2169 (class 2606 OID 43049)
-- Name: Languages_code_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Languages"
    ADD CONSTRAINT "Languages_code_key" UNIQUE (code);


--
-- TOC entry 2171 (class 2606 OID 43051)
-- Name: Languages_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Languages"
    ADD CONSTRAINT "Languages_pkey" PRIMARY KEY (id);


--
-- TOC entry 2173 (class 2606 OID 43053)
-- Name: Organizations_adminUserId_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_adminUserId_key" UNIQUE ("adminUserId");


--
-- TOC entry 2175 (class 2606 OID 43055)
-- Name: Organizations_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_pkey" PRIMARY KEY (id);


--
-- TOC entry 2177 (class 2606 OID 43057)
-- Name: ProductUOA_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_pkey" PRIMARY KEY ("productId", "UOAid");


--
-- TOC entry 2179 (class 2606 OID 43059)
-- Name: Product_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- TOC entry 2181 (class 2606 OID 43061)
-- Name: Projects_codeName_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_codeName_key" UNIQUE ("codeName");


--
-- TOC entry 2183 (class 2606 OID 43063)
-- Name: Projects_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_pkey" PRIMARY KEY (id);


--
-- TOC entry 2186 (class 2606 OID 43065)
-- Name: Rights_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Rights"
    ADD CONSTRAINT "Rights_pkey" PRIMARY KEY (id);


--
-- TOC entry 2193 (class 2606 OID 43067)
-- Name: SurveyAnswers_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_pkey" PRIMARY KEY (id);


--
-- TOC entry 2197 (class 2606 OID 43069)
-- Name: SurveyQuestions_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "SurveyQuestions"
    ADD CONSTRAINT "SurveyQuestions_pkey" PRIMARY KEY (id);


--
-- TOC entry 2199 (class 2606 OID 43071)
-- Name: Tasks_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_pkey" PRIMARY KEY (id);


--
-- TOC entry 2202 (class 2606 OID 43073)
-- Name: Translations_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_pkey" PRIMARY KEY ("essenceId", "entityId", field, "langId");


--
-- TOC entry 2206 (class 2606 OID 43075)
-- Name: UnitOfAnalysisClassType_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysisClassType"
    ADD CONSTRAINT "UnitOfAnalysisClassType_pkey" PRIMARY KEY (id);


--
-- TOC entry 2211 (class 2606 OID 43077)
-- Name: UnitOfAnalysisTagLink_uoaId_uoaTagId_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_uoaId_uoaTagId_key" UNIQUE ("uoaId", "uoaTagId");


--
-- TOC entry 2208 (class 2606 OID 43079)
-- Name: UnitOfAnalysisTag_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_pkey" PRIMARY KEY (id);


--
-- TOC entry 2214 (class 2606 OID 43081)
-- Name: UnitOfAnalysisType_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysisType"
    ADD CONSTRAINT "UnitOfAnalysisType_pkey" PRIMARY KEY (id);


--
-- TOC entry 2204 (class 2606 OID 43083)
-- Name: UnitOfAnalysis_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_pkey" PRIMARY KEY (id);


--
-- TOC entry 2218 (class 2606 OID 43085)
-- Name: UserUOA_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "UserUOA"
    ADD CONSTRAINT "UserUOA_pkey" PRIMARY KEY ("UserId", "UOAid");


--
-- TOC entry 2220 (class 2606 OID 43087)
-- Name: Users_email_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- TOC entry 2225 (class 2606 OID 43089)
-- Name: WorkflowStepList_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "WorkflowStepList"
    ADD CONSTRAINT "WorkflowStepList_pkey" PRIMARY KEY (id);


--
-- TOC entry 2227 (class 2606 OID 43091)
-- Name: WorkflowSteps_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "WorkflowSteps"
    ADD CONSTRAINT "WorkflowSteps_pkey" PRIMARY KEY (id);


--
-- TOC entry 2229 (class 2606 OID 43093)
-- Name: Workflows_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Workflows"
    ADD CONSTRAINT "Workflows_pkey" PRIMARY KEY (id);


--
-- TOC entry 2231 (class 2606 OID 43095)
-- Name: Workflows_productId_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Workflows"
    ADD CONSTRAINT "Workflows_productId_key" UNIQUE ("productId");


--
-- TOC entry 2188 (class 2606 OID 43097)
-- Name: id; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Roles"
    ADD CONSTRAINT id PRIMARY KEY (id);


--
-- TOC entry 2191 (class 2606 OID 43099)
-- Name: roleRight_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "roleRight_pkey" PRIMARY KEY ("roleID", "rightID");


--
-- TOC entry 2195 (class 2606 OID 43101)
-- Name: surveyQuestionOptions_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "SurveyQuestionOptions"
    ADD CONSTRAINT "surveyQuestionOptions_pkey" PRIMARY KEY (id);


--
-- TOC entry 2223 (class 2606 OID 43103)
-- Name: userID; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "userID" PRIMARY KEY (id);


--
-- TOC entry 2216 (class 2606 OID 43105)
-- Name: userRights_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "UserRights"
    ADD CONSTRAINT "userRights_pkey" PRIMARY KEY ("userID", "rightID");


--
-- TOC entry 2184 (class 1259 OID 43106)
-- Name: Rights_action_idx; Type: INDEX; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE UNIQUE INDEX "Rights_action_idx" ON "Rights" USING btree (action);


--
-- TOC entry 2200 (class 1259 OID 43107)
-- Name: Token_body_idx; Type: INDEX; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE UNIQUE INDEX "Token_body_idx" ON "Token" USING btree (body);


--
-- TOC entry 2209 (class 1259 OID 43108)
-- Name: UnitOfAnalysisTagLink_uoaId_idx; Type: INDEX; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE INDEX "UnitOfAnalysisTagLink_uoaId_idx" ON "UnitOfAnalysisTagLink" USING btree ("uoaId");


--
-- TOC entry 2212 (class 1259 OID 43109)
-- Name: UnitOfAnalysisTagLink_uoaTagId_idx; Type: INDEX; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE INDEX "UnitOfAnalysisTagLink_uoaTagId_idx" ON "UnitOfAnalysisTagLink" USING btree ("uoaTagId");


--
-- TOC entry 2221 (class 1259 OID 43110)
-- Name: fki_roleID; Type: INDEX; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE INDEX "fki_roleID" ON "Users" USING btree ("roleID");


--
-- TOC entry 2189 (class 1259 OID 43111)
-- Name: fki_rolesrights_rightID; Type: INDEX; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE INDEX "fki_rolesrights_rightID" ON "RolesRights" USING btree ("rightID");


--
-- TOC entry 2281 (class 2620 OID 43112)
-- Name: tr_delete_token; Type: TRIGGER; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE TRIGGER tr_delete_token BEFORE INSERT ON "Token" FOR EACH ROW EXECUTE PROCEDURE twc_delete_old_token();


--
-- TOC entry 2282 (class 2620 OID 43113)
-- Name: users_before_update; Type: TRIGGER; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE TRIGGER users_before_update BEFORE UPDATE ON "Users" FOR EACH ROW EXECUTE PROCEDURE users_before_update();


--
-- TOC entry 2236 (class 2606 OID 43114)
-- Name: Organizations_adminUserId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "Users"(id);


--
-- TOC entry 2237 (class 2606 OID 43119)
-- Name: ProductUOA_UOAid_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_UOAid_fkey" FOREIGN KEY ("UOAid") REFERENCES "UnitOfAnalysis"(id);


--
-- TOC entry 2238 (class 2606 OID 43124)
-- Name: ProductUOA_productId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- TOC entry 2239 (class 2606 OID 43129)
-- Name: Products_originalLangId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_originalLangId_fkey" FOREIGN KEY ("originalLangId") REFERENCES "Languages"(id);


--
-- TOC entry 2240 (class 2606 OID 43134)
-- Name: Products_projectId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Projects"(id);


--
-- TOC entry 2241 (class 2606 OID 43139)
-- Name: Products_surveyId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Surveys"(id);


--
-- TOC entry 2242 (class 2606 OID 43144)
-- Name: Projects_accessMatrixId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_accessMatrixId_fkey" FOREIGN KEY ("matrixId") REFERENCES "AccessMatrices"(id);


--
-- TOC entry 2243 (class 2606 OID 43149)
-- Name: Projects_adminUserId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "Users"(id);


--
-- TOC entry 2244 (class 2606 OID 43154)
-- Name: Projects_organizationId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- TOC entry 2245 (class 2606 OID 43159)
-- Name: Rights_essence_id_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Rights"
    ADD CONSTRAINT "Rights_essence_id_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- TOC entry 2246 (class 2606 OID 43164)
-- Name: RolesRights_roleID_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "RolesRights_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "Roles"(id);


--
-- TOC entry 2248 (class 2606 OID 43169)
-- Name: SurveyAnswersVersions_optionId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SurveyAnswerVersions"
    ADD CONSTRAINT "SurveyAnswersVersions_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "SurveyQuestionOptions"(id);


--
-- TOC entry 2249 (class 2606 OID 43174)
-- Name: SurveyAnswersVersions_userId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SurveyAnswerVersions"
    ADD CONSTRAINT "SurveyAnswersVersions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"(id);


--
-- TOC entry 2250 (class 2606 OID 43179)
-- Name: SurveyAnswers_optionId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "SurveyQuestionOptions"(id);


--
-- TOC entry 2251 (class 2606 OID 43184)
-- Name: SurveyAnswers_productId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- TOC entry 2252 (class 2606 OID 43189)
-- Name: SurveyAnswers_questionId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions"(id);


--
-- TOC entry 2253 (class 2606 OID 43194)
-- Name: SurveyAnswers_userId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"(id);


--
-- TOC entry 2254 (class 2606 OID 43199)
-- Name: SurveyAnswers_wfStepId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_wfStepId_fkey" FOREIGN KEY ("wfStepId") REFERENCES "WorkflowSteps"(id);


--
-- TOC entry 2256 (class 2606 OID 43204)
-- Name: SurveyQuestions_surveyId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SurveyQuestions"
    ADD CONSTRAINT "SurveyQuestions_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Surveys"(id);


--
-- TOC entry 2235 (class 2606 OID 43209)
-- Name: Surveys_projectId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Surveys"
    ADD CONSTRAINT "Surveys_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Projects"(id);


--
-- TOC entry 2257 (class 2606 OID 43214)
-- Name: Tasks_entityTypeRoleId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_entityTypeRoleId_fkey" FOREIGN KEY ("entityTypeRoleId") REFERENCES "EssenceRoles"(id);


--
-- TOC entry 2258 (class 2606 OID 43219)
-- Name: Tasks_productId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- TOC entry 2259 (class 2606 OID 43224)
-- Name: Tasks_stepId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowSteps"(id);


--
-- TOC entry 2260 (class 2606 OID 43229)
-- Name: Tasks_uoaId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_uoaId_fkey" FOREIGN KEY ("uoaId") REFERENCES "UnitOfAnalysis"(id);


--
-- TOC entry 2261 (class 2606 OID 43234)
-- Name: Translations_essence_id_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_essence_id_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- TOC entry 2262 (class 2606 OID 43239)
-- Name: Translations_lang_id_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_lang_id_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 2267 (class 2606 OID 43244)
-- Name: UnitOfAnalysisClassType_langId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysisClassType"
    ADD CONSTRAINT "UnitOfAnalysisClassType_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 2270 (class 2606 OID 43249)
-- Name: UnitOfAnalysisTagLink_uoaId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_uoaId_fkey" FOREIGN KEY ("uoaId") REFERENCES "UnitOfAnalysis"(id);


--
-- TOC entry 2271 (class 2606 OID 43254)
-- Name: UnitOfAnalysisTagLink_uoaTagId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_uoaTagId_fkey" FOREIGN KEY ("uoaTagId") REFERENCES "UnitOfAnalysisTag"(id);


--
-- TOC entry 2268 (class 2606 OID 43259)
-- Name: UnitOfAnalysisTag_classTypeId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_classTypeId_fkey" FOREIGN KEY ("classTypeId") REFERENCES "UnitOfAnalysisClassType"(id);


--
-- TOC entry 2269 (class 2606 OID 43264)
-- Name: UnitOfAnalysisTag_langId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 2272 (class 2606 OID 43269)
-- Name: UnitOfAnalysisType_langId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysisType"
    ADD CONSTRAINT "UnitOfAnalysisType_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 2263 (class 2606 OID 43274)
-- Name: UnitOfAnalysis_creatorId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Users"(id);


--
-- TOC entry 2264 (class 2606 OID 43279)
-- Name: UnitOfAnalysis_langId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 2265 (class 2606 OID 43284)
-- Name: UnitOfAnalysis_ownerId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Users"(id);


--
-- TOC entry 2266 (class 2606 OID 43289)
-- Name: UnitOfAnalysis_unitOfAnalysisType_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_unitOfAnalysisType_fkey" FOREIGN KEY ("unitOfAnalysisType") REFERENCES "UnitOfAnalysisType"(id);


--
-- TOC entry 2273 (class 2606 OID 43294)
-- Name: UserUOA_UOAid_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "UserUOA"
    ADD CONSTRAINT "UserUOA_UOAid_fkey" FOREIGN KEY ("UOAid") REFERENCES "UnitOfAnalysis"(id);


--
-- TOC entry 2274 (class 2606 OID 43299)
-- Name: UserUOA_UserId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "UserUOA"
    ADD CONSTRAINT "UserUOA_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"(id);


--
-- TOC entry 2275 (class 2606 OID 43304)
-- Name: Users_organizationId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- TOC entry 2276 (class 2606 OID 43309)
-- Name: Users_roleID_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "Roles"(id);


--
-- TOC entry 2277 (class 2606 OID 43314)
-- Name: WorkflowSteps_roleId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "WorkflowSteps"
    ADD CONSTRAINT "WorkflowSteps_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Roles"(id);


--
-- TOC entry 2278 (class 2606 OID 43319)
-- Name: WorkflowSteps_stepId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "WorkflowSteps"
    ADD CONSTRAINT "WorkflowSteps_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowStepList"(id);


--
-- TOC entry 2279 (class 2606 OID 43324)
-- Name: WorkflowSteps_worflowId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "WorkflowSteps"
    ADD CONSTRAINT "WorkflowSteps_worflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflows"(id);


--
-- TOC entry 2280 (class 2606 OID 43329)
-- Name: Workflows_productId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Workflows"
    ADD CONSTRAINT "Workflows_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- TOC entry 2232 (class 2606 OID 43334)
-- Name: essence_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "EssenceRoles"
    ADD CONSTRAINT essence_fkey FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- TOC entry 2233 (class 2606 OID 43339)
-- Name: role_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "EssenceRoles"
    ADD CONSTRAINT role_fkey FOREIGN KEY ("roleId") REFERENCES "Roles"(id);


--
-- TOC entry 2247 (class 2606 OID 43344)
-- Name: rolesrights_rightID; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "rolesrights_rightID" FOREIGN KEY ("rightID") REFERENCES "Rights"(id);


--
-- TOC entry 2255 (class 2606 OID 43349)
-- Name: surveyQuestionOptions_questionId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SurveyQuestionOptions"
    ADD CONSTRAINT "surveyQuestionOptions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions"(id);


--
-- TOC entry 2234 (class 2606 OID 43354)
-- Name: user_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "EssenceRoles"
    ADD CONSTRAINT user_fkey FOREIGN KEY ("userId") REFERENCES "Users"(id);


--
-- TOC entry 2398 (class 0 OID 0)
-- Dependencies: 6
-- Name: CLIENT_SCHEMA; Type: ACL; Schema: -; Owner: postgres
--

REVOKE ALL ON SCHEMA CLIENT_SCHEMA FROM PUBLIC;
REVOKE ALL ON SCHEMA CLIENT_SCHEMA FROM postgres;
GRANT ALL ON SCHEMA CLIENT_SCHEMA TO postgres;
GRANT ALL ON SCHEMA CLIENT_SCHEMA TO PUBLIC;


-- Completed on 2016-02-11 20:10:53 UTC

--
-- PostgreSQL database dump complete
--

