// Process HTTP requests/responses related to charging sessions

// Import express and ChargerSessionService
import { Request, Response } from "express";
import ChargerSessionService from '../services/charger-session-service';

// ChargerSessionController Class
export default class ChargerSessionController {
  constructor(private readonly sessionService: ChargerSessionService) {}

  // /**
  //  * Handle the request to get all charging sessions with optional filtering
  //  * 
  //  * @param req request object containing optional query parameters for filtering
  //  * @param res Response object used to send back the HTTP response
  //  */
  // async getAllSessions(req: Request, res: Response): Promise<Response> {
  //   // Process filtering query parameters (e.g., userId, stationId, startTime, endTime)
  //   let { userId, stationId, status, startTime, endTime } = req.query;

  //   // Validate query parameters and convert if needed...
  //   let filters = {
  //     userId: userId ? String(userId) : undefined,
  //     stationId: stationId ? String(stationId) : undefined,
  //     status: status ? String(status) : undefined,
  //     startTime: startTime ? new Date(startTime as string) : undefined,
  //     endTime: endTime ? new Date(endTime as string) : undefined,
  //   };

  //   try {
  //     const sessions = await this.sessionService.getAllSessions(filters);
  //     return res.status(200).json({
  //       message: "Sessions retrieved successfully!",
  //       data: sessions,
  //     });
  //   } catch (error: any) {
  //     return res.status(500).json({ message: error.message });
  //   }
  // }

  /**
   * Start a new charging session
   * 
   * @param req Request object containing the session details
   * @param res Response object used to send back the HTTP response
   */
  async createSession(req: Request, res: Response): Promise<Response> {
    try {
      const { userId, stationId, startTime } = req.body;
      const session = await this.sessionService.createSession({
        userId,
        stationId,
        startTime,
      });

      return res.status(201).json({
        message: `Charging session ID ${session._id} started.`,
        data: session,
      });
    } catch (error: any) {
      return this.handleError(error, res);
    }
  }

  /**
   * End a charging session by session ID
   * 
   * @param req Request object containing the session ID
   * @param res Response object used to send back the HTTP response
   */
  async endSession(req: Request, res: Response): Promise<Response> {
    try {
      const { sessionId } = req.params;
      const session = await this.sessionService.endSession(sessionId);
      
      return res.status(200).json({
        message: `Charging session ID ${session._id} ended.`,
        data: session,
      });
    } catch (error: any) {
      return this.handleError(error, res);
    }
  }

  /**
   * Get a charging session by session ID
   * 
   * @param req Request object containing the session ID
   * @param res Response object used to send back the HTTP response
   */
  async getSessionById(req: Request, res: Response): Promise<Response> {
    try {
      const { sessionId } = req.params;
      const session = await this.sessionService.getSessionById(sessionId);

      return res.status(200).json({
        message: `Success! Session ID ${sessionId} found.`,
        data: session,
      });
    } catch (error: any) {
      return this.handleError(error, res);
    }
  }

  /**
   * Get all sessions for a specific user ID
   * 
   * @param req Request object containing the user ID
   * @param res Response object used to send back the HTTP response
   */
  async getSessionsByUser(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const sessions = await this.sessionService.getSessionsByUser(userId);

      return res.status(200).json({
        message: `User ID ${userId} sessions found.`,
        data: sessions,
      });
    } catch (error: any) {
      return this.handleError(error, res);
    }
  }

  /**
   * Get all sessions for a specific station ID
   * 
   * @param req Request object containing the station ID
   * @param res Response object used to send back the HTTP response
   */
  async getSessionsByStation(req: Request, res: Response): Promise<Response> {
    try {
      const { stationId } = req.params;
      const sessions = await this.sessionService.getSessionsByStation(stationId);

      return res.status(200).json({
        message: `Station sessions ID ${stationId} found.`,
        data: sessions,
      });
    } catch (error: any) {
      return this.handleError(error, res);
    }
  }

  /**
   * Helper for error handling based on error message
   */
  private handleError(error: any, res: Response): Response {
    const msg = error.message || 'Internal Server Error';
    if (msg.toLowerCase().includes('not found')) 
      return res.status(404).json({ message: msg });
    if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('required'))
      return res.status(400).json({ message: msg });

    return res.status(500).json({ message: msg });
  }
}
