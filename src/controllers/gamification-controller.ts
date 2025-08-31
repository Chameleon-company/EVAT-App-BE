import { Request, Response } from "express";
import {
    GameVirtualItem,
    GameProfile,
    GameEvent,
    GameBadge,
    GameQuest
} from "../models/game-model";
import mongoose from "mongoose";

// A map to define points for each action type
const actionPoints: { [key: string]: number } = {
    check_in: 10,
    report_fault: 50,
    validate_ai_prediction: 75,
    discover_new_station_in_black_spot: 1000,
    use_route_planner: 25, // Assuming this completes DAILY_ROUTE_PLAN
    complete_long_trip_with_planner: 150, // Assuming this completes TUTORIAL_FIRST_ROUTE_PLAN
    ask_chatbot_question: 20, // Assuming this completes DAILY_CHATBOT_QUERY
    fun_quiz_correct: 20, // Assuming this completes DAILY_QUIZ
    redeem_easter_egg: 100, // Assuming this completes DAILY_EGG_HUNT
    charge_at_green_station: 250, // Assuming this is for EVENT_EARTH_DAY_2025
    app_login: 0, // No direct points, handled by streak logic
};

export default class GamificationController {
    constructor() { }

    // --- User-Facing Routes ---

    async getVirtualItems(req: Request, res: Response): Promise<Response> {
        try {
            const items = await GameVirtualItem.find({ cost_points: { $ne: null } }).exec();
            return res.status(200).json({
                message: "Virtual items retrieved successfully",
                data: items,
            });
        } catch (error: any) {
            return res.status(500).json({ message: "Server error while fetching virtual items", error: error.message });
        }
    }

    async purchaseVirtualItem(req: Request, res: Response): Promise<Response> {
        const { itemId, session_id } = req.body;
        const userId = req.user?.id;

        if (!itemId) return res.status(400).json({ message: "Item ID is required." });
        if (!userId) return res.status(401).json({ message: "User not authenticated." });

        try {
            const item = await GameVirtualItem.findOne({ item_id_string: itemId }).exec();
            let userProfile = await GameProfile.findOne({ main_app_user_id: userId }).exec();

            if (!item) return res.status(404).json({ message: `Item with ID '${itemId}' not found.` });
            if (!userProfile) return res.status(404).json({ message: `Game profile for user '${userId}' not found.` });
            if (item.cost_points === null) return res.status(400).json({ message: "This item cannot be purchased." });
            if (userProfile.inventory.virtual_items.includes(item._id)) return res.status(400).json({ message: "You already own this item." });
            if (userProfile.gamification_profile.points_balance < item.cost_points) return res.status(400).json({ message: "Insufficient points." });

            const pointsChange = -item.cost_points;
            const netWorthChange = item.value_points + pointsChange;

            userProfile.gamification_profile.points_balance += pointsChange;
            userProfile.gamification_profile.net_worth += netWorthChange;
            userProfile.inventory.virtual_items.push(item._id);
            userProfile.contribution_summary.total_virtual_items_purchased += 1;

            const purchaseEvent = new GameEvent({
                user_id: new mongoose.Types.ObjectId(userId),
                session_id,
                event_type: 'ACTION_PERFORMED',
                action_type: 'purchase_virtual_item',
                timestamp: new Date(),
                details: { itemId: item.item_id_string, cost: item.cost_points }
            });

            const transactionEvent = new GameEvent({
                user_id: new mongoose.Types.ObjectId(userId),
                session_id,
                event_type: 'POINTS_TRANSACTION',
                action_type: 'ITEM_PURCHASE',
                timestamp: new Date(),
                details: { points_change: pointsChange, reason: 'ITEM_PURCHASE', item_id_string: item.item_id_string }
            });

            await userProfile.save();
            await purchaseEvent.save();
            await transactionEvent.save();

            return res.status(200).json({
                message: `Successfully purchased '${item.name}'!`,
                data: userProfile
            });
        } catch (error: any) {
            return res.status(500).json({ message: "Server error during item purchase.", error: error.message });
        }
    }

    async logAction(req: Request, res: Response): Promise<Response> {
        const { action_type, session_id, details } = req.body;
        const userId = req.user?.id;

        if (!action_type) return res.status(400).json({ message: "action_type is required." });
        if (!userId) return res.status(401).json({ message: "User not authenticated." });

        try {
            let userProfile = await GameProfile.findOne({ main_app_user_id: userId }).exec();
            if (!userProfile) {
                 userProfile = await new GameProfile({ main_app_user_id: userId }).save();
            }

            const actionEvent = new GameEvent({
                user_id: new mongoose.Types.ObjectId(userId),
                session_id,
                event_type: 'ACTION_PERFORMED',
                action_type,
                timestamp: new Date(),
                details
            });
            await actionEvent.save();

            // --- Handle Points and Contribution Counters ---
            const pointsToAdd = actionPoints[action_type] ?? 0;
            if (pointsToAdd > 0) {
                userProfile.gamification_profile.points_balance += pointsToAdd;
                userProfile.gamification_profile.net_worth += pointsToAdd;

                 const transactionEvent = new GameEvent({
                    user_id: new mongoose.Types.ObjectId(userId),
                    session_id,
                    event_type: 'POINTS_TRANSACTION',
                    action_type: 'BASE_REWARD',
                    timestamp: new Date(),
                    details: { points_change: pointsToAdd, reason: 'ACTION_REWARD', source_action: action_type }
                });
                await transactionEvent.save();
            }

            // --- Update Contribution Summary Counters ---
            const summary = userProfile.contribution_summary;
            const summaryKey = `total_${action_type}s`;
            if (summaryKey in summary) {
                 (summary as any)[summaryKey] += 1;
            } else if (action_type === 'discover_new_station_in_black_spot') {
                summary.total_black_spot_discoveries += 1;
            } else if (action_type === 'fun_quiz_correct') {
                summary.total_quizzes_correct += 1;
            }

            // --- Handle Login Streak Logic ---
            if (action_type === 'app_login') {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const lastLogin = userProfile.engagement_metrics.last_login_date;
                if (lastLogin) {
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    if (lastLogin.getTime() === yesterday.getTime()) {
                        userProfile.engagement_metrics.current_app_login_streak += 1;
                    } else if (lastLogin.getTime() < yesterday.getTime()) {
                        userProfile.engagement_metrics.current_app_login_streak = 1;
                    }
                } else {
                    userProfile.engagement_metrics.current_app_login_streak = 1;
                }
                if (userProfile.engagement_metrics.current_app_login_streak > userProfile.engagement_metrics.longest_app_login_streak) {
                    userProfile.engagement_metrics.longest_app_login_streak = userProfile.engagement_metrics.current_app_login_streak;
                }
                userProfile.engagement_metrics.last_login_date = new Date();
            }

            await userProfile.save();
            
            // Note: Quest and Badge checking logic would go here in a real implementation
            
            return res.status(200).json({ message: "Action logged successfully", data: userProfile });

        } catch (error: any) {
            return res.status(500).json({ message: "Server error logging action.", error: error.message });
        }
    }


