import PersonalisedEVInsights, {
  IPersonalisedEVInsights,
} from "../models/personalisedEVInsightsModel";

export interface PersonalisedEVInsightsPayload {
  weekly_km: number;
  trip_length: string;
  driving_frequency: string;
  driving_type: string;
  road_trips: string;
  car_ownership: string;
  fuel_efficiency: number;
  monthly_fuel_spend: number;
  home_charging: string;
  solar_panels: string;
  charging_preference: string;
  budget: string;
  priorities: string;
  postcode: string;
}

interface ProcessedInsightData {
  cluster: number;
  profileType: string;
  description: string;
  similarDriverAverages: {
    weekly_km: number;
    fuel_efficiency: number;
    monthly_fuel_spend: number;
  };
  comparison: {
    weekly_km_difference: number;
    fuel_efficiency_difference: number;
    monthly_fuel_spend_difference: number;
  };
}

export default class PersonalisedEVInsightsRepository {
  static async createInsight(
    userId: string,
    email: string,
    payload: PersonalisedEVInsightsPayload
  ): Promise<IPersonalisedEVInsights> {
    try {
      const insight = await PersonalisedEVInsights.create({
        userId,
        email,
        ...payload,
        cluster: null,
      });

      return insight;
    } catch (error: any) {
      if (error instanceof Error) {
        throw new Error(
          "Error saving personalised EV insight: " + error.message
        );
      }
      throw new Error(
        "An unknown error occurred while saving personalised EV insight"
      );
    }
  }

  static async updateInsightWithResult(
    insightId: string,
    result: ProcessedInsightData
  ): Promise<IPersonalisedEVInsights | null> {
    try {
      return await PersonalisedEVInsights.findByIdAndUpdate(
        insightId,
        {
          $set: {
            cluster: result.cluster,
            profileType: result.profileType,
            description: result.description,
            similarDriverAverages: result.similarDriverAverages,
            comparison: result.comparison,
          },
        },
        { new: true }
      ).exec();
    } catch (error: any) {
      if (error instanceof Error) {
        throw new Error(
          "Error updating personalised EV insight result: " + error.message
        );
      }
      throw new Error(
        "An unknown error occurred while updating personalised EV insight result"
      );
    }
  }

  static async getLatestInsightByUserId(
    userId: string
  ): Promise<IPersonalisedEVInsights | null> {
    try {
      const insight = await PersonalisedEVInsights.findOne({ userId })
        .sort({ createdAt: -1 })
        .exec();

      return insight;
    } catch (error: any) {
      if (error instanceof Error) {
        throw new Error(
          "Error retrieving personalised EV insight: " + error.message
        );
      }
      throw new Error(
        "An unknown error occurred while retrieving personalised EV insight"
      );
    }
  }
}