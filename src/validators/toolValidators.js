import Joi from "joi";

export const createToolSchema = Joi.object({
  toolId: Joi.string(),
  SrNo: Joi.string().required(),
  nomenclature: Joi.string().required(),
  manufacturer: Joi.string().required(),
  manufacture_date: Joi.date().required(),
  model: Joi.string().required(),
  calibrationCertificateNo: Joi.string().required(),
  calibrationDate: Joi.date().required(),
  calibrationValidTill: Joi.date().required(),
  range: Joi.string().required(),
});