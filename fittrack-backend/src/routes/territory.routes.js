import express from 'express';
import { listTerritories, claimTerritory, battleTerritory } from '../controllers/territory.controller.js';
import auth from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(auth);

router.get('/', listTerritories);
router.post('/claim', claimTerritory);
router.post('/battle', battleTerritory);

export default router;
