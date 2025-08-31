import { Request, Response } from "express";
import { GameProfile, GameVirtualItem, GameEvent, GameQuest, GameBadge } from "../models/game-model";
import mongoose from "mongoose";

// In-memory cache to reduce database lookups for static data like quests and badges
let questsCache: any[] = [];
let badgesCache: any[] = [];
let lastCacheUpdateTime = 0;

async function updateCache() {
    // Refresh cache every 5 minutes (300000 ms) if needed
    if (Date.now() - lastCacheUpdateTime > 300000) {
        try {
            questsCache = await GameQuest.find({ status: 'ACTIVE' }).lean().exec();
            badgesCache = await GameBadge.find().lean().exec();
            lastCacheUpdateTime = Date.now();
            console.log("Gamification cache updated successfully.");
        } catch (error) {
            console.error("Failed to update gamification cache:", error);
        }
    }
}

// Points mapping for base rewards from actions
const actionPoints: { [key: string]: number } = {
    check_in: 10,
    upload_photo: 20, // Assuming a point value
    report_fault: 50,
    validate_ai_prediction: 75,
    discover_new_station_in_black_spot: 1000,
    // Note: Other actions get points via quests, not base rewards
};

export default class GamificationController {

  constructor() {
    updateCache(); // Initial cache load on server start
  }

  /**
   * CORE ENDPOINT: Logs a user action and triggers the entire gamification engine.
   */
  async logAction(req: Request, res: Response): Promise<Response> {
    const { action_type, details, session_id } = req.body;
    const userId = req.user?.id;

    if (!userId || !action_type) {
      return res.status(400).json({ message: "userId and action_type are required." });
    }

    try {
      await updateCache(); // Ensure cache is reasonably fresh

      let userProfile = await GameProfile.findOne({ main_app_user_id: userId });
      if (!userProfile) {
        userProfile = await new GameProfile({ main_app_user_id: userId }).save();
      }

      // Log the initial action event
      new GameEvent({
          user_id: new mongoose.Types.ObjectId(userId),
          session_id,
          event_type: "ACTION_PERFORMED",
          action_type: action_type,
          details: details || {}
      }).save();

      // --- 1. Update Profile Counters & Metrics ---
      this.updateProfileCounters(userProfile, action_type);
      
      // --- 2. Grant Base Points for the action ---
      const pointsGranted = actionPoints[action_type] || 0;
      if (pointsGranted > 0) {
        userProfile.gamification_profile.points_balance += pointsGranted;
        userProfile.gamification_profile.net_worth += pointsGranted;
      }
      
      // --- 3. Check for Quest & Badge Completion ---
      await this.checkQuestsAndBadges(userProfile, action_type, session_id);

      await userProfile.save();
      
      return res.status(200).json({
          message: `Action '${action_type}' logged successfully.`,
          data: userProfile
      });

    } catch (error: any) {
        console.error(`Error logging action for user ${userId}:`, error);
        return res.status(500).json({ message: "Server error during action logging.", error: error.message });
    }
  }

  // GET User's full Game Profile
  async getGameProfile(req: Request, res: Response): Promise<Response> {
      const userId = req.user?.id;
      try {
          const profile = await GameProfile.findOne({ main_app_user_id: userId })
              .populate('inventory.virtual_items')
              .populate('inventory.badges_earned')
              .populate('active_quests')
              .exec();

          if (!profile) {
              const newProfile = await new GameProfile({ main_app_user_id: userId }).save();
              return res.status(200).json({ message: "New profile created and retrieved", data: newProfile });
          }
          return res.status(200).json({ message: "Profile retrieved", data: profile });
      } catch (error: any) {
          return res.status(500).json({ message: "Server error retrieving profile.", error: error.message });
      }
  }
  
  async getQuests(req: Request, res: Response): Promise<Response> {
    await updateCache();
    return res.status(200).json({ message: "Quests retrieved", data: questsCache });
  }

  async getBadges(req: Request, res: Response): Promise<Response> {
    await updateCache();
    return res.status(200).json({ message: "Badges retrieved", data: badgesCache });
  }

  async getVirtualItems(req: Request, res: Response): Promise<Response> {
      try {
        const items = await GameVirtualItem.find({ cost_points: { $ne: null } }).exec();
        return res.status(200).json({ data: items });
      } catch (error: any) {
        return res.status(500).json({ message: "Server error fetching items", error: error.message });
      }
  }

