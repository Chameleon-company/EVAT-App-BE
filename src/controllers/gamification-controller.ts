import { Request, Response } from "express";
import { GameProfile, GameVirtualItem, GameEvent, IGameVirtualItem } from "../models/game-model";
import mongoose from "mongoose";

// A simple points map for base rewards. In a real system, this might come from a database.
const BASE_REWARD_MAP: { [key: string]: number } = {
    check_in: 10,
    report_fault: 50,
    validate_ai_prediction: 75,
    discover_new_station_in_black_spot: 1000,
    use_route_planner: 5, // Base reward for just planning
    ask_chatbot_question: 5,
    fun_quiz_correct: 15,
    upload_photo: 20,
};


export default class GamificationController {
  constructor() {}

  // --- CRUD for Virtual Items ---

  async createVirtualItem(req: Request, res: Response): Promise<Response> {
    try {
      const itemData: IGameVirtualItem = req.body;
      if (!itemData.item_id_string || !itemData.name || !itemData.item_type || !itemData.value_points) {
        return res.status(400).json({ message: "Missing required fields for virtual item." });
      }
      const existingItem = await GameVirtualItem.findOne({ item_id_string: itemData.item_id_string });
      if (existingItem) {
        return res.status(409).json({ message: `An item with item_id_string '${itemData.item_id_string}' already exists.` });
      }
      const newItem = await GameVirtualItem.create(itemData);
      return res.status(201).json({ message: "Virtual item created successfully", data: newItem });
    } catch (error: any) {
      return res.status(500).json({ message: "Server error creating virtual item", error: error.message });
    }
  }

  async getAllVirtualItems(req: Request, res: Response): Promise<Response> {
    try {
        const items = await GameVirtualItem.find({});
        return res.status(200).json({ message: "All virtual items retrieved successfully", data: items });
    } catch (error: any) {
        return res.status(500).json({ message: "Server error fetching all virtual items", error: error.message });
    }
  }
  
  async getVirtualItemById(req: Request, res: Response): Promise<Response> {
    try {
        const { itemId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({ message: "Invalid item ID format." });
        }
        const item = await GameVirtualItem.findById(itemId);
        if (!item) {
            return res.status(404).json({ message: "Virtual item not found." });
        }
        return res.status(200).json({ message: "Virtual item retrieved successfully", data: item });
    } catch (error: any) {
        return res.status(500).json({ message: "Server error fetching virtual item", error: error.message });
    }
  }

  async updateVirtualItem(req: Request, res: Response): Promise<Response> {
    try {
      const { itemId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(itemId)) {
        return res.status(400).json({ message: "Invalid item ID format." });
      }
      const updatedItem = await GameVirtualItem.findByIdAndUpdate(itemId, req.body, { new: true });
      if (!updatedItem) {
        return res.status(404).json({ message: "Virtual item not found." });
      }
      return res.status(200).json({ message: "Virtual item updated successfully", data: updatedItem });
    } catch (error: any) {
      return res.status(500).json({ message: "Server error updating virtual item", error: error.message });
    }
  }

  async deleteVirtualItem(req: Request, res: Response): Promise<Response> {
    try {
      const { itemId } = req.params;
       if (!mongoose.Types.ObjectId.isValid(itemId)) {
        return res.status(400).json({ message: "Invalid item ID format." });
      }
      const deletedItem = await GameVirtualItem.findByIdAndDelete(itemId);
      if (!deletedItem) {
        return res.status(404).json({ message: "Virtual item not found." });
      }
      return res.status(200).json({ message: "Virtual item deleted successfully" });
    } catch (error: any) {
      return res.status(500).json({ message: "Server error deleting virtual item", error: error.message });
    }
  }

  // --- User-Facing Methods ---

  async getVirtualItems(req: Request, res: Response): Promise<Response> {
    try {
      const items = await GameVirtualItem.find({ cost_points: { $ne: null } }).exec();
      return res.status(200).json({ message: "Virtual items retrieved successfully", data: items });
    } catch (error: any) {
      return res.status(500).json({ message: "Server error while fetching virtual items", error: error.message });
    }
  }

