import { Router } from "express";
import { authGuard } from "../middlewares/auth-middleware";
import { isAdminAuthenticated } from '../middlewares/is-admin-auth';

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
 *                 congestionLevels:
 *                   type: array
 *                   items:
 *                     type: object
 *                     example:
 *                       _id: "693a452649ade06c98d08df2"
 *                       chargerId: "674f98013dc8e5d2ac00894a"
 *                       congestion_level: "low"
 *                 data:
 *                   $ref: '#/components/schemas/StationCongestion'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post("/congestion", authGuard(["user", "admin"]), (req, res) => { // Have to use post as HEAD or GET Request cannot have a body
  predictController.getCongestionLevels(req, res);
});


/**
 * @swagger
 * {
 *   "/api/predict/congestion": {
 *       "put": {
 *           "tags": [
 *               "Predict"
 *           ],
 *           "summary": "Adds a station's congestion level by their ID",
 *           "description": "Adds or updates the congestion_level value from ID. Will delete then recreate document entry",
 *           "security": [
 *               {
 *                   "bearerAuth": []
 *               }
 *           ],
 *           "parameters": [
 *               {
 *                   "in": "query",
 *                   "name": "id",
 *                   "schema": {
 *                       "type": "string"
 *                   },
 *                   "required": true,
 *                   "description": "Station ID to update"
 *               },
 *               {
 *                   "in": "query",
 *                   "name": "level",
 *                   "schema": {
 *                       "type": "string"
 *                   },
 *                   "required": true,
 *                   "description": "Congestion level, expected to be 'low', 'medium', or 'high'"
 *               }
 *           ],
 *           "responses": {
 *               "201": {
 *                   "description": "Congestion level updated successfully",
 *                   "content": {
 *                       "application/json": {
 *                           "schema": {
 *                               "type": "object",
 *                               "properties": {
 *                                   "message": {
 *                                       "type": "string",
 *                                       "example": "Congestion level updated successfully"
 *                                   },
 *                                   "data": {
 *                                       "type": "object",
 *                                       "example": {
 *                                           "_id": "693a452649ade06c98d08df2",
 *                                           "chargerId": "674f98013dc8e5d2ac00894a",
 *                                           "congestion_level": "low"
 *                                       }
 *                                   }
 *                               }
 *                           }
 *                       }
 *                   }
 *               },
 *               "400": {
 *                   "description": "Bad request"
 *               },
 *               "401": {
 *                   "description": "Unauthorized, Admins Only"
 *               },
 *               "500": {
 *                   "description": "Internal Server Error"
 *               }
 *           }
 *       }
 *   }
 * }
 */
router.put("/congestion", isAdminAuthenticated, (req, res) =>
  predictController.putCongestionLevel(req, res)
);

/**
 * @swagger
 * /api/predict/congestion:
 *   delete:
 *     tags:
 *       - Predict
 *     summary: Removes a station's congestion level by their ID
 *     description: Deletes the congestion_level value from ID. Will cause the POST to return "unknown" for value
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       -
 *          in: query
 *          name: id
 *          schema:
 *            type: string
 *          required: true
 *          description: "Station ID to update"
 *     responses:
 *       201:
 *         description: Congestion level deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Congestion level deleted successfully"
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized, Admins Only
 *       500:
 *         description: Internal Server Error
 */
router.delete("/congestion", isAdminAuthenticated, (req, res) =>
  predictController.deleteCongestionLevel(req, res)
);

export default router;