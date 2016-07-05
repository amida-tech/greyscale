SET search_path TO 'public';

CREATE TABLE "DataApiKeys"
(
   id integer NOT NULL, 
   key character varying NOT NULL, 
   "organizationId" integer NOT NULL, 
   CONSTRAINT "DataApiKeys_pkey" PRIMARY KEY (id), 
   CONSTRAINT "DataApiKeys_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations" (id) ON UPDATE NO ACTION ON DELETE NO ACTION
) 
WITH (
  OIDS = FALSE
)
;
ALTER TABLE "DataApiKeys"
  OWNER TO indaba;

CREATE SEQUENCE "DataApiKey_id_seq"
   INCREMENT 1
   START 1
   CACHE 1;
ALTER SEQUENCE "DataApiKey_id_seq"
  OWNER TO indaba;
ALTER SEQUENCE "DataApiKey_id_seq"
  OWNED BY "DataApiKeys".id;
ALTER TABLE ONLY "DataApiKeys" ALTER COLUMN id SET DEFAULT nextval('"DataApiKey_id_seq"'::regclass);
