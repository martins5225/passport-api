// routes/passport.router.ts

import { Router } from 'express';
import { processPassport } from '../controllers/passport.controller';

const router = Router();

router.post('/process', processPassport);

export default router;
