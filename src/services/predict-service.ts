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
    /**
 * Get suitability score for a specific SA2 area by name
 * 
 * @param sa2Name Name of the SA2 area
 * @returns Suitability profile for the area
 */
async getSiteSuitabilityByArea(sa2Name: string): Promise<object> {
    try {
        const response = await fetch(
            `http://localhost:5001/suitability/area/${sa2Name}`
        );
        if (!response.ok) {
            throw new Error(`Site suitability service error: ${response.status}`);
        }
        return await response.json();
    } catch (error: any) {
        if (error instanceof Error) {
            throw new Error("Error retrieving site suitability: " + error.message);
        } else {
            throw new Error("An unknown error occurred while retrieving site suitability");
        }
    }
}

/**
 * Get top N most suitable sites for EV charger installation
 * 
 * @param n Number of top sites to return (default 10)
 * @returns List of top ranked SA2 areas by suitability score
 */
async getTopSuitableSites(n: number = 10): Promise<object> {
    try {
        const response = await fetch(
            `http://localhost:5001/suitability/top?n=${n}`
        );
        if (!response.ok) {
            throw new Error(`Site suitability service error: ${response.status}`);
        }
        return await response.json();
    } catch (error: any) {
        if (error instanceof Error) {
            throw new Error("Error retrieving top sites: " + error.message);
        } else {
            throw new Error("An unknown error occurred while retrieving top sites");
        }
    }
}

/**
 * Get suitability score for the nearest SA2 area by coordinates
 * 
 * @param lat Latitude of the location
 * @param lng Longitude of the location
 * @returns Suitability profile of the nearest SA2 area
 */
async getSiteSuitabilityByCoords(lat: number, lng: number): Promise<object> {
    try {
        const response = await fetch(
            `http://localhost:5001/suitability/coords?lat=${lat}&lng=${lng}`
        );
        if (!response.ok) {
            throw new Error(`Site suitability service error: ${response.status}`);
        }
        return await response.json();
    } catch (error: any) {
        if (error instanceof Error) {
            throw new Error("Error retrieving site suitability by coords: " + error.message);
        } else {
            throw new Error("An unknown error occurred while retrieving site suitability by coords");
        }
    }
}

}