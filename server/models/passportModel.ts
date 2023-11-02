import mongoose, { Document, Schema } from 'mongoose';

import { PassportData } from '../../interface';

const passportSchema = new Schema<PassportData>({
	dateOfBirth: String,
	expiryDate: String,
});

const PassportModel = mongoose.model<PassportData>('Passport', passportSchema);

export { PassportModel };
