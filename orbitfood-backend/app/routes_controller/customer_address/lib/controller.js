const { v4: uuidv4 } = require('uuid');
const db = require('../../../db/models');
const { status, common } = require('../../../../utils');

function guardCustomer(req, res) {
    if (req.userType !== 'customer') {
        res.status(status.Forbidden).json({ message: 'Customer access only' });
        return false;
    }
    return true;
}

async function clearOtherDefaults(customerId, transaction) {
    await db.CustomerAddress.update({ isDefault: false }, { where: { customerId, isDefault: true }, transaction });
}

exports.createAddress = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        if (!guardCustomer(req, res)) return await transaction.rollback();

        const customerId = req.user.id;
        const { label, contactName, contactPhone, addressLine, countryId, stateId, cityId, pincode, isDefault } = req.body;

        const existingCount = await db.CustomerAddress.count({ where: { customerId }, transaction });
        const shouldBeDefault = Boolean(isDefault) || existingCount === 0;

        if (shouldBeDefault) await clearOtherDefaults(customerId, transaction);

        const address = await db.CustomerAddress.create(
            {
                id: uuidv4(),
                customerId,
                label: label || 'Home',
                contactName,
                contactPhone,
                addressLine,
                countryId: countryId || null,
                stateId: stateId || null,
                cityId: cityId || null,
                pincode: pincode || null,
                isDefault: shouldBeDefault,
                createdAt: new Date(),
            },
            { transaction }
        );

        await transaction.commit();
        return res.status(status.OK).json({ message: 'Address added', data: address });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Create Customer Address API', req, res);
    }
};

exports.listAddresses = async (req, res) => {
    try {
        if (!guardCustomer(req, res)) return;
        const addresses = await db.CustomerAddress.findAll({
            where: { customerId: req.user.id },
            order: [
                ['isDefault', 'DESC'],
                ['createdAt', 'DESC'],
            ],
        });
        return res.status(status.OK).json({ data: addresses });
    } catch (error) {
        return common.throwException(error, 'List Customer Addresses API', req, res);
    }
};

exports.getAddress = async (req, res) => {
    try {
        if (!guardCustomer(req, res)) return;
        const address = await db.CustomerAddress.findOne({ where: { id: req.params.id, customerId: req.user.id } });
        if (!address) return res.status(status.NotFound).json({ message: 'Address not found' });
        return res.status(status.OK).json({ data: address });
    } catch (error) {
        return common.throwException(error, 'Get Customer Address API', req, res);
    }
};

exports.updateAddress = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        if (!guardCustomer(req, res)) return await transaction.rollback();

        const customerId = req.user.id;
        const address = await db.CustomerAddress.findOne({ where: { id: req.params.id, customerId }, transaction });
        if (!address) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Address not found' });
        }

        const { label, contactName, contactPhone, addressLine, countryId, stateId, cityId, pincode, isDefault } = req.body;

        if (isDefault === true) await clearOtherDefaults(customerId, transaction);

        address.set({
            label: label ?? address.label,
            contactName: contactName ?? address.contactName,
            contactPhone: contactPhone ?? address.contactPhone,
            addressLine: addressLine ?? address.addressLine,
            countryId: countryId ?? address.countryId,
            stateId: stateId ?? address.stateId,
            cityId: cityId ?? address.cityId,
            pincode: pincode ?? address.pincode,
            isDefault: isDefault ?? address.isDefault,
            updatedAt: new Date(),
        });
        await address.save({ transaction });

        await transaction.commit();
        return res.status(status.OK).json({ message: 'Address updated', data: address });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Update Customer Address API', req, res);
    }
};

exports.deleteAddress = async (req, res) => {
    try {
        if (!guardCustomer(req, res)) return;
        const deleted = await db.CustomerAddress.destroy({ where: { id: req.params.id, customerId: req.user.id } });
        if (!deleted) return res.status(status.NotFound).json({ message: 'Address not found' });
        return res.status(status.OK).json({ message: 'Address deleted' });
    } catch (error) {
        return common.throwException(error, 'Delete Customer Address API', req, res);
    }
};

exports.setDefaultAddress = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    try {
        if (!guardCustomer(req, res)) return await transaction.rollback();

        const customerId = req.user.id;
        const address = await db.CustomerAddress.findOne({ where: { id: req.params.id, customerId }, transaction });
        if (!address) {
            await transaction.rollback();
            return res.status(status.NotFound).json({ message: 'Address not found' });
        }

        await clearOtherDefaults(customerId, transaction);
        address.isDefault = true;
        address.updatedAt = new Date();
        await address.save({ transaction });

        await transaction.commit();
        return res.status(status.OK).json({ message: 'Default address updated', data: address });
    } catch (error) {
        await transaction.rollback();
        return common.throwException(error, 'Set Default Customer Address API', req, res);
    }
};
