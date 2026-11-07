// 'use strict';
// const { Model } = require('sequelize');

// module.exports = (sequelize, DataTypes) => {
//   class Notification extends Model {
//     static associate(models) {
//       Notification.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
//     }
//   }

//   Notification.init({
//     notifId: {
//       type: DataTypes.UUID,
//       primaryKey: true,
//       defaultValue: DataTypes.UUIDV4,
//       field: 'notif_id'
//     },
//     userId: {
//       type: DataTypes.UUID,
//       allowNull: false,
//       references: { model: 'users', key: 'user_id' },
//       field: 'user_id'
//     },
//     type: {
//       type: DataTypes.STRING(20),
//       allowNull: false,
//       validate: {
//         isIn: [['push', 'smart_reminder', 'social_presence', 'encouragement']]
//       }
//     },
//     title: {
//       type: DataTypes.STRING(255),
//       allowNull: true
//     },
//     message: {
//       type: DataTypes.TEXT,
//       allowNull: false
//     },
//     sentAt: {
//       type: DataTypes.DATE,
//       allowNull: true,
//       field: 'sent_at'
//     },
//     delivered: {
//       type: DataTypes.BOOLEAN,
//       allowNull: false,
//       defaultValue: false
//     },
//     deliveryError: {
//       type: DataTypes.TEXT,
//       allowNull: true,
//       field: 'delivery_error'
//     },
//     scheduledFor: {
//       type: DataTypes.DATE,
//       allowNull: true,
//       field: 'scheduled_for'
//     },
//     reminderReason: {
//       type: DataTypes.TEXT,
//       allowNull: true,
//       field: 'reminder_reason'
//     },
//     triggerAction: {
//       type: DataTypes.TEXT,
//       allowNull: true,
//       field: 'trigger_action'
//     },
//     triggerUserId: {
//       type: DataTypes.UUID,
//       allowNull: true,
//       field: 'trigger_user_id'
//     },
//     read: {
//       type: DataTypes.BOOLEAN,
//       allowNull: false,
//       defaultValue: false
//     },
//     readAt: {
//       type: DataTypes.DATE,
//       allowNull: true,
//       field: 'read_at'
//     },
//     clicked: {
//       type: DataTypes.BOOLEAN,
//       allowNull: false,
//       defaultValue: false
//     },
//     clickedAt: {
//       type: DataTypes.DATE,
//       allowNull: true,
//       field: 'clicked_at'
//     },
//     createdAt: {
//       type: DataTypes.DATE,
//       allowNull: false,
//       defaultValue: DataTypes.NOW,
//       field: 'created_at'
//     }
//   }, {
//     sequelize,
//     modelName: 'Notification',
//     tableName: 'notifications',
//     timestamps: false
//   });

//   return Notification;
// };

'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    static associate(models) {
      Notification.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }

  Notification.init({
    notifId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      field: 'notif_id'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'user_id' },
      field: 'user_id'
    },
    // type: {
    //   type: DataTypes.STRING(20),
    //   allowNull: false,
    //   validate: {
    //     // isIn: [['push', 'smart_reminder', 'social_presence', 'encouragement', 'kanban', 'collaboration', 'task']]
    //     isIn: [['kanban', 'collaboration', 'task', 'reminder', 'system', 'info']]
    //   }
    // }
    type: {
  type: DataTypes.STRING,
  allowNull: false
},
    title: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'sent_at'
    },
    delivered: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    deliveryError: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'delivery_error'
    },
    scheduledFor: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'scheduled_for'
    },
    reminderReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'reminder_reason'
    },
    triggerAction: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'trigger_action'
    },
    triggerUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'trigger_user_id'
    },
    read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'read_at'
    },
    clicked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    clickedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'clicked_at'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: false
  });

  return Notification;
};