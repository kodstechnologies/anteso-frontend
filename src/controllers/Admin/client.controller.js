import Hospital from "../../models/hospital.model.js";
import Institute from "../../models/institute.model.js";
import RSO from "../../models/rso.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/AsyncHandler.js";
import { clientValidationSchema } from "../../validators/clientValidators.js";

const add = asyncHandler(async (req, res) => {
    try {
        const { error, value } = clientValidationSchema.validate(req.body, {
            abortEarly: false,
        });

        if (error) {
            throw new ApiError(400, 'Validation Error', error.details.map((e) => e.message));
        }

        const { name, phone, email, address, gstNo, hospitals, institutes, rsos } = value;

        // Helper to validate optional reference IDs
        const validateReferences = async (Model, ids) => {
            if (!ids) return [];
            const found = await Model.find({ _id: { $in: ids } });
            if (found.length !== ids.length) {
                throw new ApiError(400, `Some ${Model.modelName} IDs are invalid.`);
            }
            return ids;
        };

        const validHospitals = await validateReferences(Hospital, hospitals);
        const validInstitutes = await validateReferences(Institute, institutes);
        const validRsos = await validateReferences(RSO, rsos);

        const newClient = await Client.create({
            name,
            phone,
            email,
            address,
            gstNo,
            hospitals: validHospitals,
            institutes: validInstitutes,
            rsos: validRsos,
        });

        return res
            .status(201)
            .json(new ApiResponse(201, newClient, 'Client created successfully'));
    } catch (error) {
        throw new ApiError(
            error.statusCode || 500,
            error.message || 'Something went wrong',
            error.errors || [],
            error.stack
        );
    }
});
export default {add}
