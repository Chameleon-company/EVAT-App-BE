import { Router } from "express";
import { authGuard } from "../middlewares/auth-middleware";
import GamificationController from "../controllers/gamification-controller";

const router = Router();
const gamificationController = new GamificationController();

/**
 * @swagger
 * tags:
 *   - name: Gamification - User Actions
 *     description: Endpoints for user-facing gamification features like logging actions and purchasing items.
 *   - name: Gamification - Item Management
 *     description: Endpoints for creating, updating, and managing virtual items.
 *   - name: Gamification - Badge Management
 *     description: Endpoints for creating, updating, and managing achievement badges.
 *
 * components:
 *   responses:
 *     UnauthorizedError:
 *       description: Access token is missing or invalid.
 *     NotFoundError:
 *       description: The requested resource was not found.
 *     ServerError:
 *       description: An unexpected error occurred on the server.
 *   schemas:
 *     GameVirtualItem:
 *       type: object
 *       properties:
 *         item_id_string:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         item_type:
 *           type: string
 *         cost_points:
 *           type: number
 *           nullable: true
 *         value_points:
 *           type: number
 *         rarity:
 *           type: string
 *         asset_url:
 *           type: string
 *     GameBadge:
 *       type: object
 *       properties:
 *         badge_id_string:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         icon_url:
 *           type: string
 *         criteria:
 *           type: object
 *           properties:
 *             source:
 *               type: string
 *             field:
 *               type: string
 *             operator:
 *               type: string
 *             value:
 *               type: number
 */

// --- User-Facing Routes ---

/**
 * @swagger
 * /api/gamification/items:
 *   get:
 *     summary: Get all purchasable virtual items
 *     tags: [Gamification - User Actions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of purchasable virtual items.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/items", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.getVirtualItems(req, res)
);

/**
 * @swagger
 * /api/gamification/items/purchase:
 *   post:
 *     summary: Purchase a virtual item
 *     tags: [Gamification - User Actions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               itemId:
 *                 type: string
 *                 description: The 'item_id_string' of the item to purchase.
 *               session_id:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Purchase successful.
 *       '400':
 *         description: Bad Request (e.g., insufficient points, item already owned).
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         description: Not Found (e.g., item or user profile does not exist).
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/items/purchase", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.purchaseVirtualItem(req, res)
);

/**
 * @swagger
 * /api/gamification/action:
 *   post:
 *     summary: Log a user action and receive rewards
 *     tags: [Gamification - User Actions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action_type:
 *                 type: string
 *               session_id:
 *                 type: string
 *               details:
 *                 type: object
 *     responses:
 *       '200':
 *         description: Action logged successfully.
 *       '400':
 *         description: Bad Request (e.g., missing action_type or invalid details).
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         description: Not Found (e.g., user profile not found).
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/action", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.logAction(req, res)
);

// --- Virtual Item Management Routes ---

/**
 * @swagger
 * /api/gamification/items/manage:
 *   post:
 *     summary: Create a new virtual item
 *     tags: [Gamification - Item Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GameVirtualItem'
 *     responses:
 *       '201':
 *         description: Item created successfully.
 *       '400':
 *         description: Bad Request (e.g., missing required fields).
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/items/manage", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.createVirtualItem(req, res)
);

/**
 * @swagger
 * /api/gamification/items/manage/all:
 *   get:
 *     summary: Get all virtual items
 *     tags: [Gamification - Item Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of all virtual items.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/items/manage/all", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.getAllVirtualItems(req, res)
);

/**
 * @swagger
 * /api/gamification/items/manage/{itemId}:
 *   get:
 *     summary: Get a single virtual item by its MongoDB ID
 *     tags: [Gamification - Item Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Single virtual item.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/items/manage/:itemId", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.getVirtualItemById(req, res)
);

/**
 * @swagger
 * /api/gamification/items/manage/{itemId}:
 *   patch:
 *     summary: Update a virtual item by its MongoDB ID
 *     tags: [Gamification - Item Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       '200':
 *         description: Item updated successfully.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.patch("/items/manage/:itemId", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.updateVirtualItem(req, res)
);

/**
 * @swagger
 * /api/gamification/items/manage/{itemId}:
 *   delete:
 *     summary: Delete a virtual item by its MongoDB ID
 *     tags: [Gamification - Item Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Item deleted successfully.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.delete("/items/manage/:itemId", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.deleteVirtualItem(req, res)
);

// --- Badge Management Routes ---

/**
 * @swagger
 * /api/gamification/badges/manage:
 *   post:
 *     summary: Create a new badge
 *     tags: [Gamification - Badge Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GameBadge'
 *     responses:
 *       '201':
 *         description: Badge created successfully.
 *       '400':
 *         description: Bad Request (e.g., missing required fields).
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.post("/badges/manage", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.createBadge(req, res)
);

/**
 * @swagger
 * /api/gamification/badges/manage/all:
 *   get:
 *     summary: Get all badges
 *     tags: [Gamification - Badge Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of all badges.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/badges/manage/all", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.getAllBadges(req, res)
);

/**
 * @swagger
 * /api/gamification/badges/manage/{badgeId}:
 *   get:
 *     summary: Get a single badge by its MongoDB ID
 *     tags: [Gamification - Badge Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: badgeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Single badge.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/badges/manage/:badgeId", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.getBadgeById(req, res)
);

/**
 * @swagger
 * /api/gamification/badges/manage/{badgeId}:
 *   patch:
 *     summary: Update a badge by its MongoDB ID
 *     tags: [Gamification - Badge Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: badgeId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       '200':
 *         description: Badge updated successfully.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.patch("/badges/manage/:badgeId", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.updateBadge(req, res)
);

/**
 * @swagger
 * /api/gamification/badges/manage/{badgeId}:
 *   delete:
 *     summary: Delete a badge by its MongoDB ID
 *     tags: [Gamification - Badge Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: badgeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Badge deleted successfully.
 *       '401':
 *         $ref: '#/components/responses/UnauthorizedError'
 *       '404':
 *         $ref: '#/components/responses/NotFoundError'
 *       '500':
 *         $ref: '#/components/responses/ServerError'
 */
router.delete("/badges/manage/:badgeId", authGuard(["user", "admin"]), (req, res) =>
  gamificationController.deleteBadge(req, res)
);

export default router;