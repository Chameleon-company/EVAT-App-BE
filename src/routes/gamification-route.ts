import { Router } from "express";
import { authGuard } from "../middlewares/auth-middleware";
import GamificationController from "../controllers/gamification-controller";

const router = Router();
const gamificationController = new GamificationController();

/**
 * @swagger
 * tags:
 * name: Gamification
 * description: All endpoints related to the EVAT gamification engine.
 */

/**
 * @swagger
 * /api/gamification/action:
 * post:
 * summary: Log a user action and trigger the gamification engine
 * description: This is the primary endpoint for the app frontend to report user actions. The backend will process points, check for quest completion, and award badges based on this action.
 * tags: [Gamification]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required: [action_type]
 * properties:
 * action_type:
 * type: string
 * description: A string identifying the user's action (e.g., 'check_in', 'app_login').
 * example: "check_in"
 * session_id:
 * type: string
 * description: A unique ID for the user's current session.
 * example: "session-xyz-123"
 * details:
 * type: object
 * description: Any additional data related to the action.
 * example: { "station_id": "station-123" }
 * responses:
 * '200':
 * description: Action logged and processed successfully. Returns the updated game profile.
 * '400':
 * description: Bad Request (e.g., missing action_type).
 * '401':
 * description: Unauthorized.
 * '500':
 * description: Server error.
 */
router.post(
    "/action",
    authGuard(["user", "admin"]),
    (req, res) => gamificationController.logAction(req, res)
);

/**
 * @swagger
 * /api/gamification/profile:
 * get:
 * summary: Get the current user's complete gamification profile
 * description: Retrieves the user's points, metrics, inventory (badges, items), and active quests, with populated details.
 * tags: [Gamification]
 * security:
 * - bearerAuth: []
 * responses:
 * '200':
 * description: Successfully retrieved the game profile.
 * '404':
 * description: Game profile not found for the user.
 */
router.get(
    "/profile",
    authGuard(["user", "admin"]),
    (req, res) => gamificationController.getGameProfile(req, res)
);

/**
 * @swagger
 * /api/gamification/quests:
 * get:
 * summary: Get a list of all active quests
 * description: Retrieves a list of all quests currently marked as 'ACTIVE' in the database.
 * tags: [Gamification]
 * security:
 * - bearerAuth: []
 * responses:
 * '200':
 * description: Successfully retrieved the list of active quests.
 */
router.get(
    "/quests",
    authGuard(["user", "admin"]),
    (req, res) => gamificationController.getQuests(req, res)
);

/**
 * @swagger
 * /api/gamification/badges:
 * get:
 * summary: Get a list of all defined badges
 * description: Retrieves a list of all available badges and their unlock criteria.
 * tags: [Gamification]
 * security:
 * - bearerAuth: []
 * responses:
 * '200':
 * description: Successfully retrieved the list of badges.
 */
router.get(
    "/badges",
    authGuard(["user", "admin"]),
    (req, res) => gamificationController.getBadges(req, res)
);

/**
 * @swagger
 * /api/gamification/items:
 * get:
 * summary: Get all purchasable virtual items
 * description: Retrieves items for the 'EVAT 人生' virtual shop.
 * tags: [Gamification]
 * security:
 * - bearerAuth: []
 * responses:
 * '200':
 * description: A list of virtual items.
 */
router.get(
    "/items",
    authGuard(["user", "admin"]),
    (req, res) => gamificationController.getVirtualItems(req, res)
);

/**
 * @swagger
 * /api/gamification/items/purchase:
 * post:
 * summary: Purchase a virtual item
 * description: Allows a user to spend points to buy a virtual item.
 * tags: [Gamification]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required: [itemId]
 * properties:
 * itemId:
 * type: string
 * description: The 'item_id_string' of the item to purchase.
 * example: "AVATAR_TSHIRT_STANDARD_LOGO"
 * session_id:
 * type: string
 * description: The user's current session ID.
 * example: "session-abc-456"
 * responses:
 * '200':
 * description: Purchase successful.
 */
router.post(
    "/items/purchase",
    authGuard(["user", "admin"]),
    (req, res) => gamificationController.purchaseVirtualItem(req, res)
);

export default router;

