CREATE OR REPLACE FUNCTION twc_delete_old_token()
  RETURNS trigger AS
$BODY$BEGIN
   DELETE FROM "Token"
   WHERE "userID" = NEW."userID"
   AND "realm" = NEW."realm";
   RETURN NEW;
END;$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION twc_delete_old_token()
  OWNER TO postgres;