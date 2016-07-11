CREATE SEQUENCE "public"."Logs_id_seq"
 INCREMENT 1
 MINVALUE 0
 MAXVALUE 9223372036854775807
 START 1
 CACHE 1
;
ALTER TABLE "public"."Logs_id_seq" OWNER TO "indaba";

CREATE TABLE "public"."Logs" (
"id" int4 DEFAULT nextval('"Logs_id_seq"'::regclass) NOT NULL,
"created" timestamptz(6) DEFAULT now(),
"user" int4 NOT NULL,
"action" varchar COLLATE "default",
"essence" int4 NOT NULL,
"entity" int4,
"entities" varchar COLLATE "default",
"quantity" int4 DEFAULT 0,
"info" text COLLATE "default",
"error" bool DEFAULT false,
PRIMARY KEY ("id"),
FOREIGN KEY ("user") REFERENCES "public"."Users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
FOREIGN KEY ("essence") REFERENCES "public"."Essences" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
)
WITH (OIDS=FALSE)
;
ALTER TABLE "public"."Logs" OWNER TO "indaba";

ALTER SEQUENCE "public"."Logs_id_seq"
 OWNED BY "public"."Logs"."id";