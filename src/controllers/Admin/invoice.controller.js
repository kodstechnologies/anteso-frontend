import Order from "../../models/order.model.js";
import User from "../../models/user.model.js";
import Dealer from "../../models/dealer.model.js";
import Hospital from "../../models/hospital.model.js";
import Enquiry from '../../models/enquiry.model.js'
import { asyncHandler } from "../../utils/AsyncHandler.js";
import Invoice from "../../models/invoice.model.js";
import mongoose from "mongoose";
import { generateReadableId } from "../../utils/GenerateReadableId.js";
import Payment from "../../models/payment.model.js";

// const getAllOrdersWithType = async (req, res) => {
//   try {
//     let orders = await Order.find()
//       .populate("customer") // base user (could be Dealer or Customer/Hospital user)
//       .populate({
//         path: "quotation",
//         populate: {
//           path: "enquiry",
//           populate: { path: "hospital" }, // get hospital details
//         },
//       })
//       .lean();

//     // add type field manually
//     orders = orders.map((order) => {
//       let type = "Unknown";

//       // If customer is a Dealer (discriminator)
//       if (order.customer?.__t === "Dealer") {
//         type = "Dealer";
//       }
//       // If enquiry has hospital populated
//       else if (order.quotation?.enquiry?.hospital) {
//         type = "Hospital";
//       }

//       return { ...order, type };
//     });

//     res.status(200).json({
//       success: true,
//       data: orders,
//     });
//   } catch (error) {
//     console.error("Error fetching orders:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching orders",
//     });
//   }
// };


// const getAllOrdersWithType = async (req, res) => {
//   try {
//     let orders = await Order.find()
//       .populate("customer", "name __t") // only get name + discriminator
//       .populate({
//         path: "quotation",
//         populate: {
//           path: "enquiry",
//           populate: { path: "hospital", select: "name" }, // only get hospital name
//         },
//       })
//       .select("srfNumber quotation customer") // only keep needed fields
//       .lean();

//     const formattedOrders = orders.map((order) => {
//       let type = "Unknown";
//       let name = "";

//       if (order.customer?.__t === "Dealer") {
//         type = "Dealer";
//         name = order.customer?.name || "Unknown Dealer";
//       } else if (order.quotation?.enquiry?.hospital) {
//         type = "Hospital";
//         name = order.quotation.enquiry.hospital?.name || "Unknown Hospital";
//       }

//       return {
//         srfNumber: order.srfNumber,
//         name,
//         type,
//       };
//     });

//     res.status(200).json({
//       success: true,
//       data: formattedOrders,
//     });
//   } catch (error) {
//     console.error("Error fetching orders:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching orders",
//     });
//   }
// };

//name of lead owner
// const getAllOrdersWithType = asyncHandler(async (req, res) => {
//   try {
//     let orders = await Order.find()
//       .populate("customer", "name __t") // only get name + discriminator
//       .populate({
//         path: "quotation",
//         populate: {
//           path: "enquiry",
//           populate: { path: "hospital", select: "name" }, // only get hospital name
//         },
//       })
//       .select("srfNumber quotation customer hospitalName leadOwner") // also fetch hospitalName & leadOwner
//       .lean();

//     const formattedOrders = orders.map((order) => {
//       let type = "Unknown";
//       let name = "";

//       if (order.customer?.__t === "Dealer") {
//         type = "Dealer";
//         name = order.customer?.name || "Unknown Dealer";
//       } else if (order.quotation?.enquiry?.hospital) {
//         type = "Hospital";
//         name = order.quotation.enquiry.hospital?.name || "Unknown Hospital";
//       } else if (order.hospitalName) {
//         // Direct Order fallback
//         type = "Hospital";
//         name = order.hospitalName;
//       } else if (order.leadOwner) {
//         // If leadOwner is filled but no hospitalName
//         type = "Dealer";
//         name = order.leadOwner;
//       }

//       return {
//         srfNumber: order.srfNumber,
//         leadOwner: order.leadOwner || null, // include leadOwner explicitly
//         name,
//         type,
//       };
//     });

