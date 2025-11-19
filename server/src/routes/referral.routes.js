import { Router } from 'express';
import {
  createReferral,
  getAllReferrals,
  getMyReferrals,
  updateReferralStatus,
  linkReferralToPatient,
} from '../controllers/referral.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { verifyPermission } from '../middleware/permission.middleware.js';

const router = Router();

// Doctor routes
router.route('/').post(verifyJWT, createReferral);
router.route('/my-referrals').get(verifyJWT, getMyReferrals);

// Admin routes
router.route('/all').get(verifyJWT, verifyPermission(['admin']), getAllReferrals);
router.route('/:referralId/status').patch(verifyJWT, verifyPermission(['admin']), updateReferralStatus);
router.route('/:referralId/link-patient').patch(verifyJWT, verifyPermission(['admin']), linkReferralToPatient);

export default router;

