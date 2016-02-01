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
-- TOC entry 232 (class 3079 OID 11861)
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- TOC entry 2381 (class 0 OID 0)
-- Dependencies: 232
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';

CREATE SCHEMA IF NOT EXISTS CLIENT_SCHEMA;

SET search_path = CLIENT_SCHEMA, pg_catalog;


--
-- TOC entry 591 (class 1247 OID 28620)
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
-- TOC entry 594 (class 1247 OID 28636)
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
-- TOC entry 597 (class 1247 OID 28648)
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
-- TOC entry 600 (class 1247 OID 28664)
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
-- TOC entry 233 (class 1255 OID 28677)
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
-- TOC entry 246 (class 1255 OID 28678)
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
-- TOC entry 247 (class 1255 OID 28679)
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
-- TOC entry 248 (class 1255 OID 28680)
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
-- TOC entry 249 (class 1255 OID 28681)
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
-- TOC entry 250 (class 1255 OID 28682)
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
-- TOC entry 251 (class 1255 OID 28683)
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
-- TOC entry 172 (class 1259 OID 28684)
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
-- TOC entry 173 (class 1259 OID 28690)
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
-- TOC entry 2382 (class 0 OID 0)
-- Dependencies: 173
-- Name: AccessMatix_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "AccessMatix_id_seq" OWNED BY "AccessMatrices".id;


--
-- TOC entry 174 (class 1259 OID 28692)
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
-- TOC entry 175 (class 1259 OID 28695)
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
-- TOC entry 2383 (class 0 OID 0)
-- Dependencies: 175
-- Name: AccessPermissions_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "AccessPermissions_id_seq" OWNED BY "AccessPermissions".id;


--
-- TOC entry 176 (class 1259 OID 28697)
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
-- TOC entry 177 (class 1259 OID 28699)
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
-- TOC entry 178 (class 1259 OID 28703)
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
-- TOC entry 2384 (class 0 OID 0)
-- Dependencies: 178
-- Name: COLUMN "Essences".name; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "Essences".name IS 'Human readable name of essence';


--
-- TOC entry 2385 (class 0 OID 0)
-- Dependencies: 178
-- Name: COLUMN "Essences"."fileName"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "Essences"."fileName" IS 'File name in models path';


--
-- TOC entry 179 (class 1259 OID 28709)
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
-- TOC entry 2386 (class 0 OID 0)
-- Dependencies: 179
-- Name: Entities_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "Entities_id_seq" OWNED BY "Essences".id;


--
-- TOC entry 180 (class 1259 OID 28711)
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
-- TOC entry 181 (class 1259 OID 28714)
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
-- TOC entry 2387 (class 0 OID 0)
-- Dependencies: 181
-- Name: EntityRoles_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "EntityRoles_id_seq" OWNED BY "EssenceRoles".id;


--
-- TOC entry 182 (class 1259 OID 28716)
-- Name: Surveys; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "Surveys" (
    id integer NOT NULL,
    title character varying,
    description text,
    "productId" integer
);


ALTER TABLE "Surveys" OWNER TO postgres;

--
-- TOC entry 183 (class 1259 OID 28722)
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
-- TOC entry 2388 (class 0 OID 0)
-- Dependencies: 183
-- Name: JSON_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "JSON_id_seq" OWNED BY "Surveys".id;


--
-- TOC entry 184 (class 1259 OID 28724)
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
-- TOC entry 185 (class 1259 OID 28727)
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
-- TOC entry 2389 (class 0 OID 0)
-- Dependencies: 185
-- Name: Languages_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "Languages_id_seq" OWNED BY "Languages".id;


--
-- TOC entry 186 (class 1259 OID 28729)
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
-- TOC entry 187 (class 1259 OID 28735)
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
-- TOC entry 2390 (class 0 OID 0)
-- Dependencies: 187
-- Name: Organizations_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "Organizations_id_seq" OWNED BY "Organizations".id;


--
-- TOC entry 188 (class 1259 OID 28737)
-- Name: ProductUOA; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "ProductUOA" (
    "productId" integer NOT NULL,
    "UOAid" integer NOT NULL
);


ALTER TABLE "ProductUOA" OWNER TO postgres;

--
-- TOC entry 189 (class 1259 OID 28740)
-- Name: Products; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "Products" (
    id integer NOT NULL,
    title character varying(100),
    description text,
    "matrixId" integer,
    "originalLangId" integer,
    "projectId" integer
);


ALTER TABLE "Products" OWNER TO postgres;

--
-- TOC entry 190 (class 1259 OID 28746)
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
-- TOC entry 2391 (class 0 OID 0)
-- Dependencies: 190
-- Name: Products_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "Products_id_seq" OWNED BY "Products".id;


