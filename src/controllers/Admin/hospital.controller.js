import Hospital from '../../models/hospital.model.js';
import { asyncHandler } from '../../utils/AsyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { hospitalSchema } from '../../validators/hospitalValidators.js';



const add = asyncHandler(async (req, res) => {
    const { error, value } = hospitalSchema.validate(req.body, { abortEarly: false });

    if (error) {
        throw new ApiError(400, 'Validation Error', error.details.map(e => e.message));
    }

    const newHospital = await Hospital.create(value);

    return res.status(201).json(
        new ApiResponse(201, newHospital, 'Hospital created successfully')
    );
});

export default { add };
