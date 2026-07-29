-- Fjerner ALL testdata fra selgerportalen. Trygg aa kjore naar som helst:
-- den treffer bare rader som er merket TESTDATA, aldri ekte leads eller kunder.
--
--   npx wrangler d1 execute dm-salg --remote --file slett-testdata.sql

DELETE FROM leads     WHERE bunke = 'ZZ TESTDATA (ikke ring)';
DELETE FROM bookinger WHERE bedrift LIKE 'TESTDATA %';
