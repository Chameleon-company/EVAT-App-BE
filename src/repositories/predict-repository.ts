import Congestion, { ICongestion } from "../models/congestion-model";
import { FilterQuery, UpdateQuery } from "mongoose";

class PredictRepository {
    /**
   * Get congestion levels for each station ID provided
   * 
   * @param stationIDs array of station IDs
   * @returns Object containing station IDs and their congestion levels
   */
  async getCongestionByIDs(
    stationIDs: string[]
  ): Promise<{ congestionLevels: ICongestion[]; }> {
    
    const congestionLevels = await
      Congestion.find({ $in: stationIDs})
        .exec();

    return {
      congestionLevels
    };
  }
}

export default new PredictRepository();