--
-- TOC entry 191 (class 1259 OID 28748)
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
-- TOC entry 192 (class 1259 OID 28755)
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
-- TOC entry 2392 (class 0 OID 0)
-- Dependencies: 192
-- Name: Projects_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "Projects_id_seq" OWNED BY "Projects".id;


--
-- TOC entry 193 (class 1259 OID 28757)
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
-- TOC entry 194 (class 1259 OID 28763)
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
-- TOC entry 2393 (class 0 OID 0)
-- Dependencies: 194
-- Name: Rights_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "Rights_id_seq" OWNED BY "Rights".id;


--
-- TOC entry 195 (class 1259 OID 28765)
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
-- TOC entry 196 (class 1259 OID 28767)
-- Name: Roles; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "Roles" (
    id integer DEFAULT nextval('role_id_seq'::regclass) NOT NULL,
    name character varying(20) NOT NULL,
    "isSystem" boolean DEFAULT false NOT NULL
);


ALTER TABLE "Roles" OWNER TO postgres;

--
-- TOC entry 197 (class 1259 OID 28772)
-- Name: RolesRights; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "RolesRights" (
    "roleID" bigint NOT NULL,
    "rightID" bigint NOT NULL
);


ALTER TABLE "RolesRights" OWNER TO postgres;

--
-- TOC entry 198 (class 1259 OID 28775)
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
-- TOC entry 199 (class 1259 OID 28782)
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
-- TOC entry 2394 (class 0 OID 0)
-- Dependencies: 199
-- Name: SurveyAnswerVersions_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "SurveyAnswerVersions_id_seq" OWNED BY "SurveyAnswerVersions".id;


--
-- TOC entry 200 (class 1259 OID 28784)
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
    "uoaId" integer,
    "wfStepId" integer
);


ALTER TABLE "SurveyAnswers" OWNER TO postgres;

--
-- TOC entry 201 (class 1259 OID 28791)
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
-- TOC entry 2395 (class 0 OID 0)
-- Dependencies: 201
-- Name: SurveyAnswers_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "SurveyAnswers_id_seq" OWNED BY "SurveyAnswers".id;


--
-- TOC entry 202 (class 1259 OID 28793)
-- Name: SurveyQuestionOptions; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "SurveyQuestionOptions" (
    id integer NOT NULL,
    "questionId" integer,
    value character varying
);


ALTER TABLE "SurveyQuestionOptions" OWNER TO postgres;

--
-- TOC entry 203 (class 1259 OID 28799)
-- Name: SurveyQuestions; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "SurveyQuestions" (
    id integer NOT NULL,
    "surveyId" integer,
    type smallint,
    label character varying,
    "isRequired" boolean DEFAULT false NOT NULL
);


ALTER TABLE "SurveyQuestions" OWNER TO postgres;

--
-- TOC entry 204 (class 1259 OID 28806)
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
-- TOC entry 2396 (class 0 OID 0)
-- Dependencies: 204
-- Name: SurveyQuestions_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "SurveyQuestions_id_seq" OWNED BY "SurveyQuestions".id;


--
-- TOC entry 205 (class 1259 OID 28808)
-- Name: Token; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "Token" (
    "userID" integer NOT NULL,
    body character varying(200) NOT NULL,
    "issuedAt" timestamp without time zone DEFAULT ('now'::text)::timestamp without time zone NOT NULL
);


ALTER TABLE "Token" OWNER TO postgres;

--
-- TOC entry 206 (class 1259 OID 28812)
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
-- TOC entry 207 (class 1259 OID 28818)
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
-- TOC entry 208 (class 1259 OID 28820)
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
-- TOC entry 2397 (class 0 OID 0)
-- Dependencies: 208
-- Name: COLUMN "UnitOfAnalysis"."gadmId0"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId0" IS 'ID0 for use with GADM shapefile';


--
-- TOC entry 2398 (class 0 OID 0)
-- Dependencies: 208
-- Name: COLUMN "UnitOfAnalysis"."gadmId1"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId1" IS 'ID1 for use with GADM shapefile';


--
-- TOC entry 2399 (class 0 OID 0)
-- Dependencies: 208
-- Name: COLUMN "UnitOfAnalysis"."gadmId2"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId2" IS 'ID2 for use with GADM shapefile';


--
-- TOC entry 2400 (class 0 OID 0)
-- Dependencies: 208
-- Name: COLUMN "UnitOfAnalysis"."gadmId3"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId3" IS 'ID3 for use with GADM shapefile';


--
-- TOC entry 2401 (class 0 OID 0)
-- Dependencies: 208
-- Name: COLUMN "UnitOfAnalysis"."gadmObjectId"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmObjectId" IS 'OBJECTID for use with GADM shapefile (only Global Shapefile)';