  async purchaseVirtualItem(req: Request, res: Response): Promise<Response> {
    const { itemId, session_id } = req.body;
    const userId = req.user?.id;

    if (!itemId || !userId) return res.status(400).json({ message: "itemId and userId are required."});
    
    try {
        const item = await GameVirtualItem.findOne({ item_id_string: itemId });
        let userProfile = await GameProfile.findOne({ main_app_user_id: userId });

        if(!userProfile) userProfile = await new GameProfile({ main_app_user_id: userId }).save();
        if(!item) return res.status(404).json({ message: "Item not found." });
        if(item.cost_points === null) return res.status(400).json({ message: "This item cannot be purchased." });
        
        const ownedItemIds = userProfile.inventory.virtual_items.map(id => id.toString());
        if (ownedItemIds.includes(item._id.toString())) {
            return res.status(400).json({ message: "You already own this item." });
        }
        if(userProfile.gamification_profile.points_balance < item.cost_points) {
            return res.status(400).json({ message: "Insufficient points." });
        }
        
        // Transaction logic as per your example
        userProfile.gamification_profile.points_balance -= item.cost_points;
        userProfile.gamification_profile.net_worth += (item.value_points - item.cost_points);
        userProfile.inventory.virtual_items.push(item._id);
        userProfile.contribution_summary.total_virtual_items_purchased += 1;

        await userProfile.save();
        new GameEvent({ user_id: new mongoose.Types.ObjectId(userId), session_id, event_type: "POINTS_TRANSACTION", details: { points_change: -item.cost_points, reason: "ITEM_PURCHASE", item_id_string: item.item_id_string }}).save();

        return res.status(200).json({ message: "Purchase successful", data: userProfile });

    } catch(e: any) {
        return res.status(500).json({ message: "Server error during purchase.", error: e.message })
    }
  }

  private updateProfileCounters(profile: any, action: string) {
      const summary = profile.contribution_summary;
      if (action === 'app_login') {
          const today = new Date(); today.setUTCHours(0, 0, 0, 0);
          const lastLogin = profile.engagement_metrics.last_login_date ? new Date(profile.engagement_metrics.last_login_date) : null;
          if (lastLogin) lastLogin.setUTCHours(0, 0, 0, 0);

          if (!lastLogin || today.getTime() > lastLogin.getTime()) {
              const yesterday = new Date(today); yesterday.setUTCDate(today.getUTCDate() - 1);
              if (lastLogin && lastLogin.getTime() === yesterday.getTime()) {
                  profile.engagement_metrics.current_app_login_streak += 1;
              } else {
                  profile.engagement_metrics.current_app_login_streak = 1;
              }
              if (profile.engagement_metrics.current_app_login_streak > profile.engagement_metrics.longest_app_login_streak) {
                  profile.engagement_metrics.longest_app_login_streak = profile.engagement_metrics.current_app_login_streak;
              }
              profile.engagement_metrics.last_login_date = new Date();
          }
      }
      
      const counterMap: {[key:string]: string } = { 'check_in': 'total_check_ins', 'report_fault': 'total_fault_reports', 'validate_ai_prediction': 'total_ai_validations', 'discover_new_station_in_black_spot': 'total_black_spot_discoveries', 'use_route_planner': 'total_route_plans', 'ask_chatbot_question': 'total_chatbot_questions', 'fun_quiz_correct': 'total_quizzes_correct', 'redeem_easter_egg': 'total_easter_eggs_redeemed' };
      if (counterMap[action]) summary[counterMap[action]] += 1;
  }
  
  private async checkQuestsAndBadges(profile: any, actionType: string, sessionId?: string) {
    const userId = profile.main_app_user_id;
    const earnedBadgeIds = profile.inventory.badges_earned.map((b: any) => b.toString());

    for (const badge of badgesCache) {
        if (earnedBadgeIds.includes(badge._id.toString())) continue;
        const criteria = badge.criteria;
        let isEarned = false;
        if (criteria.source && profile[criteria.source][criteria.field] >= criteria.value) {
            isEarned = true;
        } else if (criteria.action_type === actionType) {
            isEarned = true;
        }
        if(isEarned) profile.inventory.badges_earned.push(badge._id);
    }

    for (const quest of questsCache) {
        // TODO: This needs more robust logic for completed quests
        const criteria = quest.completion_criteria;
        let questCompleted = false;
        if (criteria.action_type === actionType) {
            questCompleted = true;
        } else if (criteria.source && profile[criteria.source][criteria.field] >= criteria.value) {
            questCompleted = true;
        }
        if(questCompleted) {
            const rewards = quest.rewards;
            if (rewards.points) {
                profile.gamification_profile.points_balance += rewards.points;
                profile.gamification_profile.net_worth += rewards.points;
                new GameEvent({ user_id: new mongoose.Types.ObjectId(userId), session_id, event_type: "POINTS_TRANSACTION", details: { points_change: rewards.points, reason: "QUEST_REWARD", quest_id_string: quest.quest_id_string }}).save();
            }
            if (rewards.badge_id) {
                const badge = badgesCache.find(b => b._id.toString() === rewards.badge_id);
                if (badge && !earnedBadgeIds.includes(badge._id.toString())) {
                    profile.inventory.badges_earned.push(badge._id);
                }
            }
        }
    }
  }
}

