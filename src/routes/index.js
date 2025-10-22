import express from 'express';
import { getProperties, createProperty } from '../controllers/index.js';

const router = express.Router();

router.get('/', getProperties);
router.post('/', createProperty);

export default router;
