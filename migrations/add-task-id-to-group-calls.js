'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('group_calls', 'task_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'card_lists',
        key: 'card_list_id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addIndex('group_calls', ['task_id'], {
      name: 'group_calls_task_id'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('group_calls', 'group_calls_task_id');
    await queryInterface.removeColumn('group_calls', 'task_id');
  }
};