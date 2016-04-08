ALTER Table "Token"
DROP CONSTRAINT "Token_pkey",
ADD CONSTRAINT "Token_pkey" PRIMARY KEY ("userID", realm);