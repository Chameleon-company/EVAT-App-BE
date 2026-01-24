import { Request, Response } from "express";
import PredictService from "../services/predict-service";

export default class PredictController {
    constructor(private readonly predictService: PredictService) { }

    /**
       * Gets the congestion level for one or more chargers
       * 
       * @param req Request object containing an array of charger ID strings
       * @param res Response object used to send back the HTTP response
       * @returns Returns the status code, a relevant message, and the data if the request was successful
       * */
    async getCongestionLevels(req: Request, res: Response): Promise<Response> {
        try {
            const chargerIDs = req.body.stationIds;
            if (typeof (chargerIDs) == "object") { // input needs to be an object
                if (chargerIDs.length >= 1) { // At least 1 ID needed

                    const result = await this.predictService.getCongestionLevels(chargerIDs);
                    return res.status(200).json({
                        message: "Successfully received congestion levels",
                        data: result
                    });
                }
                return res.status(400).json({ message: "Insufficient number of charger IDs given. Minimum is 1" });
            }
            return res.status(400).json({ message: "Request parameter must be a string array" });

        }
        catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    /**
       * Deletes the congestion level for a charger
       * 
       * @param req Request object containing the query parameter for an ID
       * @param res Response object used to send back the HTTP response
       * @returns Returns the status code, a relevant message
       * */
    async deleteCongestionLevel(req: Request, res: Response): Promise<Response> {
        try {
            const chargerID = req.query.id;
            if (typeof (chargerID) === "string") {

                const result = await this.predictService.deleteCongestionLevel(chargerID);

                if (result == false) {
                    return res.status(500).json({ message: "Unknown error occurred, does this ID exist?" });
                } else {
                    return res.status(201).json({ message: "Congestion level deleted successfully" });
                }
            } else {
                return res.status(400).json({ message: "ID parameter must be a string" });
            }

        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    /**
       * Adds or updates the congestion level for a charger
       * 
       * @param req Request object containing the query parameter for an ID and congestion level
       * @param res Response object used to send back the HTTP response
       * @returns Returns the status code, a relevant message
       * */
    async putCongestionLevel(req: Request, res: Response): Promise<Response> {
        try {
            const chargerID = req.query.id;
            const level = req.query.level;
            if (typeof (chargerID) === "string") {
                if ((level == "low") || (level == "medium") || (level == "high")) {

                    const result = await this.predictService.putCongestionLevel(chargerID, level);

                    if (result == false) {
                        return res.status(500).json({ message: "Unknown error occurred" });
                    } else {
                        return res.status(201).json({ message: "Congestion level updated successfully" });
                    }
                } else {
                    return res.status(400).json({ message: "Level must be 'low', 'medium', or 'high'" });
                }
            } else {
                return res.status(400).json({ message: "ID parameter must be a string" });
            }

        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    /**
       * Adds or updates the congestion level for a charger
       * 
       * @param req Request object containing the query parameter for an ID and congestion level
       * @param res Response object used to send back the HTTP response
       * @returns Returns the status code, a relevant message
       * */
    async postCongestionLevelsBatch(req: Request, res: Response): Promise<Response> {
        try {
            const levels = req.body.predictions;
            for (let i = 0; i < levels.length; i++) {
                if (typeof (levels[i].station_id) != "string") {
                    return res.status(400).json({ message: "ID must be a string for " + i });
                }
                if ((levels[i].congestion_level == "low") || (levels[i].congestion_level == "medium") || (levels[i].congestion_level == "high")) {
                    break;
                } else {
                    return res.status(400).json({ message: "Level must be 'low', 'medium', or 'high' for " + i });
                }
            }

            const result = await this.predictService.postCongestionLevelsBatch(levels);
            if (result == false) {
                return res.status(500).json({ message: "Unknown error occurred" });
            } else {
                return res.status(201).json({ message: "Congestion level updated successfully" });
            }

        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }
}