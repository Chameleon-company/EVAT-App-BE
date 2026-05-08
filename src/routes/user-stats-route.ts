import { Router } from "express";
import UserStatsController from "../controllers/user-stats-controller";
import userStatsService from "../services/user-stats-service"; 
import { authGuard } from "../middlewares/auth-middleware";

const router = Router();
const userStatController = new UserStatsController(userStatsService);

/**
 * @swagger
 * /api/user-stats/me:
 *   get:
 *     tags:
 *       - User Stats
 *     summary: Get authenticated user's stats
 *     description: Retrieve all counters, flags, and lastUpdated timestamp for the currently logged-in user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     counters:
 *                       type: object
 *                     flags:
 *                       type: object
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User stats not found
 *       500:
 *         description: Internal server error
 */
router.get("/me", authGuard(["user", "admin"]), (req, res) =>
    userStatController.getMyStats(req, res)
);

/**
 * @swagger
 * /api/user-stats/initialize:
 *   post:
 *     tags:
 *       - User Stats
 *     summary: Initialize user stats document
 *     description: Creates a user_stats document if one does not exist (usually called after registration)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: User stats initialized successfully
 *       400:
 *         description: Bad request - userId missing
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/initialize", authGuard(["user", "admin"]), (req, res) =>
    userStatController.initializeStats(req, res)
);

/**
 * @swagger
 * /api/user-stats/reset:
 *   post:
 *     tags:
 *       - User Stats
 *     summary: Reset all user stats (Development only)
 *     description: Resets all counters to 0 and flags to false. Intended for testing and development only.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All stats reset successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
if (process.env.NODE_ENV !== "production") {
    router.post("/reset", authGuard(["user", "admin"]), (req, res) =>
        userStatController.resetAllStats(req, res)
    );
}

export default router;