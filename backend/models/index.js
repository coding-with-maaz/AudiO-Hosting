const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool
  }
);

const db = {};

// Import models
db.User = require('./User')(sequelize, Sequelize.DataTypes);
db.Plan = require('./Plan')(sequelize, Sequelize.DataTypes);
db.Audio = require('./Audio')(sequelize, Sequelize.DataTypes);
db.Folder = require('./Folder')(sequelize, Sequelize.DataTypes);
db.Affiliate = require('./Affiliate')(sequelize, Sequelize.DataTypes);
db.Transaction = require('./Transaction')(sequelize, Sequelize.DataTypes);
db.Analytics = require('./Analytics')(sequelize, Sequelize.DataTypes);
db.Subscription = require('./Subscription')(sequelize, Sequelize.DataTypes);
db.Bandwidth = require('./Bandwidth')(sequelize, Sequelize.DataTypes);
db.ApiKey = require('./ApiKey')(sequelize, Sequelize.DataTypes);
db.Playlist = require('./Playlist')(sequelize, Sequelize.DataTypes);
db.PlaylistAudio = require('./PlaylistAudio')(sequelize, Sequelize.DataTypes);
db.Favorite = require('./Favorite')(sequelize, Sequelize.DataTypes);
db.Comment = require('./Comment')(sequelize, Sequelize.DataTypes);
db.Rating = require('./Rating')(sequelize, Sequelize.DataTypes);

// Define associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

