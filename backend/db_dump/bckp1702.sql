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


ALTER TABLE public."AccessMatrices" OWNER TO postgres;

--
-- Name: AccessMatix_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "AccessMatix_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."AccessMatix_id_seq" OWNER TO postgres;

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


ALTER TABLE public."AccessPermissions" OWNER TO postgres;

--
-- Name: AccessPermissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "AccessPermissions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."AccessPermissions_id_seq" OWNER TO postgres;

--
-- Name: AccessPermissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "AccessPermissions_id_seq" OWNED BY "AccessPermissions".id;


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


ALTER TABLE public."Essences" OWNER TO postgres;

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


ALTER TABLE public."Entities_id_seq" OWNER TO postgres;

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


ALTER TABLE public."EssenceRoles" OWNER TO postgres;

--
-- Name: EntityRoles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "EntityRoles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."EntityRoles_id_seq" OWNER TO postgres;

--
-- Name: EntityRoles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "EntityRoles_id_seq" OWNED BY "EssenceRoles".id;


--
-- Name: Surveys; Type: TABLE; Schema: public; Owner: indaba; Tablespace: 
--

CREATE TABLE "Surveys" (
    id integer NOT NULL,
    title character varying,
    description text,
    created timestamp with time zone DEFAULT now() NOT NULL,
    "projectId" integer
);


ALTER TABLE public."Surveys" OWNER TO indaba;

--
-- Name: JSON_id_seq; Type: SEQUENCE; Schema: public; Owner: indaba
--

CREATE SEQUENCE "JSON_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."JSON_id_seq" OWNER TO indaba;

--
-- Name: JSON_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: indaba
--

ALTER SEQUENCE "JSON_id_seq" OWNED BY "Surveys".id;


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


ALTER TABLE public."Organizations" OWNER TO postgres;

--
-- Name: Organizations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "Organizations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Organizations_id_seq" OWNER TO postgres;

--
-- Name: Organizations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "Organizations_id_seq" OWNED BY "Organizations".id;


--
-- Name: ProductUOA; Type: TABLE; Schema: public; Owner: indaba; Tablespace: 
--

CREATE TABLE "ProductUOA" (
    "productId" integer NOT NULL,
    "UOAid" integer NOT NULL
);


ALTER TABLE public."ProductUOA" OWNER TO indaba;

--
-- Name: Products; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE "Products" (
    id integer NOT NULL,
    title character varying(100),
    description text,
    "originalLangId" integer,
    "projectId" integer,
    "surveyId" integer,
    status smallint DEFAULT 0 NOT NULL
);


ALTER TABLE public."Products" OWNER TO postgres;

--
-- Name: Products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "Products_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Products_id_seq" OWNER TO postgres;

--
-- Name: Products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE "Products_id_seq" OWNED BY "Products".id;


--
-- Name: Projects; Type: TABLE; Schema: public; Owner: indaba; Tablespace: 
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


ALTER TABLE public."Projects" OWNER TO indaba;

--
-- Name: Projects_id_seq; Type: SEQUENCE; Schema: public; Owner: indaba
--

CREATE SEQUENCE "Projects_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Projects_id_seq" OWNER TO indaba;

--
-- Name: Projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: indaba
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


ALTER TABLE public."Rights" OWNER TO postgres;

--
-- Name: Rights_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "Rights_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Rights_id_seq" OWNER TO postgres;

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


ALTER TABLE public.role_id_seq OWNER TO postgres;

--
-- Name: Roles; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE "Roles" (
    id integer DEFAULT nextval('role_id_seq'::regclass) NOT NULL,
    name character varying(20) NOT NULL,
    "isSystem" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Roles" OWNER TO postgres;

--
-- Name: RolesRights; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE "RolesRights" (
    "roleID" bigint NOT NULL,
    "rightID" bigint NOT NULL
);


ALTER TABLE public."RolesRights" OWNER TO postgres;

--
-- Name: SurveyAnswerVersions; Type: TABLE; Schema: public; Owner: indaba; Tablespace: 
--

CREATE TABLE "SurveyAnswerVersions" (
    value character varying,
    "optionId" integer,
    created timestamp with time zone DEFAULT now() NOT NULL,
    "userId" integer,
    comment character varying,
    id integer NOT NULL
);


ALTER TABLE public."SurveyAnswerVersions" OWNER TO indaba;

--
-- Name: SurveyAnswerVersions_id_seq; Type: SEQUENCE; Schema: public; Owner: indaba
--

CREATE SEQUENCE "SurveyAnswerVersions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."SurveyAnswerVersions_id_seq" OWNER TO indaba;

--
-- Name: SurveyAnswerVersions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: indaba
--

ALTER SEQUENCE "SurveyAnswerVersions_id_seq" OWNED BY "SurveyAnswerVersions".id;


--
-- Name: SurveyAnswers; Type: TABLE; Schema: public; Owner: indaba; Tablespace: 
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
    version integer,
    "surveyId" integer
);


ALTER TABLE public."SurveyAnswers" OWNER TO indaba;

--
-- Name: SurveyAnswers_id_seq; Type: SEQUENCE; Schema: public; Owner: indaba
--

CREATE SEQUENCE "SurveyAnswers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."SurveyAnswers_id_seq" OWNER TO indaba;

--
-- Name: SurveyAnswers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: indaba
--

ALTER SEQUENCE "SurveyAnswers_id_seq" OWNED BY "SurveyAnswers".id;


--
-- Name: SurveyQuestionOptions; Type: TABLE; Schema: public; Owner: indaba; Tablespace: 
--

CREATE TABLE "SurveyQuestionOptions" (
    id integer NOT NULL,
    "questionId" integer,
    value character varying,
    label character varying,
    skip smallint,
    "isSelected" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."SurveyQuestionOptions" OWNER TO indaba;

--
-- Name: SurveyQuestions; Type: TABLE; Schema: public; Owner: indaba; Tablespace: 
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
    qid character varying
);


ALTER TABLE public."SurveyQuestions" OWNER TO indaba;

--
-- Name: SurveyQuestions_id_seq; Type: SEQUENCE; Schema: public; Owner: indaba
--

CREATE SEQUENCE "SurveyQuestions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."SurveyQuestions_id_seq" OWNER TO indaba;

--
-- Name: SurveyQuestions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: indaba
--

ALTER SEQUENCE "SurveyQuestions_id_seq" OWNED BY "SurveyQuestions".id;


--
-- Name: Tasks; Type: TABLE; Schema: public; Owner: indaba; Tablespace: 
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


ALTER TABLE public."Tasks" OWNER TO indaba;

--
-- Name: COLUMN "Tasks"."entityTypeRoleId"; Type: COMMENT; Schema: public; Owner: indaba
--

COMMENT ON COLUMN "Tasks"."entityTypeRoleId" IS 'table EssenceRoles';


--
-- Name: Tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: indaba
--

CREATE SEQUENCE "Tasks_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Tasks_id_seq" OWNER TO indaba;

--
-- Name: Tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: indaba
--

ALTER SEQUENCE "Tasks_id_seq" OWNED BY "Tasks".id;


--
-- Name: Token; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE "Token" (
    "userID" integer NOT NULL,
    body character varying(200) NOT NULL,
    "issuedAt" timestamp without time zone DEFAULT ('now'::text)::timestamp without time zone NOT NULL
);


ALTER TABLE public."Token" OWNER TO postgres;

--
-- Name: Translations; Type: TABLE; Schema: public; Owner: indaba; Tablespace: 
--

CREATE TABLE "Translations" (
    "essenceId" integer NOT NULL,
    "entityId" integer NOT NULL,
    field character varying(100) NOT NULL,
    "langId" integer NOT NULL,
    value text
);


ALTER TABLE public."Translations" OWNER TO indaba;

--
-- Name: UnitOfAnalysis_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE "UnitOfAnalysis_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."UnitOfAnalysis_id_seq" OWNER TO postgres;

--
-- Name: UnitOfAnalysis; Type: TABLE; Schema: public; Owner: indaba; Tablespace: 
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


ALTER TABLE public."UnitOfAnalysis" OWNER TO indaba;

--
-- Name: COLUMN "UnitOfAnalysis"."gadmId0"; Type: COMMENT; Schema: public; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId0" IS 'ID0 for use with GADM shapefile';


--
-- Name: COLUMN "UnitOfAnalysis"."gadmId1"; Type: COMMENT; Schema: public; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId1" IS 'ID1 for use with GADM shapefile';


--
-- Name: COLUMN "UnitOfAnalysis"."gadmId2"; Type: COMMENT; Schema: public; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId2" IS 'ID2 for use with GADM shapefile';


--
-- Name: COLUMN "UnitOfAnalysis"."gadmId3"; Type: COMMENT; Schema: public; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmId3" IS 'ID3 for use with GADM shapefile';


--
-- Name: COLUMN "UnitOfAnalysis"."gadmObjectId"; Type: COMMENT; Schema: public; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."gadmObjectId" IS 'OBJECTID for use with GADM shapefile (only Global Shapefile)';


--
-- Name: COLUMN "UnitOfAnalysis"."ISO"; Type: COMMENT; Schema: public; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."ISO" IS 'only for Country level Unit Of Analysis';


--
-- Name: COLUMN "UnitOfAnalysis"."ISO2"; Type: COMMENT; Schema: public; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."ISO2" IS 'only for Country level Unit Of Analysis';


--
-- Name: COLUMN "UnitOfAnalysis"."nameISO"; Type: COMMENT; Schema: public; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."nameISO" IS 'only for Country level Unit Of Analysis';


--
-- Name: COLUMN "UnitOfAnalysis".name; Type: COMMENT; Schema: public; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis".name IS 'Multilanguage';


--
-- Name: COLUMN "UnitOfAnalysis".description; Type: COMMENT; Schema: public; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis".description IS 'Multilanguage';


--
-- Name: COLUMN "UnitOfAnalysis"."shortName"; Type: COMMENT; Schema: public; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."shortName" IS 'Multilanguage';


--
-- Name: COLUMN "UnitOfAnalysis"."HASC"; Type: COMMENT; Schema: public; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."HASC" IS '(example RU.AD.OK)';


--
-- Name: COLUMN "UnitOfAnalysis"."unitOfAnalysisType"; Type: COMMENT; Schema: public; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."unitOfAnalysisType" IS 'reference to table UnitOfAnalysisType';


--
-- Name: COLUMN "UnitOfAnalysis"."parentId"; Type: COMMENT; Schema: public; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."parentId" IS 'Link to Parent Unit of Analysis if exist';


--
-- Name: COLUMN "UnitOfAnalysis"."creatorId"; Type: COMMENT; Schema: public; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."creatorId" IS 'Creator Id (User Id)';


--
-- Name: COLUMN "UnitOfAnalysis"."ownerId"; Type: COMMENT; Schema: public; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis"."ownerId" IS 'Owner Id (User Id)';


--
-- Name: COLUMN "UnitOfAnalysis".visibility; Type: COMMENT; Schema: public; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysis".visibility IS '1 = public; 2 = private;';


--
-- Name: COLUMN "UnitOfAnalysis".status; Type: COMMENT; Schema: public; Owner: indaba
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


ALTER TABLE public."UnitOfAnalysisClassType_id_seq" OWNER TO postgres;

--
-- Name: UnitOfAnalysisClassType; Type: TABLE; Schema: public; Owner: indaba; Tablespace: 
--

CREATE TABLE "UnitOfAnalysisClassType" (
    id smallint DEFAULT nextval('"UnitOfAnalysisClassType_id_seq"'::regclass) NOT NULL,
    name character varying(45) NOT NULL,
    description character varying(255),
    "langId" smallint DEFAULT 1 NOT NULL
);


ALTER TABLE public."UnitOfAnalysisClassType" OWNER TO indaba;

