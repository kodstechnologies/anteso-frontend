// models/officeStaff.model.js
import mongoose from 'mongoose';
import User from './user.model.js';

const { Schema } = mongoose;

const officeStaffSchema = new Schema({
  activeStatus: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  department: {
    type: String,
    required: false, // You can customize fields specific to Office Staff
  },
});

const OfficeStaff = User.discriminator('OfficeStaff', officeStaffSchema);

export default OfficeStaff;
