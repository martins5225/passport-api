export interface GlobalError {
	log: string;
	status: number;
	message: { err: string };
}

export interface PassportData extends Document {
	dateOfBirth: string;
	expiryDate: string;
}
