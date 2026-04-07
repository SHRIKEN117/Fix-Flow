import { Router } from 'express';
import {
  listInvoices,
  createInvoice,
  getInvoice,
  updateInvoice,
  issueInvoice,
} from '../controllers/invoice.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody } from '../middleware/validateBody';
import { createInvoiceSchema, updateInvoiceSchema } from '../validations/invoice.validation';

const router = Router();

router.use(authenticate, authorize('finance', 'admin'));

router.get('/', listInvoices);
router.post('/', authorize('finance'), validateBody(createInvoiceSchema), createInvoice);
router.get('/:id', getInvoice);
router.patch('/:id', authorize('finance'), validateBody(updateInvoiceSchema), updateInvoice);
router.patch('/:id/issue', authorize('finance'), issueInvoice);

export default router;
