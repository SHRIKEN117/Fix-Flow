import { Router } from 'express';
import {
  listEstimates,
  createEstimate,
  getEstimate,
  updateEstimate,
  addEstimateItem,
  deleteEstimateItem,
  approveEstimate,
  rejectEstimate,
} from '../controllers/estimate.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody } from '../middleware/validateBody';
import {
  createEstimateSchema,
  updateEstimateSchema,
  addEstimateItemSchema,
  approveRejectEstimateSchema,
} from '../validations/estimate.validation';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/', listEstimates);
router.post('/', validateBody(createEstimateSchema), createEstimate);
router.get('/:id', getEstimate);
router.patch('/:id', validateBody(updateEstimateSchema), updateEstimate);
router.post('/:id/items', validateBody(addEstimateItemSchema), addEstimateItem);
router.delete('/:id/items/:itemId', deleteEstimateItem);
router.patch('/:id/approve', validateBody(approveRejectEstimateSchema), approveEstimate);
router.patch('/:id/reject', validateBody(approveRejectEstimateSchema), rejectEstimate);

export default router;
