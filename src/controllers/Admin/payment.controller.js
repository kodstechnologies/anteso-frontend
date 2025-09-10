import orderModel from "../../models/order.model.js";
import Order from "../../models/order.model.js";
import Payment from "../../models/payment.model.js";
import User from "../../models/user.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/AsyncHandler.js";
import { generateReadableId } from "../../utils/GenerateReadableId.js";
import { uploadToS3 } from "../../utils/s3Upload.js";
import mongoose from "mongoose";

const addPayment = asyncHandler(async (req, res) => {
    try {
        const { orderId, totalAmount, paymentAmount, paymentType, utrNumber } = req.body;
        console.log("🚀 ~ utrNumber:", utrNumber)
        console.log("🚀 ~ paymentType:", paymentType)
        console.log("🚀 ~ paymentAmount:", paymentAmount)
        console.log("🚀 ~ totalAmount:", totalAmount)
        console.log("🚀 ~ orderId:", orderId)
        // Validation
        if (!orderId || !paymentType) {
            res.status(400);
            throw new Error("orderId and paymentType are required");
        }

        // Find order by _id
        const order = await Order.findById(orderId);
        if (!order) {
            res.status(404);
            throw new Error("Order not found for the provided orderId");
        }

        // Screenshot upload
        let screenshotUrl = "";
        if (req.file) {
            const { url } = await uploadToS3(req.file);
            screenshotUrl = url;
        }

        // Create payment
        const payment = await Payment.create({
            orderId: order._id,
            totalAmount: totalAmount || order.totalAmount,
            paymentAmount,
            paymentType,
            utrNumber,
            screenshot: screenshotUrl,
        });
        console.log("🚀 ~ payment:", payment)
        console.log("🚀 ~ payment:", payment.paymentType)

        res.status(201).json({
            success: true,
            message: "Payment added successfully",
            payment,
        });
    } catch (error) {
        console.error("❌ addPayment error:", error.message);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});


// const allOrdersWithClientName = asyncHandler(async (req, res) => {
//     try {
//         // Fetch all orders
//         const orders = await Order.find({}, "srfNumber hospitalName").lean();

//         // Map orders to append hospitalName to srfNumber
//         const formattedOrders = orders.map(order => ({
//             srfNumberWithHospital: `${order.srfNumber} - ${order.hospitalName}`,
//             ...order
//         }));

//         res.status(200).json({
//             success: true,
//             orders: formattedOrders
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// });

const allOrdersWithClientName = asyncHandler(async (req, res) => {
    try {

        // 1️⃣ Fetch all orders
        let orders = await orderModel.find({})
            .select("srfNumber hospitalName leadOwner")
            .sort({ createdAt: -1 })
            .lean();

        if (!orders || orders.length === 0) {
            return res.status(404).json({ message: "No orders found" });
        }

        // 2️⃣ Get unique non-empty leadOwner IDs
        const leadOwnerIds = [...new Set(orders.map(o => o.leadOwner).filter(Boolean))];

        // 3️⃣ Fetch users for these leadOwners
        const users = await User.find({ _id: { $in: leadOwnerIds } })
            .select("_id name role email")
            .lean();

        // Build lookup map
        const userMap = {};
        users.forEach(u => {
            userMap[u._id.toString()] = u;
        });

        // 4️⃣ Filter orders
        orders = orders.filter(order => {
            if (!order.leadOwner) return true; // ✅ keep if no leadOwner
            const owner = userMap[order.leadOwner?.toString()];
            return owner && owner.role !== "Dealer"; // ✅ keep only if not Dealer
        });

        // 5️⃣ Append hospitalName and owner details
        const formattedOrders = orders.map(order => {
            const owner = order.leadOwner ? userMap[order.leadOwner?.toString()] : null;
            return {
                ...order,
                srfNumberWithHospital: `${order.srfNumber} - ${order.hospitalName}`,
                leadOwnerDetails: owner, // can be null if no leadOwner
            };
        });

        res.status(200).json({
            success: true,
            count: formattedOrders.length,
            orders: formattedOrders,
        });
    } catch (error) {
        console.error("❌ Error fetching orders:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error",
        });
    }
});

// const getTotalAmount = asyncHandler(async (req, res) => {

//     try {
//         const { orderId } = req.query; // get from query

//         if (!orderId) {
//             return res.status(400).json({
//                 success: false,
//                 message: "orderId is required",
//             });
//         }

//         const order = await Order.findById(orderId).populate('quotation');
//         if (!order) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Order not found",
//             });
//         }

