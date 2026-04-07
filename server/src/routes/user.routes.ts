import { Router } from 'express';
import {
  listUsers,
  getUser,
  updateUser,
  updateUserRole,
  deactivateUser,
  activateUser,
  listTechnicians,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authenticate);

router.get('/', authorize('admin'), listUsers);
router.get('/technicians', authorize('admin'), listTechnicians);
router.get('/:id', authorize('admin'), getUser);
router.patch('/:id', authorize('admin'), updateUser);
router.patch('/:id/role', authorize('admin'), updateUserRole);
router.patch('/:id/deactivate', authorize('admin'), deactivateUser);
router.patch('/:id/activate', authorize('admin'), activateUser);

export default router;
