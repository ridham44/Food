'use strict';

module.exports = (sequelize, Sequelize) => {
    const TaxConfig = sequelize.define(
        'TaxConfig',
        {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.UUIDV4,
            },
            tenantId: {
                type: Sequelize.UUID,
                allowNull: false,
                association: {
                    model: 'Tenant',
                    key: 'id',
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT',
                    belongsToAlias: 'Tenant',
                },
            },
            gst: {
                type: Sequelize.DECIMAL(5, 2),
                allowNull: false,
                comment: 'GST percentage',
            },
            packingFee: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                comment: 'Flat packing fee',
            },
            status: {
                type: Sequelize.ENUM('0', '1'),
                allowNull: false,
                defaultValue: '1',
                comment: '1 = Active, 0 = Inactive',
            },
            createdAt: Sequelize.DATE,
            updatedAt: Sequelize.DATE,
        },
        {
            tableName: 'tax_config',
            timestamps: false,
        }
    );

    TaxConfig.hasTenantCondition?.(false);

    return TaxConfig;
};
