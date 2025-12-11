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

}