//     res.status(200).json({
//       success: true,
//       data: formattedOrders,
//     });
//   } catch (error) {
//     console.error("Error fetching orders:", error);
//     res.status(500).json({
//       success: false,
//       message: "Error fetching orders",
//     });
//   }
// });


const getAllOrdersWithType = asyncHandler(async (req, res) => {
  try {
    // 1️⃣ Get all complete payments
    const completePayments = await Payment.find({ paymentType: "complete" })
      .populate({
        path: "orderId",
        populate: [
          { path: "customer", select: "name __t" },
          {
            path: "quotation",
            populate: {
              path: "enquiry",
              populate: { path: "hospital", select: "name" },
            },
          },
        ],
      })
      .lean();

    // 2️⃣ Format orders with payment info
    const formattedOrders = completePayments
      .filter(p => p.orderId) // ensure order exists
      .map((p) => {
        const order = p.orderId;
        let type = "Unknown";
        let name = "";

        if (order.customer?.__t === "Dealer") {
          type = "Dealer";
          name = order.customer?.name || order.leadOwner || "Unknown Dealer";
        } else if (order.quotation?.enquiry?.hospital) {
          type = "Hospital";
          name = order.quotation.enquiry.hospital?.name || "Unknown Hospital";
        } else if (order.hospitalName) {
          type = "Hospital";
          name = order.hospitalName;
        } else if (order.leadOwner) {
          type = "Dealer";
          name = order.leadOwner;
        }

        return {
          orderId: order._id,
          srfNumber: order.srfNumber,
          name,
          type,
          payment: {
            paymentId: p.paymentId,
            paymentAmount: p.paymentAmount,
            paymentType: p.paymentType,
            paymentStatus: p.paymentStatus,
          },
        };
      });

    res.status(200).json({
      success: true,
      data: formattedOrders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
    });
  }
});


const getAllDetailsWithOrderId = asyncHandler(async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required",
      });
    }

    // Fetch the order
    const order = await Order.findById(orderId)
      .populate("services")
      .populate("additionalServices")
      .populate({
        path: "quotation",
        select: "total discount", // only total (grand total) from quotation
      })
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Extract grand total safely
    const grandTotal = order.quotation?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        ...order,
        grandTotal, // attach it at the top level if you want
      },
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching order details",
    });
  }
});


// const getAllDetailsWithOrderId = asyncHandler(async (req, res) => {
//   try {
//     const { orderId } = req.params;

//     if (!orderId) {
//       return res.status(400).json({
//         success: false,
//         message: "orderId is required",
//       });
//     }

//     const invoice = await Invoice.findById(orderId)
//       .populate({
//         path: "enquiry",
//         populate: [
//           {
//             path: "hospital",
//             model: "Hospital",
//             select: "name address branch phone gstNo", // ✅ hospital details
//           },
//           {
//             path: "services",
//             model: "Service",
//             select: "machineType description quantity rate hsnno", // ✅ services
//           },
//           {
//             path: "additionalServices",
//             model: "AdditionalService",
//           },
//         ],
//       })
//       .lean();

//     if (!invoice) {
//       return res.status(404).json({
//         success: false,
//         message: "Invoice not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: invoice,
//     });
//   } catch (error) {
//     console.error("Error fetching invoice details:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while fetching invoice details",
//     });
//   }
// });