    // --- Virtual Item Management ---

    async createVirtualItem(req: Request, res: Response): Promise<Response> {
        try {
            const newItem = new GameVirtualItem(req.body);
            await newItem.save();
            return res.status(201).json({ message: "Virtual item created successfully", data: newItem });
        } catch (error: any) {
            return res.status(500).json({ message: "Error creating virtual item", error: error.message });
        }
    }

    async getAllVirtualItems(req: Request, res: Response): Promise<Response> {
        try {
            const items = await GameVirtualItem.find().exec();
            return res.status(200).json({ message: "All virtual items retrieved", data: items });
        } catch (error: any) {
            return res.status(500).json({ message: "Error retrieving virtual items", error: error.message });
        }
    }

    async getVirtualItemById(req: Request, res: Response): Promise<Response> {
        try {
            const { itemId } = req.params;
            const item = await GameVirtualItem.findById(itemId).exec();
            if (!item) {
                return res.status(404).json({ message: "Virtual item not found" });
            }
            return res.status(200).json({ message: "Virtual item retrieved", data: item });
        } catch (error: any) {
            return res.status(500).json({ message: "Error retrieving virtual item", error: error.message });
        }
    }

    async updateVirtualItem(req: Request, res: Response): Promise<Response> {
        try {
            const { itemId } = req.params;
            const updatedItem = await GameVirtualItem.findByIdAndUpdate(itemId, req.body, { new: true }).exec();
            if (!updatedItem) {
                return res.status(404).json({ message: "Virtual item not found" });
            }
            return res.status(200).json({ message: "Virtual item updated successfully", data: updatedItem });
        } catch (error: any) {
            return res.status(500).json({ message: "Error updating virtual item", error: error.message });
        }
    }

    async deleteVirtualItem(req: Request, res: Response): Promise<Response> {
        try {
            const { itemId } = req.params;
            const deletedItem = await GameVirtualItem.findByIdAndDelete(itemId).exec();
            if (!deletedItem) {
                return res.status(404).json({ message: "Virtual item not found" });
            }
            return res.status(200).json({ message: "Virtual item deleted successfully" });
        } catch (error: any) {
            return res.status(500).json({ message: "Error deleting virtual item", error: error.message });
        }
    }

    // --- Badge Management ---

    async createBadge(req: Request, res: Response): Promise<Response> {
        try {
            const newBadge = new GameBadge(req.body);
            await newBadge.save();
            return res.status(201).json({ message: "Badge created successfully", data: newBadge });
        } catch (error: any) {
            return res.status(500).json({ message: "Error creating badge", error: error.message });
        }
    }

    async getAllBadges(req: Request, res: Response): Promise<Response> {
        try {
            const badges = await GameBadge.find().exec();
            return res.status(200).json({ message: "All badges retrieved", data: badges });
        } catch (error: any) {
            return res.status(500).json({ message: "Error retrieving badges", error: error.message });
        }
    }

    async getBadgeById(req: Request, res: Response): Promise<Response> {
        try {
            const { badgeId } = req.params;
            const badge = await GameBadge.findById(badgeId).exec();
            if (!badge) {
                return res.status(404).json({ message: "Badge not found" });
            }
            return res.status(200).json({ message: "Badge retrieved", data: badge });
        } catch (error: any) {
            return res.status(500).json({ message: "Error retrieving badge", error: error.message });
        }
    }

    async updateBadge(req: Request, res: Response): Promise<Response> {
        try {
            const { badgeId } = req.params;
            const updatedBadge = await GameBadge.findByIdAndUpdate(badgeId, req.body, { new: true }).exec();
            if (!updatedBadge) {
                return res.status(404).json({ message: "Badge not found" });
            }
            return res.status(200).json({ message: "Badge updated successfully", data: updatedBadge });
        } catch (error: any) {
            return res.status(500).json({ message: "Error updating badge", error: error.message });
        }
    }

    async deleteBadge(req: Request, res: Response): Promise<Response> {
        try {
            const { badgeId } = req.params;
            const deletedBadge = await GameBadge.findByIdAndDelete(badgeId).exec();
            if (!deletedBadge) {
                return res.status(404).json({ message: "Badge not found" });
            }
            return res.status(200).json({ message: "Badge deleted successfully" });
        } catch (error: any) {
            return res.status(500).json({ message: "Error deleting badge", error: error.message });
        }
    }
}

