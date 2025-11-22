const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Comment = sequelize.define('Comment', {
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
    audioId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'audios',
        key: 'id'
      }
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'comments',
        key: 'id'
      },
      comment: 'For nested comments/replies'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    isEdited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'comments',
    timestamps: true,
    indexes: [
      {
        fields: ['audioId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['parentId']
      }
    ]
  });

  Comment.associate = (models) => {
    Comment.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Comment.belongsTo(models.Audio, { foreignKey: 'audioId', as: 'audio' });
    Comment.belongsTo(models.Comment, { foreignKey: 'parentId', as: 'parent' });
    Comment.hasMany(models.Comment, { foreignKey: 'parentId', as: 'replies' });
  };

  return Comment;
};

