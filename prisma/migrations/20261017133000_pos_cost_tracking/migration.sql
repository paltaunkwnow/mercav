-- Preserve whether a merchant knows the cost of a product. Existing products
-- keep their current behaviour and are treated as known costs.
ALTER TABLE "POSProduct" ADD COLUMN "costKnown" BOOLEAN NOT NULL DEFAULT true;

-- A sale must keep the cost that was known at the moment it was completed.
-- Null means the merchant did not enter a cost, so reports can distinguish it
-- from a genuine cost of zero.
ALTER TABLE "POSSaleItem" ADD COLUMN "unitCostPrice" DECIMAL;
