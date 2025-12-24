import { Router } from 'express';
import {
    getReportsForUser,
    uploadReport,
    deleteReport,
} from '../controllers/report.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/multer.middleware.js';

const router = Router();

// All routes in this file require the user to be logged in
router.use(verifyJWT);

// GET /api/v1/reports/user/:userId
router.route('/user/:userId').get(getReportsForUser);

// POST /api/v1/reports/upload
router.route('/upload').post(upload.single('report'), uploadReport);

// DELETE /api/v1/reports/:reportId
router.route('/:reportId').delete(deleteReport);

export default router;