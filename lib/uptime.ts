import https from 'https';
import http from 'http';

export interface UptimeRecord {
    timestamp: string;
    status: 'up' | 'down' | 'degraded';
    responseTime: number; // in milliseconds
}

export interface IncidentDetail {
    id: string;
    startTime: string;
    endTime: string;
    duration: number; // in minutes
    reason: string;
    severity: 'minor' | 'major' | 'critical';
}

export interface UptimeResult {
    availability: number; // percentage
    totalChecks: number;
    uptime: UptimeRecord[];
    downtimeHours: number;
    incidents: number;
    incidentDetails: IncidentDetail[];
}

/**
 * Checks if a website is currently up by making an HTTP/HTTPS request
 */
export const checkUptime = (host: string): Promise<{ status: 'up' | 'down' | 'degraded'; responseTime: number }> => {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const protocol = host.includes('https://') || host.includes('443') ? https : http;
        const url = host.startsWith('http') ? host : `https://${host}`;

        const req = protocol.get(url, { timeout: 5000 }, (res) => {
            const responseTime = Date.now() - startTime;

            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
                resolve({ status: 'up', responseTime });
            } else if (res.statusCode && res.statusCode >= 400 && res.statusCode < 500) {
                resolve({ status: 'degraded', responseTime });
            } else {
                resolve({ status: 'down', responseTime });
            }
        });

        req.on('error', () => {
            const responseTime = Date.now() - startTime;
            resolve({ status: 'down', responseTime });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({ status: 'down', responseTime: 5000 });
        });
    });
};

/**
 * Generates mock 30-day uptime history with realistic patterns and incidents
 */
export const generateUptimeHistory = (host: string): UptimeRecord[] => {
    const records: UptimeRecord[] = [];
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    // Generate checks every hour for more detailed data = 720 data points
    const checkInterval = 60 * 60 * 1000; // 1 hour in milliseconds

    // Create some planned downtime incidents
    const incidents = [
        { start: 10, duration: 3 }, // Day 10, 3 hours
        { start: 18, duration: 1 }, // Day 18, 1 hour
        { start: 25, duration: 2 }, // Day 25, 2 hours
    ];

    for (let i = 0; i < 720; i++) {
        const timestamp = new Date(thirtyDaysAgo + (i * checkInterval)).toISOString();

        // Check if this time falls within an incident
        let isInIncident = false;
        for (const incident of incidents) {
            const incidentStart = incident.start * 24;
            const incidentEnd = incidentStart + incident.duration;
            if (i >= incidentStart && i < incidentEnd) {
                isInIncident = true;
                break;
            }
        }

        let status: 'up' | 'down' | 'degraded' = 'up';
        let responseTime = Math.floor(Math.random() * 200) + 50; // 50-250ms normal

        if (isInIncident) {
            status = 'down';
            responseTime = 5000;
        } else {
            // Small random chance of degraded performance
            const random = Math.random();
            if (random < 0.005) {
                status = 'degraded';
                responseTime = Math.floor(Math.random() * 2000) + 1000; // 1-3s slow
            }
        }

        records.push({ timestamp, status, responseTime });
    }

    return records;
};

const DOWNTIME_REASONS = [
    {
        severity: 'critical' as const, reasons: [
            'Servidor cayó debido a sobrecarga de memoria',
            'Fallo crítico en base de datos principal',
            'Ataque DDoS detectado y mitigado',
            'Corrupción de datos en sistema de archivos',
            'Falla en hardware del servidor',
        ]
    },
    {
        severity: 'major' as const, reasons: [
            'Mantenimiento programado de infraestructura',
            'Actualización de seguridad crítica aplicada',
            'Migración de base de datos',
            'Problema de red con proveedor de hosting',
            'Reinicio por actualización de kernel',
        ]
    },
    {
        severity: 'minor' as const, reasons: [
            'Conexión de red temporal interrumpida',
            'Timeout de respuesta por alta carga',
            'Servicio reiniciado por monitoreo automático',
            'Problema temporal de DNS',
            'Actualización de certificado SSL',
        ]
    },
];

/**
 * Analyzes uptime records and calculates statistics with detailed incidents
 */
export const analyzeUptime = (records: UptimeRecord[]): UptimeResult => {
    const totalChecks = records.length;
    const upCount = records.filter(r => r.status === 'up').length;
    const downCount = records.filter(r => r.status === 'down').length;
    const availability = totalChecks > 0 ? (upCount / totalChecks) * 100 : 0;

    // Calculate downtime hours (checks every hour, each down period = 1 hour)
    const downtimeHours = downCount;

    // Find and analyze incidents (consecutive down/degraded periods)
    const incidentDetails: IncidentDetail[] = [];
    let incidentStart: number | null = null;
    const incidentRecords: UptimeRecord[] = [];

    for (let idx = 0; idx < records.length; idx++) {
        const record = records[idx];

        if (record.status === 'down' || record.status === 'degraded') {
            if (incidentStart === null) {
                incidentStart = idx;
            }
            incidentRecords.push(record);
        } else {
            // If we were tracking an incident, save it
            if (incidentStart !== null && incidentRecords.length > 0) {
                const startTime = incidentRecords[0].timestamp;
                const endTime = record.timestamp;
                const duration = incidentRecords.length * 60; // hours to minutes

                // Determine severity based on duration
                let severity: 'minor' | 'major' | 'critical' = 'minor';
                if (duration >= 180) severity = 'critical'; // 3+ hours
                else if (duration >= 60) severity = 'major'; // 1+ hours

                // Pick a random reason for this severity
                const severityReasons = DOWNTIME_REASONS.find(dr => dr.severity === severity)?.reasons || [];
                const reason = severityReasons[Math.floor(Math.random() * severityReasons.length)];

                incidentDetails.push({
                    id: `INC-${String(incidentDetails.length + 1).padStart(4, '0')}`,
                    startTime,
                    endTime,
                    duration,
                    reason,
                    severity,
                });

                // Reset for next incident
                incidentStart = null;
                incidentRecords.length = 0;
            }
        }
    }

    // Handle if incident is still ongoing at end of period
    if (incidentStart !== null && incidentRecords.length > 0) {
        const startTime = incidentRecords[0].timestamp;
        const endTime = incidentRecords[incidentRecords.length - 1].timestamp;
        const duration = incidentRecords.length * 60;

        let severity: 'minor' | 'major' | 'critical' = 'minor';
        if (duration >= 180) severity = 'critical';
        else if (duration >= 60) severity = 'major';

        const severityReasons = DOWNTIME_REASONS.find(dr => dr.severity === severity)?.reasons || [];
        const reason = severityReasons[Math.floor(Math.random() * severityReasons.length)];

        incidentDetails.push({
            id: `INC-${String(incidentDetails.length + 1).padStart(4, '0')}`,
            startTime,
            endTime,
            duration,
            reason,
            severity,
        });
    }

    return {
        availability: Math.round(availability * 100) / 100,
        totalChecks,
        uptime: records,
        downtimeHours,
        incidents: incidentDetails.length,
        incidentDetails,
    };
};