--
-- TOC entry 2402 (class 0 OID 0)
-- Dependencies: 208
-- Name: COLUMN "UnitOfAnalysis"."ISO"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."ISO" IS 'only for Country level Unit Of Analysis';


--
-- TOC entry 2403 (class 0 OID 0)
-- Dependencies: 208
-- Name: COLUMN "UnitOfAnalysis"."ISO2"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."ISO2" IS 'only for Country level Unit Of Analysis';


--
-- TOC entry 2404 (class 0 OID 0)
-- Dependencies: 208
-- Name: COLUMN "UnitOfAnalysis"."nameISO"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."nameISO" IS 'only for Country level Unit Of Analysis';


--
-- TOC entry 2405 (class 0 OID 0)
-- Dependencies: 208
-- Name: COLUMN "UnitOfAnalysis".name; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis".name IS 'Multilanguage';


--
-- TOC entry 2406 (class 0 OID 0)
-- Dependencies: 208
-- Name: COLUMN "UnitOfAnalysis".description; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis".description IS 'Multilanguage';


--
-- TOC entry 2407 (class 0 OID 0)
-- Dependencies: 208
-- Name: COLUMN "UnitOfAnalysis"."shortName"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."shortName" IS 'Multilanguage';


--
-- TOC entry 2408 (class 0 OID 0)
-- Dependencies: 208
-- Name: COLUMN "UnitOfAnalysis"."HASC"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."HASC" IS '(example RU.AD.OK)';


--
-- TOC entry 2409 (class 0 OID 0)
-- Dependencies: 208
-- Name: COLUMN "UnitOfAnalysis"."unitOfAnalysisType"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."unitOfAnalysisType" IS 'reference to table UnitOfAnalysisType';


--
-- TOC entry 2410 (class 0 OID 0)
-- Dependencies: 208
-- Name: COLUMN "UnitOfAnalysis"."parentId"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."parentId" IS 'Link to Parent Unit of Analysis if exist';


--
-- TOC entry 2411 (class 0 OID 0)
-- Dependencies: 208
-- Name: COLUMN "UnitOfAnalysis"."creatorId"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."creatorId" IS 'Creator Id (User Id)';


--
-- TOC entry 2412 (class 0 OID 0)
-- Dependencies: 208
-- Name: COLUMN "UnitOfAnalysis"."ownerId"; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."ownerId" IS 'Owner Id (User Id)';


--
-- TOC entry 2413 (class 0 OID 0)
-- Dependencies: 208
-- Name: COLUMN "UnitOfAnalysis".visibility; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis".visibility IS '1 = CLIENT_SCHEMA; 2 = private;';


--
-- TOC entry 2414 (class 0 OID 0)
-- Dependencies: 208
-- Name: COLUMN "UnitOfAnalysis".status; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis".status IS '1 = active; 2 = inactive; 3 = deleted;';


--
-- TOC entry 209 (class 1259 OID 28830)
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
-- TOC entry 210 (class 1259 OID 28832)
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
-- TOC entry 2415 (class 0 OID 0)
-- Dependencies: 210
-- Name: COLUMN "UnitOfAnalysisClassType".name; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysisClassType".name IS 'Classification Name (for example - World Bank classification) ';


--
-- TOC entry 2416 (class 0 OID 0)
-- Dependencies: 210
-- Name: COLUMN "UnitOfAnalysisClassType".description; Type: COMMENT; Schema: CLIENT_SCHEMA; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysisClassType".description IS 'Classification Name description';


--
-- TOC entry 211 (class 1259 OID 28837)
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
-- TOC entry 212 (class 1259 OID 28841)
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
-- TOC entry 213 (class 1259 OID 28843)
-- Name: UnitOfAnalysisTagLink; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "UnitOfAnalysisTagLink" (
    id integer DEFAULT nextval('"UnitOfAnalysisTagLink_id_seq"'::regclass) NOT NULL,
    "uoaId" integer NOT NULL,
    "uoaTagId" integer NOT NULL
);


ALTER TABLE "UnitOfAnalysisTagLink" OWNER TO postgres;

--
-- TOC entry 214 (class 1259 OID 28847)
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
-- TOC entry 2417 (class 0 OID 0)
-- Dependencies: 214
-- Name: UnitOfAnalysisTag_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "UnitOfAnalysisTag_id_seq" OWNED BY "UnitOfAnalysisTag".id;


--
-- TOC entry 215 (class 1259 OID 28849)
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
-- TOC entry 216 (class 1259 OID 28851)
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
-- TOC entry 217 (class 1259 OID 28856)
-- Name: UserRights; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "UserRights" (
    "userID" bigint NOT NULL,
    "rightID" bigint NOT NULL,
    "canDo" boolean
);


