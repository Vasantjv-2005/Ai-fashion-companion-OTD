"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeatherSnapshot = exports.WEATHER_CONDITIONS = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.WEATHER_CONDITIONS = [
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
];
const weatherSnapshotSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        enum: exports.WEATHER_CONDITIONS,
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
}, {
    timestamps: true,
    collection: "weather_snapshots",
    versionKey: false,
});
weatherSnapshotSchema.index({
    city: 1,
    country: 1,
    recordedAt: -1,
});
weatherSnapshotSchema.index({
    userId: 1,
    recordedAt: -1,
});
weatherSnapshotSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
exports.WeatherSnapshot = mongoose_1.default.models.WeatherSnapshot ||
    mongoose_1.default.model("WeatherSnapshot", weatherSnapshotSchema);
exports.default = exports.WeatherSnapshot;
