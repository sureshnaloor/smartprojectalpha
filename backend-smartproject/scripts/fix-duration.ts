import { pool } from '../src/db';

async function fixDuration() {
    console.log('🚀 Running manual migration to add "duration" column...');

    try {
        const client = await pool.connect();
        try {
            // Add the duration column safely if it doesn't exist
            await client.query(`
        ALTER TABLE project_activities 
        ADD COLUMN IF NOT EXISTS duration integer;
      `);

            console.log('✅ Success: "duration" column added (or already exists) in project_activities.');
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('❌ Error applying migration:', error);
        process.exit(1);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

fixDuration();
