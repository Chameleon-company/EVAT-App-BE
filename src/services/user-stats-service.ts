import userStatsRepository from "../repositories/user-stats-repository";
import { IUserStats } from "../models/user-stats-model";

// This service handles all the achievement system items
// It is the place to put calculations and derived values (like "1 year since joining")
// Extend as needed

export class UserStatsService {

  /**
   * Get current stats for a user
   * 
   * @param userId String: a specific users ID
   * @returns UserStats: Returns the specified users stats
   */
  async getStats(userId: string): Promise<IUserStats | null> {
    return userStatsRepository.findByUserId(userId);
  }

  /**
   * Ensure user stats document exists
   * Call this on user registration or first activity
   * 
   * @param userId String: a specific users ID
   * @returns UserStats: Returns the specified users stats
   */
  async initializeStats(userId: string): Promise<IUserStats> {
    return userStatsRepository.upsertUserStats(userId);
  }

  // ====================== CHARGING RELATED ======================

  /**
   * Record a completed charging session
   * ====== This is to mimick a charging session                            ======
   * ====== Needs proper implementation when sessions are added             ======
   * 
   * @param userId String: a specific users ID
   * @param data Dictionary: the data that is being changed during a charge
   * @returns UserStats: Returns the specified users stats
   */
  async recordChargingSession(
    userId: string,
    data: {
      chargeTimeSeconds: number;    // required
      whCharged: number;            // required
      metresTravelled?: number;
      chargingCostCents?: number;
    }
  ): Promise<IUserStats | null> {
    // create update data
    const updates: any = {
      totalChargeTimeSeconds: data.chargeTimeSeconds,
      totalWhCharged: data.whCharged,
      totalChargingSessions: 1,
    };
    // if distance travelled is provided
    if (data.metresTravelled) {
      updates.totalMetresTravelled = data.metresTravelled;
    }
    // if charging cost is provided
    if (data.chargingCostCents) {
      updates.totalChargingCostsCents = data.chargingCostCents;
    }

    // You can add derived calculations here (CO2, petrol savings, etc.)
    // Example:
    // updates.totalCO2KgAvoided = Math.round(data.whCharged * 0.0005); // rough factor
    // updates.totalPetrolSavingsCents = Math.round(data.whCharged * 0.015);

    return userStatsRepository.incrementCounters(userId, updates);
  }

  // ====================== LOGIN & STREAKS ======================

  /**
   * Record a user login + handle login streaks
   * 
   * @param userId String: a specific users ID
   * @returns UserStats: Returns the specified users stats
   */
  async recordLogin(userId: string): Promise<IUserStats | null> {
    // TODO: You will need lastLoginDate logic (add it later to the model if needed)
    // simple version - add 1 to both login days and consecutive days
    return userStatsRepository.incrementCounters(userId, {
      totalLoginDays: 1,
      consecutiveLoginDays: 1,
    });
  }

  // ====================== PROFILE & ONBOARDING ======================

  /**
   * Sets one time flags to true to specific stats
   * 
   * @param userId String: a specific users ID
   * @returns UserStats: Returns the specified users stats
   */
  async markProfilePicSet(userId: string): Promise<IUserStats | null> {
    return userStatsRepository.setFlags(userId, { setProfilePic: true });
  }

  async markProfileVehicleSet(userId: string): Promise<IUserStats | null> {
    return userStatsRepository.setFlags(userId, { setProfileVehicle: true });
  }

  async markFavouriteChargeSaved(userId: string): Promise<IUserStats | null> {
    return userStatsRepository.setFlags(userId, { saveFavouriteCharge: true });
  }

  // ====================== REVIEWS & SOCIAL ======================

  /**
   * Adds increment values to specific stats
   * 
   * @param userId String: a specific users ID
   * @returns UserStats: Returns the specified users stats
   */
  async recordReviewWritten(userId: string): Promise<IUserStats | null> {
    return userStatsRepository.incrementCounters(userId, {
      totalReviewsWritten: 1,
    });
  }

  async recordRatingGiven(userId: string): Promise<IUserStats | null> {
    return userStatsRepository.incrementCounters(userId, {
      totalRatingsGiven: 1,
    });
  }

  // TESTING HELPERS - resets stats
  async resetAllStats(userId: string): Promise<IUserStats | null> {
    return userStatsRepository.resetAll(userId);
  }

  async resetCounter(userId: string, counterName: keyof IUserStats["counters"]) {
    return userStatsRepository.resetCounter(userId, counterName);
  }

  async resetFlag(userId: string, flagName: keyof IUserStats["flags"]) {
    return userStatsRepository.resetFlag(userId, flagName);
  }
}

export default new UserStatsService();