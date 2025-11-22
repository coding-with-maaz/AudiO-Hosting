const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Folder = sequelize.define('Folder', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    parentFolderId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'folders',
        key: 'id'
      },
      comment: 'For nested folders'
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isShared: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    shareToken: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      comment: 'Unique token for folder sharing'
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Optional password for folder access'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    }
  }, {
    tableName: 'folders',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['parentFolderId']
      },
      {
        fields: ['shareToken']
      },
      {
        fields: ['isPublic', 'isShared']
      }
    ]
  });

  Folder.associate = (models) => {
    Folder.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Folder.belongsTo(models.Folder, { foreignKey: 'parentFolderId', as: 'parentFolder' });
    Folder.hasMany(models.Folder, { foreignKey: 'parentFolderId', as: 'subfolders' });
    Folder.hasMany(models.Audio, { foreignKey: 'folderId', as: 'audios' });
  };

  return Folder;
};