ALTER TABLE "UserRights" OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 28859)
-- Name: UserUOA; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "UserUOA" (
    "UserId" integer NOT NULL,
    "UOAid" integer NOT NULL
);


ALTER TABLE "UserUOA" OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 28862)
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
-- TOC entry 220 (class 1259 OID 28864)
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
-- TOC entry 221 (class 1259 OID 28872)
-- Name: WorkflowStepList; Type: TABLE; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE TABLE "WorkflowStepList" (
    id integer NOT NULL,
    title character varying(100),
    description text
);


ALTER TABLE "WorkflowStepList" OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 28878)
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
-- TOC entry 2418 (class 0 OID 0)
-- Dependencies: 222
-- Name: WorkflowStepList_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "WorkflowStepList_id_seq" OWNED BY "WorkflowStepList".id;


--
-- TOC entry 223 (class 1259 OID 28880)
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
-- TOC entry 224 (class 1259 OID 28883)
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
-- TOC entry 2419 (class 0 OID 0)
-- Dependencies: 224
-- Name: WorkflowSteps_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "WorkflowSteps_id_seq" OWNED BY "WorkflowSteps".id;


--
-- TOC entry 225 (class 1259 OID 28885)
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
-- TOC entry 226 (class 1259 OID 28892)
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
-- TOC entry 2420 (class 0 OID 0)
-- Dependencies: 226
-- Name: Workflows_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "Workflows_id_seq" OWNED BY "Workflows".id;


--
-- TOC entry 227 (class 1259 OID 28894)
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
-- TOC entry 228 (class 1259 OID 28896)
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
-- TOC entry 229 (class 1259 OID 28898)
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
-- TOC entry 2421 (class 0 OID 0)
-- Dependencies: 229
-- Name: surveyQuestionOptions_id_seq; Type: SEQUENCE OWNED BY; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER SEQUENCE "surveyQuestionOptions_id_seq" OWNED BY "SurveyQuestionOptions".id;


--
-- TOC entry 230 (class 1259 OID 28900)
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
-- TOC entry 231 (class 1259 OID 28902)
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
-- TOC entry 2096 (class 2604 OID 28904)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "AccessMatrices" ALTER COLUMN id SET DEFAULT nextval('"AccessMatix_id_seq"'::regclass);


--
-- TOC entry 2097 (class 2604 OID 28905)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "AccessPermissions" ALTER COLUMN id SET DEFAULT nextval('"AccessPermissions_id_seq"'::regclass);


--
-- TOC entry 2100 (class 2604 OID 28906)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "EssenceRoles" ALTER COLUMN id SET DEFAULT nextval('"EntityRoles_id_seq"'::regclass);


--
-- TOC entry 2099 (class 2604 OID 28907)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Essences" ALTER COLUMN id SET DEFAULT nextval('"Entities_id_seq"'::regclass);


--
-- TOC entry 2102 (class 2604 OID 28908)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Languages" ALTER COLUMN id SET DEFAULT nextval('"Languages_id_seq"'::regclass);


--
-- TOC entry 2103 (class 2604 OID 28909)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Organizations" ALTER COLUMN id SET DEFAULT nextval('"Organizations_id_seq"'::regclass);


--
-- TOC entry 2104 (class 2604 OID 28910)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Products" ALTER COLUMN id SET DEFAULT nextval('"Products_id_seq"'::regclass);


--
-- TOC entry 2106 (class 2604 OID 28911)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Projects" ALTER COLUMN id SET DEFAULT nextval('"Projects_id_seq"'::regclass);


--
-- TOC entry 2107 (class 2604 OID 28912)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Rights" ALTER COLUMN id SET DEFAULT nextval('"Rights_id_seq"'::regclass);


--
-- TOC entry 2111 (class 2604 OID 28913)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SurveyAnswerVersions" ALTER COLUMN id SET DEFAULT nextval('"SurveyAnswerVersions_id_seq"'::regclass);


--
-- TOC entry 2113 (class 2604 OID 28914)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SurveyAnswers" ALTER COLUMN id SET DEFAULT nextval('"SurveyAnswers_id_seq"'::regclass);


--
-- TOC entry 2114 (class 2604 OID 28915)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SurveyQuestionOptions" ALTER COLUMN id SET DEFAULT nextval('"surveyQuestionOptions_id_seq"'::regclass);


--
-- TOC entry 2116 (class 2604 OID 28916)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SurveyQuestions" ALTER COLUMN id SET DEFAULT nextval('"SurveyQuestions_id_seq"'::regclass);


--
-- TOC entry 2101 (class 2604 OID 28917)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Surveys" ALTER COLUMN id SET DEFAULT nextval('"JSON_id_seq"'::regclass);


