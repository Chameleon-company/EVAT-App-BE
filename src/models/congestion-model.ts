import { query } from "express";
import mongoose, { Schema, Document } from "mongoose";

export interface ICongestion extends Document {
  chargerId: string;
  congestion_level: string // "low", "Medium", "High", "Unknown"
}
const CongestionSchema: Schema = new Schema<ICongestion>(
  {
    chargerId: {
      type: String,
      required: [true, "Charger ID is required"],
      trim: true,
      unique: true
    },
    congestion_level: {
      type: String,
      required: [true, "Congestion level is required"],
      trim: true
    }
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

CongestionSchema.index({ chargerId: 1, createdAt: -1 });
CongestionSchema.index({ chargerId: 1, congestion_level: 1 }, { unique: true }); // One level per user per charger

const Congestion = mongoose.model<ICongestion>("Congestion", CongestionSchema, "congestion");

export default Congestion;