import { Router } from "express";
import UserService from "../services/user-service";
import { authGuard } from "../middlewares/auth-middleware";
import PersonalisedEVInsightsService from "../services/personalised-ev-insights-service";
import PersonalisedEVInsightsController from "../controllers/personalised-ev-insights-controller";

const router = Router();

const userService = new UserService();
const personalisedEVInsightsService = new PersonalisedEVInsightsService();

const personalisedEVInsightsController = new PersonalisedEVInsightsController(
  userService,
  personalisedEVInsightsService
);

router.post("/", authGuard(["user", "admin"]), (req, res) =>
  personalisedEVInsightsController.submitInsights(req, res)
);

router.get("/me", authGuard(["user", "admin"]), (req, res) =>
  personalisedEVInsightsController.getMyInsights(req, res)
);

export default router;