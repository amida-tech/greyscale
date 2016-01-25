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


ALTER TYPE event_status OWNER TO postgres;

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


ALTER TYPE order_status OWNER TO postgres;

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


ALTER TYPE tour_status OWNER TO postgres;

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


ALTER TYPE transport_status OWNER TO postgres;

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
   DELETE FROM "Token" WHERE "userID" = NEW."userID";
   RETURN NEW;
END;$$;


ALTER FUNCTION public.twc_delete_old_token() OWNER TO postgres;

--
-- Name: twc_get_token(character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION twc_get_token(body character varying, exp character varying) RETURNS character varying
    LANGUAGE plpgsql
    AS $$BEGIN

  SELECT t."body"
    FROM "Token" t
   where (t."body" = twc_get_token.body)
   and ((now() - t."issuedAt") < (twc_get_token.exp || ' milliseconds')::interval);
         
END$$;


ALTER FUNCTION public.twc_get_token(body character varying, exp character varying) OWNER TO postgres;

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

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: AccessMatrices; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE "AccessMatrices" (
    id integer NOT NULL,
    name character varying(100),
    description text,
    default_value smallint
);


ALTER TABLE "AccessMatrices" OWNER TO postgres;

--
-- Name: AccessMatix_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "AccessMatix_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "AccessMatix_id_seq" OWNER TO postgres;

--
-- Name: AccessMatix_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "AccessMatix_id_seq" OWNED BY "AccessMatrices".id;


--
-- Name: AccessPermissions; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
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
-- Name: AccessPermissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "AccessPermissions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "AccessPermissions_id_seq" OWNER TO postgres;

--
-- Name: AccessPermissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "AccessPermissions_id_seq" OWNED BY "AccessPermissions".id;


--
-- Name: country_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE country_id_seq
    START WITH 240
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE country_id_seq OWNER TO postgres;

--
-- Name: Countries; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
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
-- Name: Essences; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
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
-- Name: COLUMN "Essences".name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "Essences".name IS 'Human readable name of essence';


--
-- Name: COLUMN "Essences"."fileName"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "Essences"."fileName" IS 'File name in models path';


--
-- Name: Entities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "Entities_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Entities_id_seq" OWNER TO postgres;

--
-- Name: Entities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "Entities_id_seq" OWNED BY "Essences".id;


--
-- Name: EssenceRoles; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
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
-- Name: EntityRoles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "EntityRoles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "EntityRoles_id_seq" OWNER TO postgres;

--
-- Name: EntityRoles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "EntityRoles_id_seq" OWNED BY "EssenceRoles".id;


--
-- Name: Surveys; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE "Surveys" (
    id integer NOT NULL,
    data text
);


ALTER TABLE "Surveys" OWNER TO postgres;

--
-- Name: JSON_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "JSON_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "JSON_id_seq" OWNER TO postgres;

--
-- Name: JSON_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "JSON_id_seq" OWNED BY "Surveys".id;


--
-- Name: Languages; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE "Languages" (
    id integer NOT NULL,
    name character varying(100),
    "nativeName" character varying(255),
    code character varying(3)
);


ALTER TABLE "Languages" OWNER TO postgres;

--
-- Name: Languages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "Languages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Languages_id_seq" OWNER TO postgres;

--
-- Name: Languages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "Languages_id_seq" OWNED BY "Languages".id;


--
-- Name: Organizations; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
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
-- Name: Organizations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "Organizations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Organizations_id_seq" OWNER TO postgres;

--
-- Name: Organizations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "Organizations_id_seq" OWNED BY "Organizations".id;


--
-- Name: Products; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE "Products" (
    id integer NOT NULL,
    title character varying(100),
    description text,
    "matrixId" integer,
    "originalLangId" integer
);


ALTER TABLE "Products" OWNER TO postgres;

--
-- Name: Products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "Products_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Products_id_seq" OWNER TO postgres;

--
-- Name: Products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "Products_id_seq" OWNED BY "Products".id;


--
-- Name: Projects; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
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
-- Name: Projects_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "Projects_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Projects_id_seq" OWNER TO postgres;

--
-- Name: Projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "Projects_id_seq" OWNED BY "Projects".id;


--
-- Name: Rights; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE "Rights" (
    id integer NOT NULL,
    action character varying(80) NOT NULL,
    description text,
    "essenceId" integer
);


ALTER TABLE "Rights" OWNER TO postgres;

--
-- Name: Rights_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "Rights_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Rights_id_seq" OWNER TO postgres;

--
-- Name: Rights_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "Rights_id_seq" OWNED BY "Rights".id;


--
-- Name: role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE role_id_seq OWNER TO postgres;

--
-- Name: Roles; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE "Roles" (
    id integer DEFAULT nextval('role_id_seq'::regclass) NOT NULL,
    name character varying(20) NOT NULL,
    "isSystem" boolean DEFAULT false NOT NULL
);


ALTER TABLE "Roles" OWNER TO postgres;

--
-- Name: RolesRights; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE "RolesRights" (
    "roleID" bigint NOT NULL,
    "rightID" bigint NOT NULL
);


ALTER TABLE "RolesRights" OWNER TO postgres;

--
-- Name: SurveyAnswers; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE "SurveyAnswers" (
    id integer NOT NULL,
    "surveyId" integer,
    "userId" integer,
    data text,
    date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE "SurveyAnswers" OWNER TO postgres;

--
-- Name: SurveyAnswers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "SurveyAnswers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "SurveyAnswers_id_seq" OWNER TO postgres;

--
-- Name: SurveyAnswers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "SurveyAnswers_id_seq" OWNED BY "SurveyAnswers".id;


--
-- Name: Token; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE "Token" (
    "userID" integer NOT NULL,
    body character varying(200) NOT NULL,
    "issuedAt" timestamp without time zone DEFAULT ('now'::text)::timestamp without time zone NOT NULL
);


ALTER TABLE "Token" OWNER TO postgres;

--
-- Name: Translations; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
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
-- Name: UnitOfAnalysis_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "UnitOfAnalysis_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysis_id_seq" OWNER TO postgres;

--
-- Name: UnitOfAnalysis; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
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
-- Name: COLUMN "UnitOfAnalysis"."gadmId0"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId0" IS 'ID0 for use with GADM shapefile';


--
-- Name: COLUMN "UnitOfAnalysis"."gadmId1"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId1" IS 'ID1 for use with GADM shapefile';


--
-- Name: COLUMN "UnitOfAnalysis"."gadmId2"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId2" IS 'ID2 for use with GADM shapefile';


--
-- Name: COLUMN "UnitOfAnalysis"."gadmId3"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId3" IS 'ID3 for use with GADM shapefile';


--
-- Name: COLUMN "UnitOfAnalysis"."gadmObjectId"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmObjectId" IS 'OBJECTID for use with GADM shapefile (only Global Shapefile)';


--
-- Name: COLUMN "UnitOfAnalysis"."ISO"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."ISO" IS 'only for Country level Unit Of Analysis';


--
-- Name: COLUMN "UnitOfAnalysis"."ISO2"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."ISO2" IS 'only for Country level Unit Of Analysis';


--
-- Name: COLUMN "UnitOfAnalysis"."nameISO"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."nameISO" IS 'only for Country level Unit Of Analysis';


--
-- Name: COLUMN "UnitOfAnalysis".name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis".name IS 'Multilanguage';


--
-- Name: COLUMN "UnitOfAnalysis".description; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis".description IS 'Multilanguage';


--
-- Name: COLUMN "UnitOfAnalysis"."shortName"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."shortName" IS 'Multilanguage';


--
-- Name: COLUMN "UnitOfAnalysis"."HASC"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."HASC" IS '(example RU.AD.OK)';


--
-- Name: COLUMN "UnitOfAnalysis"."unitOfAnalysisType"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."unitOfAnalysisType" IS 'reference to table UnitOfAnalysisType';


--
-- Name: COLUMN "UnitOfAnalysis"."parentId"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."parentId" IS 'Link to Parent Unit of Analysis if exist';


--
-- Name: COLUMN "UnitOfAnalysis"."creatorId"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."creatorId" IS 'Creator Id (User Id)';


--
-- Name: COLUMN "UnitOfAnalysis"."ownerId"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis"."ownerId" IS 'Owner Id (User Id)';


--
-- Name: COLUMN "UnitOfAnalysis".visibility; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis".visibility IS '1 = public; 2 = private;';


--
-- Name: COLUMN "UnitOfAnalysis".status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysis".status IS '1 = active; 2 = inactive; 3 = deleted;';


--
-- Name: UnitOfAnalysisClassType_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "UnitOfAnalysisClassType_id_seq"
    START WITH 9
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysisClassType_id_seq" OWNER TO postgres;

--
-- Name: UnitOfAnalysisClassType; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE "UnitOfAnalysisClassType" (
    id smallint DEFAULT nextval('"UnitOfAnalysisClassType_id_seq"'::regclass) NOT NULL,
    name character varying(45) NOT NULL,
    description character varying(255),
    "langId" smallint DEFAULT 1 NOT NULL
);


ALTER TABLE "UnitOfAnalysisClassType" OWNER TO postgres;

--
-- Name: COLUMN "UnitOfAnalysisClassType".name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysisClassType".name IS 'Classification Name (for example - World Bank classification) ';


--
-- Name: COLUMN "UnitOfAnalysisClassType".description; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "UnitOfAnalysisClassType".description IS 'Classification Name description';


--
-- Name: UnitOfAnalysisTag; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
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
-- Name: UnitOfAnalysisTag_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "UnitOfAnalysisTag_id_seq"
    START WITH 9
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysisTag_id_seq" OWNER TO postgres;

--
-- Name: UnitOfAnalysisTag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "UnitOfAnalysisTag_id_seq" OWNED BY "UnitOfAnalysisTag".id;


--
-- Name: UnitOfAnalysisType_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "UnitOfAnalysisType_id_seq"
    START WITH 9
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "UnitOfAnalysisType_id_seq" OWNER TO postgres;

--
-- Name: UnitOfAnalysisType; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE "UnitOfAnalysisType" (
    id smallint DEFAULT nextval('"UnitOfAnalysisType_id_seq"'::regclass) NOT NULL,
    name character varying(40) NOT NULL,
    description character varying(255),
    "langId" integer DEFAULT 1 NOT NULL
);


ALTER TABLE "UnitOfAnalysisType" OWNER TO postgres;

--
-- Name: UserRights; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE "UserRights" (
    "userID" bigint NOT NULL,
    "rightID" bigint NOT NULL,
    "canDo" boolean
);


ALTER TABLE "UserRights" OWNER TO postgres;

--
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE user_id_seq OWNER TO postgres;

--
-- Name: Users; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
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
-- Name: brand_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE brand_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE brand_id_seq OWNER TO postgres;

--
-- Name: order_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE order_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE order_id_seq OWNER TO postgres;

--
-- Name: transport_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE transport_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE transport_id_seq OWNER TO postgres;

--
-- Name: transportmodel_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE transportmodel_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE transportmodel_id_seq OWNER TO postgres;

--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "AccessMatrices" ALTER COLUMN id SET DEFAULT nextval('"AccessMatix_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "AccessPermissions" ALTER COLUMN id SET DEFAULT nextval('"AccessPermissions_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "EssenceRoles" ALTER COLUMN id SET DEFAULT nextval('"EntityRoles_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Essences" ALTER COLUMN id SET DEFAULT nextval('"Entities_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Languages" ALTER COLUMN id SET DEFAULT nextval('"Languages_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Organizations" ALTER COLUMN id SET DEFAULT nextval('"Organizations_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Products" ALTER COLUMN id SET DEFAULT nextval('"Products_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Projects" ALTER COLUMN id SET DEFAULT nextval('"Projects_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Rights" ALTER COLUMN id SET DEFAULT nextval('"Rights_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "SurveyAnswers" ALTER COLUMN id SET DEFAULT nextval('"SurveyAnswers_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Surveys" ALTER COLUMN id SET DEFAULT nextval('"JSON_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysisTag" ALTER COLUMN id SET DEFAULT nextval('"UnitOfAnalysisTag_id_seq"'::regclass);


--
-- Name: AccessMatix_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"AccessMatix_id_seq"', 8, true);


--
-- Data for Name: AccessMatrices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "AccessMatrices" (id, name, description, default_value) FROM stdin;
1	test	Test matrix	0
2	test	Test matrix	0
3	test	Test matrix	0
4	test	Test matrix	0
8	Test2	\N	\N
\.


--
-- Data for Name: AccessPermissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "AccessPermissions" ("matrixId", "roleId", "rightId", permission, id) FROM stdin;
6	2	1	1	2
4	3	7	0	9
4	4	127	0	10
\.


--
-- Name: AccessPermissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"AccessPermissions_id_seq"', 12, true);


--
-- Data for Name: Countries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "Countries" (id, name, alpha2, alpha3, nbr) FROM stdin;
2	AFGHANISTAN	AF	AFG	4
3	ALBANIA	AL	ALB	8
4	ALGERIA	DZ	DZA	12
5	AMERICAN SAMOA	AS	ASM	16
6	ANDORRA	AD	AND	20
7	ANGOLA	AO	AGO	24
8	ANGUILLA	AI	AIA	660
9	ANTARCTICA	AQ	ATA	10
10	ANTIGUA AND BARBUDA	AG	ATG	28
11	ARGENTINA	AR	ARG	32
12	ARMENIA	AM	ARM	51
13	ARUBA	AW	ABW	533
14	AUSTRALIA	AU	AUS	36
15	AUSTRIA	AT	AUT	40
16	AZERBAIJAN	AZ	AZE	31
17	BAHAMAS	BS	BHS	44
18	BAHRAIN	BH	BHR	48
19	BANGLADESH	BD	BGD	50
20	BARBADOS	BB	BRB	52
21	BELARUS	BY	BLR	112
22	BELGIUM	BE	BEL	56
23	BELIZE	BZ	BLZ	84
24	BENIN	BJ	BEN	204
25	BERMUDA	BM	BMU	60
26	BHUTAN	BT	BTN	64
27	BOLIVIA	BO	BOL	68
28	BOSNIA AND HERZEGOWINA	BA	BIH	70
29	BOTSWANA	BW	BWA	72
30	BOUVET ISLAND	BV	BVT	74
31	BRAZIL	BR	BRA	76
32	BRITISH INDIAN OCEAN TERRITORY	IO	IOT	86
33	BRUNEI DARUSSALAM	BN	BRN	96
34	BULGARIA	BG	BGR	100
35	BURKINA FASO	BF	BFA	854
36	BURUNDI	BI	BDI	108
37	CAMBODIA	KH	KHM	116
38	CAMEROON	CM	CMR	120
39	CANADA	CA	CAN	124
40	CAPE VERDE	CV	CPV	132
41	CAYMAN ISLANDS	KY	CYM	136
42	CENTRAL AFRICAN REPUBLIC	CF	CAF	140
43	CHAD	TD	TCD	148
44	CHILE	CL	CHL	152
45	CHINA	CN	CHN	156
46	CHRISTMAS ISLAND	CX	CXR	162
47	COCOS (KEELING) ISLANDS	CC	CCK	166
48	COLOMBIA	CO	COL	170
49	COMOROS	KM	COM	174
50	DEMOCRATIC REPUBLIC OF CONGO	CD	COD	180
51	REPUBLIC OF CONGO	CG	COG	178
52	COOK ISLANDS	CK	COK	184
53	COSTA RICA	CR	CRI	188
54	COTE D`IVOIRE	CI	CIV	384
55	CROATIA	HR	HRV	191
56	CUBA	CU	CUB	192
57	CYPRUS	CY	CYP	196
58	CZECH REPUBLIC	CZ	CZE	203
59	DENMARK	DK	DNK	208
60	DJIBOUTI	DJ	DJI	262
61	DOMINICA	DM	DMA	212
62	DOMINICAN REPUBLIC	DO	DOM	214
63	ECUADOR	EC	ECU	218
64	EGYPT	EG	EGY	818
65	EL SALVADOR	SV	SLV	222
66	EQUATORIAL GUINEA	GQ	GNQ	226
67	ERITREA	ER	ERI	232
68	ESTONIA	EE	EST	233
69	ETHIOPIA	ET	ETH	231
70	FALKLAND ISLANDS (MALVINAS)	FK	FLK	238
71	FAROE ISLANDS	FO	FRO	234
72	FIJI	FJ	FJI	242
73	FINLAND	FI	FIN	246
74	FRANCE	FR	FRA	250
75	FRENCH GUIANA	GF	GUF	254
76	FRENCH POLYNESIA	PF	PYF	258
77	FRENCH SOUTHERN TERRITORIES	TF	ATF	260
78	GABON	GA	GAB	266
79	GAMBIA	GM	GMB	270
80	GEORGIA	GE	GEO	268
81	GERMANY	DE	DEU	276
82	GHANA	GH	GHA	288
83	GIBRALTAR	GI	GIB	292
84	GREECE	GR	GRC	300
85	GREENLAND	GL	GRL	304
86	GRENADA	GD	GRD	308
87	GUADELOUPE	GP	GLP	312
88	GUAM	GU	GUM	316
89	GUATEMALA	GT	GTM	320
90	GUINEA	GN	GIN	324
91	GUINEA-BISSAU	GW	GNB	624
92	GUYANA	GY	GUY	328
93	HAITI	HT	HTI	332
94	HEARD AND MC DONALD ISLANDS	HM	HMD	334
95	HONDURAS	HN	HND	340
96	HONG KONG	HK	HKG	344
97	HUNGARY	HU	HUN	348
98	ICELAND	IS	ISL	352
99	INDIA	IN	IND	356
100	INDONESIA	ID	IDN	360
101	IRAN	IR	IRN	364
102	IRAQ	IQ	IRQ	368
103	IRELAND	IE	IRL	372
104	ISRAEL	IL	ISR	376
105	ITALY	IT	ITA	380
106	JAMAICA	JM	JAM	388
107	JAPAN	JP	JPN	392
108	JORDAN	JO	JOR	400
109	KAZAKHSTAN	KZ	KAZ	398
110	KENYA	KE	KEN	404
111	KIRIBATI	KI	KIR	296
112	DEMOCRATIC PEOPLE`S REPUBLIC OF KOREA	KP	PRK	408
113	REPUBLIC OF KOREA	KR	KOR	410
114	KUWAIT	KW	KWT	414
115	KYRGYZSTAN	KG	KGZ	417
116	LAO PEOPLE`S DEMOCRATIC REPUBLIC	LA	LAO	418
117	LATVIA	LV	LVA	428
118	LEBANON	LB	LBN	422
119	LESOTHO	LS	LSO	426
120	LIBERIA	LR	LBR	430
121	LIBYAN ARAB JAMAHIRIYA	LY	LBY	434
122	LIECHTENSTEIN	LI	LIE	438
123	LITHUANIA	LT	LTU	440
124	LUXEMBOURG	LU	LUX	442
125	MACAU	MO	MAC	446
126	THE FORMER YUGOSLAV REPUBLIC OF MACEDONIA	MK	MKD	807
127	MADAGASCAR	MG	MDG	450
128	MALAWI	MW	MWI	454
129	MALAYSIA	MY	MYS	458
130	MALDIVES	MV	MDV	462
131	MALI	ML	MLI	466
132	MALTA	MT	MLT	470
133	MARSHALL ISLANDS	MH	MHL	584
134	MARTINIQUE	MQ	MTQ	474
135	MAURITANIA	MR	MRT	478
136	MAURITIUS	MU	MUS	480
137	MAYOTTE	YT	MYT	175
138	MEXICO	MX	MEX	484
139	FEDERATED STATES OF MICRONESIA	FM	FSM	583
140	REPUBLIC OF MOLDOVA	MD	MDA	498
141	MONACO	MC	MCO	492
142	MONGOLIA	MN	MNG	496
143	MONTSERRAT	MS	MSR	500
144	MOROCCO	MA	MAR	504
145	MOZAMBIQUE	MZ	MOZ	508
146	MYANMAR	MM	MMR	104
147	NAMIBIA	NA	NAM	516
148	NAURU	NR	NRU	520
149	NEPAL	NP	NPL	524
150	NETHERLANDS	NL	NLD	528
151	NETHERLANDS ANTILLES	AN	ANT	530
152	NEW CALEDONIA	NC	NCL	540
153	NEW ZEALAND	NZ	NZL	554
154	NICARAGUA	NI	NIC	558
155	NIGER	NE	NER	562
156	NIGERIA	NG	NGA	566
157	NIUE	NU	NIU	570
158	NORFOLK ISLAND	NF	NFK	574
159	NORTHERN MARIANA ISLANDS	MP	MNP	580
160	NORWAY	NO	NOR	578
161	OMAN	OM	OMN	512
162	PAKISTAN	PK	PAK	586
163	PALAU	PW	PLW	585
164	PALESTINIAN TERRITORY	PS	PSE	275
165	PANAMA	PA	PAN	591
166	PAPUA NEW GUINEA	PG	PNG	598
167	PARAGUAY	PY	PRY	600
168	PERU	PE	PER	604
169	PHILIPPINES	PH	PHL	608
170	PITCAIRN	PN	PCN	612
171	POLAND	PL	POL	616
172	PORTUGAL	PT	PRT	620
173	PUERTO RICO	PR	PRI	630
174	QATAR	QA	QAT	634
175	REUNION	RE	REU	638
176	ROMANIA	RO	ROU	642
177	RUSSIAN FEDERATION	RU	RUS	643
178	RWANDA	RW	RWA	646
179	SAINT HELENA	SH	SHN	654
180	SAINT KITTS AND NEVIS	KN	KNA	659
181	SAINT LUCIA	LC	LCA	662
182	SAINT PIERRE AND MIQUELON	PM	SPM	666
183	SAINT VINCENT AND THE GRENADINES	VC	VCT	670
184	SAMOA	WS	WSM	882
185	SAN MARINO	SM	SMR	674
186	SAO TOME AND PRINCIPE	ST	STP	678
187	SAUDI ARABIA	SA	SAU	682
188	SENEGAL	SN	SEN	686
189	SERBIA AND MONTENEGRO	CS	SCG	891
190	SEYCHELLES	SC	SYC	690
191	SIERRA LEONE	SL	SLE	694
192	SINGAPORE	SG	SGP	702
193	SLOVAKIA	SK	SVK	703
194	SLOVENIA	SI	SVN	705
195	SOLOMON ISLANDS	SB	SLB	90
196	SOMALIA	SO	SOM	706
197	SOUTH AFRICA	ZA	ZAF	710
198	SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS	GS	SGS	239
199	SPAIN	ES	ESP	724
200	SRI LANKA	LK	LKA	144
201	SUDAN	SD	SDN	736
202	SURINAME	SR	SUR	740
203	SVALBARD AND JAN MAYEN ISLANDS	SJ	SJM	744
204	SWAZILAND	SZ	SWZ	748
205	SWEDEN	SE	SWE	752
206	SWITZERLAND	CH	CHE	756
207	SYRIAN ARAB REPUBLIC	SY	SYR	760
208	TAIWAN	TW	TWN	158
209	TAJIKISTAN	TJ	TJK	762
210	UNITED REPUBLIC OF TANZANIA	TZ	TZA	834
211	THAILAND	TH	THA	764
212	TIMOR-LESTE	TL	TLS	626
213	TOGO	TG	TGO	768
214	TOKELAU	TK	TKL	772
215	TONGA	TO	TON	776
216	TRINIDAD AND TOBAGO	TT	TTO	780
217	TUNISIA	TN	TUN	788
218	TURKEY	TR	TUR	792
219	TURKMENISTAN	TM	TKM	795
220	TURKS AND CAICOS ISLANDS	TC	TCA	796
221	TUVALU	TV	TUV	798
222	UGANDA	UG	UGA	800
223	UKRAINE	UA	UKR	804
224	UNITED ARAB EMIRATES	AE	ARE	784
225	UNITED KINGDOM	GB	GBR	826
226	UNITED STATES	US	USA	840
227	UNITED STATES MINOR OUTLYING ISLANDS	UM	UMI	581
228	URUGUAY	UY	URY	858
229	UZBEKISTAN	UZ	UZB	860
230	VANUATU	VU	VUT	548
231	VATICAN CITY STATE (HOLY SEE)	VA	VAT	336
232	VENEZUELA	VE	VEN	862
233	VIET NAM	VN	VNM	704
234	VIRGIN ISLANDS (BRITISH)	VG	VGB	92
235	VIRGIN ISLANDS (U.S.)	VI	VIR	850
236	WALLIS AND FUTUNA ISLANDS	WF	WLF	876
237	WESTERN SAHARA	EH	ESH	732
238	YEMEN	YE	YEM	887
239	ZAMBIA	ZM	ZMB	894
240	ZIMBABWE	ZW	ZWE	716
248	ssssssssssss	ss	sss	111
\.


--
-- Name: Entities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"Entities_id_seq"', 13, true);


--
-- Name: EntityRoles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"EntityRoles_id_seq"', 19, true);


--
-- Data for Name: EssenceRoles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "EssenceRoles" (id, "roleId", "userId", "essenceId", "entityId") FROM stdin;
9	5	76	4	7
10	4	76	4	8
12	4	127	4	1
14	5	127	4	2
16	5	127	4	3
17	2	127	5	3
18	1	112	13	6
19	9	125	13	6
\.


--
-- Data for Name: Essences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "Essences" (id, "tableName", name, "fileName", "nameField") FROM stdin;
4	Products	Products	products	title
6	UnitOfAnalysis	UnitOfAnalysis	uoas	name
5	UnitOfAnalysisType	UnitОfAnalysisType	uoatypes	name
7	UnitOfAnalysisClassType	UnitOfAnalysisClassType	uoaclasstypes	name
8	UnitOfAnalysisTag	UnitOfAnalysisTag	uoatags	name
13	Projects	projects	projects	codeName
\.


--
-- Name: JSON_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"JSON_id_seq"', 11, true);


--
-- Data for Name: Languages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "Languages" (id, name, "nativeName", code) FROM stdin;
1	English	English	en
2	Russian	Русский	ru
9	Japanese	日本語	jp
\.


--
-- Name: Languages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"Languages_id_seq"', 9, true);


--
-- Data for Name: Organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "Organizations" (id, name, address, "adminUserId", url, "enforceApiSecurity", "isActive") FROM stdin;
10	NTR Lab	Moscow	124	http://www.ntrlab.ru	\N	t
11	Google	New york	76	http://google.com	\N	t
7	test Organization	South pole	125	http://www.example.org	\N	t
12	Your new organization	\N	131	\N	\N	f
15	Your new organization	\N	134	\N	\N	f
\.


--
-- Name: Organizations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"Organizations_id_seq"', 15, true);


--
-- Data for Name: Products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "Products" (id, title, description, "matrixId", "originalLangId") FROM stdin;
1	apple	My new apple	4	\N
2	Watermelon	My new watermelon	4	\N
3	Orange	My orange	4	1
4	Banana	Yellow banana	4	2
\.


--
-- Name: Products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"Products_id_seq"', 4, true);


--
-- Data for Name: Projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "Projects" (id, "organizationId", "codeName", description, created, "matrixId", "startTime", status, "adminUserId", "closeTime") FROM stdin;
4	7	mysuperCode	super project	2015-12-22 13:25:59-05	3	2015-12-17 13:00:00-05	0	76	\N
6	11	qwerty	\N	2015-12-24 07:00:11-05	1	2015-11-30 13:00:00-05	1	112	2015-12-30 13:00:00-05
7	7	\N	Yellow banana	2015-10-23 08:00:00-04	4	2015-12-21 16:00:00-05	1	76	2015-12-23 16:00:00-05
9	7	myCode2	Yellow banana	2015-10-23 08:00:00-04	4	2015-12-21 16:00:00-05	1	76	2015-12-23 16:00:00-05
5	11	qwerty2	Yellow banana	2015-10-23 08:00:00-04	4	2015-12-21 16:00:00-05	1	76	2015-12-23 16:00:00-05
14	11	qwerty3	Simple survey	2015-10-23 08:00:00-04	4	2015-12-21 16:00:00-05	1	76	2015-12-23 16:00:00-05
15	11	qwerty4	Simple survey	2015-10-23 08:00:00-04	4	2015-12-21 16:00:00-05	1	76	2015-12-23 16:00:00-05
2	7	\N	Yellow banana	2015-10-23 08:00:00-04	4	2015-12-21 16:00:00-05	1	125	2015-12-23 16:00:00-05
\.


--
-- Name: Projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"Projects_id_seq"', 15, true);


--
-- Data for Name: Rights; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "Rights" (id, action, description, "essenceId") FROM stdin;
19	rights_delete_one	Can delete one right	\N
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
50	countries_insert_one	Can insert countries	\N
51	countries_update_one	Can update countries	\N
52	countries_delete_one	Can delete countries	\N
\.


--
-- Name: Rights_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"Rights_id_seq"', 130, true);


--
-- Data for Name: Roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "Roles" (id, name, "isSystem") FROM stdin;
1	admin	t
2	client	t
4	reviewer	f
5	translator	f
8	decider	f
9	project manager	f
10	research director	f
11	researcher	f
3	user	t
\.


--
-- Data for Name: RolesRights; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "RolesRights" ("roleID", "rightID") FROM stdin;
1	18
1	17
1	19
1	16
1	127
1	29
1	50
1	51
1	52
2	129
2	24
2	16
\.


--
-- Data for Name: SurveyAnswers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "SurveyAnswers" (id, "surveyId", "userId", data, date) FROM stdin;
4	\N	112	\N	2015-12-28 10:06:48.840737-05
5	\N	112	\N	2015-12-28 10:06:53.83712-05
6	\N	112	\N	2015-12-28 10:06:58.851214-05
7	\N	112	\N	2015-12-28 10:07:03.840767-05
8	\N	112	\N	2015-12-28 10:07:08.907858-05
9	\N	112	\N	2015-12-28 10:09:48.595499-05
10	\N	112	\N	2015-12-28 10:09:53.593861-05
11	\N	112	\N	2015-12-28 10:10:03.164657-05
12	\N	112	\N	2015-12-28 10:10:08.19131-05
13	\N	112	\N	2015-12-28 10:10:13.174798-05
14	\N	112	\N	2015-12-28 10:10:18.170499-05
15	\N	112	\N	2015-12-28 10:10:23.176698-05
16	\N	112	\N	2015-12-28 10:13:37.639912-05
17	\N	112	\N	2015-12-28 10:13:42.625431-05
18	\N	112	\N	2015-12-28 10:13:47.625101-05
19	\N	112	\N	2015-12-28 10:13:52.623914-05
20	\N	112	\N	2015-12-28 10:13:57.703526-05
21	\N	112	\N	2015-12-28 10:15:19.539586-05
22	\N	112	\N	2015-12-28 10:16:45.817684-05
23	\N	112	\N	2015-12-28 10:18:04.589445-05
24	\N	112	\N	2015-12-28 10:18:16.09193-05
25	\N	112	\N	2015-12-28 10:20:53.227326-05
26	2	76	Simple4	2015-12-28 10:24:31.256323-05
28	9	76	test	2015-12-28 10:32:27.148039-05
30	10	76	Simple4	2015-12-28 10:38:26.782251-05
31	2	112	{"c2":"","c6":"","c16":"","c20":"","c24":"Var 1"}	2015-12-28 10:40:19.848002-05
32	9	112	{"c7":"","c5":""}	2015-12-29 08:19:58.014129-05
\.


--
-- Name: SurveyAnswers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"SurveyAnswers_id_seq"', 33, true);


--
-- Data for Name: Surveys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "Surveys" (id, data) FROM stdin;
10	{"fields":[{"label":"Test","field_type":"text","required":true,"field_options":{"size":"small"},"cid":"c2"}]}
2	{"fields":[{"label":"Test","field_type":"text","required":true,"field_options":{"size":"small"},"cid":"c2"},{"label":"Checkboxes","field_type":"checkboxes","required":true,"field_options":{"options":[{"label":"option 1","checked":false},{"label":"option 2","checked":false}],"include_other_option":true},"cid":"c6"},{"label":"Dollars","field_type":"price","required":true,"field_options":{"description":"Dollars info"},"cid":"c16"},{"label":"Big text","field_type":"paragraph","required":true,"field_options":{"size":"large","description":"Big text"},"cid":"c20"},{"label":"Radio","field_type":"dropdown","required":true,"field_options":{"options":[{"label":"Var 1","checked":false},{"label":"Var 2","checked":false}],"include_blank_option":false},"cid":"c24"}]}
9	{"fields":[{"label":"Untitled","field_type":"text","required":true,"field_options":{"size":"small"},"cid":"c7"},{"label":"werrweqre","field_type":"price","required":true,"field_options":{},"cid":"c5"}]}
\.


--
-- Data for Name: Token; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "Token" ("userID", body, "issuedAt") FROM stdin;
54	138e393f51e47d66cdaaa971fa7c71a25f48b920f6113af53c9aecc543131dbf	2014-12-27 09:19:14.374563
90	2878e3b16a25a788668ce4023f745ed9324d6605a837d051422f049ef439761f	2015-06-08 16:02:34.826848
84	5a22e7b0f76e3a3011ef1ced877d444806f04db6571cdabb865b25c342f58c8d	2015-01-29 07:55:10.279829
93	d3b0757b1035fc5fa130676fdf62e779242d5eba6f68592de08435e242861f47	2015-03-11 17:06:01.216828
95	c959cb1a316def33d13482ffcfccba8e03228959541fc38cda9f199a13ce567a	2015-03-17 15:06:37.981102
35	32824b0efed0c0be53bd119c4fddd6b1ed7fbd5f168d2d0e7d2e5c21b9fa4758	2015-03-31 14:16:41.713094
47	63280a3b1a237ead9420f3390d6e71d8146583163444f633ea63805942a7b662	2015-06-09 19:01:32.517733
56	459e823d1b7d6f8e8e6ca62f9410e53d104a740d1e3375b7a2228469d1101ded	2014-12-16 08:14:51.989618
82	b4e7d7cc1b65363f9bfdca6551f3b5f246e9a8f0c5539d18531356cfd5030b5d	2015-03-31 18:11:38.391391
37	82a86da182c9ea21e52abc9779734320eab1b4da7a5432c880ca34f3d352fe61	2015-03-26 13:02:01.193949
92	a1a6922abc8484d7eff1775e7252c5544266eaec1e2fb1a0802e339d6e3213fd	2015-03-18 02:48:49.447903
55	b751f994bb3276f999bff4a90e1382c8605a6941c438a80036dcd625281e3ae2	2030-12-12 00:00:00
94	7861d7b1b7ece30611abcee336f4d9688cc2b0ee93d22f040876998e2f8d682a	2015-03-12 15:37:18.88121
60	092149628a4e696b05a5cada1268c3ee28a9f1accd39762cdde7290b9bdad9fd	2015-01-21 06:40:54.552954
80	4021521fa146a7e1ab23cdc120842fa367c0cacccc7df7fb1849844b6ad5e593	2015-01-04 03:19:34.092721
78	c6553d8b8585f32f967f0d989fc5cc46c1080b56a5cdd9e95c791444aac26c25	2015-01-23 08:44:49.886475
100	615b1ea5e119eb7e978ad87cc0c8fc6b7de20863e654d5932030a86ed66cbf95	2015-04-18 06:53:34.601861
23	b751f994bb3276f999bff4a90e1382c8605a6941c438a80036dcd625281e3ae4	2030-12-12 00:00:00
79	5783126d22cdc1652e2eb85cab7d845ca07977db88f4cdf9aa3d382cb5cc5773	2015-02-16 07:13:08.992361
32	44ad2ad13a7404e7f0bf8159f66aca6e64977ea130dc3abcce3490b1499a2b10	2015-11-04 16:19:23.518684
81	f8901ae375580f43a4eb88bfc670328090f57196159d3045a14671fd7279ecdd	2015-02-16 16:15:16.362536
65	9a45d1a3daf81b719aa18763b7601e5c34c0a04bfbaaaa001e7afd9d8a86b3cd	2014-12-24 07:16:46.830463
66	72a8c0f1e7434d3571a68d129d90bd7134671ffefbb24614fd64fc11f7197f91	2014-12-24 10:09:50.929946
67	376e059baf41f99121f79c1dafaac62f54553859b9704c590354e655f9de1f0a	2014-12-24 11:49:53.942986
86	2f5ddf958264aca7c3ce4a53e2490fc9dd75fd115479145317f2c8caa82636e2	2015-02-17 19:07:47.263378
46	ac644942a5482c612aef6e6cc95af0943b07174bd731c82be57eaa1800c8aee9	2014-12-08 11:00:52.40202
97	76ab934899e329a50dfe622965c0dd708da829d29eb8aa0c5e8f6f2835d3f29a	2015-04-11 16:40:58.143145
71	4e7ee2a847dbb46fd79b51bc2436c791f2d436b21c596bd1a9a1fcf9edf14045	2014-12-25 02:01:03.152349
73	e36b675edb3584f2a8cd249e92eeea9772c3821e3db69c8b837c8e6a8f893aa3	2014-12-25 02:21:34.132064
89	f3584df036468d8c876a7173881d2a84361f885e2140c162c0f51bacd02196f2	2015-02-19 06:58:07.557545
74	84a8246838d2459201857c0b9ab5c5e6597ab7f21854552cf48dca942038c5a7	2014-12-25 02:34:50.442223
83	dc525f47bbc3ed683761458a20bffcc2f2ccbb603734886b616d3e668ce6b5e5	2015-01-28 16:41:32.884523
91	f1f8d861a6ef4f87b03974f2db9d9b20a93a068b368691975f1a6ad4604f3c06	2015-03-10 16:43:09.509843
36	e0c921b2103e4bc85ca5603c36eeee22668f79d2d1cbdc8ce3fdb52283fbc010	2015-01-10 11:54:18.566218
61	397ad7404fbdcfad2ab63b77df0492987a5752f8a2dd2f0e6bb66011387306fe	2015-01-15 07:12:11.646917
107	e7f38c6fa61a87bd7dcfa67efcca026a78c763a416475146c39076d0244e61e9	2015-05-05 04:15:59.197305
105	a71cd5a58bb857fedc18dc6cf51472f7bdd921278c57610ca41142d0272e31de	2015-04-22 20:33:44.912491
106	b11d21dec7b35b5ea15f98725e3f69dd26db63d4242d51d6d0954498a3b96642	2015-04-23 17:40:47.393725
98	87e14a884f1999f635b23fe69a6af060d1d772617bb0650d8b96a2a9025e02db	2015-04-15 05:23:33.394182
34	8360cde8f130fbf049b857c36cdeddb001aef925f25bd948363a3290866372e2	2015-04-24 07:20:13.671901
87	b87869b93b608149373788b6f61b5ad00e188100fca24f57f6adecebe25008f5	2015-05-23 19:21:37.442341
99	33970a123f368661d777d8b7570eac165c381d802b23eb601cba764cbf1ace3b	2015-04-15 07:25:18.400175
111	a771f9c70e1a0f96d000eb248407e0e22b414f85f94d08881cd997b09252a238	2015-11-30 14:35:52.400036
115	fcd17d4d37e45731832c1f94e3d15d8753dce9fac6dceda4350246719600cd05	2015-12-01 13:16:04.838175
122	755194832bb76649694c5a294a0b31e4baf67c8a88c491fb45a1b4bf52dd50d0	2015-12-01 18:07:39.474604
123	d228a9e4d33bb719dcf461532400b34b0d836564a1ef3f32c00015b5bc5834b3	2015-12-01 18:09:23.11958
126	c345a94e604bfa5e153118004c94675529f84b2d0f2a2266547f7a229143320a	2015-12-03 16:49:16.734867
76	4999dd0c864bba8613613e6680dafafc6b0e1bddc7931ec47feefba04ffce40d	2015-12-29 14:35:55.843297
114	f6d276f5ef67e8b121620646a0686568f8811d57125a5cd92b97cd017379bd0e	2015-12-30 14:01:27.285999
112	660548b5adc4748e70169d95fc81adb79c307f603685de4bdd6bdcb549092475	2016-01-18 16:52:01.238276
\.


--
-- Data for Name: Translations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "Translations" ("essenceId", "entityId", field, "langId", value) FROM stdin;
4	1	title	2	Яблоко
4	2	title	2	Ярбуз
4	2	description	2	Вкусный большой ярбуз
4	1	description	2	Спелое зеленое яблоко
4	1	title	1	Apple
4	1	description	1	Fresh green apple
4	2	title	1	Watemelon
4	2	description	1	Big watermelon
5	1	name	2	Страна
6	1	name	2	Цель 1
8	1	name	2	Низкий доход
7	1	name	2	Размер дохода (Всемирный банк)
\.


--
-- Data for Name: UnitOfAnalysis; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "UnitOfAnalysis" (id, "gadmId0", "gadmId1", "gadmId2", "gadmId3", "gadmObjectId", "ISO", "ISO2", "nameISO", name, description, "shortName", "HASC", "unitOfAnalysisType", "parentId", "creatorId", "ownerId", visibility, status, "createTime", "deleteTime", "langId") FROM stdin;
1	\N	\N	\N	\N	\N	\N	\N	\N	Target1	Target1 description	t1	\N	1	\N	114	114	1	1	2015-12-23 11:10:43	\N	1
2	\N	\N	\N	\N	\N	\N	\N	\N	Target 2	Testing ...........	t2	\N	2	\N	114	114	1	2	2015-12-23 11:37:52.072	\N	1
\.


--
-- Data for Name: UnitOfAnalysisClassType; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "UnitOfAnalysisClassType" (id, name, description, "langId") FROM stdin;
1	Income Size WBC	Income size classification (World Bank)	1
\.


--
-- Name: UnitOfAnalysisClassType_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"UnitOfAnalysisClassType_id_seq"', 2, true);


--
-- Data for Name: UnitOfAnalysisTag; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "UnitOfAnalysisTag" (id, name, description, "langId", "classTypeId") FROM stdin;
3	Low income	Low income WB class	1	1
\.


--
-- Name: UnitOfAnalysisTag_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"UnitOfAnalysisTag_id_seq"', 3, true);


--
-- Data for Name: UnitOfAnalysisType; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "UnitOfAnalysisType" (id, name, description, "langId") FROM stdin;
1	Country	\N	1
2	International Region	\N	1
3	Sub-National: Province	\N	1
4	Sub-National: State	\N	1
5	Sub-National: Region	\N	1
6	Sub-National: City/Municipality	\N	1
7	Organization	\N	1
8	Government Unit/Project	\N	1
9	Sector	\N	1
\.


--
-- Name: UnitOfAnalysisType_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"UnitOfAnalysisType_id_seq"', 9, true);


--
-- Name: UnitOfAnalysis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"UnitOfAnalysis_id_seq"', 4, true);


--
-- Data for Name: UserRights; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "UserRights" ("userID", "rightID", "canDo") FROM stdin;
\.


--
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "Users" ("roleID", id, email, "firstName", "lastName", password, mobile, birthday, "resetPasswordToken", "resetPasswordExpires", created, updated, "isActive", "activationToken", "organizationId") FROM stdin;
3	127	babushkin.semyon@gmail.com	Semyon	Babushkin	7411477a92034069a0b8df36572fae0e20638264c781796760fcd8f5c9b27746	\N	\N	\N	\N	2015-12-03 09:01:50.786677-05	2015-12-03 17:02:21.232973	t	\N	11
1	114	dtseytlin@gmail.com	Dmitry	Tseytlin	06bf092523eae1ead26398d2209b60119cf936d0abeaf77cb395dc6c6bb9c886	\N	\N	\N	\N	2015-12-01 03:51:40.983331-05	2015-12-01 12:13:38.662831	t	\N	\N
1	112	no@mail.net	test	admin	2d97fa50e82fb50e883dfd491565f276349eed70dbf0ed0c188b051018ede809	\N	\N	\N	\N	2015-11-26 07:52:45.264987-05	2015-12-21 12:37:40.832334	t	\N	\N
2	124	eugen@sinergo.ru	Sluchanko	Eugen	fa2a10a34565fd42459ffb63372951c9372026820d806ec8f2cf21ffd2572f55	\N	\N	\N	\N	2015-12-01 10:10:46.517976-05	2015-12-01 18:13:50.247408	t	\N	\N
2	125	no@email.net	test	client	2d97fa50e82fb50e883dfd491565f276349eed70dbf0ed0c188b051018ede809	\N	\N	\N	\N	2015-12-02 07:38:37.214467-05	2015-12-21 12:41:35.45101	t	\N	7
1	130	user@host.net	John	\N	1fc7765730263306c51ef79704bc3972e4451c58fbbee17ba531ce8515abc59a	\N	\N	\N	\N	2015-12-24 08:17:36.638694-05	\N	\N	\N	\N
1	76	next15@mail.ru	Semyon	Babushkin	0e1712e80207b36cc834dcceaf613ef2b6d00c672e02b63e2ed2ed4d65084fcc	\N	\N	\N	\N	2015-03-07 19:00:00-05	2015-12-25 16:17:17.886326	t	\N	11
1	131	iivanov@sinergo.ru	Igor	Ivanov	17c457406a00638bf5b78832488bcadfa9e90d1f5a60b2e71ae519f484c1ae25	\N	\N	\N	\N	2015-12-28 05:41:19.935-05	2015-12-28 14:34:18.829828	f	1c819246e00663f6ffb7829fa344329cdb822251fb57210495a52763e5f2a478	\N
2	134	qwerty@test.ru	Simple	User	3cdf90402b4667d989b4ebd33bfaebdea7a23d712232a5c3d97b10096cec8474	\N	\N	\N	\N	2015-12-28 08:25:38.78727-05	2015-12-28 16:25:38.946759	f	5aaff69afb6618e2aecaad7fa240d772b776894d18e4473a9ac2ef2208d9a336	15
\.


--
-- Name: brand_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('brand_id_seq', 19, true);


--
-- Name: country_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('country_id_seq', 248, true);


--
-- Name: order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('order_id_seq', 320, true);


--
-- Name: role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('role_id_seq', 11, true);


--
-- Name: transport_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('transport_id_seq', 22, true);


--
-- Name: transportmodel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('transportmodel_id_seq', 24, true);


--
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('user_id_seq', 134, true);


--
-- Name: AccessMatrix_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "AccessMatrices"
    ADD CONSTRAINT "AccessMatrix_pkey" PRIMARY KEY (id);


--
-- Name: AccessPermissions_accessMatrixId_roleId_rightId_key; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "AccessPermissions"
    ADD CONSTRAINT "AccessPermissions_accessMatrixId_roleId_rightId_key" UNIQUE ("matrixId", "roleId", "rightId");


--
-- Name: AccessPermissoins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "AccessPermissions"
    ADD CONSTRAINT "AccessPermissoins_pkey" PRIMARY KEY (id);


--
-- Name: Countries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Countries"
    ADD CONSTRAINT "Countries_pkey" PRIMARY KEY (id);


--
-- Name: EntityRoles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "EssenceRoles"
    ADD CONSTRAINT "EntityRoles_pkey" PRIMARY KEY (id);


--
-- Name: Entity_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Entity_pkey" PRIMARY KEY (id);


--
-- Name: EssenceRoles_essenceId_entityId_userId_key; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "EssenceRoles"
    ADD CONSTRAINT "EssenceRoles_essenceId_entityId_userId_key" UNIQUE ("essenceId", "entityId", "userId");


--
-- Name: Essences_fileName_key; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_fileName_key" UNIQUE ("fileName");


--
-- Name: Essences_tableName_key; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Essences"
    ADD CONSTRAINT "Essences_tableName_key" UNIQUE ("tableName");


--
-- Name: JSON_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Surveys"
    ADD CONSTRAINT "JSON_pkey" PRIMARY KEY (id);


--
-- Name: Languages_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Languages"
    ADD CONSTRAINT "Languages_code_key" UNIQUE (code);


--
-- Name: Languages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Languages"
    ADD CONSTRAINT "Languages_pkey" PRIMARY KEY (id);


--
-- Name: Organizations_adminUserId_key; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_adminUserId_key" UNIQUE ("adminUserId");


--
-- Name: Organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_pkey" PRIMARY KEY (id);


--
-- Name: Product_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: Projects_codeName_key; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_codeName_key" UNIQUE ("codeName");


--
-- Name: Projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_pkey" PRIMARY KEY (id);


--
-- Name: Rights_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Rights"
    ADD CONSTRAINT "Rights_pkey" PRIMARY KEY (id);


--
-- Name: SurveyAnswers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_pkey" PRIMARY KEY (id);


--
-- Name: SurveyAnswers_surveyId_userId_key; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_surveyId_userId_key" UNIQUE ("surveyId", "userId");


--
-- Name: Translations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_pkey" PRIMARY KEY ("essenceId", "entityId", field, "langId");


--
-- Name: UnitOfAnalysisClassType_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysisClassType"
    ADD CONSTRAINT "UnitOfAnalysisClassType_pkey" PRIMARY KEY (id);


--
-- Name: UnitOfAnalysisTag_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_pkey" PRIMARY KEY (id);


--
-- Name: UnitOfAnalysisType_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysisType"
    ADD CONSTRAINT "UnitOfAnalysisType_pkey" PRIMARY KEY (id);


--
-- Name: UnitOfAnalysis_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_pkey" PRIMARY KEY (id);


--
-- Name: Users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- Name: id; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Roles"
    ADD CONSTRAINT id PRIMARY KEY (id);


--
-- Name: roleRight_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "roleRight_pkey" PRIMARY KEY ("roleID", "rightID");


--
-- Name: userID; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "userID" PRIMARY KEY (id);


--
-- Name: userRights_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "UserRights"
    ADD CONSTRAINT "userRights_pkey" PRIMARY KEY ("userID", "rightID");


--
-- Name: Rights_action_idx; Type: INDEX; Schema: public; Owner: postgres; Tablespace: 
--

CREATE UNIQUE INDEX "Rights_action_idx" ON "Rights" USING btree (action);


--
-- Name: Token_body_idx; Type: INDEX; Schema: public; Owner: postgres; Tablespace: 
--

CREATE UNIQUE INDEX "Token_body_idx" ON "Token" USING btree (body);


--
-- Name: fki_roleID; Type: INDEX; Schema: public; Owner: postgres; Tablespace: 
--

CREATE INDEX "fki_roleID" ON "Users" USING btree ("roleID");


--
-- Name: fki_rolesrights_rightID; Type: INDEX; Schema: public; Owner: postgres; Tablespace: 
--

CREATE INDEX "fki_rolesrights_rightID" ON "RolesRights" USING btree ("rightID");


--
-- Name: tr_delete_token; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tr_delete_token BEFORE INSERT ON "Token" FOR EACH ROW EXECUTE PROCEDURE twc_delete_old_token();


--
-- Name: users_before_update; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER users_before_update BEFORE UPDATE ON "Users" FOR EACH ROW EXECUTE PROCEDURE users_before_update();


--
-- Name: Organizations_adminUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Organizations"
    ADD CONSTRAINT "Organizations_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "Users"(id);


--
-- Name: Products_originalLangId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_originalLangId_fkey" FOREIGN KEY ("originalLangId") REFERENCES "Languages"(id);


--
-- Name: Projects_accessMatrixId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_accessMatrixId_fkey" FOREIGN KEY ("matrixId") REFERENCES "AccessMatrices"(id);


--
-- Name: Projects_adminUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "Users"(id);


--
-- Name: Projects_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- Name: Rights_essence_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Rights"
    ADD CONSTRAINT "Rights_essence_id_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- Name: RolesRights_roleID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "RolesRights_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "Roles"(id);


--
-- Name: SurveyAnswers_surveyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Surveys"(id);


--
-- Name: SurveyAnswers_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"(id);


--
-- Name: Translations_essence_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_essence_id_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- Name: Translations_lang_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_lang_id_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysisClassType_langId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysisClassType"
    ADD CONSTRAINT "UnitOfAnalysisClassType_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysisTag_classTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_classTypeId_fkey" FOREIGN KEY ("classTypeId") REFERENCES "UnitOfAnalysisClassType"(id);


--
-- Name: UnitOfAnalysisTag_langId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysisType_langId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysisType"
    ADD CONSTRAINT "UnitOfAnalysisType_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysis_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Users"(id);


--
-- Name: UnitOfAnalysis_langId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysis_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Users"(id);


--
-- Name: UnitOfAnalysis_unitOfAnalysisType_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_unitOfAnalysisType_fkey" FOREIGN KEY ("unitOfAnalysisType") REFERENCES "UnitOfAnalysisType"(id);


--
-- Name: Users_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- Name: Users_roleID_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_roleID_fkey" FOREIGN KEY ("roleID") REFERENCES "Roles"(id);


--
-- Name: essence_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "EssenceRoles"
    ADD CONSTRAINT essence_fkey FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- Name: role_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "EssenceRoles"
    ADD CONSTRAINT role_fkey FOREIGN KEY ("roleId") REFERENCES "Roles"(id);


--
-- Name: rolesrights_rightID; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "RolesRights"
    ADD CONSTRAINT "rolesrights_rightID" FOREIGN KEY ("rightID") REFERENCES "Rights"(id);


--
-- Name: user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "EssenceRoles"
    ADD CONSTRAINT user_fkey FOREIGN KEY ("userId") REFERENCES "Users"(id);


--
-- Name: public; Type: ACL; Schema: -; Owner: Jacob
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM "Jacob";
GRANT ALL ON SCHEMA public TO "Jacob";
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

