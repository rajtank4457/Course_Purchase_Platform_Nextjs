import { connectToDatabase } from "../lib/db.js";
import PDFDocument from "pdfkit";

const getStatusText = (status) => {
    if (status === "paid") return "Payment Successful";
    if (status === "failed") return "Payment Failed";
    return "Payment Pending";
};

export const getOrders = async (req, res) => {
    try {
        const db = await connectToDatabase();

        const [rows] = await db.query(
            `
      SELECT 
        orderId,
        userId,
        razorpayOrderId,
        courseQuantity,
        subTotal,
        couponCode,
        discountAmount,
        taxableAmount,
        gst,
        platformFee,
        totalPrice,
        paymentStatus,
        createdAt
      FROM orders
      WHERE userId = ?
      ORDER BY orderId DESC
      `,
            [req.userId]
        );

        return res.status(200).json({
            success: true,
            data: rows,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};

export const getOrderDetails = async (req, res) => {
    try {
        const db = await connectToDatabase();

        const [orderRows] = await db.query(
            `
      SELECT 
        o.*,
        u.firstName,
        u.lastName,
        u.email,
        u.phoneNo,
        u.address,
        u.city,
        u.state
      FROM orders o
      LEFT JOIN user_details u
        ON o.userId = u.userId
      WHERE o.orderId = ? AND o.userId = ?
      `,
            [req.params.orderId, req.userId]
        );

        if (orderRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        let order = orderRows[0];

        if (order.paymentStatus === "created") {
            await db.query(
                `
        UPDATE orders
        SET paymentStatus = 'failed'
        WHERE orderId = ? 
          AND userId = ? 
          AND paymentStatus = 'created'
        `,
                [req.params.orderId, req.userId]
            );

            const [updatedOrderRows] = await db.query(
                `
        SELECT 
          o.*,
          u.firstName,
          u.lastName,
          u.email,
          u.phoneNo,
          u.address,
          u.city,
          u.state
        FROM orders o
        LEFT JOIN user_details u
          ON o.userId = u.userId
        WHERE o.orderId = ? AND o.userId = ?
        `,
                [req.params.orderId, req.userId]
            );

            order = updatedOrderRows[0];
        }

        const [items] = await db.query(
            `
      SELECT
        oi.orderItemId,
        oi.orderId,
        oi.courseId,
        oi.courseName,
        oi.quantity,
        oi.price,
        cd.courseDesc
      FROM order_items oi
      LEFT JOIN course_details cd
        ON oi.courseId = cd.courseId
      WHERE oi.orderId = ?
      `,
            [req.params.orderId]
        );

        return res.status(200).json({
            success: true,
            order,
            items,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};

export const getAllOrders = async (req, res) => {
    try {
        const db = await connectToDatabase();

        const [orders] = await db.query(`
      SELECT
        orderId,
        userId,
        razorpayOrderId,
        courseQuantity,
        subTotal,
        couponCode,
        discountAmount,
        taxableAmount,
        gst,
        platformFee,
        totalPrice,
        paymentStatus,
        createdAt
      FROM orders
      ORDER BY orderId DESC
    `);

        return res.status(200).json({
            success: true,
            data: orders,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch all orders",
            error: err.message,
        });
    }
};

export const getAdminOrderDetails = async (req, res) => {
    try {
        const db = await connectToDatabase();

        const [orderRows] = await db.query(
            `
      SELECT
        o.*,
        u.firstName,
        u.lastName,
        u.email,
        u.phoneNo
      FROM orders o
      LEFT JOIN user_details u
        ON o.userId = u.userId
      WHERE o.orderId = ?
      `,
            [req.params.orderId]
        );

        if (orderRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        const [items] = await db.query(
            `
      SELECT
        oi.orderItemId,
        oi.orderId,
        oi.courseId,
        oi.courseName,
        oi.quantity,
        oi.price,
        cd.courseDesc
      FROM order_items oi
      LEFT JOIN course_details cd
        ON oi.courseId = cd.courseId
      WHERE oi.orderId = ?
      `,
            [req.params.orderId]
        );

        return res.status(200).json({
            success: true,
            order: orderRows[0],
            items,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};

export const downloadInvoice = async (req, res) => {
    try {
        const userId = req.userId;
        const { orderId } = req.params;

        const db = await connectToDatabase();

        const [orderRows] = await db.query(
            `
            SELECT
                o.*,
                u.firstName,
                u.lastName,
                u.email,
                u.phoneNo,
                u.address,
                u.city,
                u.state
            FROM orders o
            INNER JOIN user_details u ON u.userId = o.userId
            WHERE o.orderId = ?
            AND o.userId = ?
            LIMIT 1
            `,
            [orderId, userId]
        );

        if (orderRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        const order = orderRows[0];

        if (order.paymentStatus !== "paid") {
            return res.status(400).json({
                success: false,
                message: "Invoice available only for paid orders",
            });
        }

        const [items] = await db.query(
            `
            SELECT courseName, quantity, price
            FROM order_items
            WHERE orderId = ?
            `,
            [orderId]
        );

        const doc = new PDFDocument({ size: "A4", margin: 40 });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=invoice-order-${order.orderId}.pdf`
        );

        doc.pipe(res);

        const pageWidth = doc.page.width;

        // Header
        doc.rect(0, 0, pageWidth, 100).fill("#581c87");

        doc.fillColor("white").fontSize(26).font("Helvetica-Bold");
        doc.text("INVOICE", 40, 35);

        doc.fontSize(11).font("Helvetica");
        doc.text("Course Purchase Platform", 350, 35, { align: "right" });
        doc.text("Online Course Invoice", 350, 52, { align: "right" });

        // Invoice info
        doc.fillColor("#1f2937").fontSize(11).font("Helvetica");

        doc.text(`Invoice No: INV-${order.orderId}`, 40, 120);
        doc.text(`Order ID: #${order.orderId}`, 40, 138);
        doc.text(
            `Purchase Date: ${new Date(order.createdAt).toLocaleString()}`,
            40,
            156
        );

        doc.text("Payment Mode: Razorpay", 350, 120, { align: "right" });
        doc.text(`Status: ${getStatusText(order.paymentStatus)}`, 350, 138, {
            align: "right",
        });

        // Buyer box
        doc.roundedRect(40, 185, pageWidth - 80, 75, 8).fill("#f8f5ff");

        doc.fillColor("#581c87").fontSize(14).font("Helvetica-Bold");
        doc.text("Buyer Details", 55, 200);

        doc.fillColor("#1f2937").fontSize(10).font("Helvetica");
        doc.text(`Name: ${order.firstName || ""} ${order.lastName || ""}`, 55, 222);
        doc.text(`Email: ${order.email || ""}`, 55, 238);

        doc.text(`Phone: ${order.phoneNo || "-"}`, 310, 222);
        doc.text(
            `Address: ${order.address || ""}, ${order.city || ""}, ${order.state || ""}`,
            310,
            238,
            { width: 230 }
        );

        // Table header
        let y = 295;

        doc.rect(40, y, pageWidth - 80, 30).fill("#581c87");

        doc.fillColor("white").fontSize(10).font("Helvetica-Bold");
        doc.text("Course Name", 50, y + 10);
        doc.text("Qty", 360, y + 10);
        doc.text("Price", 470, y + 10);

        y += 30;

        // Table rows
        doc.fillColor("#1f2937").font("Helvetica").fontSize(10);

        items.forEach((item) => {
            doc.rect(40, y, pageWidth - 80, 32).stroke("#e5e7eb");

            doc.text(item.courseName, 50, y + 10, { width: 280 });
            doc.text(String(item.quantity), 365, y + 10);
            doc.text(`Rs. ${item.price}`, 455, y + 10, {
                width: 90,
                align: "right",
            });

            y += 32;
        });

        y += 25;

        // Summary box
        const boxX = pageWidth - 250;
        const boxY = y;

        doc.roundedRect(boxX, boxY, 210, 120, 8).fill("#fafafa");

        doc.fillColor("#374151").fontSize(10).font("Helvetica");

        const summaryLine = (label, value, offset) => {
            doc.text(label, boxX + 15, boxY + offset);
            doc.text(`Rs. ${value}`, boxX + 110, boxY + offset, {
                width: 80,
                align: "right",
            });
        };

        summaryLine("Subtotal:", order.subTotal, 15);
        summaryLine("Discount:", order.discountAmount, 35);
        summaryLine("GST:", order.gst, 55);
        summaryLine("Platform Fee:", order.platformFee, 75);

        doc.moveTo(boxX + 15, boxY + 92).lineTo(boxX + 195, boxY + 92).stroke();

        doc.fillColor("#581c87").fontSize(13).font("Helvetica-Bold");
        doc.text("Total:", boxX + 15, boxY + 100);
        doc.text(`Rs. ${order.totalPrice}`, boxX + 110, boxY + 100, {
            width: 80,
            align: "right",
        });

        // Footer
        doc.fillColor("#6b7280").fontSize(9).font("Helvetica");
        doc.text(
            "Thank you for your purchase. This is a system-generated invoice.",
            40,
            780,
            { align: "center", width: pageWidth - 80 }
        );

        doc.end();
    } catch (err) {
        console.log("DOWNLOAD INVOICE ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Failed to generate invoice",
            error: err.message,
        });
    }
};