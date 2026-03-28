import { Request, Response } from "express";
import mongoose from "mongoose";

export const compareEnvironmentalImpact = async (req: Request, res: Response) => {
    try {
        const evId = req.query.evId as string;
        const iceId = req.query.iceId as string;

        if (!evId || !iceId) {
            return res.status(400).json({
                message: "evId and iceId are required",
            });
        }

        if (
            !mongoose.Types.ObjectId.isValid(evId) ||
            !mongoose.Types.ObjectId.isValid(iceId)
        ) {
            return res.status(400).json({
                message: "Invalid evId or iceId",
            });
        }

        const evVehicle = await mongoose.connection
            .collection("ev_vehicles")
            .findOne({ _id: new mongoose.Types.ObjectId(evId) });

        const iceVehicle = await mongoose.connection
            .collection("ice_vehicles")
            .findOne({ _id: new mongoose.Types.ObjectId(iceId) });

        if (!evVehicle) {
            return res.status(404).json({
                message: "EV vehicle not found",
            });
        }

        if (!iceVehicle) {
            return res.status(404).json({
                message: "ICE vehicle not found",
            });
        }

        const ev = {
            id: evVehicle._id,
            make: evVehicle.make,
            model: evVehicle.model,
            variant: evVehicle.variant,
            fuelType: evVehicle.fuel_type,
            co2EmissionsCombined: evVehicle.co2_emissions_combined,
            fuelConsumptionCombined: evVehicle.fuel_consumption_combined,
            energyConsumptionWhkm: evVehicle.energy_consumption_whkm,
            electricRangeKm: evVehicle.electric_range_km,
            fuelLifeCycleCo2: evVehicle.fuel_life_cycle_co2,
            annualTailpipeCo2: evVehicle.annual_tailpipe_co2,
            annualFuelCost: evVehicle.annual_fuel_cost,
        };

        const ice = {
            id: iceVehicle._id,
            make: iceVehicle.make,
            model: iceVehicle.model,
            variant: iceVehicle.variant,
            fuelType: iceVehicle.fuel_type,
            co2EmissionsCombined: iceVehicle.co2_emissions_combined,
            fuelConsumptionCombined: iceVehicle.fuel_consumption_combined,
            fuelLifeCycleCo2: iceVehicle.fuel_life_cycle_co2,
            annualTailpipeCo2: iceVehicle.annual_tailpipe_co2,
            annualFuelCost: iceVehicle.annual_fuel_cost,
        };

        const co2SavedPerKm =
            (ice.co2EmissionsCombined ?? 0) - (ev.co2EmissionsCombined ?? 0);

        const co2SavedAnnual =
            (ice.annualTailpipeCo2 ?? 0) - (ev.annualTailpipeCo2 ?? 0);

        const evBetter = co2SavedPerKm > 0;

        const summary = `The EV emits ${co2SavedPerKm} g/km less CO₂ (${co2SavedAnnual.toFixed(
            2
        )} kg/year).`;

        return res.status(200).json({
            message: "Environmental impact comparison retrieved successfully",
            data: {
                ev,
                ice,
                comparison: {
                    co2SavedPerKm,
                    co2SavedAnnual,
                    evBetter,
                    summary,
                },
            },
        });
    } catch (error) {
        console.error("Error comparing environmental impact:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};