  async purchaseVirtualItem(req: Request, res: Response): Promise<Response> {
    const { itemId, session_id } = req.body;
    const userId = req.user?.id;

    if (!itemId || !session_id) {
      return res.status(400).json({ message: "itemId and session_id are required." });
    }
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated." });
    }

    try {
      const item = await GameVirtualItem.findOne({ item_id_string: itemId }).exec();
      let userProfile = await GameProfile.findOne({ main_app_user_id: userId }).exec();

      if (!item) return res.status(404).json({ message: `Item with ID '${itemId}' not found.` });
      if (!userProfile) return res.status(404).json({ message: `Game profile for user '${userId}' not found.` });
      if (item.cost_points === null) return res.status(400).json({ message: "This item cannot be purchased." });
      if (userProfile.inventory.virtual_items.some(ownedItem => ownedItem.equals(item._id))) {
        return res.status(400).json({ message: "You already own this item." });
      }
      if (userProfile.gamification_profile.points_balance < item.cost_points) {
        return res.status(400).json({ message: "Insufficient points." });
      }

      userProfile.gamification_profile.points_balance -= item.cost_points;
      userProfile.gamification_profile.net_worth += item.value_points;
      userProfile.inventory.virtual_items.push(item._id);
      userProfile.contribution_summary.total_virtual_items_purchased += 1;
      
      const eventLog = new GameEvent({
        user_id: new mongoose.Types.ObjectId(userId),
        session_id: session_id,
        event_type: 'POINTS_TRANSACTION',
        details: {
            points_change: -item.cost_points,
            reason: 'ITEM_PURCHASE',
            item_id_string: item.item_id_string,
        }
      });
      
      await userProfile.save();
      await eventLog.save();

      return res.status(200).json({
        message: `Successfully purchased '${item.name}'!`,
        data: { new_balance: userProfile.gamification_profile.points_balance }
      });

    } catch (error: any) {
      return res.status(500).json({ message: "Server error during item purchase.", error: error.message });
    }
  }

  async logAction(req: Request, res: Response): Promise<Response> {
     const { action_type, session_id, details } = req.body;
     const userId = req.user?.id;

     if (!action_type || !session_id) {
        return res.status(400).json({ message: "action_type and session_id are required." });
     }
     if (!userId) {
        return res.status(401).json({ message: "User not authenticated." });
     }

     try {
        let userProfile = await GameProfile.findOne({ main_app_user_id: userId });
        if (!userProfile) {
            userProfile = await GameProfile.create({ main_app_user_id: userId });
        }

        await GameEvent.create({
            user_id: new mongoose.Types.ObjectId(userId),
            session_id,
            event_type: 'ACTION_PERFORMED',
            action_type,
            details,
        });

        // Update contribution summary
        const summaryField = `total_${action_type}s`;
        if (summaryField in userProfile.contribution_summary) {
            (userProfile.contribution_summary as any)[summaryField] += 1;
        }

        // Handle points for base actions
        const pointsToAdd = BASE_REWARD_MAP[action_type] || 0;
        if (pointsToAdd > 0) {
            userProfile.gamification_profile.points_balance += pointsToAdd;
            userProfile.gamification_profile.net_worth += pointsToAdd;
        }
        
        // Handle login streak logic
        if (action_type === 'app_login') {
            const today = new Date();
            const lastLogin = userProfile.engagement_metrics.last_login_date;
            today.setHours(0, 0, 0, 0);

            if (lastLogin) {
                lastLogin.setHours(0, 0, 0, 0);
                const diffTime = today.getTime() - lastLogin.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) {
                    userProfile.engagement_metrics.current_app_login_streak += 1;
                } else if (diffDays > 1) {
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
        
        // TODO: Add calls to helper functions to check for quest and badge completion
        // await this._checkAndProcessQuests(userProfile, action_type);
        // await this._checkAndAwardBadges(userProfile);

        return res.status(200).json({ message: "Action logged successfully", data: userProfile });

     } catch (error: any) {
        return res.status(500).json({ message: "Server error logging action.", error: error.message });
     }
  }
}

