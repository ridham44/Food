const PDFDocument = require('pdfkit');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const db = require('../../../db/models');
const { status, common } = require('../../../../utils');

exports.generateInvoicePDF = async (req, res) => {
    try {
        const { orderId } = req.body;

        const order = await db.OrderList.findOne({
            where: { id: orderId },
            include: [
                {
                    model: db.Customer,
                    as: 'Customer',
                    attributes: ['firstName', 'lastName', 'phoneNo'],
                    required: false,
                },
                {
                    model: db.OrderItem,
                    as: 'OrderItem',
                    include: [
                        {
                            model: db.Menu,
                            as: 'Menu',
                            attributes: ['name', 'price'],
                            disableTenantCheck: true,
                        },
                        {
                            model: db.ComboGroup,
                            as: 'ComboGroup',
                            attributes: ['name', 'price'],
                            disableTenantCheck: true,
                        },
                    ],
                },
                {
                    model: db.OrderBill,
                    as: 'OrderBill',
                },
                {
                    model: db.Tenant,
                    as: 'Tenant',
                    attributes: ['companyName', 'address', 'mobile', 'gstNumber'],
                    disableTenantCheck: true,
                },
            ],
        });

        if (!order) {
            return res.status(status.NotFound).json({ message: 'Order not found' });
        }

        const customerName = order.Customer ? `${order.Customer.firstName} ${order.Customer.lastName}`.trim() : order.customerName || '';
        const customerPhone = order.Customer ? order.Customer.phoneNo : order.customerMobile || '';

        const items = order.OrderItem.map((item) => {
            if (item.comboId && item.ComboGroup) {
                return {
                    type: 'combo',
                    name: item.ComboGroup.name,
                    unitPrice: parseFloat(item.ComboGroup.price),
                    quantity: item.quantity,
                    totalPrice: parseFloat(item.totalPrice).toFixed(2),
                };
            } else {
                return {
                    type: 'menu',
                    name: item.Menu?.name || 'Unknown',
                    unitPrice: parseFloat(item.Menu?.price || 0),
                    quantity: item.quantity,
                    totalPrice: parseFloat(item.totalPrice).toFixed(2),
                };
            }
        });

        const bill = order.OrderBill && order.OrderBill.length > 0 ? order.OrderBill[0] : null;

        const invoice = {
            tenant: {
                name: order.Tenant?.companyName || 'N/A',
                address: order.Tenant?.address || '',
                mobile: order.Tenant?.mobile || '',
                GST: order.Tenant?.gstNumber || '',
            },
            customer: {
                name: customerName,
                phoneNo: customerPhone,
            },
            orderDate: moment(order.createdAt).format('YYYY-MM-DD HH:mm'),
            orderId: order.id,
            items,
            bill: {
                subTotal: bill?.totalAmount ? parseFloat(bill.totalAmount) : 0,
                discount: bill?.discountAmount ? parseFloat(bill.discountAmount) : 0,
                coupon: bill?.couponCode || '',
                pointsUsed: bill?.pointsUsed || 0,
                finalAmount: bill?.finalAmount ? parseFloat(bill.finalAmount) : 0,
            },
        };

        // ===== Generate PDF and Save =====
        const fileName = `receipt_${orderId}.pdf`;
        const invoicePath = path.join(__dirname, '../../../../uploads/pdf', fileName);
        const doc = new PDFDocument({ margin: 10, size: [316, 500] });
        doc.pipe(fs.createWriteStream(invoicePath));

        // Header
        const startX = 10;
        const nameCol = startX;
        const unitCol = nameCol + 130;
        const qtyCol = unitCol + 60;
        const totalCol = qtyCol + 70;

        doc.fontSize(16).font('Helvetica-Bold').text(invoice.tenant.name, { align: 'center' });
        doc.moveDown(0.2);
        doc.fontSize(9).font('Helvetica').text(invoice.tenant.address, { align: 'center' });
        doc.text(`Phone: ${invoice.tenant.mobile}`, { align: 'center' });
        doc.text(`GST: ${invoice.tenant.GST}`, { align: 'center' });

        doc.moveDown(1);
        doc.moveTo(startX, doc.y).lineTo(300, doc.y).stroke();
        doc.moveDown(1);

        // Order Info
        doc.fontSize(8).font('Helvetica');
        doc.text(`Date: ${invoice.orderDate}`);
        doc.text(`Customer: ${invoice.customer.name}`);
        doc.text(`Phone: ${invoice.customer.phoneNo}`);
        doc.moveDown(1);
        doc.moveTo(startX, doc.y).lineTo(300, doc.y).stroke();
        doc.moveDown(1);

        // Order ID
        doc.font('Helvetica').fontSize(9).text(`Order ID: ${orderId}`, { align: 'center' });
        doc.moveDown(0.5);

        // ===== ITEM HEADERS =====
        doc.font('Helvetica-Bold').fontSize(9);

        const headerY = doc.y; // Capture current y only once
        doc.text('Name', nameCol, headerY);
        doc.text('Unit Price', unitCol, headerY);
        doc.text('Qty', qtyCol, headerY);
        doc.text('Total', totalCol, headerY);

        doc.moveDown(0.2);
        doc.moveTo(startX, doc.y).lineTo(300, doc.y).stroke();
        doc.moveDown(0.5);

        // ===== ITEM ROWS =====
        doc.font('Helvetica').fontSize(8);
        invoice.items.forEach((item) => {
            const name = item.name;
            const unitPrice = `${item.unitPrice.toFixed(2)}₹`;
            const qty = item.quantity.toString();
            const total = `${item.totalPrice}₹`;

            const y = doc.y;
            doc.text(name, nameCol, y);
            doc.text(unitPrice, unitCol, y);
            doc.text(qty, qtyCol, y);
            doc.text(total, totalCol, y);
            doc.moveDown(0.6);
        });

        // ===== TOTALS =====
        doc.moveDown(0.4);
        doc.moveTo(startX, doc.y).lineTo(300, doc.y).stroke();
        doc.moveDown(1);

        const leftX = 10;

        let lineY = doc.y;
        const lineHeight = 12;

        doc.font('Helvetica').fontSize(8);

        // Subtotal
        doc.text('Subtotal:', leftX, lineY);
        doc.text(`${invoice.bill.subTotal}₹`, totalCol, lineY, { align: 'right', width: 20 }); 

        // Discount
        lineY += lineHeight;
        doc.text('Discount:', leftX, lineY);
        doc.text(`${invoice.bill.discount}₹`, totalCol, lineY, { align: 'right', width: 20 }); 

        // Coupon
        lineY += lineHeight;
        doc.text('Coupon:', leftX, lineY);
        doc.text(`${invoice.bill.coupon || 'N/A'}`, totalCol, lineY, { align: 'right', width: 30 }); 

        // Points Used
        lineY += lineHeight;
        doc.text('Points Used:', leftX, lineY);
        doc.text(`${invoice.bill.pointsUsed || 0}`, totalCol, lineY, { align: 'right', width: 20 }); 

        // Final Amount (Bold)
        lineY += lineHeight + 2;
        doc.font('Helvetica-Bold').fontSize(9);
        doc.text('Final Amount:', leftX, lineY);
        doc.text(`${invoice.bill.finalAmount}₹`, totalCol, lineY, { align: 'right', width: 25 }); 

        doc.moveDown(1);
        doc.moveTo(10, doc.y).lineTo(306, doc.y).stroke();
        doc.moveDown(1);

        //  footer
        const footerY = doc.y + 2;
        doc.font('Helvetica').fontSize(8).text(`****** Please Visit ${invoice.tenant.name} Again ******`, 20, footerY, {
            align: 'center',
            width: 296,
        });

        doc.end();

        return res.status(status.OK).json({
            message: 'Invoice data generated successfully',
            file: `/bill-pdf/pdf/${fileName}`,
            invoice,
        });
    } catch (error) {
        return common.throwException(error, 'Generate Invoice PDF', req, res);
    }
};
