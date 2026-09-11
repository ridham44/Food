const db = require('../../app/db/models');

/**
 * Prices a cart against live Menu/ComboGroup rows. Same lookup pattern as
 * order_placement's orderCustomer, but with an explicit tenantId match added
 * — the original lookup only checked disableTenantCheck + existence, so a
 * menuId from another tenant would silently price/validate successfully.
 * That gap matters more here because the result is what gets charged via
 * Razorpay, not just recorded on an unpaid order.
 */
async function priceCartItems({ tenantId, items }) {
    if (!Array.isArray(items) || items.length === 0) {
        const err = new Error('items are required');
        err.status = 400;
        throw err;
    }

    const menuIds = items.filter((i) => i.menuId).map((i) => i.menuId);
    const comboIds = items.filter((i) => i.comboId).map((i) => i.comboId);

    const menus = await db.Menu.findAll({
        where: { id: menuIds, isAvailable: '1', tenantId },
        raw: true,
        disableTenantCheck: true,
    });

    const combos = await db.ComboGroup.findAll({
        where: { id: comboIds, tenantId },
        raw: true,
        disableTenantCheck: true,
    });

    if (menus.length !== menuIds.length || combos.length !== comboIds.length) {
        const err = new Error('Invalid menuId or comboId in items');
        err.status = 400;
        throw err;
    }

    let totalAmount = 0;
    const pricedItems = items.map((item) => {
        if (item.menuId) {
            const menu = menus.find((m) => m.id === item.menuId);
            const price = parseFloat(menu.price);
            const totalPrice = price * item.quantity;
            totalAmount += totalPrice;
            return {
                menuId: item.menuId,
                comboId: null,
                quantity: item.quantity,
                specialInstruction: item.specialInstruction || null,
                unitPrice: price,
                totalPrice,
            };
        }

        const combo = combos.find((c) => c.id === item.comboId);
        const price = parseFloat(combo.price);
        const totalPrice = price * item.quantity;
        totalAmount += totalPrice;
        return {
            menuId: null,
            comboId: item.comboId,
            quantity: item.quantity,
            specialInstruction: item.specialInstruction || null,
            unitPrice: price,
            totalPrice,
        };
    });

    return { totalAmount: round2(totalAmount), pricedItems };
}

async function computeTaxAndFees({ tenantId, totalAmount, isParcel }) {
    const taxConfig = await db.TaxConfig.findOne({ where: { tenantId, status: '1' } });

    const gstPercent = taxConfig ? parseFloat(taxConfig.gst) : 0;
    const gstAmount = round2((totalAmount * gstPercent) / 100);
    const packingFee = isParcel === '1' && taxConfig ? round2(parseFloat(taxConfig.packingFee)) : 0;

    return { gstPercent, gstAmount, packingFee };
}

function round2(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

module.exports = { priceCartItems, computeTaxAndFees, round2 };