--
-- TOC entry 2125 (class 2604 OID 28918)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysisTag" ALTER COLUMN id SET DEFAULT nextval('"UnitOfAnalysisTag_id_seq"'::regclass);


--
-- TOC entry 2131 (class 2604 OID 28919)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "WorkflowStepList" ALTER COLUMN id SET DEFAULT nextval('"WorkflowStepList_id_seq"'::regclass);


--
-- TOC entry 2132 (class 2604 OID 28920)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "WorkflowSteps" ALTER COLUMN id SET DEFAULT nextval('"WorkflowSteps_id_seq"'::regclass);


--
-- TOC entry 2134 (class 2604 OID 28921)
-- Name: id; Type: DEFAULT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Workflows" ALTER COLUMN id SET DEFAULT nextval('"Workflows_id_seq"'::regclass);


--
-- TOC entry 2136 (class 2606 OID 28923)
-- Name: AccessMatrix_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "AccessMatrices"
    ADD CONSTRAINT "AccessMatrix_pkey" PRIMARY KEY (id);


--
-- TOC entry 2138 (class 2606 OID 28925)
-- Name: AccessPermissions_accessMatrixId_roleId_rightId_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "AccessPermissions"
    ADD CONSTRAINT "AccessPermissions_accessMatrixId_roleId_rightId_key" UNIQUE ("matrixId", "roleId", "rightId");


--
-- TOC entry 2140 (class 2606 OID 28927)
-- Name: AccessPermissoins_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "AccessPermissions"
    ADD CONSTRAINT "AccessPermissoins_pkey" PRIMARY KEY (id);


--
-- TOC entry 2142 (class 2606 OID 28929)
-- Name: Countries_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Countries"
    ADD CONSTRAINT "Countries_pkey" PRIMARY KEY (id);


--
-- TOC entry 2150 (class 2606 OID 28931)
-- Name: EntityRoles_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "EssenceRoles"
    ADD CONSTRAINT "EntityRoles_pkey" PRIMARY KEY (id);


--
-- TOC entry 2144 (class 2606 OID 28933)
-- Name: Entity_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Entity_pkey" PRIMARY KEY (id);


--
-- TOC entry 2152 (class 2606 OID 28935)
-- Name: EssenceRoles_essenceId_entityId_userId_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "EssenceRoles"
    ADD CONSTRAINT "EssenceRoles_essenceId_entityId_userId_key" UNIQUE ("essenceId", "entityId", "userId");


--
-- TOC entry 2146 (class 2606 OID 28937)
-- Name: Essences_fileName_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_fileName_key" UNIQUE ("fileName");


--
-- TOC entry 2148 (class 2606 OID 28939)
-- Name: Essences_tableName_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_tableName_key" UNIQUE ("tableName");


--
-- TOC entry 2154 (class 2606 OID 28941)
-- Name: JSON_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Surveys"
    ADD CONSTRAINT "JSON_pkey" PRIMARY KEY (id);


--
-- TOC entry 2156 (class 2606 OID 28943)
-- Name: Languages_code_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Languages"
    ADD CONSTRAINT "Languages_code_key" UNIQUE (code);


--
-- TOC entry 2158 (class 2606 OID 28945)
-- Name: Languages_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Languages"
    ADD CONSTRAINT "Languages_pkey" PRIMARY KEY (id);


--
-- TOC entry 2160 (class 2606 OID 28947)
-- Name: Organizations_adminUserId_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_adminUserId_key" UNIQUE ("adminUserId");


--
-- TOC entry 2162 (class 2606 OID 28949)
-- Name: Organizations_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_pkey" PRIMARY KEY (id);


--
-- TOC entry 2164 (class 2606 OID 28951)
-- Name: ProductUOA_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_pkey" PRIMARY KEY ("productId", "UOAid");


--
-- TOC entry 2166 (class 2606 OID 28953)
-- Name: Product_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- TOC entry 2168 (class 2606 OID 28955)
-- Name: Projects_codeName_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_codeName_key" UNIQUE ("codeName");


--
-- TOC entry 2170 (class 2606 OID 28957)
-- Name: Projects_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_pkey" PRIMARY KEY (id);


--
-- TOC entry 2173 (class 2606 OID 28959)
-- Name: Rights_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Rights"
    ADD CONSTRAINT "Rights_pkey" PRIMARY KEY (id);


--
-- TOC entry 2180 (class 2606 OID 28961)
-- Name: SurveyAnswers_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_pkey" PRIMARY KEY (id);


--
-- TOC entry 2182 (class 2606 OID 28963)
-- Name: SurveyAnswers_questionId_userId_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_questionId_userId_key" UNIQUE ("questionId", "userId");


--
-- TOC entry 2186 (class 2606 OID 28965)
-- Name: SurveyQuestions_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "SurveyQuestions"
    ADD CONSTRAINT "SurveyQuestions_pkey" PRIMARY KEY (id);


