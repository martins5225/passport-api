import express, { Application, NextFunction, Request, Response } from 'express';

import { GlobalError } from '../interface';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import passportRouter from './routes/passport.router';

//For env File
dotenv.config();

const app: Application = express();
const port = process.env.PORT || 8000;
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
// Connect to the MongoDB database
const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mydatabase';

const connectToDb = () => {
	mongoose
		.connect(dbURI)
		.then(() => {
			console.log('Connected to the database');
		})
		.catch((err) => {
			console.error('Error connecting to the database:', err);
		});
};

connectToDb();

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

const { Storage } = require('@google-cloud/storage');

async function authenticateImplicitWithAdc() {
	const storage = new Storage({
		projectId,
	});
	const [buckets] = await storage.getBuckets();
	console.log('Buckets:');

	for (const bucket of buckets) {
		console.log(`- ${bucket.name}`);
	}

	console.log('Listed all storage buckets.');
}

authenticateImplicitWithAdc();

app.get('/', (req: Request, res: Response) => {
	res.send('Welcome to Passport Server');
});

app.use('/passport', passportRouter);

// Unknown route handler
app.use('/*', (req, res) => res.status(404).send('Page not found'));

// Global error handler
app.use((err: GlobalError, req: Request, res: Response, next: NextFunction) => {
	const defaultErr = {
		log: 'Express error handler caught unknown middleware error',
		status: 400,
		message: { err: 'An error occurred' },
	};
	const errorObj = Object.assign({}, defaultErr, err);
	console.log(errorObj.log);
	return res.status(errorObj.status).json(errorObj.message);
});

app.listen(port, () => {
	console.log(`Server is Fire at http://localhost:${port}`);
});
