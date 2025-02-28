import winston from "winston";

export const config = {
    environment: process.env.NODE_ENV || "development",
    telemetryEnabled: true,
    // ...weitere enterprise-spezifische Einstellungen...
};

export const logger = winston.createLogger({
    level: config.environment === "development" ? "debug" : "info",
    transports: [
        new winston.transports.Console({
            format: winston.format.simple()
        }),
        // Weitere Transportoptionen (z.B. Datei, externe Services) können hinzugefügt werden.
    ],
});
