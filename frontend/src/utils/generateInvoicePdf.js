import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateInvoicePdf = ({ order, items, getStatusText }) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(88, 28, 135);
  doc.rect(0, 0, pageWidth, 35, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", 14, 22);

  doc.setFontSize(11);
  doc.text("Course Purchase Platform", pageWidth - 14, 16, {
    align: "right",
  });
  doc.text("Online Course Invoice", pageWidth - 14, 23, {
    align: "right",
  });

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.text(`Invoice No: INV-${order.orderId}`, 14, 48);
  doc.text(`Order ID: #${order.orderId}`, 14, 56);
  doc.text(
    `Purchase Date: ${new Date(order.createdAt).toLocaleString()}`,
    14,
    64
  );

  doc.text("Payment Mode: Razorpay", pageWidth - 14, 48, {
    align: "right",
  });
  doc.text(`Status: ${getStatusText(order.paymentStatus)}`, pageWidth - 14, 56, {
    align: "right",
  });

  doc.setFillColor(248, 245, 255);
  doc.roundedRect(14, 75, pageWidth - 28, 35, 3, 3, "F");

  doc.setTextColor(88, 28, 135);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Buyer Details", 20, 86);

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  doc.text(`Name: ${order.firstName || ""} ${order.lastName || ""}`, 20, 95);
  doc.text(`Email: ${order.email || ""}`, 20, 102);

  doc.text(`Phone: ${order.phoneNo || "-"}`, pageWidth / 2, 95);
  doc.text(
    `Address: ${order.address || ""}, ${order.city || ""}, ${order.state || ""}`,
    pageWidth / 2,
    102
  );

  autoTable(doc, {
    startY: 122,
    head: [["Course Name", "Qty", "Price"]],
    body: items.map((item) => [
      item.courseName,
      item.quantity,
      `Rs. ${item.price}`,
    ]),
    theme: "grid",
    headStyles: {
      fillColor: [88, 28, 135],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 110 },
      1: { halign: "center" },
      2: { halign: "right" },
    },
  });

  const finalY = doc.lastAutoTable.finalY + 10;

  doc.setFillColor(250, 250, 250);
  doc.roundedRect(pageWidth - 85, finalY, 70, 45, 3, 3, "F");

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);

  doc.text("Subtotal:", pageWidth - 80, finalY + 8);
  doc.text(`Rs. ${order.subTotal}`, pageWidth - 20, finalY + 8, {
    align: "right",
  });

  doc.text("Discount:", pageWidth - 80, finalY + 16);
  doc.text(`Rs. ${order.discountAmount}`, pageWidth - 20, finalY + 16, {
    align: "right",
  });

  doc.text("GST:", pageWidth - 80, finalY + 24);
  doc.text(`Rs. ${order.gst}`, pageWidth - 20, finalY + 24, {
    align: "right",
  });

  doc.text("Platform Fee:", pageWidth - 80, finalY + 32);
  doc.text(`Rs. ${order.platformFee}`, pageWidth - 20, finalY + 32, {
    align: "right",
  });

  doc.setDrawColor(220, 220, 220);
  doc.line(pageWidth - 80, finalY + 36, pageWidth - 20, finalY + 36);

  doc.setTextColor(88, 28, 135);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total:", pageWidth - 80, finalY + 43);
  doc.text(`Rs. ${order.totalPrice}`, pageWidth - 20, finalY + 43, {
    align: "right",
  });

  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(
    "Thank you for your purchase. This is a system-generated invoice.",
    pageWidth / 2,
    285,
    { align: "center" }
  );

  doc.save(`invoice-order-${order.orderId}.pdf`);
};