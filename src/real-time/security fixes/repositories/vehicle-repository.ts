import Vehicle, { IVehicle } from "../models/vehicle-model";
import { FilterQuery } from "mongoose";

class VehicleRepository {

  /**
   * Finds a vehicle by a given ID
   * 
   * @param vehicleId String: A vehicle's ID
   * @returns Vehicle: the specified vehicle's details, or null if none exists
   */
  async findById(vehicleId: string): Promise<IVehicle | null> {
    return await Vehicle.findById(vehicleId).exec();
  }

  /**
   * Finds all vehicles with a specific input filter
   * 
   * @param filter Input a specific filter 
   * @returns Returns all vehicles under a specific filter
   */
  async findAll(filter: FilterQuery<IVehicle> = {}): Promise<IVehicle[]> {
    return await Vehicle.find(filter).exec();
  }
}

export default new VehicleRepository();
