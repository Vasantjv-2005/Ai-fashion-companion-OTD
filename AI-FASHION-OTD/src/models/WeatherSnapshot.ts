import mongoose, { Schema } from "mongoose";

export const WEATHER_CONDITIONS = [
    "sunny",
    "cloudy",
    "partly_cloudy",
    "rainy",
    "stormy",
    "windy",
    "snowy",
    "foggy",
    "humid",
    "unknown",
] as const;

export interface WeatherSnapshotDocument extends mongoose.Document {
    userId?: mongoose.Types.ObjectId;
    city: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    temperatureCelsius: number;
    feelsLikeCelsius?: number;
    humidity?: number;
    windSpeedKmh?: number;
    precipitationProbability?: number;
    condition: (typeof WEATHER_CONDITIONS)[number];
    description?: string;
    recordedAt: Date;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const weatherSnapshotSchema = new Schema<WeatherSnapshotDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        city: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },
        country: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        latitude: {
            type: Number,
            min: -90,
            max: 90,
        },
        longitude: {
            type: Number,
            min: -180,
            max: 180,
        },
        temperatureCelsius: {
            type: Number,
            required: true,
            min: -100,
            max: 70,
        },
        feelsLikeCelsius: {
            type: Number,
            min: -100,
            max: 70,
        },
        humidity: {
            type: Number,
            min: 0,
            max: 100,
        },
        windSpeedKmh: {
            type: Number,
            min: 0,
        },
        precipitationProbability: {
            type: Number,
            min: 0,
            max: 100,
        },
        condition: {
            type: String,
            enum: WEATHER_CONDITIONS,
            default: "unknown",
            required: true,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        recordedAt: {
            type: Date,
            default: Date.now,
            required: true,
        },
        expiresAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        collection: "weather_snapshots",
        versionKey: false,
    },
);

weatherSnapshotSchema.index({
    city: 1,
    country: 1,
    recordedAt: -1,
});

weatherSnapshotSchema.index({
    userId: 1,
    recordedAt: -1,
});

weatherSnapshotSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 },
);

export const WeatherSnapshot =
    (mongoose.models.WeatherSnapshot as mongoose.Model<WeatherSnapshotDocument>) ||
    mongoose.model<WeatherSnapshotDocument>(
        "WeatherSnapshot",
        weatherSnapshotSchema,
    );

export default WeatherSnapshot;