//         if (!order.quotation) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Quotation not found for this order",
//             });
//         }

//         res.status(200).json({
//             success: true,
//             totalAmount: order.quotation.total,
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// });

const getTotalAmount = asyncHandler(async (req, res) => {
    const { srfNumber } = req.query;  // ✅ expect srfNumber

    if (!srfNumber) {
        return res.status(400).json({ success: false, message: "SRF number is required" });
    }

    // Find order by SRF number and populate its quotation
    const order = await Order.findOne({ srfNumber })
        .populate("quotation", "total"); // only bring 'total' field from quotation

    if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!order.quotation) {
        return res.status(404).json({ success: false, message: "Quotation not found for this order" });
    }

    res.json({
        success: true,
        totalAmount: order.quotation.total,  // ✅ use quotation total
    });
});

const getAllPayments = asyncHandler(async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate({
                path: "orderId", // assumes Payment schema has { orderId: { type: ObjectId, ref: "Order" } }
                select: "srfNumber", // only return needed fields
            })
            .sort({ createdAt: -1 }); // latest first

        res.status(200).json({
            success: true,
            count: payments.length,
            payments,
        });
    } catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch payments",
            error: error.message,
        });
    }
});
// controllers/payment.controller.js
const getPaymentsBySrf = asyncHandler(async (req, res) => {
    const { srfNumber } = req.params; // SRF number from URL

    if (!srfNumber) {
        return res.status(400).json({ success: false, message: "SRF number is required" });
    }

    // 1. Find the order by its srfNumber
    const order = await Order.findOne({ srfNumber });
    if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
    }

    // 2. Find payments linked to that orderId
    const payments = await Payment.find({ orderId: order._id });

    res.status(200).json({
        success: true,
        data: payments,
        message: "Payments fetched successfully",
    });
});

// 🔹 Search payments by SRF number (example: ABSRF/2025/09/004)
const searchBySRF = asyncHandler(async (req, res) => {
    try {
        const { srfNumber } = req.query; // pass ?srfNumber=ABSRF/2025/09/004

        if (!srfNumber) {
            throw new ApiError(400, "SRF number is required");
        }

        // ✅ Find the order with given SRF number
        const order = await Order.findOne({
            srfNumber: { $regex: `^${srfNumber}`, $options: "i" }, // starts with search input, case-insensitive
        });

        if (!order) {
            throw new ApiError(404, "Order with this SRF number not found");
        }

        // ✅ Find related payments
        const payments = await Payment.find({ orderId: order._id })
            .populate("orderId", "srfNumber hospitalName")
            .sort({ createdAt: -1 });

        if (!payments || payments.length === 0) {
            throw new ApiError(404, "No payments found for this SRF number");
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    srfNumber: order.srfNumber,
                    hospitalName: order.hospitalName,
                    payments: payments.map((payment) => ({
                        paymentId: payment.paymentId,
                        orderId: payment.orderId?._id,
                        totalAmount: payment.totalAmount,
                        paymentAmount: payment.paymentAmount,
                        paymentType: payment.paymentType,
                        utrNumber: payment.utrNumber,
                        screenshot: payment.screenshot,
                        createdAt: payment.createdAt,
                    })),
                },
                "Payments fetched successfully"
            )
        );
    } catch (error) {
        console.error("❌ Error searching payments by SRF:", error);
        throw new ApiError(500, error.message || "Failed to search payments");
    }
});
// const searchBySRF = asyncHandler(async (req, res) => {
//     try {
//         const { srfNumber } = req.query;
//         if (!srfNumber) {
//             throw new ApiError(400, "srfNumber query parameter is required");
//         }

//         console.log("🚀 Searching payments for SRF:", srfNumber);

//         // ✅ Step 1: Find the order by SRF first
//         const order = await Order.findOne({ srfNumber: srfNumber.trim() });
//         console.log("Order:", order?._id);
//         if (!order) {
//             throw new ApiError(404, "No order found with this SRF number");
//         }

//         // ✅ Step 2: Find payments linked to this order
//         const payments = await Payment.find({ orderId: order._id });
//         console.log("Payments:", payments);

//         if (!payments.length) {
//             throw new ApiError(404, "No payments found for this SRF number");
//         }

//         // ✅ Step 3: Map payments with order details
//         const responseData = payments.map((p) => ({
//             paymentId: p.paymentId,
//             orderId: order._id,
//             srfNumber: order.srfNumber,
//             hospitalName: order.hospitalName,
//             totalAmount: p.totalAmount,
//             paymentAmount: p.paymentAmount,
//             paymentType: p.paymentType,
//             utrNumber: p.utrNumber,
//             screenshot: p.screenshot,
//             createdAt: p.createdAt,
//             updatedAt: p.updatedAt,
//         }));

