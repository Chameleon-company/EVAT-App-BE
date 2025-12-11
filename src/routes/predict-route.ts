import { Router } from "express";
import { authGuard } from "../middlewares/auth-middleware";

import PredictService from "../services/predict-service";
import PredictController from "../controllers/predict-controller";

const router = Router();

const predictService = new PredictService();
const predictController = new PredictController(predictService);

/**
 * @swagger
 * components:
 *   schemas:
 *     StationCongestion:
 *       type: array
 *       properties:
 *         station:
 *           type: object
 *           example: 
 *              stationId:
 *                  type: string
 *                  example: "674f98013dc8e5d2ac00894a"
 *              congestion_level:
 *                  type: string
 *                  example: ["low", "medium", "high", "unknown"]
 */

/**
 * @swagger
 * /api/predict/congestion:
 *   post:
 *     tags:
 *       - Predict
 *     summary: Get station congestion
 *     description: Retrieves multiple stations congestions level by their ID's
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stationIds
 *             properties:
 *               stationIds:
 *                 type: array
 *                 example: ["674f98013dc8e5d2ac00894a", "674f97ff3dc8e5d2ac008456", "674f97ff3dc8e5d2ac008407", "674f97ff3dc8e5d2ac008685"]
 *     responses:
 *       200:
 *         description: Congestion levels received successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Congestion levels received successfully"
 *                 data:
 *                   $ref: '#/components/schemas/StationCongestion'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post("/congestion", authGuard(["user", "admin"]), (req, res) =>
  predictController.getCongestionLevels(req, res)
);

export default router;