import e, { Request, Response } from "express";
import UserService from "../services/user-service";
import { UserItemResponse } from "../dtos/user-item-response";
import jwt from "jsonwebtoken";
import generateToken from "../utils/generate-token";

interface JwtPayload {
    id: string;
    email?: string;
    role?: string;
    admin?: boolean;
}

export default class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Registers a new user
   * 
   * @param req Request object containing a full name, email and password
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data object of the user if the request was successful
   */
  async register(req: Request, res: Response): Promise<Response> {
    const { email, password, fullName } = req.body;

    try {
      const user = await this.userService.register(email, password, fullName);
      return res
        .status(201)
        .json({ message: "User registered successfully", data: user });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

    /**
     * Function to be called to see if the user's access/refresh tokens are still valid
     *
     * @param req Request object containing the authorization header with the JWT
     * @param res Response object used to send back the HTTP response
     * @returns Returns the status code which will be used to deny or allow the user to skip the login screen
     */
    async jwtLogin(req: Request, res: Response): Promise<Response> {

        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(401).json({ message: "No token provided" });
            }

            if (!process.env.JWT_SECRET) {
                throw new Error("JWT_SECRET is not set in environment variables");
            }

            const token = authHeader.split(" ")[1];

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
                const user = await this.userService.getUserById(decoded.id);
                if (!user) {
                    return res.status(404).json({ message: "User not found" });
                }

                // Update last login
                //user.lastLogin = new Date();
                await user.save();

                return res.status(200).json({
                    message: "Automatic Login Successful",
                    data: {
                        user,
                        accessToken: token, // same one, still valid
                    },
                });
            } catch (err) {

                const decoded = jwt.decode(token) as JwtPayload;
                if (!decoded?.id) {
                    return res.status(401).json({ message: "Invalid token" });
                }

                const user = await this.userService.getUserById(decoded.id);
                if (!user || !user.refreshTokenExpiresAt) {
                    return res.status(404).json({ message: "User or refresh token not found" });
                }

                const nowUnix = Math.floor(Date.now() / 1000);
                const refreshTokenExpiryUnix = Math.floor(
                    new Date(user.refreshTokenExpiresAt).getTime() / 1000
                );

                if (refreshTokenExpiryUnix > nowUnix) {
                    // if still valid, make a new AccessToken
                    const newAccessToken = generateToken(user, "1h");

                    // Update last login
                    //user.lastLogin = new Date();
                    await user.save();

                    // OK status with data and a new AccessToken
                    return res.status(200).json({
                        message: "Automatic Login Successful",
                        data: {
                            user,
                            accessToken: newAccessToken,
                        },
                    });

                } else {
                    return res.status(401).json({ message: "Refresh token expired, please log in again" });
                }
            }
        } catch (error: any) {
            console.error("jwtLogin error:", error);
            return res.status(500).json({ message: "Internal server error", error: error.message });
        }
    }

  
  
  /**
   * Handles a login request
   * 
   * @param req Request object containing an email and a password
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data if the request was successful
   */
  async login(req: Request, res: Response): Promise<Response> {
    const { email, password } = req.body;

    try {
      const data = await this.userService.authenticate(email, password);

      // ✅ Update lastLogin timestamp
      const userToUpdate = await this.userService.getUserById(data.data._id);
      if (userToUpdate) {
        userToUpdate.lastLogin = new Date();
        await userToUpdate.save();
      }

      const token = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };

      return res.status(200).json({
        message: "Login successful",
        data: {
          user: data.data,
          accessToken: token,
        },
      });
    } catch (error: any) {
      return res.status(401).json({ message: error.message });
    }
  }

  /**
   * Handles a request for a new access token
   * 
   * @param req Request object containing an AccessToken
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message and a new AcessToken 
   */
  async refreshToken(req: Request, res: Response): Promise<Response> {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    try {
      const { accessToken } = await this.userService.refreshAccessToken(refreshToken);
      return res.status(200).json({
        message: "Token refreshed successfully",
        data: {
          accessToken,
        },
      });
    } catch (error: any) {
      return res.status(401).json({ message: error.message });
    }
  }

  /**
   * Handles a request to get a user by ID
   * 
   * @param req Request object containing the User ID
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data if the request was successful   
   */
  async getUserById(req: Request, res: Response): Promise<Response> {
    const { user } = req;
    console.log("user", user);
    try {
      const existingUser = await this.userService.getUserById(user?.id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.status(200).json({
        message: "success",
        data: new UserItemResponse(existingUser),
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Handles a request to get a user by an input email
   * 
   * @param req Request object containing an email address
   * @param res Response object used to send back the HTTP response
   * @returns Returns the status code, a relevant message, and the data if the request was successful   
   */
  async getUserByEmail(req: Request, res: Response): Promise<Response> {
    const {email} = req.query;
    try {
      const existingUser = await this.userService.getUserByEmail(email as string);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.status(200).json({
        message: "success",
        data: new UserItemResponse(existingUser),
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Handles a request to get all users (Admin only)
   * 
   * @param req --Not used in this segment--
   * @param res Response object used to send back the HTTP response 
   * @returns Returns the status code, a relevant message, and the data if the request was successful
   */
  async getAllUser(req: Request, res: Response): Promise<Response> {
    try {
      const existingUsers = await this.userService.getAllUser();
      return res.status(200).json({
        message: "success",
        data: existingUsers.map((u) => new UserItemResponse(u)),
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  }
}