//         res.status(200).json(
//             new ApiResponse(200, { payments: responseData }, "Payments fetched successfully")
//         );
//     } catch (error) {
//         console.error("❌ Error searching payments by SRF:", error);
//         throw new ApiError(error.statusCode || 500, error.message || "Failed to search payments");
//     }
// });


const getPaymentById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        // ✅ Validate MongoDB ObjectId
        if (!id) {
            throw new ApiError(400, "Payment ID is required");
        }

        // ✅ Fetch payment with related Order (to get SRF number etc.)
        const payment = await Payment.findById(id).populate("orderId", "srfNumber hospitalName");

        if (!payment) {
            throw new ApiError(404, "Payment not found");
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    paymentId: payment.paymentId,
                    orderId: payment.orderId?._id,
                    srfNumber: payment.orderId?.srfNumber || "N/A",
                    hospitalName: payment.orderId?.hospitalName || "N/A",
                    totalAmount: payment.totalAmount,
                    paymentAmount: payment.paymentAmount,
                    paymentType: payment.paymentType,
                    utrNumber: payment.utrNumber,
                    screenshot: payment.screenshot,
                    createdAt: payment.createdAt,
                    updatedAt: payment.updatedAt,
                },
                "Payment fetched successfully"
            )
        );
    } catch (error) {
        console.error("❌ Error fetching payment by ID:", error);
        throw new ApiError(500, error.message || "Failed to fetch payment");
    }
});


const deletePayment = asyncHandler(async (req, res) => {
    try {
        const { paymentId } = req.params;

        if (!paymentId) {
            throw new ApiError(400, "Payment ID is required");
        }

        // Try to find by _id first
        let payment = null;
        if (/^[0-9a-fA-F]{24}$/.test(paymentId)) {
            // looks like MongoDB ObjectId
            payment = await Payment.findById(paymentId);
        }

        // If not found, try by custom paymentId
        if (!payment) {
            payment = await Payment.findOne({ paymentId });
        }

        if (!payment) {
            throw new ApiError(404, "Payment not found");
        }

        // Delete payment
        await Payment.deleteOne({ _id: payment._id });

        return res.status(200).json({
            statusCode: 200,
            message: `Payment ${payment.paymentId} deleted successfully`,
            success: true,
            data: null,
            errors: [],
        });
    } catch (error) {
        console.error("❌ Error deleting payment:", error);
        throw new ApiError(error.statusCode || 500, error.message || "Failed to delete payment");
    }
});


// ✅ Get payment by ID
// export const getPaymentById = asyncHandler(async (req, res) => {
//     try {
//         const { id } = req.params;
//         if (!id) {
//             return res.status(400).json({ success: false, message: "Payment ID is required" });
//         }

//         const payment = await Payment.findById(id).populate("orderId", "srfNumber hospitalName");
//         if (!payment) {
//             return res.status(404).json({ success: false, message: "Payment not found" });
//         }

//         res.status(200).json({ success: true, payment });
//     } catch (error) {
//         console.error("Error in getPaymentById:", error);
//         res.status(500).json({ success: false, message: "Failed to fetch payment" });
//     }
// });

// ✅ Edit payment by ID
const editPaymentById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { totalAmount, paymentAmount, paymentType, utrNumber, screenshot } = req.body;

        if (!id) {
            return res.status(400).json({ success: false, message: "Payment ID is required" });
        }

        const payment = await Payment.findById(id);
        if (!payment) {
            return res.status(404).json({ success: false, message: "Payment not found" });
        }

        // Update fields if provided
        if (totalAmount !== undefined) payment.totalAmount = totalAmount;
        if (paymentAmount !== undefined) payment.paymentAmount = paymentAmount;
        if (paymentType) payment.paymentType = paymentType;
        if (utrNumber) payment.utrNumber = utrNumber;
        if (screenshot) payment.screenshot = screenshot;

        await payment.save();

        res.status(200).json({ success: true, message: "Payment updated successfully", payment });
    } catch (error) {
        console.error("Error in editPaymentById:", error);
        res.status(500).json({ success: false, message: "Failed to update payment" });
    }
});


export default { addPayment, allOrdersWithClientName, getTotalAmount, getAllPayments, getPaymentsBySrf, getPaymentById, searchBySRF, deletePayment, editPaymentById };