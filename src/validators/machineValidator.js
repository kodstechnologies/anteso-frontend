import Joi from 'joi';

export const machineSchema = Joi.object({
    machineType: Joi.string().required().label('Machine Type'),
    make: Joi.string().required().label('Make'),
    model: Joi.string().required().label('Model'),
    serialNumber: Joi.string().required().label('Serial Number'),
    equipmentId: Joi.string().required().label('Equipment ID'),
    qaValidity: Joi.date().required().label('QA Validity'),
    licenseValidity: Joi.date().required().label('License Validity'),
    status: Joi.string().required().label('Status'),
});