require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false
  }
);

async function fixPlaylistAudios() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Check if table exists (try both naming conventions)
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
      AND (TABLE_NAME = 'PlaylistAudios' OR TABLE_NAME = 'playlist_audios')
    `);

    const tableName = tables.length > 0 ? tables[0].TABLE_NAME : 'playlist_audios';
    
    if (tables.length === 0) {
      console.log('Creating playlist_audios table...');
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS playlist_audios (
          id CHAR(36) BINARY NOT NULL,
          playlistId CHAR(36) BINARY NOT NULL,
          audioId CHAR(36) BINARY NOT NULL,
          \`order\` INTEGER DEFAULT 0,
          addedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY (playlistId, audioId),
          FOREIGN KEY (playlistId) REFERENCES playlists(id) ON DELETE CASCADE,
          FOREIGN KEY (audioId) REFERENCES audios(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('playlist_audios table created.');
    } else {
      // Check if order column exists
      const [columns] = await sequelize.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
        AND TABLE_NAME = '${tableName}' 
        AND COLUMN_NAME = 'order'
      `);

      if (columns.length === 0) {
        console.log(`Adding order column to ${tableName} table...`);
        await sequelize.query(`
          ALTER TABLE \`${tableName}\` 
          ADD COLUMN \`order\` INTEGER DEFAULT 0 AFTER audioId
        `);
        console.log('Order column added.');
      } else {
        console.log('Order column already exists.');
      }

      // Check if addedAt column exists
      const [addedAtColumns] = await sequelize.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
        AND TABLE_NAME = '${tableName}' 
        AND COLUMN_NAME = 'addedAt'
      `);

      if (addedAtColumns.length === 0) {
        console.log(`Adding addedAt column to ${tableName} table...`);
        await sequelize.query(`
          ALTER TABLE \`${tableName}\` 
          ADD COLUMN addedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        `);
        console.log('AddedAt column added.');
      } else {
        console.log('AddedAt column already exists.');
      }
    }

    console.log(`${tableName} table is up to date.`);
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

fixPlaylistAudios();