--
-- TOC entry 2189 (class 2606 OID 28967)
-- Name: Translations_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_pkey" PRIMARY KEY ("essenceId", "entityId", field, "langId");


--
-- TOC entry 2193 (class 2606 OID 28969)
-- Name: UnitOfAnalysisClassType_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysisClassType"
    ADD CONSTRAINT "UnitOfAnalysisClassType_pkey" PRIMARY KEY (id);


--
-- TOC entry 2198 (class 2606 OID 28971)
-- Name: UnitOfAnalysisTagLink_uoaId_uoaTagId_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_uoaId_uoaTagId_key" UNIQUE ("uoaId", "uoaTagId");


--
-- TOC entry 2195 (class 2606 OID 28973)
-- Name: UnitOfAnalysisTag_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_pkey" PRIMARY KEY (id);


--
-- TOC entry 2201 (class 2606 OID 28975)
-- Name: UnitOfAnalysisType_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysisType"
    ADD CONSTRAINT "UnitOfAnalysisType_pkey" PRIMARY KEY (id);


--
-- TOC entry 2191 (class 2606 OID 28977)
-- Name: UnitOfAnalysis_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_pkey" PRIMARY KEY (id);


--
-- TOC entry 2205 (class 2606 OID 28979)
-- Name: UserUOA_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "UserUOA"
    ADD CONSTRAINT "UserUOA_pkey" PRIMARY KEY ("UserId", "UOAid");


--
-- TOC entry 2207 (class 2606 OID 28981)
-- Name: Users_email_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- TOC entry 2212 (class 2606 OID 28983)
-- Name: WorkflowStepList_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "WorkflowStepList"
    ADD CONSTRAINT "WorkflowStepList_pkey" PRIMARY KEY (id);


--
-- TOC entry 2214 (class 2606 OID 28985)
-- Name: WorkflowSteps_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "WorkflowSteps"
    ADD CONSTRAINT "WorkflowSteps_pkey" PRIMARY KEY (id);


--
-- TOC entry 2216 (class 2606 OID 28987)
-- Name: Workflows_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Workflows"
    ADD CONSTRAINT "Workflows_pkey" PRIMARY KEY (id);


--
-- TOC entry 2218 (class 2606 OID 28989)
-- Name: Workflows_productId_key; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Workflows"
    ADD CONSTRAINT "Workflows_productId_key" UNIQUE ("productId");


--
-- TOC entry 2175 (class 2606 OID 28991)
-- Name: id; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Roles"
    ADD CONSTRAINT id PRIMARY KEY (id);


--
-- TOC entry 2178 (class 2606 OID 28993)
-- Name: roleRight_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "roleRight_pkey" PRIMARY KEY ("roleID", "rightID");


--
-- TOC entry 2184 (class 2606 OID 28995)
-- Name: surveyQuestionOptions_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "SurveyQuestionOptions"
    ADD CONSTRAINT "surveyQuestionOptions_pkey" PRIMARY KEY (id);


--
-- TOC entry 2210 (class 2606 OID 28997)
-- Name: userID; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "userID" PRIMARY KEY (id);


--
-- TOC entry 2203 (class 2606 OID 28999)
-- Name: userRights_pkey; Type: CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "UserRights"
    ADD CONSTRAINT "userRights_pkey" PRIMARY KEY ("userID", "rightID");


--
-- TOC entry 2171 (class 1259 OID 29000)
-- Name: Rights_action_idx; Type: INDEX; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE UNIQUE INDEX "Rights_action_idx" ON "Rights" USING btree (action);


--
-- TOC entry 2187 (class 1259 OID 29001)
-- Name: Token_body_idx; Type: INDEX; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE UNIQUE INDEX "Token_body_idx" ON "Token" USING btree (body);


--
-- TOC entry 2196 (class 1259 OID 29002)
-- Name: UnitOfAnalysisTagLink_uoaId_idx; Type: INDEX; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE INDEX "UnitOfAnalysisTagLink_uoaId_idx" ON "UnitOfAnalysisTagLink" USING btree ("uoaId");


--
-- TOC entry 2199 (class 1259 OID 29003)
-- Name: UnitOfAnalysisTagLink_uoaTagId_idx; Type: INDEX; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE INDEX "UnitOfAnalysisTagLink_uoaTagId_idx" ON "UnitOfAnalysisTagLink" USING btree ("uoaTagId");


--
-- TOC entry 2208 (class 1259 OID 29004)
-- Name: fki_roleID; Type: INDEX; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE INDEX "fki_roleID" ON "Users" USING btree ("roleID");


