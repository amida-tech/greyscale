-- Table: "Organizations"

-- DROP TABLE "Organizations";

CREATE TABLE "Organizations"
(
  id serial NOT NULL,
  name character varying(100),
  address character varying(200),
  "adminUserId" integer,
  url character varying(200),
  "enforceApiSecurity" smallint,
  "isActive" boolean,
  CONSTRAINT "Organizations_pkey" PRIMARY KEY (id),
  CONSTRAINT "Organizations_adminUserId_fkey" FOREIGN KEY ("adminUserId")
      REFERENCES "Users" (id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "Organizations_adminUserId_key" UNIQUE ("adminUserId")
)
WITH (
  OIDS=FALSE
);
ALTER TABLE "Organizations"
  OWNER TO postgres;
