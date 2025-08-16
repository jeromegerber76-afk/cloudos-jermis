import { Router } from 'express';
const router = Router();
router.get('/', (req, res) => res.json({ message: 'Routes coming soon!' }));
export default router;