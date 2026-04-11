import axios from "axios";
import PersonalisedEVInsightsRepository, {
  PersonalisedEVInsightsPayload,
} from "../repositories/personalised-ev-insights-repository";
import { IPersonalisedEVInsights } from "../models/personalisedEVInsightsModel";

export default class PersonalisedEVInsightsService {
  async submitInsights(
    userId: string,
    email: string,
    payload: PersonalisedEVInsightsPayload
  ): Promise<{ message: string }> {
    try {
      this.validateUser(userId, email);
      this.validatePayload(payload);

      const savedRecord = await PersonalisedEVInsightsRepository.createInsight(
        userId,
        email,
        payload
      );

      const cluster = await this.getClusterPrediction(payload);
      const processedResult = this.buildProcessedResult(payload, cluster);

      await PersonalisedEVInsightsRepository.updateInsightWithResult(
        savedRecord._id.toString(),
        processedResult
      );

      return {
        message: "Personalised EV insight generated and saved successfully",
      };
    } catch (error: any) {
      throw new Error("Error saving personalised EV insights: " + error.message);
    }
  }

  async getLatestInsightByUserId(
    userId: string
  ): Promise<IPersonalisedEVInsights | null> {
    try {
      if (!userId) {
        throw new Error("User ID is required");
      }

      return await PersonalisedEVInsightsRepository.getLatestInsightByUserId(
        userId
      );
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

  private validateUser(userId: string, email: string): void {
    if (!userId) throw new Error("User ID is required");
    if (!email) throw new Error("Email is required");
  }

  private async getClusterPrediction(
    payload: PersonalisedEVInsightsPayload
  ): Promise<number> {
    const flaskResponse = await axios.post("http://127.0.0.1:8000/predict", payload);

    if (flaskResponse.data?.cluster === undefined || flaskResponse.data?.cluster === null) {
      throw new Error("Invalid cluster response from Flask API");
    }

    return flaskResponse.data.cluster;
  }

  private buildProcessedResult(
    payload: PersonalisedEVInsightsPayload,
    cluster: number
  ) {
    const clusterInsights: Record<number, { profileType: string; description: string }> = {
      0: {
        profileType: "High-Usage Fuel Spenders",
        description:
          "Drives long distances with poor fuel efficiency, leading to high fuel costs.",
      },
      1: {
        profileType: "Regular Commuters",
        description:
          "Drives regularly with moderate efficiency and steady fuel spending.",
      },
      2: {
        profileType: "Long-Distance Travellers",
        description:
          "Drives extensively and spends heavily on fuel despite good efficiency.",
      },
      3: {
        profileType: "Low Usage Urban Drivers",
        description:
          "Drives short distances occasionally with minimal fuel costs.",
      },
    };

    const clusterAverages: Record<number, {
      weekly_km: number;
      fuel_efficiency: number;
      monthly_fuel_spend: number;
    }> = {
      0: { weekly_km: 524.18, fuel_efficiency: 2.35, monthly_fuel_spend: 105.12 },
      1: { weekly_km: 213.62, fuel_efficiency: 6.6, monthly_fuel_spend: 103.59 },
      2: { weekly_km: 525.1, fuel_efficiency: 8.4, monthly_fuel_spend: 315.07 },
      3: { weekly_km: 55.73, fuel_efficiency: 6.29, monthly_fuel_spend: 27.51 },
    };
    const allDrivers: {
      weekly_km: number;
      fuel_efficiency: number;
      monthly_fuel_spend: number;
    } = {weekly_km: 460.66, fuel_efficiency: 5.91, monthly_fuel_spend: 137.82};

    const insight = clusterInsights[cluster];
    const averages = clusterAverages[cluster];

    if (!insight || !averages) {
      throw new Error(`Unsupported cluster value: ${cluster}`);
    }

    return {
      cluster,
      profileType: insight.profileType,
      description: insight.description,
      similarDriverAverages: averages,
      allDriverAverages: allDrivers,
      comparison: {
        sim_weekly_km_difference: Number(
          (payload.weekly_km - averages.weekly_km).toFixed(2)
        ),
        sim_fuel_efficiency_difference: Number(
          (payload.fuel_efficiency - averages.fuel_efficiency).toFixed(2)
        ),
        sim_monthly_fuel_spend_difference: Number(
          (payload.monthly_fuel_spend - averages.monthly_fuel_spend).toFixed(2)
        ),
        all_weekly_km_difference: Number(
          (payload.weekly_km - allDrivers.weekly_km).toFixed(2)
        ),
        all_fuel_efficiency_difference: Number(
          (payload.fuel_efficiency - allDrivers.fuel_efficiency).toFixed(2)
        ),
        all_monthly_fuel_spend_difference: Number(
          (payload.monthly_fuel_spend - allDrivers.monthly_fuel_spend).toFixed(2)
        ),
      },
    };
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