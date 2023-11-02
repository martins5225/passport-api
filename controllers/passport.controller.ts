import { NextFunction, Request, Response } from 'express';

import { ImageAnnotatorClient } from '@google-cloud/vision';
import { PassportModel } from '../models/passportModel';

const client = new ImageAnnotatorClient({
	keyFilename: 'path-to-your-service-account-key.json',
});

export const processPassport = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		if (!req.file || !req.body.name) {
			return res
				.status(400)
				.json({ error: 'Passport image or name not provided' });
		}

		const imageBuffer = req.file.buffer;

		const [result] = await client.textDetection(imageBuffer);
		const fullTextAnnotation = result.fullTextAnnotation;
		console.log(fullTextAnnotation);

		const dateOfBirth = 'Extracted Date of Birth';
		const expiryDate = 'Extracted Expiry Date';

		// Get the passport name from user input
		const name = req.body.name;

		const newPassport = new PassportModel({
			dateOfBirth,
			expiryDate,
		});

		await newPassport.save();

		res.json({ dateOfBirth, expiryDate });
	} catch (error) {
		next({
			log: 'error in processing passport',
			status: 500,
			message: {
				err: `Error: ${error}`,
			},
		});
	}
};