const createInvoice = asyncHandler(async (req, res) => {
  try {
    const {
      type,
      srfNumber,
      buyerName,
      address,
      state,
      remarks,
      taxes,
      discountPercent,
      services,
      dealerHospitals,
      orderId,        // Order ID to link payment
      paymentType,    // advance, balance, complete
      paymentAmount,
      utrNumber,
    } = req.body;

    if (!srfNumber || !buyerName) {
      return res.status(400).json({
        success: false,
        message: "SRF number and buyerName are required",
      });
    }

    let subtotal = 0;

    // Handle Customer type
    if (type === "Customer") {
      if (!services || services.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one service is required for Customer invoice",
        });
      }
      subtotal = services.reduce(
        (sum, s) => sum + Number(s.quantity) * Number(s.rate),
        0
      );
    }

    // Handle Dealer/Manufacturer type
    if (type === "Dealer/Manufacturer") {
      if (!dealerHospitals || dealerHospitals.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "At least one dealer hospital entry is required for Dealer/Manufacturer invoice",
        });
      }
      subtotal = dealerHospitals.reduce(
        (sum, d) => sum + Number(d.amount),
        0
      );
    }

    // Taxes
    const taxAmounts = {};
    let totalTax = 0;
    ["cgst", "sgst", "igst"].forEach((tax) => {
      if (taxes && taxes[tax] && taxes[tax].checked) {
        const percent = parseFloat(taxes[tax].amount) || 0;
        const taxAmount = (subtotal * percent) / 100;
        taxAmounts[tax] = taxAmount;
        totalTax += taxAmount;
      } else {
        taxAmounts[tax] = 0;
      }
    });

    // Discount
    const discountAmount = parseFloat(discountPercent) || 0;

    // Grand total
    const grandTotal = subtotal + totalTax - discountAmount;

    // Generate invoiceId
    const invoiceId = await generateReadableId("Invoice", "INV");

    // Create Invoice
    const newInvoice = await Invoice.create({
      invoiceId,
      type,
      srfNumber,
      buyerName,
      address,
      state,
      remarks,
      services: type === "Customer" ? services : [],
      dealerHospitals: type === "Dealer/Manufacturer" ? dealerHospitals : [],
      subtotal,
      discount: discountAmount,
      sgst: taxAmounts.sgst,
      cgst: taxAmounts.cgst,
      igst: taxAmounts.igst,
      grandtotal: grandTotal,
      createdBy: req.user ? req.user._id : null,
    });

    // If payment details are provided, create payment and link to invoice
    if (orderId && paymentType && paymentAmount && utrNumber) {
      const payment = await Payment.create({
        orderId,
        totalAmount: grandTotal,
        paymentAmount,
        paymentType,
        utrNumber,
        paymentStatus: "paid",
      });

      // Save payment reference and paymentType in invoice
      newInvoice.payment = payment._id;
      newInvoice.paymentType = payment.paymentType; // save paymentType in invoice
      await newInvoice.save();
    }

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: newInvoice,
    });
  } catch (error) {
    console.error("🚀 ~ createInvoice ~ error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create invoice",
    });
  }
});

const getInvoiceById = asyncHandler(async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Validate invoiceId
    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({ success: false, message: "Invalid invoice ID" });
    }

    // Fetch invoice with optional population of enquiry
    const invoice = await Invoice.findById(invoiceId).populate("enquiry");

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch invoice",
    });
  }
});

const getAllInvoices = asyncHandler(async (req, res) => {
  try {
    // Fetch all invoices, populate 'enquiry' and 'payment' to get paymentType
    const invoices = await Invoice.find()
      .sort({ createdAt: -1 }) // latest first
      .populate("enquiry") // populate enquiry if needed
      .populate({
        path: "payment",
        select: "paymentType paymentAmount paymentStatus utrNumber", // select the fields you need
      });
    console.log("🚀 ~ invoices:", invoices)

    res.status(200).json({
      success: true,
      data: invoices,
      count: invoices.length,
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to fetch invoices",
    });
  }
});

// DELETE /invoice/:id
const deleteInvoice = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invoice ID is required",
      });
    }

    const invoice = await Invoice.findById(id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // ✅ Use deleteOne instead of remove
    await Invoice.deleteOne({ _id: id });

    res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    res.status(500).json({
      success: false,
      message: error?.message || "Failed to delete invoice",
    });
  }
});


export default { getAllOrdersWithType, getAllDetailsWithOrderId, getAllDetailsWithOrderId, createInvoice, getInvoiceById, getAllInvoices, deleteInvoice }