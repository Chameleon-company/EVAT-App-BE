import Congestion, { ICongestion } from "../models/congestion-model";
import { FilterQuery, UpdateQuery, Types } from "mongoose";
import mongoose from "mongoose";
//mongoose.set('debug', true); // Add this at the top of your file

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
      Congestion.find({ $in: stationIDs })
        .exec();

    return {
      congestionLevels
    };
  }

  /**
  * Delete congestion level for a station ID provided
  * 
  * @param stationID string of station ID
  * @returns boolean success value
  */
  async deleteCongestionLevel(chargerID: string): Promise<boolean> {
    const status = await Congestion.deleteMany({
      chargerId: new mongoose.Types.ObjectId(chargerID)
    });

    return status.deletedCount > 0;
  }

  /**
  * Updates congestion level for a station ID provided
  * 
  * @param stationID string of station ID
  * @param level congestion level as a string, 'low', 'medium', 'high'
  * @returns boolean success value
  */
  async putCongestionLevel(chargerID: string, level: string): Promise<boolean> {
    const status = await Congestion.updateOne({
      chargerId: new mongoose.Types.ObjectId(chargerID)
    }, {
      congestion_level: level
    }, {
      upsert: true // Insert if entry doesn't exist
    });
    
    return status.upsertedCount + status.modifiedCount > 0;
  }
}

export default new PredictRepository();