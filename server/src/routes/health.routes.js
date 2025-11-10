import { Router } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = Router();

router.get('/health', (req, res) => {
    res.status(200).json(new ApiResponse(200, { status: 'ok' }, 'Server is healthy'));
});

export default router;