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

router.use(authenticate, authorize('finance', 'admin'));

router.get('/', listEstimates);
router.post('/', authorize('finance'), validateBody(createEstimateSchema), createEstimate);
router.get('/:id', getEstimate);
router.patch('/:id', authorize('finance'), validateBody(updateEstimateSchema), updateEstimate);
router.post('/:id/items', authorize('finance'), validateBody(addEstimateItemSchema), addEstimateItem);
router.delete('/:id/items/:itemId', authorize('finance'), deleteEstimateItem);
router.patch('/:id/approve', validateBody(approveRejectEstimateSchema), approveEstimate);
router.patch('/:id/reject', validateBody(approveRejectEstimateSchema), rejectEstimate);

export default router;
