interface EnvironmentalImpactComparisonInput {
    evVehicleId: string;
    iceVehicleId: string;
}

interface VehicleEnvironmentalData {
    id: string;
    make: string;
    model: string;
    variant: string;
    fuelType: string;
    co2EmissionsCombined: number; // g/km
    fuelConsumptionCombined: number; // L/100km
    fuelLifeCycleCo2: number; // g/km
    annualTailpipeCo2: number; // t/year or mock unit for now
    annualFuelCost: number; // mock currency value
}

interface EnvironmentalImpactComparisonResult {
    ev: VehicleEnvironmentalData;
    ice: VehicleEnvironmentalData;
    comparison: {
        co2SavedPerKm: number;
        co2SavedAnnual: number;
        evBetter: boolean;
        summary: string;
    };
}

export default class EnvironmentalImpactService {
    /**
     * Compare EV vs ICE environmental impact.
     *
     * Note:
     * - Currently uses mock data for integration/testing
     * - Will later be replaced by DB queries
     * - Assumes FE sends selected vehicle IDs only
     */
    async compareVehicles(
        data: EnvironmentalImpactComparisonInput
    ): Promise<EnvironmentalImpactComparisonResult> {
        const { evVehicleId, iceVehicleId } = data;

        if (!evVehicleId || evVehicleId.trim() === "") {
            throw new Error("evVehicleId is required");
        }

        if (!iceVehicleId || iceVehicleId.trim() === "") {
            throw new Error("iceVehicleId is required");
        }

        const evVehicles: VehicleEnvironmentalData[] = [
            {
                id: "66d7e0f5cdf87e8b5d63de69",
                make: "BYD",
                model: "DOLPHIN",
                variant: "Dynamic",
                fuelType: "Pure Electric",
                co2EmissionsCombined: 0,
                fuelConsumptionCombined: 0,
                fuelLifeCycleCo2: 102,
                annualTailpipeCo2: 0,
                annualFuelCost: 529
            },
            {
                id: "ev-bmw-i3",
                make: "BMW",
                model: "i3",
                variant: "i3 BEV 120Ah",
                fuelType: "Pure Electric",
                co2EmissionsCombined: 0,
                fuelConsumptionCombined: 0,
                fuelLifeCycleCo2: 111,
                annualTailpipeCo2: 0,
                annualFuelCost: 600
            }
        ];

        const iceVehicles: VehicleEnvironmentalData[] = [
            {
                id: "69c24f33220016a8b3e1adc0",
                make: "MINI",
                model: "Cooper D",
                variant: "Hardtop",
                fuelType: "Diesel",
                co2EmissionsCombined: 103,
                fuelConsumptionCombined: 3.9,
                fuelLifeCycleCo2: 112,
                annualTailpipeCo2: 1.44,
                annualFuelCost: 874
            },
            {
                id: "ice-toyota-corolla",
                make: "Toyota",
                model: "Corolla",
                variant: "Ascent Sport",
                fuelType: "Petrol",
                co2EmissionsCombined: 121,
                fuelConsumptionCombined: 5.4,
                fuelLifeCycleCo2: 123,
                annualTailpipeCo2: 1.70,
                annualFuelCost: 920
            }
        ];

        const ev = evVehicles.find(v => v.id === evVehicleId);
        const ice = iceVehicles.find(v => v.id === iceVehicleId);

        if (!ev) {
            throw new Error("EV vehicle not found");
        }

        if (!ice) {
            throw new Error("ICE vehicle not found");
        }

        const co2SavedPerKm = ice.co2EmissionsCombined - ev.co2EmissionsCombined;
        const co2SavedAnnual = Number(
            (ice.annualTailpipeCo2 - ev.annualTailpipeCo2).toFixed(2)
        );
        const evBetter = co2SavedPerKm > 0;

        const summary = evBetter
            ? `The EV emits ${co2SavedPerKm} g/km less CO₂ (${co2SavedAnnual} kg/year).`
            : `The EV does not reduce CO₂ compared with the selected ICE vehicle.`;

        return {
            ev,
            ice,
            comparison: {
                co2SavedPerKm,
                co2SavedAnnual,
                evBetter,
                summary
            }
        };
    }
}