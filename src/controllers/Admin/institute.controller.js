import Institute from '../../models/institute.model.js';
import { asyncHandler } from '../../utils/AsyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { instituteSchema } from '../../validators/instituteValidators.js';


const add = asyncHandler(async (req, res) => {
    const { error, value } = instituteSchema.validate(req.body, { abortEarly: false });

    if (error) {
        throw new ApiError(400, 'Validation Error', error.details.map(e => e.message));
    }

    const newInstitute = await Institute.create(value);

    return res.status(201).json(
        new ApiResponse(201, newInstitute, 'Institute created successfully')
    );
});

export default { add };
