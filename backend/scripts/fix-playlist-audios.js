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

    // Check if table exists
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
      AND TABLE_NAME = 'PlaylistAudios'
    `);

    if (tables.length === 0) {
      console.log('Creating PlaylistAudios table...');
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS PlaylistAudios (
          playlistId CHAR(36) BINARY NOT NULL,
          audioId CHAR(36) BINARY NOT NULL,
          \`order\` INTEGER DEFAULT 0,
          addedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (playlistId, audioId),
          FOREIGN KEY (playlistId) REFERENCES playlists(id) ON DELETE CASCADE,
          FOREIGN KEY (audioId) REFERENCES audios(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('PlaylistAudios table created.');
    } else {
      // Check if order column exists
      const [columns] = await sequelize.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
        AND TABLE_NAME = 'PlaylistAudios' 
        AND COLUMN_NAME = 'order'
      `);

      if (columns.length === 0) {
        console.log('Adding order column to PlaylistAudios table...');
        await sequelize.query(`
          ALTER TABLE PlaylistAudios 
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
        AND TABLE_NAME = 'PlaylistAudios' 
        AND COLUMN_NAME = 'addedAt'
      `);

      if (addedAtColumns.length === 0) {
        console.log('Adding addedAt column to PlaylistAudios table...');
        await sequelize.query(`
          ALTER TABLE PlaylistAudios 
          ADD COLUMN addedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        `);
        console.log('AddedAt column added.');
      } else {
        console.log('AddedAt column already exists.');
      }
    }

    console.log('PlaylistAudios table is up to date.');
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

fixPlaylistAudios();

