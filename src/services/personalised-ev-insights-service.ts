import PersonalisedEVInsightsRepository, {
  PersonalisedEVInsightsPayload,
} from "../repositories/personalised-ev-insights-repository";
import { IPersonalisedEVInsights } from "../models/personalisedEVInsightsModel";

export default class PersonalisedEVInsightsService {
  async submitInsights(
    userId: string,
    email: string,
    payload: PersonalisedEVInsightsPayload
  ): Promise<IPersonalisedEVInsights> {
    try {
      if (!userId) {
        throw new Error("User ID is required");
      }

      if (!email) {
        throw new Error("Email is required");
      }

      this.validatePayload(payload);

      const result = await PersonalisedEVInsightsRepository.createInsight(
        userId,
        email,
        payload
      );

      return result;
    } catch (error: any) {
      if (error instanceof Error) {
        throw new Error(
          "Error saving personalised EV insights: " + error.message
        );
      }
      throw new Error(
        "An unknown error occurred while saving personalised EV insights"
      );
    }
  }

  async getLatestInsightByUserId(
    userId: string
  ): Promise<IPersonalisedEVInsights | null> {
    try {
      if (!userId) {
        throw new Error("User ID is required");
      }

      const result =
        await PersonalisedEVInsightsRepository.getLatestInsightByUserId(userId);

      return result;
    } catch (error: any) {
      if (error instanceof Error) {
        throw new Error(
          "Error retrieving personalised EV insights: " + error.message
        );
      }
      throw new Error(
        "An unknown error occurred while retrieving personalised EV insights"
      );
    }
  }

  private validatePayload(payload: PersonalisedEVInsightsPayload): void {
    const {
      weekly_km,
      trip_length,
      driving_frequency,
      driving_type,
      road_trips,
      car_ownership,
      fuel_efficiency,
      monthly_fuel_spend,
      home_charging,
      solar_panels,
      charging_preference,
      budget,
      priorities,
      postcode,
    } = payload;

    if (
      weekly_km === undefined ||
      trip_length === undefined ||
      driving_frequency === undefined ||
      driving_type === undefined ||
      road_trips === undefined ||
      car_ownership === undefined ||
      fuel_efficiency === undefined ||
      monthly_fuel_spend === undefined ||
      home_charging === undefined ||
      solar_panels === undefined ||
      charging_preference === undefined ||
      budget === undefined ||
      priorities === undefined ||
      postcode === undefined
    ) {
      throw new Error("All required fields must be provided");
    }

    if (Number(weekly_km) < 0) {
      throw new Error("Weekly km cannot be negative");
    }

    if (Number(fuel_efficiency) < 0) {
      throw new Error("Fuel efficiency cannot be negative");
    }

    if (Number(monthly_fuel_spend) < 0) {
      throw new Error("Monthly fuel spend cannot be negative");
    }
  }
}