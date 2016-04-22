SET search_path TO sceleton;-- need to patch all the schemas excluding public
ALTER TABLE "UnitOfAnalysis" 
ALTER COLUMN "unitOfAnalysisType" SET NOT NULL,
ADD UNIQUE ("name");

