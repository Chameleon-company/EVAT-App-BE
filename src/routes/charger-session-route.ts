//Express routes

import express from 'express';
import { Request, Response } from 'express';

import ChargerSessionController from '../controllers/charger-session-controller';
import ChargerSessionService from '../services/charger-session-service';
import ChargerSessionRepository from '../repositories/charger-session-repository';

// Middleware
import { authGuard } from '../middlewares/auth-middleware';

// Initialise router
const router = express.Router();

// Setup: controller -> service -> repository
const chargerSessionRepository = new ChargerSessionRepository();
const chargerSessionService = new ChargerSessionService(chargerSessionRepository);
const chargerSessionController = new ChargerSessionController(chargerSessionService);

// Routes with Swagger documentations

/**
 * @swagger
 * /api/charger-sessions/{sessionId}:
 *   get:
 *     summary: Get a charging session by ID
 *     description: Get a specific charging session using its session ID.
 *     tags:
 *       - Charger Sessions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the charging session
 *         example: ""
 *     responses:
 *       200:
 *         description: Charging session retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Success! Session ID ... found."
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: ""
 *                     userId:
 *                       type: string
 *                       example: ""
 *                     stationId:
 *                       type: string
 *                       example: ""
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                       example: ""
 *                     status:
 *                       type: string
 *                       example: "in_progress"
 *       404:
 *         description: Charging session with the provided ID not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Session with ID ... not found."
 */
router.get('/:sessionId', authGuard(['user', 'admin']), (req: Request, res: Response) => chargerSessionController.getSessionById(req, res));

/**
 * @swagger
 * /api/charger-sessions/user/{userId}:
 *   get:
 *     summary: Get all sessions for a specific user ID
 *     description: Retrieves all charging sessions of a user based on their ID.
 *     tags:
 *       - Charger Sessions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user
 *         example: ""
 *     responses:
 *       200:
 *         description: Charging sessions for the user retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User ID ... sessions found."
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: ""
 *                       userId:
 *                         type: string
 *                         example: ""
 *                       stationId:
 *                         type: string
 *                         example: ""
 *                       startTime:
 *                         type: string
 *                         format: date-time
 *                         example: ""
 *                       status:
 *                         type: string
 *                         example: "in_progress"
 *       404:
 *         description: User with the provided ID not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User ID ... not found."
 *       500:
 *         description: Server error
 */
router.get('/user/:userId', authGuard(['user', 'admin']), (req: Request, res: Response) => chargerSessionController.getSessionsByUser(req, res));

/**
 * @swagger
 * /api/charger-sessions/station/{stationId}:
 *   get:
 *     summary: Get all sessions for a specific station ID
 *     description: Retrieves all charging sessions that occurred at a the specified charging station.
 *     tags:
 *       - Charger Sessions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stationId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the charging station
 *         example: ""
 *     responses:
 *       200:
 *         description: Charging sessions for the station retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Station sessions ID ... found."
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: ""
 *                       userId:
 *                         type: string
 *                         example: ""
 *                       stationId:
 *                         type: string
 *                         example: ""
 *                       startTime:
 *                         type: string
 *                         format: date-time
 *                         example: ""
 *                       status:
 *                         type: string
 *                         example: "in_progress"
 *       404:
 *         description: Station with the provided ID not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Station ID ... not found."
 *       500:
 *         description: Server error
 */
router.get('/station/:stationId', authGuard(['user', 'admin']), (req: Request, res: Response) => chargerSessionController.getSessionsByStation(req, res));

/**
 * @swagger
 * /api/charger-sessions/:
 *   post:
 *     summary: Start a new charging session
 *     description: Start a new charging session for a user at a charging station.
 *     tags:
 *       - Charger Sessions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - stationId
 *             properties:
 *               userId:
 *                 type: string
 *                 example: ""
 *               stationId:
 *                 type: string
 *                example: ""
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 example: ""
 *     responses:
 *       201:
 *         description: Charging session started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Charging session ID ... started."
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: ""
 *                     userId:
 *                       type: string
 *                       example: ""
 *                     stationId:
 *                       type: string
 *                       example: ""
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                       example: ""
 *                     status:
 *                       type: string
 *                       example: "in_progress"
 *       500:
 *         description: Server error
 */
router.post('/', authGuard(['user', 'admin']), (req: Request, res: Response) => chargerSessionController.createSession(req, res));

/**
 * @swagger
 * /api/charger-sessions/end/{sessionId}:
 *   patch:
 *     summary: End a charging session by session ID
 *     description: Ends a charging session by marking its completion time and update it status.
 *     tags:
 *       - Charger Sessions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the charging session to end
 *         example: ""
 *     responses:
 *       200:
 *         description: Charging session ended successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Charging session ID ... ended."
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: ""
 *                     status:
 *                       type: string
 *                       example: "completed"
 *                     endTime:
 *                       type: string
 *                       format: date-time
 *                       example: ""
 *       404:
 *         description: Charging session with the provided ID not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Session with ID ... not found."
 *       404:
 *         description: Session not found
 */
router.patch('/end/:sessionId', authGuard(['user', 'admin']), (req: Request, res: Response) => chargerSessionController.endSession(req, res));

// Newly added SSE and REST logs (need Swagger documentation)
router.get('/sessions/stream', (req, res) => chargerSessionController.streamSessions(req, res));
router.get('sessions/logs', (req, res) => chargerSessionController.getLogs(req, res));

export default router;