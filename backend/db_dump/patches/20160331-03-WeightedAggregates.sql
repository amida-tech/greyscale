SET search_path TO 'public';

ALTER TABLE "IndexQuestionWeights"
   ADD COLUMN "aggregateType" character varying;

ALTER TABLE "SubindexWeights"
   ADD COLUMN "aggregateType" character varying;
