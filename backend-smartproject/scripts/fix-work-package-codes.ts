/**
 * Script to fix existing work package codes to follow the WBS code pattern
 * Run with: npx tsx scripts/fix-work-package-codes.ts
 */

import { db } from "../src/db";
import { workPackages, wbsItems } from "../src/schema";
import { eq, sql } from "drizzle-orm";

async function fixWorkPackageCodes() {
  console.log("Starting work package code fix...");

  try {
    // Get all work packages with their parent WBS codes
    const allWorkPackages = await db
      .select({
        wpId: workPackages.id,
        wbsItemId: workPackages.wbsItemId,
        projectId: workPackages.projectId,
        currentCode: workPackages.code,
        wbsCode: wbsItems.code,
      })
      .from(workPackages)
      .innerJoin(wbsItems, eq(workPackages.wbsItemId, wbsItems.id))
      .orderBy(workPackages.wbsItemId, workPackages.id);

    console.log(`Found ${allWorkPackages.length} work packages to process`);

    // Group by WBS item ID and assign sequential indices
    const wbsGroups = new Map<number, typeof allWorkPackages>();
    for (const wp of allWorkPackages) {
      if (!wbsGroups.has(wp.wbsItemId)) {
        wbsGroups.set(wp.wbsItemId, []);
      }
      wbsGroups.get(wp.wbsItemId)!.push(wp);
    }

    // Update each work package with the new code
    let updated = 0;
    for (const [wbsItemId, wps] of wbsGroups.entries()) {
      const wbsCode = wps[0].wbsCode;
      
      for (let i = 0; i < wps.length; i++) {
        const wp = wps[i];
        const newCode = `${wbsCode}.${i + 1}`;
        
        if (wp.currentCode !== newCode) {
          await db
            .update(workPackages)
            .set({ code: newCode })
            .where(eq(workPackages.id, wp.wpId));
          
          console.log(`Updated WP ${wp.wpId}: "${wp.currentCode}" -> "${newCode}"`);
          updated++;
        }
      }
    }

    console.log(`\nFixed ${updated} work package codes`);
    console.log("Code fix completed successfully!");
  } catch (error) {
    console.error("Error fixing work package codes:", error);
    process.exit(1);
  }
}

fixWorkPackageCodes()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

