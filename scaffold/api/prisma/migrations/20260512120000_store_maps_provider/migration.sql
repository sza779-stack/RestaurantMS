-- Map provider for dispatch / delivery UI (Google vs free OSM stack).
ALTER TABLE "store_settings" ADD COLUMN "mapsProvider" TEXT NOT NULL DEFAULT 'GOOGLE';