--
-- Name: COLUMN "UnitOfAnalysisClassType".name; Type: COMMENT; Schema: public; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysisClassType".name IS 'Classification Name (for example - World Bank classification) ';


--
-- Name: COLUMN "UnitOfAnalysisClassType".description; Type: COMMENT; Schema: public; Owner: indaba
--

COMMENT ON COLUMN "UnitOfAnalysisClassType".description IS 'Classification Name description';


--
-- Name: UnitOfAnalysisTag; Type: TABLE; Schema: public; Owner: indaba; Tablespace: 
--

CREATE TABLE "UnitOfAnalysisTag" (
    id smallint NOT NULL,
    name character varying(45) NOT NULL,
    description character varying(255),
    "langId" integer DEFAULT 1 NOT NULL,
    "classTypeId" smallint NOT NULL
);


ALTER TABLE public."UnitOfAnalysisTag" OWNER TO indaba;

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
-- Name: UnitOfAnalysisTagLink; Type: TABLE; Schema: public; Owner: indaba; Tablespace: 
--

CREATE TABLE "UnitOfAnalysisTagLink" (
    id integer DEFAULT nextval('"UnitOfAnalysisTagLink_id_seq"'::regclass) NOT NULL,
    "uoaId" integer NOT NULL,
    "uoaTagId" integer NOT NULL
);


ALTER TABLE public."UnitOfAnalysisTagLink" OWNER TO indaba;

--
-- Name: UnitOfAnalysisTag_id_seq; Type: SEQUENCE; Schema: public; Owner: indaba
--

CREATE SEQUENCE "UnitOfAnalysisTag_id_seq"
    START WITH 9
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."UnitOfAnalysisTag_id_seq" OWNER TO indaba;

--
-- Name: UnitOfAnalysisTag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: indaba
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


ALTER TABLE public."UnitOfAnalysisType_id_seq" OWNER TO postgres;

--
-- Name: UnitOfAnalysisType; Type: TABLE; Schema: public; Owner: indaba; Tablespace: 
--

CREATE TABLE "UnitOfAnalysisType" (
    id smallint DEFAULT nextval('"UnitOfAnalysisType_id_seq"'::regclass) NOT NULL,
    name character varying(40) NOT NULL,
    description character varying(255),
    "langId" integer DEFAULT 1 NOT NULL
);


ALTER TABLE public."UnitOfAnalysisType" OWNER TO indaba;

--
-- Name: UserRights; Type: TABLE; Schema: public; Owner: postgres; Tablespace: 
--

CREATE TABLE "UserRights" (
    "userID" bigint NOT NULL,
    "rightID" bigint NOT NULL,
    "canDo" boolean
);


ALTER TABLE public."UserRights" OWNER TO postgres;

--
-- Name: UserUOA; Type: TABLE; Schema: public; Owner: indaba; Tablespace: 
--

CREATE TABLE "UserUOA" (
    "UserId" integer NOT NULL,
    "UOAid" integer NOT NULL
);


ALTER TABLE public."UserUOA" OWNER TO indaba;

--
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_id_seq OWNER TO postgres;

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
    affiliation character varying
);


ALTER TABLE public."Users" OWNER TO postgres;

--
-- Name: WorkflowSteps; Type: TABLE; Schema: public; Owner: indaba; Tablespace: 
--

CREATE TABLE "WorkflowSteps" (
    "workflowId" integer NOT NULL,
    id integer NOT NULL,
    "startDate" timestamp with time zone,
    "endDate" timestamp with time zone,
    "roleId" integer,
    title character varying,
    "taskAccessToResponses" boolean,
    "taskAccessToDiscussions" boolean,
    "taskBlindReview" boolean,
    "workflowAccessToResponses" boolean,
    "workflowAccessToDiscussions" boolean,
    "workflowBlindReview" boolean,
    "position" integer,
    "writeToAnswers" boolean
);


ALTER TABLE public."WorkflowSteps" OWNER TO indaba;

--
-- Name: WorkflowSteps_id_seq; Type: SEQUENCE; Schema: public; Owner: indaba
--

CREATE SEQUENCE "WorkflowSteps_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."WorkflowSteps_id_seq" OWNER TO indaba;

--
-- Name: WorkflowSteps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: indaba
--

ALTER SEQUENCE "WorkflowSteps_id_seq" OWNED BY "WorkflowSteps".id;


--
-- Name: Workflows; Type: TABLE; Schema: public; Owner: indaba; Tablespace: 
--

CREATE TABLE "Workflows" (
    id integer NOT NULL,
    name character varying(200),
    description text,
    created timestamp with time zone DEFAULT now() NOT NULL,
    "productId" integer
);


ALTER TABLE public."Workflows" OWNER TO indaba;

--
-- Name: Workflows_id_seq; Type: SEQUENCE; Schema: public; Owner: indaba
--

CREATE SEQUENCE "Workflows_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."Workflows_id_seq" OWNER TO indaba;

--
-- Name: Workflows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: indaba
--

ALTER SEQUENCE "Workflows_id_seq" OWNED BY "Workflows".id;


--
-- Name: brand_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE brand_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.brand_id_seq OWNER TO postgres;

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
-- Name: order_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE order_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_id_seq OWNER TO postgres;

--
-- Name: surveyQuestionOptions_id_seq; Type: SEQUENCE; Schema: public; Owner: indaba
--

CREATE SEQUENCE "surveyQuestionOptions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."surveyQuestionOptions_id_seq" OWNER TO indaba;

--
-- Name: surveyQuestionOptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: indaba
--

ALTER SEQUENCE "surveyQuestionOptions_id_seq" OWNED BY "SurveyQuestionOptions".id;


--
-- Name: transport_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE transport_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.transport_id_seq OWNER TO postgres;

