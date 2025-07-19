import Joi from 'joi';
import RSO from '../../models/rso.model.js';
import { asyncHandler } from '../../utils/AsyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { rsoSchema } from '../../validators/rsoValidators.js';

const add = asyncHandler(async (req, res) => {
    const { error, value } = rsoSchema.validate(req.body, { abortEarly: false });

    if (error) {
        throw new ApiError(400, 'Validation Error', error.details.map(e => e.message));
    }

    const newRSO = await RSO.create(value);

    return res.status(201).json(
        new ApiResponse(201, newRSO, 'RSO created successfully')
    );
});

export default { add };
