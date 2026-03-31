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