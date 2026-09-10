'use strict';
module.exports = (sequelize, Sequelize) => {
    const CustomerPoints = sequelize.define(
        'CustomerPoints',
        {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            customerId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'Customer',
                    key: 'id',
                    belongsToAlias: 'Customer',
                    hasManyAlias: 'CustomerPoints',
                },
            },
            totalPoints: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                allowNull: false,
            },
            currentOrderCount: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                allowNull: false,
                comment: 'Number of orders placed in current 10-order stack',
            },
            bonusPosition: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
                allowNull: false,
                comment: 'Order number where bonus was last given in current stack (0 = not yet given)',
            },
            createdAt: Sequelize.DATE,
            updatedAt: Sequelize.DATE,
        },
        {
            tableName: 'customer_points',
            timestamps: false,
            underscored: false,
        }
    );

    CustomerPoints.hasTenantCondition(false);

    return CustomerPoints;
};