--
-- Name: transportmodel_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE transportmodel_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.transportmodel_id_seq OWNER TO postgres;

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
-- Name: id; Type: DEFAULT; Schema: public; Owner: indaba
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
-- Name: id; Type: DEFAULT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "Projects" ALTER COLUMN id SET DEFAULT nextval('"Projects_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Rights" ALTER COLUMN id SET DEFAULT nextval('"Rights_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "SurveyAnswerVersions" ALTER COLUMN id SET DEFAULT nextval('"SurveyAnswerVersions_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "SurveyAnswers" ALTER COLUMN id SET DEFAULT nextval('"SurveyAnswers_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "SurveyQuestionOptions" ALTER COLUMN id SET DEFAULT nextval('"surveyQuestionOptions_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "SurveyQuestions" ALTER COLUMN id SET DEFAULT nextval('"SurveyQuestions_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "Surveys" ALTER COLUMN id SET DEFAULT nextval('"JSON_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "Tasks" ALTER COLUMN id SET DEFAULT nextval('"Tasks_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysisTag" ALTER COLUMN id SET DEFAULT nextval('"UnitOfAnalysisTag_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "WorkflowSteps" ALTER COLUMN id SET DEFAULT nextval('"WorkflowSteps_id_seq"'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "Workflows" ALTER COLUMN id SET DEFAULT nextval('"Workflows_id_seq"'::regclass);


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
-- Name: Entities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"Entities_id_seq"', 13, true);


--
-- Name: EntityRoles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"EntityRoles_id_seq"', 60, true);


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
19	9	125	13	6
18	10	112	13	6
21	9	135	13	17
24	8	137	13	18
30	4	136	13	2
32	5	140	13	2
33	9	131	13	2
34	4	138	13	2
35	8	139	13	2
36	11	136	13	9
37	11	76	13	2
39	5	139	13	9
40	4	138	13	9
42	4	138	13	6
43	11	140	13	6
45	9	125	13	2
44	8	112	13	2
46	11	185	13	29
47	11	186	13	29
48	4	187	13	29
49	4	188	13	29
50	10	184	13	29
51	11	205	13	31
52	14	206	13	31
53	4	207	13	31
54	12	208	13	31
55	9	204	13	31
56	4	209	13	31
58	9	114	13	5
60	11	142	13	2
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
-- Name: JSON_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indaba
--

SELECT pg_catalog.setval('"JSON_id_seq"', 75, true);


--
-- Data for Name: Languages; Type: TABLE DATA; Schema: public; Owner: indaba
--

COPY "Languages" (id, name, "nativeName", code) FROM stdin;
1	English	English	en
2	Russian	Русский	ru
9	Japanese	日本語	jp
\.


--
-- Name: Languages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indaba
--

SELECT pg_catalog.setval('"Languages_id_seq"', 9, true);


--
-- Data for Name: Organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "Organizations" (id, name, address, "adminUserId", url, "enforceApiSecurity", "isActive") FROM stdin;
11	Google	New york	76	http://google.com	\N	t
7	test Organization	South pole	125	http://www.example.org	\N	t
12	Your new organization	\N	131	\N	\N	f
15	Your new organization	\N	134	\N	\N	f
16	KONTORA	sxsx	135	sxsx	\N	t
19	Your new organization	\N	141	\N	\N	f
20	Your new organization	\N	175	\N	\N	f
21	IBP demo	1600 some ave.	112	http://ibp.org	\N	\N
22	Your new organization	\N	176	\N	\N	f
25	IBP new 3 (changed name)	asd	177	asd	\N	t
28	IBP 15	some address	184	http://ibp15.org	\N	t
29	Your new organization	\N	190	\N	\N	f
10	Yandex	Moscow	124	http://www.ntrlab.ru	\N	t
30	Yandex	\N	\N	\N	\N	\N
31	Yandex	\N	\N	\N	\N	\N
32	www	www1	\N	ww	\N	\N
33	Carter Center	some address	\N	http://carter.org	\N	t
34	Your new organization	\N	191	\N	\N	f
36	Your new organization	\N	193	\N	\N	f
37	Your new organization	\N	194	\N	\N	f
35	The Carter Foundation	some other address	192	http://carterdoundation.org	\N	f
38	Your new organization	\N	195	\N	\N	f
39	IBP Demo 16	some other address	\N	http://ibp16.org	\N	t
40	IBP Org (Feb 16)	some address	204	http://ibp16demo.org	\N	t
41	Reid's Test Org	an address	\N	a URL	\N	t
42	Your new organization	\N	210	\N	\N	f
43	Your new organization	\N	211	\N	\N	f
44	Transparency-Mali	908 Clear street; Bamako Mali	\N	www.transparency-Mali.com	\N	t
45	Your new organization	\N	212	\N	\N	f
46	swswsws	wswswsw	\N	swswswsws	\N	\N
47	Your new organization	\N	213	\N	\N	f
48	Your new organization	\N	214	\N	\N	f
\.


--
-- Name: Organizations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"Organizations_id_seq"', 48, true);


--
-- Data for Name: ProductUOA; Type: TABLE DATA; Schema: public; Owner: indaba
--

COPY "ProductUOA" ("productId", "UOAid") FROM stdin;
7	1
4	1
4	2
14	1
19	1
19	2
18	1
18	2
19	5
22	1
25	1
25	2
25	5
27	1
27	2
27	5
26	1
26	2
26	5
17	1
17	2
17	5
2	1
21	1
21	2
18	5
29	1
29	2
29	5
30	14
30	15
30	16
\.


--
-- Data for Name: Products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "Products" (id, title, description, "originalLangId", "projectId", "surveyId", status) FROM stdin;
4	Banana	Yellow banana	2	\N	\N	4
2	Watermelon1	My new watermelon	\N	2	2	0
17	Eating bananas	To all who eating bananas	\N	2	9	4
28	Yellow Banana 2016	banana research - 2016	\N	2	\N	0
18	wwww	wwwwwwwwwww	\N	2	9	1
29	2016 Survey of budgets	Doing it for 2016	\N	29	\N	0
19	This is a good test product!	sssssssssssssssssssssssssss	\N	2	68	1
30	2016 IBP product	Data collection for 2016	\N	31	72	1
31	Продукт Tsdima	Описание продукта Tsdima	\N	5	73	0
32	xsxsxsxsxs	xsxsxsxsxsxs	\N	2	40	0
3	Orange	My orange	1	6	\N	0
7	sssss	sssssssssssssssssss	\N	6	\N	0
16	pppppppppp	ppppppppppppppppppp	\N	19	\N	0
14	cvvvvvvvvvvvvvvvvvv22	vvvvvvvvvvvvvvvvv	\N	16	\N	0
13	cccccccccc	cccccccccccccccccccccc	\N	16	\N	0
20	iiiiiiiiiiiiiiiiiiiiiiiii	iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii	\N	2	\N	0
24	dvf	dfvdfv	\N	6	2	0
25	вкпич	вапвяар	\N	9	2	0
26	IBP 2016	new IBP research	\N	6	2	0
27	IBP 2016	blah	\N	9	2	0
1	apple	My new apple	\N	6	\N	0
21	Can I hijack this project for testing?	APM borrowing an existing product	\N	2	48	0
22	wswsws	wswssws	\N	2	48	0
\.


--
-- Name: Products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"Products_id_seq"', 32, true);


--
-- Data for Name: Projects; Type: TABLE DATA; Schema: public; Owner: indaba
--

COPY "Projects" (id, "organizationId", "codeName", description, created, "matrixId", "startTime", status, "adminUserId", "closeTime") FROM stdin;
31	40	IBP Budget 2016	2016 annual project	2016-02-16 21:20:40+03	8	2016-02-01 08:00:00+03	1	\N	2016-02-29 08:00:00+03
22	7	dddddddddd	\N	2016-01-27 13:49:47+03	8	2016-01-27 00:00:00+03	1	\N	2016-01-28 00:00:00+03
21	7	xssssssss	xssssssssssssss	2016-01-22 15:39:12+03	8	2016-01-22 00:00:00+03	0	\N	2016-02-06 00:00:00+03
18	16	wswsw	wswsw	2016-01-14 17:51:45+03	8	2016-01-14 00:00:00+03	1	135	2016-02-06 00:00:00+03
16	16	Peace 2 Peace		2016-01-14 09:34:33+03	8	2016-01-14 00:00:00+03	0	135	2016-01-30 00:00:00+03
19	16	wssws	wswsw	2016-01-14 17:52:09+03	8	2016-01-14 00:00:00+03	1	135	2016-02-05 00:00:00+03
23	7	cccc	\N	2016-01-27 14:24:53+03	8	2016-01-27 00:00:00+03	0	\N	2016-03-05 00:00:00+03
24	7	ssss	sss	2016-02-05 12:16:46+03	4	2016-03-04 00:00:00+03	0	\N	2016-02-25 00:00:00+03
15	11	qwerty4	Simple survey	2015-10-23 15:00:00+03	4	2015-12-22 00:00:00+03	0	76	2015-12-24 00:00:00+03
6	11	qwerty	\N	2015-12-24 15:00:11+03	1	2015-11-30 21:00:00+03	1	112	2015-12-30 21:00:00+03
14	11	qwerty3	Simple survey	2015-10-23 15:00:00+03	4	2015-12-22 00:00:00+03	1	76	2015-12-24 00:00:00+03
25	7	444444	4444444444444	2016-02-05 12:20:39+03	4	2016-02-20 00:00:00+03	1	\N	2016-03-13 00:00:00+03
5	11	qwerty2w	Yellow banana	2015-10-23 15:00:00+03	4	2015-12-22 00:00:00+03	1	76	2015-12-24 00:00:00+03
20	7	sssssssss	sssssssssssssssssss	2016-01-22 14:47:51+03	8	2016-01-22 00:00:00+03	1	\N	2016-03-12 00:00:00+03
26	11	trubaShatal3	\N	2016-02-05 12:59:35+03	4	\N	0	\N	\N
2	7	Yellow banana	Ела банан	2015-10-23 15:00:00+03	4	2015-12-22 00:00:00+03	1	125	2015-12-24 00:00:00+03
9	7	trubaShatal	Yellow banana	2015-10-23 15:00:00+03	4	2015-12-22 00:00:00+03	1	76	2015-12-24 00:00:00+03
27	25	Test project 15.02	Test project 15.02	2016-02-15 18:01:15+03	8	\N	1	\N	\N
28	25	SUPERPROJECT	asdfasdfasdfasdf	2016-02-15 18:02:10+03	8	\N	1	\N	\N
29	28	IBP 2016 budget	Budget research for year 2016	2016-02-15 18:55:49+03	8	2016-02-01 08:00:00+03	1	\N	2016-02-29 08:00:00+03
30	7	гргрг	гргргргрг	2016-02-16 11:12:54+03	8	2016-02-01 00:00:00+03	0	\N	2016-02-28 00:00:00+03
\.


--
-- Name: Projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indaba
--

SELECT pg_catalog.setval('"Projects_id_seq"', 31, true);


--
-- Data for Name: Rights; Type: TABLE DATA; Schema: public; Owner: postgres
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
132	product_uoa	Can get product uoa	4
133	Bruce the mighty	fghftj	13
134	users_invite	Can invite users	\N
\.


--
-- Name: Rights_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"Rights_id_seq"', 134, true);


--
-- Data for Name: Roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "Roles" (id, name, "isSystem") FROM stdin;
1	admin	t
2	client	t
5	translator	f
9	project manager	f
11	researcher	f
3	user	t
12	program officer	f
13	project support	f
8	director	f
10	research assistant	f
4	peer reviewer	f
14	government reviewer	f
15	editor	f
16	publisher	f
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
2	129
2	24
2	16
2	33
3	33
2	131
1	132
2	132
1	134
\.


--
-- Data for Name: SurveyAnswerVersions; Type: TABLE DATA; Schema: public; Owner: indaba
--

COPY "SurveyAnswerVersions" (value, "optionId", created, "userId", comment, id) FROM stdin;
my new answer	\N	2016-01-27 19:42:59.732573+03	76	\N	1
my new answer	\N	2016-01-27 19:44:16.034052+03	76	\N	2
my new answer	\N	2016-01-27 19:44:19.076628+03	76	\N	3
my new answer	\N	2016-01-27 19:44:46.897471+03	76	\N	4
\.


--
-- Name: SurveyAnswerVersions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indaba
--

SELECT pg_catalog.setval('"SurveyAnswerVersions_id_seq"', 4, true);


--
-- Data for Name: SurveyAnswers; Type: TABLE DATA; Schema: public; Owner: indaba
--

COPY "SurveyAnswers" (id, "questionId", "userId", value, created, "optionId", "productId", "UOAid", "wfStepId", version, "surveyId") FROM stdin;
43	101	112	\N	2016-02-16 14:30:12.265066+03	64	19	1	19	\N	68
42	100	112	\N	2016-02-16 14:30:12.237223+03	63	19	1	19	\N	68
5	1	76	\N	2016-02-01 20:34:52.361804+03	4	22	1	5	1	9
6	1	76	\N	2016-02-01 20:34:57.045998+03	4	22	1	5	2	9
7	1	76	\N	2016-02-01 20:35:09.664741+03	4	22	1	5	3	9
8	29	112	1	2016-02-05 18:39:59.673617+03	\N	2	2	2	1	2
9	28	112	2	2016-02-05 18:39:59.675847+03	\N	2	2	2	1	2
10	30	112	3	2016-02-05 18:39:59.68643+03	\N	2	2	2	1	2
11	29	112	1	2016-02-05 18:40:22.766947+03	\N	2	2	2	2	2
12	28	112	2	2016-02-05 18:40:28.226088+03	\N	2	2	2	2	2
13	30	112	3	2016-02-05 18:40:30.723498+03	\N	2	2	2	2	2
14	33	112	1	2016-02-08 16:03:29.833399+03	\N	19	1	19	1	40
15	33	112	11	2016-02-08 16:03:58.681633+03	\N	19	1	19	2	40
16	33	112	11	2016-02-08 16:24:44.754584+03	\N	19	1	19	3	40
17	36	112	2	2016-02-08 16:24:44.757565+03	\N	19	1	19	1	40
18	35	112	3	2016-02-08 16:24:44.763226+03	\N	19	1	19	1	40
19	33	136	cxgnhgj	2016-02-08 18:29:36.571899+03	\N	19	2	23	1	40
20	35	136	санпо ygfj	2016-02-08 18:29:36.581644+03	\N	19	2	23	1	40
21	36	136	чавр чве р	2016-02-08 18:29:36.587242+03	\N	19	2	23	1	40
22	39	136	1	2016-02-09 10:53:18.533416+03	\N	21	2	38	1	48
23	39	136	1	2016-02-09 11:22:12.235322+03	\N	21	1	38	1	48
24	36	125	szdgzsdg	2016-02-09 18:40:26.005333+03	\N	19	1	22	1	40
25	33	125	fdgdf	2016-02-09 18:40:26.010404+03	\N	19	1	22	1	40
26	35	125	vhngfn	2016-02-09 18:40:26.018761+03	\N	19	1	22	1	40
27	1	76	\N	2016-02-12 16:31:43.281753+03	4	22	1	5	4	9
28	1	76	\N	2016-02-12 16:32:33.254026+03	4	22	1	5	5	9
29	2	112	1	2016-02-15 12:15:50.073985+03	\N	19	1	19	1	9
30	32	112	2	2016-02-15 12:15:50.102295+03	\N	19	1	19	1	9
32	32	112	2	2016-02-15 17:52:57.620109+03	\N	19	1	19	\N	9
31	2	112	1	2016-02-15 17:52:57.589835+03	\N	19	1	19	\N	9
33	43	112	\N	2016-02-15 18:09:27.196175+03	11	19	1	19	\N	9
34	46	112	\N	2016-02-15 18:09:27.211847+03	13	19	1	19	\N	9
35	46	112	\N	2016-02-15 18:09:27.223203+03	13	19	1	19	\N	9
36	96	112	\N	2016-02-16 11:20:22.569618+03	57	19	1	19	\N	62
38	95	112	{"{\\"id\\":\\"57\\",\\"label\\":\\"2\\",\\"skip\\":\\"2\\",\\"value\\":\\"2\\"}"}	2016-02-16 11:20:22.606715+03	\N	19	1	19	\N	62
37	97	112	q	2016-02-16 11:20:22.603288+03	58	19	1	19	\N	62
41	1	76	\N	2016-02-16 14:14:59.208783+03	4	22	1	5	6	9
40	98	112	{"{\\"id\\":\\"59\\",\\"label\\":\\"2\\",\\"skip\\":\\"2\\",\\"value\\":\\"2\\"}","{\\"id\\":null,\\"label\\":null,\\"skip\\":\\"0\\",\\"value\\":\\"Test\\"}"}	2016-02-16 11:20:22.683106+03	\N	19	1	19	\N	62
39	97	112	q	2016-02-16 11:20:22.615217+03	59	19	1	19	\N	62
\.


--
-- Name: SurveyAnswers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indaba
--

SELECT pg_catalog.setval('"SurveyAnswers_id_seq"', 43, true);


--
-- Data for Name: SurveyQuestionOptions; Type: TABLE DATA; Schema: public; Owner: indaba
--

COPY "SurveyQuestionOptions" (id, "questionId", value, label, skip, "isSelected") FROM stdin;
2	1	Moscow	\N	\N	f
3	1	New York	\N	\N	f
4	1	London	\N	\N	f
5	4	test	\N	\N	f
9	42	20	Yes	0	t
10	42	10	No	1	f
11	43	20	Yes	0	t
12	43	10	No	1	f
13	46	20	Yes	0	t
14	46	10	No	1	f
15	47	20	Yes	0	t
16	47	10	No	1	f
17	48	20	Yes	0	t
18	48	10	No	1	f
19	49	20	Yes, realy ok!	0	t
20	49	10	No	1	f
21	50	20	Yes	0	t
22	50	10	No	1	f
23	51	20	Yes, realy ok!	0	t
24	51	10	No	1	f
53	87	1	Annual	0	f
54	87	2	Semi-annual	0	f
55	87	0	Every 5 years	0	f
56	96	1	1	1	f
57	96	2	2	2	f
58	97	1	1	1	t
59	97	2	2	2	t
60	99	1	1	1	f
61	99	2	2	2	f
62	100	1	1	1	t
63	100	2	2	2	t
64	101	1	1	1	f
65	101	2	2	2	t
66	105	1	Annual	0	f
67	105	2	Semiannual	0	f
68	105	3	Bi-Annual	0	f
72	111		option1	0	t
73	111		option2	0	f
74	112		radio 1	0	f
75	112		radio 2	0	t
76	112		radio 3	0	f
\.


--
-- Data for Name: SurveyQuestions; Type: TABLE DATA; Schema: public; Owner: indaba
--

COPY "SurveyQuestions" (id, "surveyId", type, label, "isRequired", "position", description, skip, size, "minLength", "maxLength", "isWordmml", "incOtherOpt", units, "intOnly", value, qid) FROM stdin;
2	9	1	What is your name?	t	3	\N	\N	\N	\N	\N	f	f	\N	f	\N	\N
4	9	2	Who are you?	f	5	\N	\N	\N	\N	\N	f	f	\N	f	\N	\N
32	9	1	What is your country?	t	4	\N	\N	\N	\N	\N	f	f	\N	f	\N	\N
1	9	2	What is your first name?	f	2	\N	\N	\N	\N	\N	f	f	\N	f	\N	\N
10	9	2	What is the Capital of Russia?	f	1	\N	\N	\N	\N	\N	f	f	\N	f	\N	\N
29	2	1	2nd question	t	1	\N	\N	\N	\N	\N	f	f	\N	f	\N	\N
30	2	1	Untitled	t	3	\N	\N	\N	\N	\N	f	f	\N	f	\N	\N
28	2	1	1st question	t	2	\N	\N	\N	\N	\N	f	f	\N	f	\N	\N
39	48	1	Test	t	1	\N	\N	\N	\N	\N	f	f	\N	f	\N	\N
43	9	2	Is it ok?	f	6	\N	2	\N	\N	\N	f	f	\N	f	\N	\N
44	9	2	Is it ok?	f	7	\N	2	\N	\N	\N	f	f	\N	f	\N	\N
45	9	2	Is it ok?	f	8	\N	2	\N	\N	\N	f	f	\N	f	\N	\N
46	9	2	Is it ok?	f	9	\N	2	\N	\N	\N	f	f	\N	f	\N	\N
86	59	0	Question 1	t	1	What is your budget startegy?	0	1	10	300	t	f	\N	f	\N	\N
87	59	2	Question 2	t	2	Your budget process is:	0	0	\N	\N	f	f	\N	f	\N	\N
89	59	5	Question 4	t	4	How many years your budget process was electronic?	0	0	\N	\N	f	f	years	t	\N	\N
88	59	5	Question 3	t	3	Size of your budget for last year?	0	0	\N	\N	f	f	$	t	\N	\N
97	62	2	Checkboxes	t	5	Checkboxes description	0	0	\N	\N	f	t	\N	f	\N	\N
33	40	1	paragraph	t	1	1	1	1	1	11	t	f		f	\N	\N
111	40	2	Checkbox test	t	2		0	0	\N	\N	f	t	\N	f	\N	\N
98	62	9	End	t	6		0	0	\N	\N	f	f	\N	f	\N	\N
95	62	10	Break	t	4	Break description	0	0	\N	\N	f	f	\N	f	\N	\N
96	62	3	Radio	t	3		0	0	\N	\N	f	t	\N	f	\N	\N
93	62	8	Start	t	2		0	0	\N	\N	f	f	\N	f	\N	\N
99	62	4	Dropdown	t	7		0	0	\N	\N	f	t	\N	f	\N	\N
100	68	2	Checkboxes	t	2		0	0	\N	\N	f	t	\N	f	\N	\N
101	68	3	Radio	t	2		0	0	\N	\N	f	t	\N	f	\N	\N
102	68	0	Text	t	1		0	0	\N	\N	f	f	\N	f	\N	\N
42	9	\N	\N	f	\N	\N	\N	\N	\N	\N	f	f	\N	f	\N	\N
47	9	\N	\N	f	\N	\N	\N	\N	\N	\N	f	f	\N	f	\N	\N
48	9	\N	\N	f	\N	\N	\N	\N	\N	\N	f	f	\N	f	\N	\N
49	9	\N	\N	f	\N	\N	\N	\N	\N	\N	f	f	\N	f	\N	\N
50	9	\N	\N	f	\N	\N	\N	\N	\N	\N	f	f	\N	f	\N	\N
51	9	\N	\N	f	\N	\N	\N	\N	\N	\N	f	f	\N	f	\N	\N
104	72	0	Q1: What is your budget structure	t	1		0	0	\N	\N	f	f	\N	f	\N	\N
105	72	3	Q2: What is your budget cycle?	t	2		0	0	\N	\N	f	f	\N	f	\N	\N
107	73	0	Вопрос 2	t	1	Второй вопрос	0	0	\N	\N	f	f	\N	f	\N	2
108	73	0	Вопрос 1 Copy	t	2	Первый вопрос	0	0	\N	\N	f	f	\N	f	\N	1
36	40	1	2	t	6		0	0	\N	\N	f	f		f	\N	\N
112	40	3	Radibutton test	f	3		0	0	\N	\N	f	t	\N	f	\N	\N
67	40	0	test text	t	6		0	0	\N	\N	f	f	\N	f	\N	\N
68	40	5	number test	t	5		0	0	\N	\N	f	f	\N	f	\N	\N
62	40	8	section1_1	t	7		0	0	\N	\N	f	f	\N	f	\N	\N
61	40	6	e-m@il	t	8		0	0	\N	\N	f	f	\N	f	\N	\N
65	40	10	another break	t	12		0	0	\N	\N	f	f	\N	f	\N	\N
37	40	8	Section 1	t	11		0	0	\N	\N	f	f		f	\N	\N
60	40	9	section 1_1 end	t	12		0	0	\N	\N	f	f	\N	f	\N	\N
63	40	10	section break	f	10		0	0	\N	\N	f	f	\N	f	\N	\N
38	40	9	Section 1 end	t	14		0	0	\N	\N	f	f		f	\N	\N
35	40	1	3	t	13		0	0	\N	\N	f	f		f	\N	\N
\.


--
-- Name: SurveyQuestions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indaba
--

SELECT pg_catalog.setval('"SurveyQuestions_id_seq"', 112, true);


--
-- Data for Name: Surveys; Type: TABLE DATA; Schema: public; Owner: indaba
--

COPY "Surveys" (id, title, description, created, "projectId") FROM stdin;
46	New Survey	test	2016-02-05 10:20:51.029758+03	20
47	New Survey	test	2016-02-05 10:20:59.277983+03	20
59	2016 budget survey	Survey form for year 2016	2016-02-15 18:57:06.657+03	29
2	1	22222	2016-02-01 18:30:39.077+03	9
62	All test	Description	2016-02-16 10:57:57.887+03	2
9	test	test desc	2016-02-01 18:30:39.077+03	2
68	New test	\N	2016-02-16 11:57:43.434881+03	2
72	IBP 2016 Survey	Annual IBP 2016 survey project	2016-02-16 21:23:02.835+03	31
73	Tsdima 1st survey	Tsdima 1st survey	2016-02-16 23:55:12.022+03	5
48	APM Feb 7 survey	fkajdfoajgiaroivnodvnd	2016-02-08 00:43:07+03	2
40	My test	My test is just the test of my tasty taste	2016-02-03 16:11:06.869+03	2
\.


--
-- Data for Name: Tasks; Type: TABLE DATA; Schema: public; Owner: indaba
--

COPY "Tasks" (id, title, description, "uoaId", "stepId", "entityTypeRoleId", created, "productId", "startDate", "endDate", "accessToResponses", "accessToDiscussions", "writeToAnswers") FROM stdin;
6	Test	\N	2	2	9	2016-02-05 12:15:42.160803+03	2	\N	\N	f	f	f
7	Test	\N	2	2	9	2016-02-05 12:20:44.558186+03	2	\N	\N	f	f	f
42	\N	\N	1	2	34	2016-02-08 00:54:12.317597+03	2	\N	\N	f	f	f
53	\N	\N	1	38	30	2016-02-08 09:37:21.171967+03	21	\N	\N	f	f	f
57	\N	\N	1	40	32	2016-02-08 09:39:53.686508+03	21	\N	\N	f	f	f
58	\N	\N	2	38	34	2016-02-08 09:52:22.357764+03	21	\N	\N	f	f	f
9	Task1	\N	1	2	34	2016-02-05 16:13:57.263316+03	2	\N	\N	f	f	f
10	Task1	\N	1	2	30	2016-02-05 16:13:57.323453+03	2	\N	\N	f	f	f
95	\N	\N	1	22	45	2016-02-09 12:59:18.40944+03	19	2016-02-17 00:00:00+03	2016-02-17 00:00:00+03	f	f	f
83	\N	\N	2	22	33	2016-02-09 10:29:14.130694+03	19	2016-02-17 00:00:00+03	2016-02-17 00:00:00+03	f	f	f
84	\N	\N	5	22	33	2016-02-09 10:29:15.77914+03	19	2016-02-17 00:00:00+03	2016-02-17 00:00:00+03	f	f	f
90	\N	\N	2	19	35	2016-02-09 11:52:01.815773+03	19	2016-01-01 00:00:00+03	2016-03-08 00:00:00+03	f	f	f
91	\N	\N	5	19	35	2016-02-09 11:53:13.184755+03	19	2016-01-01 00:00:00+03	2016-03-08 00:00:00+03	f	f	f
99	\N	\N	1	19	35	2016-02-12 14:27:59.951038+03	19	2016-01-01 00:00:00+03	2015-10-10 00:00:00+03	f	f	f
87	\N	\N	1	24	30	2016-02-09 11:35:58.922158+03	18	2016-02-04 00:00:00+03	2016-02-04 00:00:00+03	f	f	f
88	\N	\N	2	24	34	2016-02-09 11:36:00.888222+03	18	2016-02-04 00:00:00+03	2016-02-04 00:00:00+03	f	f	f
14	Task1	\N	1	2	30	2016-02-05 16:21:18.273494+03	2	\N	\N	f	f	f
101	\N	\N	14	49	55	2016-02-16 21:47:17.995078+03	30	2016-02-15 08:00:00+03	2016-02-19 08:00:00+03	f	f	f
102	\N	\N	15	49	55	2016-02-16 21:47:19.775104+03	30	2016-02-15 08:00:00+03	2016-02-19 08:00:00+03	f	f	f
103	\N	\N	16	49	55	2016-02-16 21:47:21.155957+03	30	2016-02-15 08:00:00+03	2016-02-19 08:00:00+03	f	f	f
104	\N	\N	14	47	51	2016-02-16 21:47:27.245726+03	30	2016-02-01 08:00:00+03	2016-02-05 08:00:00+03	f	f	f
105	\N	\N	15	47	51	2016-02-16 21:47:29.058129+03	30	2016-02-01 08:00:00+03	2016-02-05 08:00:00+03	f	f	f
93	\N	\N	2	23	30	2016-02-09 12:05:23.991601+03	19	2016-02-17 00:00:00+03	2016-02-29 00:00:00+03	f	f	f
92	\N	\N	1	23	30	2016-02-09 12:05:23.932949+03	19	2016-02-17 00:00:00+03	2016-02-29 00:00:00+03	f	f	f
96	\N	\N	1	28	39	2016-02-10 13:09:39.659738+03	27	2016-02-09 08:00:00+03	2016-02-01 08:00:00+03	f	f	f
97	\N	\N	2	28	39	2016-02-10 13:09:39.750183+03	27	2016-02-09 08:00:00+03	2016-02-01 08:00:00+03	f	f	f
98	\N	\N	5	28	39	2016-02-10 13:09:39.789387+03	27	2016-02-09 08:00:00+03	2016-02-01 08:00:00+03	f	f	f
106	\N	\N	16	47	51	2016-02-16 21:47:31.463457+03	30	2016-02-01 08:00:00+03	2016-02-05 08:00:00+03	f	f	f
107	\N	\N	14	48	53	2016-02-16 21:47:39.690617+03	30	2016-02-08 08:00:00+03	2016-02-12 08:00:00+03	f	f	f
108	\N	\N	16	48	53	2016-02-16 21:47:43.704252+03	30	2016-02-08 08:00:00+03	2016-02-12 08:00:00+03	f	f	f
109	\N	\N	15	48	53	2016-02-16 21:47:47.872503+03	30	2016-02-08 08:00:00+03	2016-02-12 08:00:00+03	f	f	f
110	\N	\N	1	20	60	2016-02-17 12:54:46.659148+03	19	2016-02-04 00:00:00+03	2016-03-08 00:00:00+03	f	f	f
111	\N	\N	2	20	60	2016-02-17 12:54:48.873888+03	19	2016-02-04 00:00:00+03	2016-03-08 00:00:00+03	f	f	f
112	\N	\N	5	20	60	2016-02-17 12:54:51.056007+03	19	2016-02-04 00:00:00+03	2016-03-08 00:00:00+03	f	f	f
\.


--
-- Name: Tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indaba
--

SELECT pg_catalog.setval('"Tasks_id_seq"', 112, true);


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
112	5994e378b690a22940a70b21d0402ec0feeb120e37e35aff8ee88e2475938a54	2016-02-17 11:44:06.669888
142	630f14afb8f7b936e630b0e0029162e655cc5a30cd766d5efbac08febafe0677	2016-02-17 12:55:12.939088
111	a771f9c70e1a0f96d000eb248407e0e22b414f85f94d08881cd997b09252a238	2015-11-30 14:35:52.400036
115	fcd17d4d37e45731832c1f94e3d15d8753dce9fac6dceda4350246719600cd05	2015-12-01 13:16:04.838175
122	755194832bb76649694c5a294a0b31e4baf67c8a88c491fb45a1b4bf52dd50d0	2015-12-01 18:07:39.474604
123	d228a9e4d33bb719dcf461532400b34b0d836564a1ef3f32c00015b5bc5834b3	2015-12-01 18:09:23.11958
190	f76e28cf1bac38372e4473d96fa306de500c5b03b8deab83006b8f26a8e3e094	2016-02-15 20:56:18.377311
126	c345a94e604bfa5e153118004c94675529f84b2d0f2a2266547f7a229143320a	2015-12-03 16:49:16.734867
176	2be0ed6f1334ca33dfb7b8ba330a99536d988c99c0ddac208962ccde1450959e	2016-02-15 08:36:11.203103
76	5330f09fe50eadd3450e6125b718b2d80d73e468c98a0f6e199809ed76e771a6	2016-02-11 13:33:42.236925
196	c59819590912dd9f32e5443d24b797efaa8649388840b8561a02d1439d61d33d	2016-02-16 18:43:32.840148
163	f04de3ec8395b2ecac8be74d6b94afdf74406e2aa8efbaaa8d36798b8e4325f5	2016-02-09 19:40:34.112797
114	66c23a628b7502f53cca2fae49f61a9f230aa1bf8dc0de7670e762482d88df9d	2016-02-16 23:50:27.222573
212	f8003ed954d6adf9a8f8f3e932c24c0ac057413793094090b9f3763c6186a40b	2016-02-17 02:23:12.542302
\.


--
-- Data for Name: Translations; Type: TABLE DATA; Schema: public; Owner: indaba
--

COPY "Translations" ("essenceId", "entityId", field, "langId", value) FROM stdin;
4	1	title	2	Яблоко
4	2	title	2	Ярбуз
4	2	description	2	Вкусный большой ярбуз
4	1	description	2	Спелое зеленое яблоко
4	1	description	1	Fresh green apple
4	2	title	1	Watemelon
4	2	description	1	Big watermelon
5	1	name	2	Страна
6	1	name	2	Цель 1
8	1	name	2	Низкий доход
7	1	name	2	Размер дохода (Всемирный банк)
4	1	title	1	Apple
4	1	title	9	Jrjk,z
\.


--
-- Data for Name: UnitOfAnalysis; Type: TABLE DATA; Schema: public; Owner: indaba
--

COPY "UnitOfAnalysis" (id, "gadmId0", "gadmId1", "gadmId2", "gadmId3", "gadmObjectId", "ISO", "ISO2", "nameISO", name, description, "shortName", "HASC", "unitOfAnalysisType", "parentId", "creatorId", "ownerId", visibility, status, created, deleted, "langId", updated) FROM stdin;
1	\N	\N	\N	\N	\N	\N	\N	\N	Target1	Target1 description	t1	\N	1	\N	114	114	1	1	2015-12-23 11:10:43	\N	1	\N
2	\N	\N	\N	\N	\N	\N	\N	\N	Target 2	Testing ...........	t2	\N	2	\N	114	114	1	2	2015-12-23 11:37:52.072	\N	1	\N
5	\N	\N	\N	\N	\N	\N	\N	\N	Sector 3	sector 3 people	sector3	\N	9	\N	112	112	1	1	2016-02-01 13:24:59.424	\N	1	\N
14	\N	\N	\N	\N	\N				Russia	Russian Federation	Russia		1	\N	112	112	1	1	2016-02-16 14:22:25.618868	\N	1	\N
15	\N	\N	\N	\N	\N				Germany	Western Europe - Germany	Germany		1	\N	112	112	1	2	2016-02-16 14:22:25.667316	\N	1	\N
16	\N	\N	\N	\N	\N				USA	United States of America	USA		1	\N	112	112	1	1	2016-02-16 14:22:25.700547	\N	1	\N
17	\N	\N	\N	\N	\N	\N	\N	\N	aqq@dcdcd.ff	 wedede	 efrefrfr	\N	\N	\N	112	112	1	1	2016-02-17 13:22:26.897809	\N	1	\N
18	\N	\N	\N	\N	\N	\N	\N	\N	xsxsxsxs	 dcdcd	 vvv	\N	\N	\N	112	112	1	1	2016-02-17 13:22:26.936476	\N	1	\N
19	\N	\N	\N	\N	\N	\N	\N	\N	new@nnnnn.ddd	 ssssss	 cccccc	\N	\N	\N	112	112	1	1	2016-02-17 13:22:26.967259	\N	1	\N
20	6	\N	\N	\N	\N	ALB	AL	ALBANIA	Albania	Region: Southern Europe (Europe); WB: Europe & Central Asia - Lower middle income - Less indebted	Albania		\N	100	112	112	2	3	2016-02-17 13:28:45.230255	\N	1	\N
\.


--
-- Data for Name: UnitOfAnalysisClassType; Type: TABLE DATA; Schema: public; Owner: indaba
--

COPY "UnitOfAnalysisClassType" (id, name, description, "langId") FROM stdin;
1	Income Size WBC	Income size classification (World Bank)	1
3	Other	Other classification type	1
\.


--
-- Name: UnitOfAnalysisClassType_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"UnitOfAnalysisClassType_id_seq"', 4, true);


--
-- Data for Name: UnitOfAnalysisTag; Type: TABLE DATA; Schema: public; Owner: indaba
--

COPY "UnitOfAnalysisTag" (id, name, description, "langId", "classTypeId") FROM stdin;
3	Low income	Low income WB class	1	1
4	Middle income	Middle income (WB classification)	1	1
5	High income	High income (WB classification)	1	1
7	2	Other 2 (Other classification type)	1	3
6	1	Other 1 (Other classification type)	1	3
9	10	Other 10 (Other classification type)	1	3
\.


--
-- Data for Name: UnitOfAnalysisTagLink; Type: TABLE DATA; Schema: public; Owner: indaba
--

COPY "UnitOfAnalysisTagLink" (id, "uoaId", "uoaTagId") FROM stdin;
1	1	3
2	1	7
3	2	5
4	2	7
\.


--
-- Name: UnitOfAnalysisTagLink_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indaba
--

SELECT pg_catalog.setval('"UnitOfAnalysisTagLink_id_seq"', 4, true);


--
-- Name: UnitOfAnalysisTag_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indaba
--

SELECT pg_catalog.setval('"UnitOfAnalysisTag_id_seq"', 9, true);


--
-- Data for Name: UnitOfAnalysisType; Type: TABLE DATA; Schema: public; Owner: indaba
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

SELECT pg_catalog.setval('"UnitOfAnalysisType_id_seq"', 11, true);


--
-- Name: UnitOfAnalysis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"UnitOfAnalysis_id_seq"', 20, true);


--
-- Data for Name: UserRights; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "UserRights" ("userID", "rightID", "canDo") FROM stdin;
\.


--
-- Data for Name: UserUOA; Type: TABLE DATA; Schema: public; Owner: indaba
--

COPY "UserUOA" ("UserId", "UOAid") FROM stdin;
127	2
\.


--
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "Users" ("roleID", id, email, "firstName", "lastName", password, cell, birthday, "resetPasswordToken", "resetPasswordExpires", created, updated, "isActive", "activationToken", "organizationId", location, phone, address, lang, bio, "notifyLevel", timezone, "lastActive", affiliation) FROM stdin;
2	175	indaba@amida-tech.com	Indaba	Super Admin	2d97fa50e82fb50e883dfd491565f276349eed70dbf0ed0c188b051018ede809	\N	\N	\N	\N	2016-02-13 20:10:31.689741+03	2016-02-13 20:11:31.068721	t	\N	20	\N	\N	\N	\N	\N	\N	\N	\N	\N
1	76	next15@mail.ru	Semyon	Babushkin	0e1712e80207b36cc834dcceaf613ef2b6d00c672e02b63e2ed2ed4d65084fcc	89234242341	2015-03-08	\N	\N	2015-03-08 03:00:00+03	2016-02-16 19:16:29.897864	t	\N	11	\N	\N	\N	\N	\N	\N	\N	2016-02-16 19:16:29.839+03	ntrlab
2	209	ibp16-user5@amida-tech.com	u5	ibp	622b439bf08bf77f13f788601516c12c201feff0ac9176b4c4ebeb0f3d9b53a4	\N	\N	\N	\N	2016-02-16 21:19:25.585576+03	\N	f	c1ce3162a672ac5d3f1f5475dd826df1ed5b58224df26b7c188f0b201333b1d9	40	NYC		some add2	es	Bio 2	0		\N	\N
3	183	new@nnnnn.ddd	 ssssss	 cccccc	7d4c788e5ad8da3c3199ded355eaf767bc7b028fc05a424a1a46a1cf47ec4088	\N	\N	\N	\N	2016-02-15 12:11:05.142188+03	\N	f	15267691e4a8057a0bd04324d0942cced826ac50abe5797f72b03c6371e26756	16	\N	\N	\N	\N	\N	0	\N	\N	\N
2	176	ibp@amida-tech.com	IBP	Admin	2d97fa50e82fb50e883dfd491565f276349eed70dbf0ed0c188b051018ede809	\N	\N	\N	\N	2016-02-15 08:35:13.242568+03	2016-02-15 08:36:10.820027	t	\N	22	\N	\N	\N	\N	\N	\N	\N	\N	\N
3	127	babushkin.semyon@gmail.com	Semyon	Babushkin	7411477a92034069a0b8df36572fae0e20638264c781796760fcd8f5c9b27746	\N	\N	\N	\N	2015-12-03 17:01:50.786677+03	2015-12-03 17:02:21.232973	t	\N	11	\N	\N	\N	\N	\N	\N	\N	\N	\N
3	142	dmitry@amida-tech.com	Dmitry	Kachaev	d7c1e132081cc535e1436feb438bfd34d0cc62e65be53a52e71562a315971d81	\N	\N	\N	\N	2016-02-08 16:20:19.98916+03	2016-02-17 12:55:30.002022	t	\N	7	\N	\N	\N	\N	\N	\N	\N	2016-02-17 12:55:29.997+03	\N
1	210	reid+testadmin@amida-tech.com	Reid's	Admin	979249bb0b9b95086d988a50355687169fafecfb03ec7126fb60f94cf76b8ce1	\N	\N	\N	\N	2016-02-17 00:33:45.242+03	2016-02-17 00:34:50.86577	f	a62ab578f4b6967e0039931b42bc2cbcfb1e5fe4cf680b5c52dd13455bd66746	42	\N	\N	\N	\N	\N	\N	\N	\N	\N
3	172	aqq@dcdcd.ff	 wedede	 efrefrfr	92f2b70fc37730b4d5e68a35ab65f6a0a186929e26046b1ec3e226ea61e25cc4	\N	\N	\N	\N	2016-02-10 13:02:35.457029+03	\N	f	c1663650ce965f0cc345d9d42da513b4c669e4af11cd64de935809bf74e7e543	7	\N	\N	\N	\N	\N	0	\N	\N	\N
2	173	next20@mail.ru	bbb	ccc	dd5ac7f23ebea82ec9c85520808041e83d3ab9e9b23e90aedb1b4999c044f70a	\N	\N	\N	\N	2016-02-11 15:34:46.897808+03	\N	f	e0275d05a44c0f7904964dcdbdc89e6572ef2540a89e256487ce9175baf07a50	10	ggg	hhh	kkk	lll	mmm	0	fff	\N	\N
3	174	next17@mail.ru	Semyon	B	ce6adc971d2bc51e49d4278a7cfd983e4720396abe113f726d7d67edeec45586	\N	\N	\N	\N	2016-02-11 15:34:47.120601+03	\N	f	577b8d193085e0f4a896c0209ba2cb09bb2f764652d19fd7d934fd27d51d447e	10						0		\N	\N
3	136	cntr@mail.net	test	contributor	2d97fa50e82fb50e883dfd491565f276349eed70dbf0ed0c188b051018ede809	\N	\N	\N	\N	2016-01-14 17:11:46.669889+03	2016-02-17 12:53:05.796919	t	\N	7	\N	\N	\N	\N	\N	\N	\N	2016-02-17 12:53:05.792+03	\N
2	134	qwerty@test.ru	Joe	Qwerty	3cdf90402b4667d989b4ebd33bfaebdea7a23d712232a5c3d97b10096cec8474	\N	\N	\N	\N	2015-12-28 16:25:38.78727+03	2016-01-13 08:53:09.588741	f	5aaff69afb6618e2aecaad7fa240d772b776894d18e4473a9ac2ef2208d9a336	15	\N	\N	\N	\N	\N	\N	\N	\N	\N
2	178	ibp-user1@amida-tech.com	user 1	ibp	927e6a65c2daa2761348fdaae853278251f0062e427ab1f025741682154d0132	\N	\N	\N	\N	2016-02-15 08:58:00.749229+03	\N	f	0f280575e0411b5fe6f78294dc8b8f25d272494ae1382ad986faa2c987672fd6	25	Washington	2021231231	some add 1	en	Bio 1	0		\N	\N
2	179	ibp-user2@amida-tech.com	user 2	ibp	33e04ab28d773a23b72da36d96ffe27e82c080e104f2ed051aa8add8f69a6982	\N	\N	\N	\N	2016-02-15 08:59:08.285903+03	\N	f	283fbca3c479b140d8845b3f95a1128d637966d7f54e88fd1c54bd0d017b0adc	25	Washington	2021231231	some add 1	en	Bio 1	0		\N	\N
2	194	indaba1.5.uglyeugen@spamgourmet.com	Indaba1	Test	03c7e742e47b78269c4133cb926087c0f4291a82ee2cffab3764f3f9d34424ef	\N	\N	\N	\N	2016-02-16 17:48:37.733515+03	2016-02-16 17:48:37.758922	f	d01e44f78d6f947a04e07e5fc1bd30854fd5bc477464f1eee25f7aeeca351369	37	\N	\N	\N	\N	\N	\N	\N	\N	\N
3	180	ibp-user3@amida-tech.com	user 3	ibp	2d97fa50e82fb50e883dfd491565f276349eed70dbf0ed0c188b051018ede809	\N	\N	\N	\N	2016-02-15 08:59:08.346+03	2016-02-15 09:03:43.987341	t	\N	25	NYC	7031231231	some add2	es	Bio 2	0		\N	\N
2	181	ibp-user4@amida-tech.com	user 4	ibp	21bdc01e000baa87f1ca1b6e70b6c2ea549d6a4ee205100fce1bb8c38aa257a8	\N	\N	\N	\N	2016-02-15 09:08:39.895464+03	\N	f	1da46a06e37e303eb77372e47574e005e3f0d00cf7d398fb8b56e6eb4cccaf00	25	Washington	2021231231	some add 1	en	Bio 1	0		\N	\N
2	182	ibp-user5@amida-tech.com	user 5	ibp	89a6b740571d1c6d2c7809a1abc923a7cb5fed7b4f6de3d0ea0276686871d49a	\N	\N	\N	\N	2016-02-15 09:08:39.988068+03	\N	f	620280ce7746954a325b55b47d236bbc341c7daca75e98527fe2527c0fd3927f	25	NYC	7031231231	some add2	es	Bio 2	0		\N	\N
2	214	igiware@gmail.com	Igor	Ivanov	46a7a12d0b617a2332446d35e634cd26fd9eaef53e4cd2855a985e4ab9deee1e	\N	\N	\N	\N	2016-02-17 11:39:58.678753+03	2016-02-17 13:39:09.124691	t	\N	48	\N	\N	\N	\N	\N	\N	\N	2016-02-17 13:36:09.168+03	\N
2	204	elena@amida-tech.com	Elena	from IBP	2d97fa50e82fb50e883dfd491565f276349eed70dbf0ed0c188b051018ede809	\N	\N	\N	\N	2016-02-16 21:16:10.869501+03	2016-02-16 22:03:36.731376	t	\N	40	\N	\N	\N	\N	\N	\N	\N	2016-02-16 22:03:36.727+03	\N
2	124	eugen@sinergo.ru	Sluchanko	Eugen	fa2a10a34565fd42459ffb63372951c9372026820d806ec8f2cf21ffd2572f55	\N	\N	\N	\N	2015-12-01 18:10:46.517976+03	2015-12-01 18:13:50.247408	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1	130	user@host.net	John	\N	1fc7765730263306c51ef79704bc3972e4451c58fbbee17ba531ce8515abc59a	\N	\N	\N	\N	2015-12-24 16:17:36.638694+03	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3	137	lexa.trener@gmail.com	lexa	trener	08f77fbf51b1da692c812224d2ea5f5d114b70d79514608705e0f12cf9431f4a	\N	\N	\N	\N	2016-01-14 17:25:54.822611+03	2016-01-14 17:26:20.054916	t	\N	16	\N	\N	\N	\N	\N	\N	\N	\N	\N
2	177	ibp2@amida-tech.com	IBP 2	Admin	0e1712e80207b36cc834dcceaf613ef2b6d00c672e02b63e2ed2ed4d65084fcc	\N	\N	\N	\N	2016-02-15 08:50:23.225445+03	2016-02-15 18:01:28.914181	t	\N	25	\N	\N	\N	\N	\N	\N	\N	2016-02-15 18:01:28.902+03	\N
2	135	abochkarev@sinergo.ru	Alexey	Bochkarev	08f77fbf51b1da692c812224d2ea5f5d114b70d79514608705e0f12cf9431f4a	8888888888888	1975-03-26	\N	\N	2016-01-11 10:32:49.263+03	2016-01-15 11:25:51.368049	t	\N	16	\N	\N	\N	\N	\N	\N	\N	\N	\N
4	138	rev@mail.net	test	reviewver	2d97fa50e82fb50e883dfd491565f276349eed70dbf0ed0c188b051018ede809	\N	\N	\N	\N	2016-01-26 14:31:21.341359+03	\N	t	\N	7	\N	\N	\N	\N	\N	\N	\N	\N	\N
9	131	pm@mail.net	test	projectManager	2d97fa50e82fb50e883dfd491565f276349eed70dbf0ed0c188b051018ede809	\N	\N	\N	\N	2015-12-28 13:41:19.935+03	2016-01-26 17:31:21.498333	t	\N	7	\N	\N	\N	\N	\N	\N	\N	\N	\N
3	139	edt@mail.net	test	editor	2d97fa50e82fb50e883dfd491565f276349eed70dbf0ed0c188b051018ede809	\N	\N	\N	\N	2016-01-26 14:34:21.656054+03	\N	t	\N	7	\N	\N	\N	\N	\N	\N	\N	\N	\N
5	140	tr@mail.net	test	translator	2d97fa50e82fb50e883dfd491565f276349eed70dbf0ed0c188b051018ede809	\N	\N	\N	\N	2016-01-26 14:38:46.397547+03	\N	t	\N	7	\N	\N	\N	\N	\N	\N	\N	\N	\N
2	141	CheckIt@feb7.com	CheckIt	OnFeb7	a3053f87f0a9650f89db916f0b8aabe557b155d29333e4940f1be3fab13c8f76	\N	\N	\N	\N	2016-02-07 17:07:54.474+03	2016-02-07 17:08:16.461176	f	46ea4a54d710b7a0c684ddfe1f60ca6125f43a109835edf314375896c4d83a2a	19	\N	\N	\N	\N	\N	\N	\N	\N	\N
2	211	reid+testadmin2@amida-tech.com	AdminTest	Reid'sTestOrg	2bfe894f88a013e78d541080d057515ebff082fd332fb97d0dff9a8d86e180ba	\N	\N	\N	\N	2016-02-17 00:36:02.329227+03	2016-02-17 00:36:02.36119	f	905c3a2034b016fd035b01cf713d479d33824c79e8f6264c249dae30d23110db	43	\N	\N	\N	\N	\N	\N	\N	\N	\N
2	195	swsw@ww.dd	223	3333	6bbe786caa3ad5e0beae5cbcbd1da341db34477300f51aa8b8b88eac0a89be8f	\N	\N	\N	\N	2016-02-16 17:53:12.959929+03	2016-02-16 17:53:12.990072	f	c56064056b4d7cd1ec09f352c56fa21067253f22eb9fee06d7c76347c4e3bbbc	38	\N	\N	\N	\N	\N	\N	\N	\N	\N
2	205	ibp16-user1@amida-tech.com	u1	ibp	2d97fa50e82fb50e883dfd491565f276349eed70dbf0ed0c188b051018ede809	\N	\N	\N	\N	2016-02-16 21:19:25.474912+03	2016-02-16 22:07:56.013606	t	\N	40	Washington		some add 1	en	Bio 1	0		2016-02-16 22:07:56.009+03	\N
3	203	yourhottest2012@gmail.com	Mstislav	\N	671fe2094fcf2a2d3dafa659af14cbef82a83d984848f35186a0c5d67aca69a9	\N	\N	\N	\N	2016-02-16 19:16:30.083156+03	2016-02-17 13:35:08.057901	f	4cb3b52b1928d47d7dba597ac2a79328b840a2c1142010652ee37fb33e212a76	7	\N	\N	\N	\N	\N	\N	\N	\N	\N
1	112	su@mail.net	Test	Super Admin	2d97fa50e82fb50e883dfd491565f276349eed70dbf0ed0c188b051018ede809	+7888888888888	2015-12-28	b4f4ce038f866a5ba36c352e5b547082b63e5a4376acec8edfaf901c885fa80a	1455534349632	2015-11-26 15:52:45.264+03	2016-02-17 14:02:43.694097	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	2016-02-17 14:02:43.688+03	\N
2	125	adm@mail.net	test	admin	2d97fa50e82fb50e883dfd491565f276349eed70dbf0ed0c188b051018ede809	+1222333444555	2015-11-30	\N	\N	2015-12-02 15:38:37.214+03	2016-02-17 12:54:58.08436	t	\N	7	\N	\N	\N	\N	\N	\N	\N	2016-02-17 12:54:58.08+03	\N
2	212	Alicia+Mali@amida-tech.com	APMali	Tandja	2d97fa50e82fb50e883dfd491565f276349eed70dbf0ed0c188b051018ede809	\N	\N	\N	\N	2016-02-17 02:19:33.374619+03	2016-02-17 02:28:54.014955	t	\N	45	\N	\N	\N	\N	\N	\N	\N	2016-02-17 02:28:54.01+03	\N
2	191	carter@amida-tech.com	Jimmy	Carter	2d97fa50e82fb50e883dfd491565f276349eed70dbf0ed0c188b051018ede809	\N	\N	\N	\N	2016-02-16 17:40:12.177217+03	2016-02-16 17:40:56.767853	t	\N	34	\N	\N	\N	\N	\N	\N	\N	2016-02-16 17:40:56.763+03	\N
2	206	ibp16-user2@amida-tech.com	u2	ibp	ab3117431099b699122e495368be7d22d8736b7e0c96f58ca3f530839f48bbf0	\N	\N	\N	\N	2016-02-16 21:19:25.503672+03	\N	f	d566dbe22ce2099844fc155b7730bc1133c08ecefa66a69e4191204ec9c8ff16	40	NYC		some add2	es	Bio 2	0		\N	\N
2	207	ibp16-user3@amida-tech.com	u3	ibp	16df29b5d825523e80f5e144aea7b1d601b3cb1eec8efbbb286ac495d6a92125	\N	\N	\N	\N	2016-02-16 21:19:25.527438+03	\N	f	70aec198246c5cd4b937c922d6d6c6e4ab65b7690edcc8480c2d85db5252340c	40	NYC		some add2	es	Bio 2	0		\N	\N
2	213	wswsw@swssww.www	wwswsw	swswswsw	53f2cab8b621c849a436c1886d6798909506367760f8a7e346916d6b268a9fc7	\N	\N	\N	\N	2016-02-17 09:07:53.296528+03	2016-02-17 09:07:53.346673	f	540e118f3c60c4603e7eb4b9f22440d3acc1c20d0e3d159e11873469bf0001de	47	\N	\N	\N	\N	\N	\N	\N	\N	\N
2	192	jimmy@amida-tech.com	Jimmy	Carter the Second	2d97fa50e82fb50e883dfd491565f276349eed70dbf0ed0c188b051018ede809	\N	\N	\N	\N	2016-02-16 17:44:03.651077+03	2016-02-16 17:51:23.833512	t	\N	35	\N	\N	\N	\N	\N	\N	\N	2016-02-16 17:51:23.828+03	\N
2	193	sss@ddd.dd	11	222	08880c91d0616689aa104447677a3d3bafe28a43778e470e66b77bbd0c81b610	\N	\N	\N	\N	2016-02-16 17:47:50.061763+03	2016-02-16 17:47:50.088659	f	a6b9a9ca7744266f76f602fba56dbd1e139d1393cbd8727e4ae038c4e8e75dd1	36	\N	\N	\N	\N	\N	\N	\N	\N	\N
2	208	ibp16-user4@amida-tech.com	u4	ibp	8a59f536445fd50e584cd553c6ea0834c79cca66f66984186e57d1b01ef4b38d	\N	\N	\N	\N	2016-02-16 21:19:25.557614+03	\N	f	396b4de215ef1f393f9d748612e30d5cc6be7c074fcb2ae6446d15d7205b8b25	40	NYC		some add2	es	Bio 2	0		\N	\N
3	185	ibp15-user1@amida-tech.com	u1	ibp	0b831ba6613688a054cbdc74c6d6a6f810c5bb3802d68ac519bd949dbc9ee522	\N	\N	\N	\N	2016-02-15 19:00:37.217+03	2016-02-16 22:05:16.14284	f	b03c742fb04dfa8a1c5cc404660bc728b54b538e8662d8a1d7fc2fd2dd19aa91	28	Washington		some add 1	en	Bio 1	0		\N	\N
2	190	reid+testaccount@amida-tech.com	Reid (test)	Amida Account	51aabc693b4e71d3393e8bc06aa2a63700edd53e9d38ddc73e74669fce84ceb5	\N	\N	\N	\N	2016-02-15 20:55:28.631406+03	2016-02-16 23:47:49.046682	t	\N	29	\N	\N	\N	\N	\N	\N	\N	2016-02-16 23:47:49.042+03	\N
1	114	dtseytlin@gmail.com	Dmitry	Tseytlin	06bf092523eae1ead26398d2209b60119cf936d0abeaf77cb395dc6c6bb9c886	\N	\N	\N	\N	2015-12-01 11:51:40.983331+03	2016-02-17 00:07:21.162063	t	\N	11	\N	\N	\N	\N	\N	\N	\N	2016-02-17 00:07:21.157+03	\N
2	186	ibp15-user2@amida-tech.com	u2	ibp	2f8c7e591866c5dfc008ec2e8f41b4ecab8b24ddfe87f99492ecc8586fe94558	\N	\N	\N	\N	2016-02-15 19:00:37.311616+03	\N	f	726977a9497fae7cdaedee72cdb2a4bba6fab3e3a8a74b629490076f54fd1d49	28	NYC		some add2	es	Bio 2	0		\N	\N
2	187	ibp15-user3@amida-tech.com	u3	ibp	7f1eb5d5f0c81ae6c9b1e176d88c9a7f4b14d29aeeb4da055a95e89d8f8aadfc	\N	\N	\N	\N	2016-02-15 19:00:37.365702+03	\N	f	241c2d66461eeef3407af42b2aa2e51aec6e5202e70fa587c81167cb658233de	28	NYC		some add2	es	Bio 2	0		\N	\N
2	188	ibp15-user4@amida-tech.com	u4	ibp	fe3b2508f8b675fb906253970a41bb08017dbcb01fe461bfc205ac403ee4ec70	\N	\N	\N	\N	2016-02-15 19:00:37.424606+03	\N	f	7d1ab1318269b2ef76e9c0c629690a6224c2f0ee3329947f56d49c0908d811d3	28	NYC		some add2	es	Bio 2	0		\N	\N
2	189	ibp15-user5@amida-tech.com	u5	ibp	5fa83f95904c3fd6c206139704a0dfd99af31ed5252b985974af4797134f2db8	\N	\N	\N	\N	2016-02-15 19:00:39.81346+03	\N	f	87cdb7387f1eb936e9a6c27b24cc8e50be303e86aec76cb9d8bba591503c95a6	28	NYC		some add2	es	Bio 2	0		\N	\N
2	184	ibp15@amida-tech.com	IBP Admin	Feb 15th	2d97fa50e82fb50e883dfd491565f276349eed70dbf0ed0c188b051018ede809	\N	\N	\N	\N	2016-02-15 18:54:14.596719+03	2016-02-15 20:36:32.468768	t	\N	28	\N	\N	\N	\N	\N	\N	\N	2016-02-15 20:36:32.464+03	\N
\.


--
-- Data for Name: WorkflowSteps; Type: TABLE DATA; Schema: public; Owner: indaba
--

COPY "WorkflowSteps" ("workflowId", id, "startDate", "endDate", "roleId", title, "taskAccessToResponses", "taskAccessToDiscussions", "taskBlindReview", "workflowAccessToResponses", "workflowAccessToDiscussions", "workflowBlindReview", "position", "writeToAnswers") FROM stdin;
10	26	2016-03-01 00:00:00+03	2016-03-12 00:00:00+03	11	Collect Data!!!	\N	\N	\N	\N	\N	\N	1	\N
11	27	2016-02-02 08:00:00+03	2016-02-10 08:00:00+03	4	Collect Data!!!	\N	\N	\N	\N	\N	\N	1	\N
12	29	2016-02-05 08:00:00+03	2016-02-14 08:00:00+03	11	Collect Data!!!	\N	\N	\N	\N	\N	\N	1	\N
12	30	2016-02-15 08:00:00+03	2016-02-22 08:00:00+03	4	Verify data!!!	\N	\N	\N	\N	\N	\N	2	\N
7	31	2016-02-01 00:00:00+03	2016-02-01 00:00:00+03	4	Collect Data!!!	\N	\N	\N	\N	\N	\N	1	\N
11	28	2016-02-09 08:00:00+03	2016-02-01 08:00:00+03	5	Verify data!!!	\N	\N	\N	\N	\N	\N	2	\N
7	33	2016-02-04 00:00:00+03	2016-02-25 00:00:00+03	8	Think twice!!	\N	\N	\N	\N	\N	\N	2	\N
7	34	2016-02-07 00:00:00+03	2016-02-08 00:00:00+03	9	Watch your step	\N	\N	\N	\N	\N	\N	3	\N
7	35	2016-02-15 00:00:00+03	2016-02-16 00:00:00+03	10	tie shoes	\N	\N	\N	\N	\N	\N	4	\N
7	36	2016-02-01 00:00:00+03	2016-02-11 00:00:00+03	5	Verify data!!!	\N	\N	\N	\N	\N	\N	5	\N
8	37	2016-02-09 08:00:00+03	2016-02-10 08:00:00+03	11	Collect Data!!!	\N	\N	\N	\N	\N	\N	1	\N
8	38	2016-02-11 08:00:00+03	2016-02-12 08:00:00+03	4	Think twice!!	\N	\N	\N	\N	\N	\N	2	\N
8	39	2016-02-15 08:00:00+03	2016-02-16 08:00:00+03	8	Watch your step	\N	\N	\N	\N	\N	\N	3	\N
8	40	2016-02-18 08:00:00+03	2016-02-19 08:00:00+03	5	tie shoes	\N	\N	\N	\N	\N	\N	4	\N
11	41	2016-02-10 00:00:00+03	2016-02-29 00:00:00+03	10	Think twice!!	\N	\N	\N	\N	\N	\N	3	\N
6	20	2016-02-04 00:00:00+03	2016-03-08 00:00:00+03	11	Collect Data!!!	\N	\N	\N	\N	\N	\N	1	\N
6	19	2016-01-01 00:00:00+03	2016-02-03 00:00:00+03	8	Think twice!!	\N	\N	\N	\N	\N	\N	2	\N
6	21	2016-02-05 00:00:00+03	2016-02-05 00:00:00+03	10	Verify data!!!	\N	\N	\N	\N	\N	\N	3	\N
6	22	2016-02-01 00:00:00+03	2016-02-02 00:00:00+03	9	Watch your step	\N	\N	\N	\N	\N	\N	4	\N
6	23	2016-02-17 00:00:00+03	2016-02-29 00:00:00+03	4	tie shoes!!!!!	t	t	\N	t	t	t	6	\N
6	44	2016-02-17 00:00:00+03	2016-02-29 00:00:00+03	4	tie tie	t	t	\N	t	t	t	5	\N
2	1	2016-02-01 08:00:00+03	2016-02-08 08:00:00+03	11	Collect Data!!!	\N	\N	\N	\N	\N	\N	1	\N
2	2	2016-02-09 08:00:00+03	2016-02-15 08:00:00+03	4	Verify data!!!	\N	\N	\N	\N	\N	\N	2	\N
2	46	2016-02-23 00:00:00+03	2016-02-26 00:00:00+03	9	test	\N	\N	\N	\N	\N	\N	\N	f
13	47	2016-02-01 08:00:00+03	2016-02-05 08:00:00+03	11	Data Collection	f	t	\N	t	t	\N	\N	t
13	48	2016-02-08 08:00:00+03	2016-02-12 08:00:00+03	4	Peer Review	t	t	\N	\N	t	\N	\N	f
13	49	2016-02-15 08:00:00+03	2016-02-19 08:00:00+03	9	Publish	f	t	\N	\N	t	\N	\N	f
4	45	2016-02-01 00:00:00+03	2016-02-28 00:00:00+03	9	sssss	t	t	t	t	t	t	0	f
4	24	2016-02-04 00:00:00+03	2016-02-04 00:00:00+03	4	Verify data!!!	t	t	t	t	t	t	1	t
4	50	2016-02-03 00:00:00+03	2016-02-18 00:00:00+03	5	eedededed	t	t	\N	t	t	\N	2	t
4	25	2016-02-11 00:00:00+03	2016-02-12 00:00:00+03	5	Think twice!!	t	t	f	t	t	f	3	t
9	5	\N	\N	11	Collect Data!!!	\N	\N	\N	\N	\N	\N	1	\N
9	6	\N	\N	10	Verify data!!!	\N	\N	\N	\N	\N	\N	2	\N
\.


--
-- Name: WorkflowSteps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indaba
--

SELECT pg_catalog.setval('"WorkflowSteps_id_seq"', 50, true);


--
-- Data for Name: Workflows; Type: TABLE DATA; Schema: public; Owner: indaba
--

COPY "Workflows" (id, name, description, created, "productId") FROM stdin;
3	new wf	\N	2016-01-21 17:17:26.859854+03	4
4	ddddddddd	\N	2016-01-21 17:51:03.36599+03	18
5	ddddd dddd	wwwwwwwwww	2016-01-21 17:52:22.298657+03	17
6	xxxxxxxxxxxxxxxxx	sssssssssssss	2016-01-21 17:59:16.374721+03	19
9	sssssssssssssss	ccccccccccccccccccccccccccccccc	2016-01-25 14:16:27.551509+03	22
7	ddddddddddddddddddd	wwwwwwwwwwwww	2016-01-22 09:55:32.894357+03	20
10	1-step WF	test	2016-02-03 19:13:22.928175+03	25
11	IBP 2016 Workflow	New process	2016-02-03 23:54:26.831307+03	27
12	asd	asd	2016-02-05 10:17:21.421579+03	26
2	test workflow	my first test workflow	2016-01-20 18:27:35.972083+03	2
8	2/7 made up	APM seeing how this works	2016-01-22 16:34:32.335583+03	21
13	2016 survey workflow	This is how we do process in 2016	2016-02-16 21:45:41.481821+03	30
\.


--
-- Name: Workflows_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indaba
--

SELECT pg_catalog.setval('"Workflows_id_seq"', 13, true);


--
-- Name: brand_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('brand_id_seq', 19, true);


--
-- Name: country_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indaba
--

SELECT pg_catalog.setval('country_id_seq', 248, true);


--
-- Name: order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('order_id_seq', 320, true);


--
-- Name: role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('role_id_seq', 16, true);


--
-- Name: surveyQuestionOptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: indaba
--

SELECT pg_catalog.setval('"surveyQuestionOptions_id_seq"', 76, true);


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

SELECT pg_catalog.setval('user_id_seq', 214, true);


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
-- Name: JSON_pkey; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Surveys"
    ADD CONSTRAINT "JSON_pkey" PRIMARY KEY (id);


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
-- Name: ProductUOA_pkey; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_pkey" PRIMARY KEY ("productId", "UOAid");


--
-- Name: Product_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: Projects_codeName_key; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_codeName_key" UNIQUE ("codeName");


--
-- Name: Projects_pkey; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_pkey" PRIMARY KEY (id);


--
-- Name: Rights_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Rights"
    ADD CONSTRAINT "Rights_pkey" PRIMARY KEY (id);


--
-- Name: SurveyAnswers_pkey; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_pkey" PRIMARY KEY (id);


--
-- Name: SurveyQuestions_pkey; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "SurveyQuestions"
    ADD CONSTRAINT "SurveyQuestions_pkey" PRIMARY KEY (id);


--
-- Name: Tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_pkey" PRIMARY KEY (id);


--
-- Name: Translations_pkey; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_pkey" PRIMARY KEY ("essenceId", "entityId", field, "langId");


--
-- Name: UnitOfAnalysisClassType_pkey; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysisClassType"
    ADD CONSTRAINT "UnitOfAnalysisClassType_pkey" PRIMARY KEY (id);


--
-- Name: UnitOfAnalysisTagLink_uoaId_uoaTagId_key; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_uoaId_uoaTagId_key" UNIQUE ("uoaId", "uoaTagId");


--
-- Name: UnitOfAnalysisTag_pkey; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_pkey" PRIMARY KEY (id);


--
-- Name: UnitOfAnalysisType_pkey; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysisType"
    ADD CONSTRAINT "UnitOfAnalysisType_pkey" PRIMARY KEY (id);


--
-- Name: UnitOfAnalysis_pkey; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_pkey" PRIMARY KEY (id);


--
-- Name: UserUOA_pkey; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "UserUOA"
    ADD CONSTRAINT "UserUOA_pkey" PRIMARY KEY ("UserId", "UOAid");


--
-- Name: Users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres; Tablespace: 
--

ALTER TABLE ONLY "Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- Name: WorkflowSteps_pkey; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "WorkflowSteps"
    ADD CONSTRAINT "WorkflowSteps_pkey" PRIMARY KEY (id);


--
-- Name: Workflows_pkey; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Workflows"
    ADD CONSTRAINT "Workflows_pkey" PRIMARY KEY (id);


--
-- Name: Workflows_productId_key; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Workflows"
    ADD CONSTRAINT "Workflows_productId_key" UNIQUE ("productId");


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
-- Name: surveyQuestionOptions_pkey; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "SurveyQuestionOptions"
    ADD CONSTRAINT "surveyQuestionOptions_pkey" PRIMARY KEY (id);


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
-- Name: UnitOfAnalysisTagLink_uoaId_idx; Type: INDEX; Schema: public; Owner: indaba; Tablespace: 
--

CREATE INDEX "UnitOfAnalysisTagLink_uoaId_idx" ON "UnitOfAnalysisTagLink" USING btree ("uoaId");


--
-- Name: UnitOfAnalysisTagLink_uoaTagId_idx; Type: INDEX; Schema: public; Owner: indaba; Tablespace: 
--

CREATE INDEX "UnitOfAnalysisTagLink_uoaTagId_idx" ON "UnitOfAnalysisTagLink" USING btree ("uoaTagId");


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
-- Name: ProductUOA_UOAid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_UOAid_fkey" FOREIGN KEY ("UOAid") REFERENCES "UnitOfAnalysis"(id);


--
-- Name: ProductUOA_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "ProductUOA"
    ADD CONSTRAINT "ProductUOA_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: Products_originalLangId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_originalLangId_fkey" FOREIGN KEY ("originalLangId") REFERENCES "Languages"(id);


--
-- Name: Products_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Projects"(id);


--
-- Name: Products_surveyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "Products"
    ADD CONSTRAINT "Products_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Surveys"(id);


--
-- Name: Projects_accessMatrixId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_accessMatrixId_fkey" FOREIGN KEY ("matrixId") REFERENCES "AccessMatrices"(id);


--
-- Name: Projects_adminUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "Projects"
    ADD CONSTRAINT "Projects_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "Users"(id);


--
-- Name: Projects_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
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
-- Name: SurveyAnswersVersions_optionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "SurveyAnswerVersions"
    ADD CONSTRAINT "SurveyAnswersVersions_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "SurveyQuestionOptions"(id);


--
-- Name: SurveyAnswersVersions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "SurveyAnswerVersions"
    ADD CONSTRAINT "SurveyAnswersVersions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"(id);


--
-- Name: SurveyAnswers_optionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "SurveyQuestionOptions"(id);


--
-- Name: SurveyAnswers_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: SurveyAnswers_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions"(id);


--
-- Name: SurveyAnswers_surveyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Surveys"(id);


--
-- Name: SurveyAnswers_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"(id);


--
-- Name: SurveyAnswers_wfStepId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "SurveyAnswers"
    ADD CONSTRAINT "SurveyAnswers_wfStepId_fkey" FOREIGN KEY ("wfStepId") REFERENCES "WorkflowSteps"(id);


--
-- Name: SurveyQuestions_surveyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "SurveyQuestions"
    ADD CONSTRAINT "SurveyQuestions_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Surveys"(id);


--
-- Name: Surveys_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "Surveys"
    ADD CONSTRAINT "Surveys_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Projects"(id);


--
-- Name: Tasks_entityTypeRoleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_entityTypeRoleId_fkey" FOREIGN KEY ("entityTypeRoleId") REFERENCES "EssenceRoles"(id);


--
-- Name: Tasks_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: Tasks_stepId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowSteps"(id);


--
-- Name: Tasks_uoaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "Tasks"
    ADD CONSTRAINT "Tasks_uoaId_fkey" FOREIGN KEY ("uoaId") REFERENCES "UnitOfAnalysis"(id);


--
-- Name: Translations_essence_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_essence_id_fkey" FOREIGN KEY ("essenceId") REFERENCES "Essences"(id);


--
-- Name: Translations_lang_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "Translations"
    ADD CONSTRAINT "Translations_lang_id_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysisClassType_langId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysisClassType"
    ADD CONSTRAINT "UnitOfAnalysisClassType_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysisTagLink_uoaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_uoaId_fkey" FOREIGN KEY ("uoaId") REFERENCES "UnitOfAnalysis"(id);


--
-- Name: UnitOfAnalysisTagLink_uoaTagId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysisTagLink"
    ADD CONSTRAINT "UnitOfAnalysisTagLink_uoaTagId_fkey" FOREIGN KEY ("uoaTagId") REFERENCES "UnitOfAnalysisTag"(id);


--
-- Name: UnitOfAnalysisTag_classTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_classTypeId_fkey" FOREIGN KEY ("classTypeId") REFERENCES "UnitOfAnalysisClassType"(id);


--
-- Name: UnitOfAnalysisTag_langId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysisTag"
    ADD CONSTRAINT "UnitOfAnalysisTag_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysisType_langId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysisType"
    ADD CONSTRAINT "UnitOfAnalysisType_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysis_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Users"(id);


--
-- Name: UnitOfAnalysis_langId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_langId_fkey" FOREIGN KEY ("langId") REFERENCES "Languages"(id);


--
-- Name: UnitOfAnalysis_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Users"(id);


--
-- Name: UnitOfAnalysis_unitOfAnalysisType_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "UnitOfAnalysis"
    ADD CONSTRAINT "UnitOfAnalysis_unitOfAnalysisType_fkey" FOREIGN KEY ("unitOfAnalysisType") REFERENCES "UnitOfAnalysisType"(id);


--
-- Name: UserUOA_UOAid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "UserUOA"
    ADD CONSTRAINT "UserUOA_UOAid_fkey" FOREIGN KEY ("UOAid") REFERENCES "UnitOfAnalysis"(id);


--
-- Name: UserUOA_UserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "UserUOA"
    ADD CONSTRAINT "UserUOA_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"(id);


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
-- Name: WorkflowSteps_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "WorkflowSteps"
    ADD CONSTRAINT "WorkflowSteps_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Roles"(id);


--
-- Name: WorkflowSteps_worflowId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "WorkflowSteps"
    ADD CONSTRAINT "WorkflowSteps_worflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflows"(id);


--
-- Name: Workflows_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "Workflows"
    ADD CONSTRAINT "Workflows_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


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
-- Name: surveyQuestionOptions_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "SurveyQuestionOptions"
    ADD CONSTRAINT "surveyQuestionOptions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions"(id);


--
-- Name: user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "EssenceRoles"
    ADD CONSTRAINT user_fkey FOREIGN KEY ("userId") REFERENCES "Users"(id);


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

