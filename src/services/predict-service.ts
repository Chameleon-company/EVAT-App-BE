import PredictRepository from "../repositories/predict-repository";
import Congestion, { ICongestion } from "../models/congestion-model";


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

            for (let i = 0; i < chargerIDs.length; i++) {
                if (!result.congestionLevels.some(
                    (level) => level.chargerId === chargerIDs[i]
                )) {
                    // Create a new entry for any unknown stations
                    const newCongestion = new Congestion({
                        chargerId: chargerIDs[i],
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
}