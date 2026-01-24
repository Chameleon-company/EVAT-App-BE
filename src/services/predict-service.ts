import PredictRepository from "../repositories/predict-repository";
import Congestion, { ICongestion } from "../models/congestion-model";
import mongoose from "mongoose";


export default class PredictService {
    /**
 * Get a congestion levels for multiple chargers
 * 
 * @param chargerIDs Array of one or more charger ID strings
 * @returns Object containing charger ID's and their respective congestion levels
 */
    async getCongestionLevels(
        chargerIDs: string[]
    ): Promise<{
        congestionLevels: ICongestion[];
    }> {
        try {
            if (chargerIDs.length < 1) {
                throw new Error("Array must contain at least one station ID")
            }
            let result = await PredictRepository.getCongestionByIDs(chargerIDs);

            // Filter to only keep entries that match the requested chargerIDs
            result.congestionLevels = result.congestionLevels.filter(
                (level) => chargerIDs.includes(level.chargerId.toString())
            );

            // Add entries for any requested chargerIDs that weren't found
            for (let i = 0; i < chargerIDs.length; i++) {
                if (!result.congestionLevels.some(
                    (level) => level.chargerId.toString() === chargerIDs[i]
                )) {
                    const newCongestion = new Congestion({
                        chargerId: new mongoose.Types.ObjectId(chargerIDs[i]),
                        congestion_level: "unknown"
                    });
                    result.congestionLevels.push(newCongestion);
                }
            }
            return result

        }
        catch (error: any) {
            if (error instanceof Error) {
                throw new Error("Error retrieving congestion levels: " + error.message);
            } else {
                throw new Error("An unknown error occurred while retrieving congestion levels");
            }
        }
    }

    /**
     * Deletes a congestion level for a chargers
     * 
     * @param chargerID Array of one or more charger ID strings
     * @returns boolean containing true for success or false for failure
     */
    async deleteCongestionLevel(chargerID: string
    ): Promise<boolean> {
        try {
            let result = await PredictRepository.deleteCongestionLevel(chargerID);
            return result;
        } catch (error: any) {
            if (error instanceof Error) {
                throw new Error("Error retrieving congestion levels: " + error.message);
            } else {
                throw new Error("An unknown error occurred while retrieving congestion levels");
            }
        }
    }

    /**
     * Updates a congestion level for a chargers
     * 
     * @param chargerID Array of one or more charger ID strings
     * @param level String of either 'low', 'medium', 'high'
     * @returns boolean containing true for success or false for failure
     */
    async putCongestionLevel(chargerID: string, level: string
    ): Promise<boolean> {
        try {
            let result = await PredictRepository.putCongestionLevel(chargerID, level);
            return result;
        } catch (error: any) {
            if (error instanceof Error) {
                throw new Error("Error updating congestion levels: " + error.message);
            } else {
                throw new Error("An unknown error occurred while updating congestion levels");
            }
        }
    }

    /**
     * updates a congestion levels for multiple chargers
     * 
     * @param level Array of dictionaries with a charger_id and level
     * @returns boolean containing true for success or false for failure
     */
    async postCongestionLevelsBatch(levels: Array<object>
    ): Promise<boolean> {
        try {
            let result = await PredictRepository.postCongestionLevelsBatch(levels);
            return result;
        } catch (error: any) {
            if (error instanceof Error) {
                throw new Error("Error updating congestion levels: " + error.message);
            } else {
                throw new Error("An unknown error occurred while updating congestion levels");
            }
        }
    }

}