import { Request, Response } from "express";
import ProfileService from "../services/profile-service";
import VehicleService from "../services/vehicle-service";
import UserService from "../services/user-service";
import ChargingStationService from "../services/station-service";
import { UserProfileResponse } from "../dtos/user-profile-response";

export default class ProfileController {
  constructor(
    private readonly userService: UserService,
    private readonly profileService: ProfileService,
    private readonly vehicleService: VehicleService,
    private readonly stationService: ChargingStationService
  ) {}

  async getUserProfile(req: Request, res: Response): Promise<Response> {
    const { user } = req;

    try {
      const response = new UserProfileResponse(user?.id);

      const existingProfile = await this.profileService.getUserProfile(
        user?.id
      );

      if (existingProfile.user_car_model) {
        const existingVehicle = await this.vehicleService.getVehicleById(
          existingProfile.user_car_model
        );
        response.user_car_model = existingVehicle;
      }

      if (
        existingProfile.favourite_stations &&
        existingProfile.favourite_stations.length > 0
      ) {
        const existingStations = await this.stationService.getStationsWithIdIn(
          existingProfile.favourite_stations
        );
        response.favourite_stations = existingStations;
      }

      return res.status(201).json({
        message: "success",
        data: response,
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  async updateUserVehicleModel(req: Request, res: Response): Promise<Response> {
    const { vehicleId } = req.body;
    const { user } = req;

    try {
      const existingUser = await this.userService.getUserById(user?.id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const existingVehicle = await this.vehicleService.getVehicleById(
        vehicleId
      );
      if (!existingVehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      const updatedProfile = await this.profileService.updateUserVehicleModel(
        user?.id || "",
        vehicleId
      );

      return res.status(201).json({
        message: "Update user vehicle model successfully",
        data: updatedProfile,
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  async addFavouriteStation(req: Request, res: Response): Promise<Response> {
    const { stationId } = req.body;
    const { user } = req;

    try {
      const existingUser = await this.userService.getUserById(user?.id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const existingStation = await this.stationService.getStationById(
        stationId
      );
      if (!existingStation) {
        return res.status(404).json({ message: "Station not found" });
      }

      const updatedProfile = await this.profileService.addFavouriteStation(
        user?.id || "",
        stationId
      );

      return res.status(201).json({
        message: "Add favourite station successfully",
        data: updatedProfile,
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  async deleteFavouriteStation(req: Request, res: Response): Promise<Response> {
    const { stationId } = req.body;
    const { user } = req;

    try {
      const existingUser = await this.userService.getUserById(user?.id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedProfile = await this.profileService.removeFavouriteStation(
        user?.id || "",
        stationId
      );

      return res.status(201).json({
        message: "Remove favourite station successfully",
        data: updatedProfile,
      });
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }
}