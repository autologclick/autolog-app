ALTER TABLE "Expense" ADD COLUMN "documentId" TEXT; 
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_documentId_key" UNIQUE ("documentId"); 
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE; 
