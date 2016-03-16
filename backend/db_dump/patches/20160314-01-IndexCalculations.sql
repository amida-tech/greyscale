-- Name: IndexQuestionWeights; Type: TABLE; Schema: public; Owner: indaba; Tablespace: 
--

CREATE TABLE "IndexQuestionWeights" (
    "indexId" integer NOT NULL,
    "questionId" integer NOT NULL,
    weight numeric NOT NULL,
    type character varying NOT NULL
);


ALTER TABLE "IndexQuestionWeights" OWNER TO indaba;

--
-- Name: IndexSubindexWeights; Type: TABLE; Schema: public; Owner: rickards; Tablespace: 
--

CREATE TABLE "IndexSubindexWeights" (
    "indexId" integer NOT NULL,
    "subindexId" integer NOT NULL,
    weight numeric NOT NULL,
    type character varying NOT NULL
);


ALTER TABLE "IndexSubindexWeights" OWNER TO indaba;

--
-- Name: Index_id_seq; Type: SEQUENCE; Schema: public; Owner: indaba
--

CREATE SEQUENCE "Index_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Index_id_seq" OWNER TO indaba;

--
-- Name: Indexes; Type: TABLE; Schema: public; Owner: indaba; Tablespace: 
--

CREATE TABLE "Indexes" (
    id integer DEFAULT nextval('"Index_id_seq"'::regclass) NOT NULL,
    "productId" integer NOT NULL,
    title character varying,
    description text,
    divisor numeric DEFAULT 1 NOT NULL
);


ALTER TABLE "Indexes" OWNER TO indaba;

-- Name: SubindexWeights; Type: TABLE; Schema: public; Owner: indaba; Tablespace: 
--

CREATE TABLE "SubindexWeights" (
    "subindexId" integer NOT NULL,
    "questionId" integer NOT NULL,
    weight numeric NOT NULL,
    type character varying NOT NULL
);


ALTER TABLE "SubindexWeights" OWNER TO indaba;

--
-- Name: Subindex_id_seq; Type: SEQUENCE; Schema: public; Owner: indaba
--

CREATE SEQUENCE "Subindex_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Subindex_id_seq" OWNER TO indaba;

--
-- Name: Subindexes; Type: TABLE; Schema: public; Owner: indaba; Tablespace: 
--

CREATE TABLE "Subindexes" (
    id integer DEFAULT nextval('"Subindex_id_seq"'::regclass) NOT NULL,
    "productId" integer NOT NULL,
    title character varying,
    description text,
    divisor numeric DEFAULT 1 NOT NULL
);

ALTER TABLE "Subindexes" OWNER TO indaba;

-- Name: Visualizations; Type: TABLE; Schema: public; Owner: indaba; Tablespace: 
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


ALTER TABLE "Visualizations" OWNER TO indaba;

--
-- Name: Visualizations_id_seq; Type: SEQUENCE; Schema: public; Owner: indaba
--

CREATE SEQUENCE "Visualizations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "Visualizations_id_seq" OWNER TO indaba;

--
-- Name: Visualizations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: indaba
--

ALTER SEQUENCE "Visualizations_id_seq" OWNED BY "Visualizations".id;

--
-- Name: IndexQuestionWeight_pkey; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "IndexQuestionWeights"
    ADD CONSTRAINT "IndexQuestionWeight_pkey" PRIMARY KEY ("indexId", "questionId");


--
-- Name: IndexSubindexWeight_pkey; Type: CONSTRAINT; Schema: public; Owner: rickards; Tablespace: 
--

ALTER TABLE ONLY "IndexSubindexWeights"
    ADD CONSTRAINT "IndexSubindexWeight_pkey" PRIMARY KEY ("indexId", "subindexId");


--
-- Name: Indexes_pkey; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Indexes"
    ADD CONSTRAINT "Indexes_pkey" PRIMARY KEY (id);


-- Name: SubindexWeight_pkey; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "SubindexWeights"
    ADD CONSTRAINT "SubindexWeight_pkey" PRIMARY KEY ("subindexId", "questionId");


--
-- Name: Subindexes_pkey; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Subindexes"
    ADD CONSTRAINT "Subindexes_pkey" PRIMARY KEY (id);

-- Name: Visualizations_pkey; Type: CONSTRAINT; Schema: public; Owner: indaba; Tablespace: 
--

ALTER TABLE ONLY "Visualizations"
    ADD CONSTRAINT "Visualizations_pkey" PRIMARY KEY (id);


-- Name: fki_Indexes_productId_fkey; Type: INDEX; Schema: public; Owner: indaba; Tablespace: 
--

CREATE INDEX "fki_Indexes_productId_fkey" ON "Indexes" USING btree ("productId");


--
-- Name: fki_Subindexes_productId_fkey; Type: INDEX; Schema: public; Owner: indaba; Tablespace: 
--

CREATE INDEX "fki_Subindexes_productId_fkey" ON "Subindexes" USING btree ("productId");


-- Name: IndexQuestionWeights_indexId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "IndexQuestionWeights"
    ADD CONSTRAINT "IndexQuestionWeights_indexId_fkey" FOREIGN KEY ("indexId") REFERENCES "Indexes"(id);


--
-- Name: IndexQuestionWeights_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "IndexQuestionWeights"
    ADD CONSTRAINT "IndexQuestionWeights_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions"(id);


--
-- Name: IndexSubindexWeights_indexId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rickards
--

ALTER TABLE ONLY "IndexSubindexWeights"
    ADD CONSTRAINT "IndexSubindexWeights_indexId_fkey" FOREIGN KEY ("indexId") REFERENCES "Indexes"(id);


--
-- Name: IndexSubindexWeights_subindexId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rickards
--

ALTER TABLE ONLY "IndexSubindexWeights"
    ADD CONSTRAINT "IndexSubindexWeights_subindexId_fkey" FOREIGN KEY ("subindexId") REFERENCES "Subindexes"(id);


--
-- Name: Indexes_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "Indexes"
    ADD CONSTRAINT "Indexes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


--
-- Name: SubindexWeights_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "SubindexWeights"
    ADD CONSTRAINT "SubindexWeights_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SurveyQuestions"(id);


--
-- Name: SubindexWeights_subindexId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "SubindexWeights"
    ADD CONSTRAINT "SubindexWeights_subindexId_fkey" FOREIGN KEY ("subindexId") REFERENCES "Subindexes"(id);


--
-- Name: Subindexes_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "Subindexes"
    ADD CONSTRAINT "Subindexes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);


-- Name: Visualizations_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "Visualizations"
    ADD CONSTRAINT "Visualizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organizations"(id);


--
-- Name: Visualizations_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: indaba
--

ALTER TABLE ONLY "Visualizations"
    ADD CONSTRAINT "Visualizations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"(id);
