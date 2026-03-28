import express from "express";
import { compareEnvironmentalImpact } from "../controllers/environmental-impact-controller";

const router = express.Router();

/**
 * @swagger
 * /api/environmental-impact/compare:
 *   get:
 *     summary: Compare environmental impact between an EV and an ICE vehicle
 *     tags: [Environmental Impact]
 *     parameters:
 *       - in: query
 *         name: evId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the EV vehicle
 *       - in: query
 *         name: iceId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the ICE vehicle
 *     responses:
 *       200:
 *         description: Environmental impact comparison retrieved successfully
 *       400:
 *         description: Missing or invalid evId / iceId
 *       404:
 *         description: EV or ICE vehicle not found
 *       500:
 *         description: Internal server error
 */
router.get("/compare", compareEnvironmentalImpact);

export default router;