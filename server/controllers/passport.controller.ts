import { NextFunction, Request, Response, response } from 'express';

import { ImageAnnotatorClient } from '@google-cloud/vision';
import { PassportModel } from '../models/passportModel';
import axios from 'axios';

const client = new ImageAnnotatorClient();

const fetchImageAndConvertToBase64 = async (image: string): Promise<string> => {
	if (image.startsWith('http') || image.startsWith('https')) {
		const response = await axios.get(image, {
			responseType: 'arraybuffer',
		});

		if (response.status !== 200) {
			throw new Error('Failed to fetch the image from the URL');
		}

		const imageBuffer = Buffer.from(response.data);
		return imageBuffer.toString('base64');
	} else {
		return image;
	}
};

export const processPassport = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const { image, name } = req.body;

		if (!image || !name) {
			return res
				.status(400)
				.json({ error: 'Passport image or name not provided' });
		}

		const base64String = await fetchImageAndConvertToBase64(image);

		const [result] = await client.textDetection({
			image: { content: base64String },
		});

		const fullTextAnnotation = result.fullTextAnnotation;
		const monthAbbreviations: { [key: string]: string } = {
			JAN: '01',
			FEB: '02',
			MAR: '03',
			APR: '04',
			MAY: '05',
			JUN: '06',
			JUL: '07',
			AUG: '08',
			SEP: '09',
			OCT: '10',
			NOV: '11',
			DEC: '12',
		};
		const extractedText = fullTextAnnotation?.text ?? '';
		const dateOfBirthPattern =
			/(?:Date of Birth|Date de Naissance).*\n(\d{2}[^\d]+[A-Z]{3}[^\d]+.*\d{2})/i;

		const expiryDatePattern =
			/(?:Date of Expiry|Date d'Expiration).*\n(\d{2}[^\d]+[A-Z]{3}[^\d]+.*\d{2})/i;

		const dateOfBirthMatch = dateOfBirthPattern?.exec(extractedText);
		const expiryDateMatch = expiryDatePattern?.exec(extractedText);

		let dateOfBirth = '';
		let expiryDate = '';
		const currentYear = new Date().getFullYear().toString().slice(-2);
		const currentCentury = new Date().getFullYear().toString().substring(0, 2);
		const yearPattern = /(\d{2}|\d{4})$/;

		if (dateOfBirthMatch) {
			let dateOfBirthString = dateOfBirthMatch[1];
			const monthAbbreviation = dateOfBirthString.match(/[A-Z]{3}/);
			console.log(monthAbbreviation);
			if (monthAbbreviation) {
				const numericMonth = monthAbbreviations[monthAbbreviation[0]];
				dateOfBirthString = dateOfBirthString.replace(
					monthAbbreviation[0],
					numericMonth
				);
			}
			const yearMatch = yearPattern.exec(dateOfBirthString);

			if (yearMatch) {
				const yearValue = yearMatch[1];

				if (yearValue.length === 2) {
					console.log('im here working');

					const twoDigitYearInt = parseInt(yearValue, 10);

					let century = currentCentury;
					if (twoDigitYearInt > parseInt(currentYear)) {
						century = (parseInt(currentCentury) - 1).toString();
					}
					dateOfBirthString = dateOfBirthString.replace(
						yearMatch[1],
						century + yearValue
					);
				}
			}

			dateOfBirth = dateOfBirthString.replace(/[^\d]+/g, '-');
		}

		if (expiryDateMatch) {
			let expiryDateString = expiryDateMatch[1];
			const monthAbbreviation = expiryDateString.match(/[A-Z]{3}/);
			if (monthAbbreviation) {
				const numericMonth = monthAbbreviations[monthAbbreviation[0]];
				expiryDateString = expiryDateString.replace(
					monthAbbreviation[0],
					numericMonth
				);
			}
			const yearMatch = yearPattern.exec(expiryDateString);
			if (yearMatch) {
				const yearValue = yearMatch[1];

				if (yearValue.length === 2) {
					const twoDigitYearInt = parseInt(yearValue, 10);

					let century = currentCentury;
					if (twoDigitYearInt > parseInt(currentYear)) {
						century = parseInt(currentCentury).toString();
					}
					expiryDateString = expiryDateString.replace(
						yearMatch[1],
						century + yearValue
					);
				}
			}
			expiryDate = expiryDateString.replace(/[^\d]+/g, '-');
		}

		const newPassport = new PassportModel({
			dateOfBirth,
			expiryDate,
		});

		await newPassport.save();

		res.json({ dateOfBirth, expiryDate });
	} catch (error) {
		console.error('Error initializing Google Cloud Vision API client:', error);

		next({
			log: 'error in processing passport',
			status: 500,
			message: {
				err: `Error: ${error}`,
			},
		});
	}
};
