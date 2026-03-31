import { seedSiteContentFromFileToKv } from "../lib/site-content-store";

async function main() {
  const content = await seedSiteContentFromFileToKv();
  console.log(
    `Seed abgeschlossen: ${content.aktuell.items.length} Aktuelles, ${content.courses.length} Kurse, ${content.prices.length} Preise.`,
  );
}

main().catch((error) => {
  console.error("Seed fehlgeschlagen:", error);
  process.exitCode = 1;
});
