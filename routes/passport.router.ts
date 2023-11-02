// routes/passport.router.ts

import { Router } from 'express';
import multer from 'multer';
import { processPassport } from '../controllers/passport.controller';

const router = Router();

// Multer middleware for handling file uploads
const upload = multer({ storage: multer.memoryStorage() });

router.post('/process', upload.single('passportImage'), processPassport);

export default router;
