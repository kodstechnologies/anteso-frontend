import { asyncHandler } from "../../utils/AsyncHandler.js";
import Enquiry from "../../models/enquiry.model.js";
import Quotation from "../../models/quotation.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

// export const createQuotationByEnquiryId = asyncHandler(async (req, res) => {
//     const { enquiryId } = req.params;

//     // Fetch enquiry using the ObjectId
//     const enquiry = await Enquiry.findById(enquiryId);

//     if (!enquiry) {
//         throw new ApiError(404, "Enquiry not found");
//     }

//     // You may customize discount, terms, total, etc. from req.body
//     const { discount = 0, total, from, termsAndConditions = [] } = req.body;

//     if (!total || !from) {
//         throw new ApiError(400, "Total and From (user ID) are required");
//     }

//     // Create new quotation
//     const newQuotation = await Quotation.create({
//         enquiry: enquiry._id,
//         from,
//         discount,
//         total,
//         termsAndConditions,
//         quotationStatus: "Created", // or 'Create' if you want to edit later
//     });

//     // Optional: Update enquiry's quotationStatus field with reference
//     enquiry.quotationStatus = newQuotation._id;
//     enquiry.enquiryStatus = 'Quotation Sent';
//     enquiry.enquiryStatusDates.quotationSentOn = new Date();
//     await enquiry.save();

//     res.status(201).json(
//         new ApiResponse(201, newQuotation, "Quotation created successfully")
//     );
// });



const createQuotationByEnquiryId = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        console.log("🚀 ~ enquiryId:", id)
        const {
            date,
            quotationNumber,
            expiryDate,
            customer,
            assignedEmployee,
            termsAndConditions,
            calculations,
            items,
        } = req.body;

        if (!assignedEmployee || !calculations || !items) {
            throw new ApiError(400, 'Missing required fields');
        }

        // Now directly fetch by enquiry ID
        const enquiry = await Enquiry.findById(id);
        if (!enquiry) {
            throw new ApiError(404, 'Enquiry not found');
        }

        const quotation = await Quotation.create({
            date,
            quotationId: quotationNumber,
            enquiry: enquiry._id,
            from: assignedEmployee.id,
            discount: calculations.discount,
            total: calculations.totalAmount,
            quotationStatus: 'Created',
            termsAndConditions: termsAndConditions.map(term => term.label),
        });
        console.log("Created Quotation:", quotation);
        await Enquiry.findByIdAndUpdate(enquiry._id, {
            quotationStatus: quotation.quotationStatus,
        });
        return res
            .status(201)
            .json(new ApiResponse(201, quotation, 'Quotation created successfully'));
    } catch (error) {
        console.error("Error creating quotation:", error);
        throw new ApiError(500, 'Failed to create quotation', [error.message]);
    }
});

const getQuotationByEnquiryId = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            throw new ApiError(400, 'Enquiry ID is required');
        }

        // Find the quotation associated with the given enquiry ID
        const quotation = await Quotation.findOne({ enquiry: id })
            .populate('enquiry')
            .populate('from', 'name email') // Populate employee info
            .exec();

        if (!quotation) {
            throw new ApiError(404, 'Quotation not found for this enquiry');
        }

        return res
            .status(200)
            .json(new ApiResponse(200, quotation, 'Quotation fetched successfully'));
    } catch (error) {
        console.error("Error fetching quotation:", error);
        throw new ApiError(500, 'Failed to fetch quotation', [error.message]);
    }
});



const acceptQuotation = asyncHandler(async (req, res) => {
    try {
        

    } catch (error) {

    }
})
const rejectQuotation = asyncHandler((req, res) => {
    try {

    } catch (error) {

    }
})

export default { acceptQuotation, rejectQuotation, createQuotationByEnquiryId, getQuotationByEnquiryId }