--
-- TOC entry 2176 (class 1259 OID 29005)
-- Name: fki_rolesrights_rightID; Type: INDEX; Schema: CLIENT_SCHEMA; Owner: postgres; Tablespace: 
--

CREATE INDEX "fki_rolesrights_rightID" ON "RolesRights" USING btree ("rightID");


--
-- TOC entry 2263 (class 2620 OID 29006)
-- Name: tr_delete_token; Type: TRIGGER; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE TRIGGER tr_delete_token BEFORE INSERT ON "Token" FOR EACH ROW EXECUTE PROCEDURE twc_delete_old_token();


--
-- TOC entry 2264 (class 2620 OID 29007)
-- Name: users_before_update; Type: TRIGGER; Schema: CLIENT_SCHEMA; Owner: postgres
--

CREATE TRIGGER users_before_update BEFORE UPDATE ON "Users" FOR EACH ROW EXECUTE PROCEDURE users_before_update();


--
-- TOC entry 2223 (class 2606 OID 29008)
-- Name: Organizations_adminUserId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "Users"(id);


--
-- TOC entry 2224 (class 2606 OID 29013)
-- Name: ProductUOA_UOAid_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_UOAid_fkey" FOREIGN KEY ("UOAid") REFERENCES "UnitOfAnalysis"(id);


--
-- TOC entry 2225 (class 2606 OID 29018)
-- Name: ProductUOA_productId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- TOC entry 2226 (class 2606 OID 29023)
-- Name: Products_originalLangId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_originalLangId_fkey" FOREIGN KEY ("originalLangId") REFERENCES "Languages"(id);


--
-- TOC entry 2227 (class 2606 OID 29028)
-- Name: Products_projectId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Projects"(id);


--
-- TOC entry 2228 (class 2606 OID 29033)
-- Name: Projects_accessMatrixId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_accessMatrixId_fkey" FOREIGN KEY ("matrixId") REFERENCES "AccessMatrices"(id);


--
-- TOC entry 2229 (class 2606 OID 29038)
-- Name: Projects_adminUserId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "Users"(id);


--
-- TOC entry 2230 (class 2606 OID 29043)
-- Name: Projects_organizationId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- TOC entry 2231 (class 2606 OID 29048)
-- Name: Rights_essence_id_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Rights"
    ADD CONSTRAINT "Rights_essence_id_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- TOC entry 2232 (class 2606 OID 29053)
-- Name: RolesRights_roleID_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "RolesRights_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "Roles"(id);


--
-- TOC entry 2234 (class 2606 OID 29058)
-- Name: SurveyAnswersVersions_optionId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SurveyAnswerVersions"
    ADD CONSTRAINT "SurveyAnswersVersions_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "SurveyQuestionOptions"(id);


--
-- TOC entry 2235 (class 2606 OID 29063)
-- Name: SurveyAnswersVersions_userId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SurveyAnswerVersions"
    ADD CONSTRAINT "SurveyAnswersVersions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"(id);


--
-- TOC entry 2236 (class 2606 OID 29068)
-- Name: SurveyAnswers_optionId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "SurveyQuestionOptions"(id);


--
-- TOC entry 2237 (class 2606 OID 29073)
-- Name: SurveyAnswers_productId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- TOC entry 2238 (class 2606 OID 29078)
-- Name: SurveyAnswers_questionId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions"(id);


--
-- TOC entry 2239 (class 2606 OID 29083)
-- Name: SurveyAnswers_userId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"(id);


--
-- TOC entry 2240 (class 2606 OID 29088)
-- Name: SurveyAnswers_wfStepId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_wfStepId_fkey" FOREIGN KEY ("wfStepId") REFERENCES "WorkflowSteps"(id);


--
-- TOC entry 2242 (class 2606 OID 29093)
-- Name: SurveyQuestions_surveyId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SurveyQuestions"
    ADD CONSTRAINT "SurveyQuestions_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Surveys"(id);


--
-- TOC entry 2222 (class 2606 OID 29098)
-- Name: Surveys_productId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Surveys"
    ADD CONSTRAINT "Surveys_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- TOC entry 2243 (class 2606 OID 29103)
-- Name: Translations_essence_id_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_essence_id_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- TOC entry 2244 (class 2606 OID 29108)
-- Name: Translations_lang_id_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_lang_id_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 2249 (class 2606 OID 29113)
-- Name: UnitOfAnalysisClassType_langId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysisClassType"
    ADD CONSTRAINT "UnitOfAnalysisClassType_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 2252 (class 2606 OID 29118)
-- Name: UnitOfAnalysisTagLink_uoaId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_uoaId_fkey" FOREIGN KEY ("uoaId") REFERENCES "UnitOfAnalysis"(id);


