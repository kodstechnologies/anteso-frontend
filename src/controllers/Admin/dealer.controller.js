import Dealer from "../../models/dealer.model.js";
import { asyncHandler } from "../../utils/AsyncHandler.js";

const FIXED_QA_TESTS = [
    { testName: "FIXED X RAY", price: 3500 },
    { testName: "MOBILE X RAY", price: 2500 },
    { testName: "C ARM", price: 3000 },
    { testName: "MAMMOGRAPH", price: 4000 },
    { testName: "CATH LAB", price: 5000 },
    { testName: "CT SCAN", price: 600 },
];

export const createDealer = asyncHandler(async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            address,
            city,
            state,
            pincode,
            branch,
            mouValidity,
            qaTests = []
        } = req.body;

        // ✅ Basic validation
        if (!name || !phone || !email) {
            return res.status(400).json({
                success: false,
                message: "Name, phone, and email are required",
            });
        }

        // ✅ Merge fixed + provided tests without duplicates
        const mergedQaTests = [
            ...FIXED_QA_TESTS,
            ...qaTests
        ].reduce((acc, curr) => {
            if (!acc.find(test => test.testName.toLowerCase() === curr.testName.toLowerCase())) {
                acc.push(curr);
            }
            return acc;
        }, []);

        // ✅ Create dealer
        const dealer = new Dealer({
            name,
            phone,
            email,
            address,
            city,
            state,
            pincode,
            branch,
            mouValidity,
            qaTests: mergedQaTests,
        });

        await dealer.save();

        res.status(201).json({
            success: true,
            message: "Dealer created successfully",
            dealer,
        });
    } catch (error) {
        console.error("❌ Dealer creation error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create dealer",
        });
    }
});


const getById = asyncHandler(async (req, res) => {
    try {

    } catch (error) {

    }
})
const getAll = asyncHandler(async (req, res) => {
    try {
        const dealers = await Dealer.find(); // fetch all dealers

        res.status(200).json({
            success: true,
            count: dealers.length,
            dealers,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch dealers",
        });
    }
});
const deleteById = asyncHandler(async () => {
    try {

    } catch (error) {

    }
})
export default { createDealer, getAll }