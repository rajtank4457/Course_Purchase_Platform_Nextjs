import dotenv from "dotenv";
dotenv.config(); import fs from "fs/promises";

import path from "path";
import { fileURLToPath } from "url";

import { runQuery, updateRow } from "../helpers/dbHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Backend root folder
const ROOT_DIR = path.resolve(__dirname, "..");

async function updateChapterFileSizes() {
    try {
        console.log("Fetching chapter source files...");
        console.log(process.env.DB_HOST);
        console.log(process.env.DB_USER);
        console.log(process.env.DB_NAME);

        const files = await runQuery(`
      SELECT
        csId,
        filePath
      FROM chapter_sources
    `);

        console.log(`Found ${files.length} files\n`);

        let updated = 0;
        let skipped = 0;

        for (const file of files) {
            try {
                // Example:
                // uploads/chapters/docs/abc.pdf
                const absolutePath = path.join(ROOT_DIR, file.filePath);

                const stats = await fs.stat(absolutePath);

                await updateRow(
                    "chapter_sources",
                    {
                        fileSize: stats.size,
                    },
                    "csId = ?",
                    [file.csId]
                );

                console.log(
                    `✔ csId=${file.csId}  Size=${stats.size} bytes`
                );

                updated++;
            } catch (err) {
                console.log(
                    `✖ File not found for csId=${file.csId}`
                );

                skipped++;
            }
        }

        console.log("\n==================================");
        console.log(`Updated : ${updated}`);
        console.log(`Skipped : ${skipped}`);
        console.log("Finished Successfully");
        console.log("==================================");
    } catch (err) {
        console.error(err);
    }

    process.exit();
}

updateChapterFileSizes();