--
-- TOC entry 2253 (class 2606 OID 29123)
-- Name: UnitOfAnalysisTagLink_uoaTagId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_uoaTagId_fkey" FOREIGN KEY ("uoaTagId") REFERENCES "UnitOfAnalysisTag"(id);


--
-- TOC entry 2250 (class 2606 OID 29128)
-- Name: UnitOfAnalysisTag_classTypeId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_classTypeId_fkey" FOREIGN KEY ("classTypeId") REFERENCES "UnitOfAnalysisClassType"(id);


--
-- TOC entry 2251 (class 2606 OID 29133)
-- Name: UnitOfAnalysisTag_langId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 2254 (class 2606 OID 29138)
-- Name: UnitOfAnalysisType_langId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysisType"
    ADD CONSTRAINT "UnitOfAnalysisType_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 2245 (class 2606 OID 29143)
-- Name: UnitOfAnalysis_creatorId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Users"(id);


--
-- TOC entry 2246 (class 2606 OID 29148)
-- Name: UnitOfAnalysis_langId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- TOC entry 2247 (class 2606 OID 29153)
-- Name: UnitOfAnalysis_ownerId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Users"(id);


--
-- TOC entry 2248 (class 2606 OID 29158)
-- Name: UnitOfAnalysis_unitOfAnalysisType_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_unitOfAnalysisType_fkey" FOREIGN KEY ("unitOfAnalysisType") REFERENCES "UnitOfAnalysisType"(id);


--
-- TOC entry 2255 (class 2606 OID 29163)
-- Name: UserUOA_UOAid_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "UserUOA"
    ADD CONSTRAINT "UserUOA_UOAid_fkey" FOREIGN KEY ("UOAid") REFERENCES "UnitOfAnalysis"(id);


--
-- TOC entry 2256 (class 2606 OID 29168)
-- Name: UserUOA_UserId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "UserUOA"
    ADD CONSTRAINT "UserUOA_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"(id);


--
-- TOC entry 2257 (class 2606 OID 29173)
-- Name: Users_organizationId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- TOC entry 2258 (class 2606 OID 29178)
-- Name: Users_roleID_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "Roles"(id);


--
-- TOC entry 2259 (class 2606 OID 29183)
-- Name: WorkflowSteps_roleId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "WorkflowSteps"
    ADD CONSTRAINT "WorkflowSteps_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Roles"(id);


--
-- TOC entry 2260 (class 2606 OID 29188)
-- Name: WorkflowSteps_stepId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "WorkflowSteps"
    ADD CONSTRAINT "WorkflowSteps_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowStepList"(id);


--
-- TOC entry 2261 (class 2606 OID 29193)
-- Name: WorkflowSteps_worflowId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "WorkflowSteps"
    ADD CONSTRAINT "WorkflowSteps_worflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflows"(id);


--
-- TOC entry 2262 (class 2606 OID 29198)
-- Name: Workflows_productId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "Workflows"
    ADD CONSTRAINT "Workflows_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- TOC entry 2219 (class 2606 OID 29203)
-- Name: essence_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "EssenceRoles"
    ADD CONSTRAINT essence_fkey FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- TOC entry 2220 (class 2606 OID 29208)
-- Name: role_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "EssenceRoles"
    ADD CONSTRAINT role_fkey FOREIGN KEY ("roleId") REFERENCES "Roles"(id);


--
-- TOC entry 2233 (class 2606 OID 29213)
-- Name: rolesrights_rightID; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "rolesrights_rightID" FOREIGN KEY ("rightID") REFERENCES "Rights"(id);


--
-- TOC entry 2241 (class 2606 OID 29218)
-- Name: surveyQuestionOptions_questionId_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "SurveyQuestionOptions"
    ADD CONSTRAINT "surveyQuestionOptions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions"(id);


--
-- TOC entry 2221 (class 2606 OID 29223)
-- Name: user_fkey; Type: FK CONSTRAINT; Schema: CLIENT_SCHEMA; Owner: postgres
--

ALTER TABLE ONLY "EssenceRoles"
    ADD CONSTRAINT user_fkey FOREIGN KEY ("userId") REFERENCES "Users"(id);


--
-- TOC entry 2380 (class 0 OID 0)
-- Dependencies: 6
-- Name: CLIENT_SCHEMA; Type: ACL; Schema: -; Owner: postgres
--

REVOKE ALL ON SCHEMA CLIENT_SCHEMA FROM PUBLIC;
REVOKE ALL ON SCHEMA CLIENT_SCHEMA FROM postgres;
GRANT ALL ON SCHEMA CLIENT_SCHEMA TO postgres;
GRANT ALL ON SCHEMA CLIENT_SCHEMA TO PUBLIC;


-- Completed on 2016-01-29 18:11:41 UTC

--
-- PostgreSQL database dump complete
--

