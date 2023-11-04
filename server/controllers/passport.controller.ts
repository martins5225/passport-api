import { NextFunction, Request, Response, response } from 'express';

import { ImageAnnotatorClient } from '@google-cloud/vision';
import { PassportModel } from '../models/passportModel';
import axios from 'axios';

const client = new ImageAnnotatorClient();

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

		let base64String: string;
		console.log(image);
		if (image.startsWith('http') || image.startsWith('https')) {
			// Fetch the image from the URL and convert it to base64
			const response = await axios.get(image, {
				responseType: 'arraybuffer',
			});

			if (response.status !== 200) {
				return res
					.status(400)
					.json({ error: 'Failed to fetch the image from the URL' });
			}

			const imageBuffer = Buffer.from(response.data);
			base64String = imageBuffer.toString('base64');
		} else {
			base64String = image;
		}

		const [result] = await client.textDetection({
			image: { content: base64String },
		});

		console.log(result);
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
		console.log(extractedText);
		const dateOfBirthPattern =
			/(?:Date of Birth|Date de Naissance).*\n(\d{2}[^\d]+[A-Z]{3}[^\d]+.*\d{2})/i;

		const expiryDatePattern =
			/(?:Date of Expiry|Date d'Expiration).*\n(\d{2}[^\d]+[A-Z]{3}[^\d]+.*\d{2})/i;

		const dateOfBirthMatch = dateOfBirthPattern?.exec(extractedText);
		console.log(dateOfBirthMatch);
		const expiryDateMatch = expiryDatePattern?.exec(extractedText);

		let dateOfBirth = '';
		let expiryDate = '';

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
			const yearPattern = /(\d{2}|\d{4})$/;
			const yearMatch = yearPattern.exec(dateOfBirthString);
			if (yearMatch && yearMatch.length === 2) {
				const twoDigitYear = yearMatch[1];
				const currentYear = new Date().getFullYear().toString().substr(-2);
				const currentCentury = new Date().getFullYear().toString().substr(0, 2);
				// Convert the two-digit year to an integer
				const twoDigitYearInt = parseInt(twoDigitYear, 10);

				// Determine the century based on comparison with the current year
				let century = currentCentury;
				if (twoDigitYearInt > parseInt(currentYear)) {
					// If the two-digit year is greater than the current year, use the previous century
					century = (parseInt(currentCentury) - 1).toString();
				}
				// Replace only the last two digits with the converted year
				dateOfBirthString = dateOfBirthString.replace(
					twoDigitYear,
					century + twoDigitYear
				);
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
			const yearPattern = /(\d{2}|\d{4})$/;
			const yearMatch = yearPattern.exec(expiryDateString);
			if (yearMatch?.length === 2) {
				const twoDigitYear = yearMatch[1];
				const currentYear = new Date().getFullYear().toString().substring(-2);
				const currentCentury = new Date()
					.getFullYear()
					.toString()
					.substring(0, 2);
				// Convert the two-digit year to an integer
				const twoDigitYearInt = parseInt(twoDigitYear, 10);

				// Determine the century based on comparison with the current year
				let century = currentCentury;
				if (twoDigitYearInt > parseInt(currentYear)) {
					// If the two-digit year is greater than the current year, use the current century
					century = parseInt(currentCentury).toString();
				}
				expiryDateString = expiryDateString.replace(
					twoDigitYear,
					century + twoDigitYear
				);
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
