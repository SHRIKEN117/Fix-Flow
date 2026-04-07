import { Router } from 'express';
import { listPayments, createPayment, getPayment } from '../controllers/payment.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody } from '../middleware/validateBody';
import { createPaymentSchema } from '../validations/payment.validation';

const router = Router();

router.use(authenticate, authorize('finance', 'admin'));

router.get('/', listPayments);
router.post('/', authorize('finance'), validateBody(createPaymentSchema), createPayment);
router.get('/:id', getPayment);

export default router;
