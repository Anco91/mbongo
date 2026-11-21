-- Remove the unused member role while preserving every other member field.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_members" ("createdAt", "firstName", "id", "lastName", "updatedAt") SELECT "createdAt", "firstName", "id", "lastName", "updatedAt" FROM "members";
DROP TABLE "members";
ALTER TABLE "new_members" RENAME TO "members";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
