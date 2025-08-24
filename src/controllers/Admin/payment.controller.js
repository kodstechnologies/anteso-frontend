import Order from "../../models/order.model.js";
import Payment from "../../models/payment.model.js";
import { asyncHandler } from "../../utils/AsyncHandler.js";
import { uploadToS3 } from "../../utils/s3Upload.js";
const addPayment = asyncHandler(async (req, res) => {
    try {
        const { srfNumber, totalAmount, paymentAmount, paymentType, utrNumber } = req.body;

        // Basic validation
        if (!srfNumber || !paymentType || !utrNumber) {
            res.status(400);
            throw new Error("srfNumber, paymentType, and utrNumber are required");
        }

        // Find the order by srfNumber
        const order = await Order.findOne({ srfNumber });
        if (!order) {
            res.status(404);
            throw new Error("Order not found for the provided srfNumber");
        }

        // Handle screenshot upload if file is provided
        let screenshotUrl = '';
        if (req.file) {
            const { url } = await uploadToS3(req.file);
            screenshotUrl = url;
        }

        // Create payment linked to that order
        const payment = await Payment.create({
            srfNumber: order._id,                 // Reference the order
            totalAmount: totalAmount || order.totalAmount,
            paymentAmount,
            paymentType,
            utrNumber,
            screenshot: screenshotUrl,
        });

        res.status(201).json({
            success: true,
            message: "Payment added successfully",
            payment,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});
const allOrdersWithClientName = asyncHandler(async (req, res) => {
    try {
        // Fetch all orders
        const orders = await Order.find({}, "srfNumber hospitalName").lean();

        // Map orders to append hospitalName to srfNumber
        const formattedOrders = orders.map(order => ({
            srfNumberWithHospital: `${order.srfNumber} - ${order.hospitalName}`,
            ...order
        }));

        res.status(200).json({
            success: true,
            orders: formattedOrders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export const getTotalAmount = asyncHandler(async (req, res) => {
    try {
        const { orderId } = req.query; // get from query

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "orderId is required",
            });
        }

        const order = await Order.findById(orderId).populate('quotation');
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        if (!order.quotation) {
            return res.status(404).json({
                success: false,
                message: "Quotation not found for this order",
            });
        }

        res.status(200).json({
            success: true,
            totalAmount: order.quotation.total,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});


const getAllPayments = asyncHandler(async (req, res) => {
    try {
        const payments = await Payment.find()

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




export default { addPayment, allOrdersWithClientName, getTotalAmount, getAllPayments };
