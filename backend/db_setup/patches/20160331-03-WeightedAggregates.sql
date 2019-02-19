SET search_path TO 'public';

ALTER TABLE "SubindexWeights"
   ADD COLUMN "aggregateType" character varying;
