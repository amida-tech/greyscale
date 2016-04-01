SET search_path TO 'public';

CREATE TABLE "ComparativeVisualizationProducts" (
    "visualizationId" integer NOT NULL,
    "productId" integer NOT NULL,
    "indexId" integer NOT NULL
);
ALTER TABLE "ComparativeVisualizationProducts" OWNER TO indaba;

CREATE TABLE "ComparativeVisualizations" (
    id integer NOT NULL,
    title character varying,
    "organizationId" integer NOT NULL,
    "uoaIds" integer[] NOT NULL DEFAULT '{}'::integer[]
);
ALTER TABLE "ComparativeVisualizations" OWNER TO indaba;

CREATE TABLE "ImportedDatasets" (
    id integer NOT NULL,
    title character varying,
    cols character varying[] NOT NULL,
    "uoaCol" integer NOT NULL,
    "yearCol" integer,
    "dataCol" integer NOT NULL,
    data character varying[][] NOT NULL,
    "visualizationId" integer NOT NULL,
    "uoaType" character varying NOT NULL
);
ALTER TABLE "ImportedDatasets" OWNER TO indaba;

CREATE SEQUENCE "ComparativeVisualizations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "ComparativeVisualizations_id_seq" OWNER TO indaba;
ALTER SEQUENCE "ComparativeVisualizations_id_seq" OWNED BY "ComparativeVisualizations".id;
ALTER TABLE ONLY "ComparativeVisualizations" ALTER COLUMN id SET DEFAULT nextval('"ComparativeVisualizations_id_seq"'::regclass);

CREATE SEQUENCE "ImportedDataset_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "ImportedDataset_id_seq" OWNER TO indaba;
ALTER SEQUENCE "ImportedDataset_id_seq" OWNED BY "ImportedDatasets".id;
ALTER TABLE ONLY "ImportedDatasets" ALTER COLUMN id SET DEFAULT nextval('"ImportedDataset_id_seq"'::regclass);

ALTER TABLE ONLY "ComparativeVisualizationProducts"
    ADD CONSTRAINT "ComparativeVisualizationProducts_pkey" PRIMARY KEY ("visualizationId", "productId", "indexId");

ALTER TABLE ONLY "ComparativeVisualizations"
    ADD CONSTRAINT "ComparativeVisualizations_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "ComparativeVisualizationProducts"
    ADD CONSTRAINT "ComparativeVisualizationProducts_indexId_fkey" FOREIGN KEY ("indexId") REFERENCES "Indexes"(id);

ALTER TABLE ONLY "ComparativeVisualizationProducts"
    ADD CONSTRAINT "ComparativeVisualizationProducts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);    

ALTER TABLE ONLY "ComparativeVisualizationProducts"
    ADD CONSTRAINT "ComparativeVisualizationProducts_visualizationId_fkey" FOREIGN KEY ("visualizationId") REFERENCES "ComparativeVisualizations"(id);

ALTER TABLE ONLY "ComparativeVisualizations"
    ADD CONSTRAINT "ComparativeVisualizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);
    
ALTER TABLE ONLY "ImportedDatasets"
    ADD CONSTRAINT "ImportedDataset_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY "ImportedDatasets"
    ADD CONSTRAINT "ImportedDataset_visualizationId_fkey" FOREIGN KEY ("visualizationId") REFERENCES "ComparativeVisualizations"(id);
