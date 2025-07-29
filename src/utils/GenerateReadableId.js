// utils/generateReadableId.js
import Counter from '../models/counter.model.js';

export const generateReadableId = async (entityName, prefix) => {
    const counter = await Counter.findOneAndUpdate(
        { entity: entityName },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    const paddedNumber = String(counter.seq).padStart(3, '0');
    return `${prefix}${paddedNumber}`;
};