import net from 'net';
import { SSLResult } from './ssl';
import { HeaderResult } from './headers';
import { SubdomainResult } from './subdomains';
import { VulnResult } from './vulnerabilities';
import { UptimeResult } from './uptime';
import { FingerprintResult } from './fingerprint';

export interface PortResult {
    port: number;
    status: 'open' | 'closed';
    service: string;
}

export interface ScanResult {
    host: string;
    ports: PortResult[];
    ssl?: SSLResult;
    headers?: HeaderResult[];
    subdomains?: SubdomainResult[];
    vulnerabilities?: VulnResult[];
    uptime?: UptimeResult;
    fingerprint?: FingerprintResult;
    score: number;
    timestamp: string;
}

export const COMMON_PORTS = [
    { port: 20, service: 'FTP Data' },
    { port: 21, service: 'FTP Control' },
    { port: 22, service: 'SSH' },
    { port: 23, service: 'Telnet' },
    { port: 25, service: 'SMTP' },
    { port: 53, service: 'DNS' },
    { port: 80, service: 'HTTP' },
    { port: 110, service: 'POP3' },
    { port: 143, service: 'IMAP' },
    { port: 443, service: 'HTTPS' },
    { port: 465, service: 'SMTPS' },
    { port: 587, service: 'SMTP Submission' },
    { port: 993, service: 'IMAPS' },
    { port: 995, service: 'POP3S' },
    { port: 3306, service: 'MySQL' },
    { port: 3389, service: 'RDP' },
    { port: 5432, service: 'PostgreSQL' },
    { port: 8080, service: 'HTTP Proxy' },
    { port: 8443, service: 'HTTPS Alt' },
];

export const scanPort = (host: string, port: number, timeout = 2000): Promise<PortResult> => {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        let status: 'open' | 'closed' = 'closed';

        socket.setTimeout(timeout);

        socket.on('connect', () => {
            status = 'open';
            socket.destroy();
        });

        socket.on('timeout', () => {
            status = 'closed';
            socket.destroy();
        });

        socket.on('error', (err) => {
            status = 'closed';
            socket.destroy();
        });

        socket.on('close', () => {
            const service = COMMON_PORTS.find((p) => p.port === port)?.service || 'Unknown';
            resolve({ port, status, service });
        });

        socket.connect(port, host);
    });
};

export const calculateScore = (
    ports: PortResult[],
    ssl?: SSLResult,
    headers?: HeaderResult[],
    vulns?: VulnResult[],
    uptime?: UptimeResult
): number => {
    let score = 100;

    // 1. Ports Penalty
    ports.forEach((r) => {
        if (r.status === 'open') {
            if (![80, 443].includes(r.port)) {
                score -= 5; // Reduced penalty per port
            }
        }
    });

    // 2. SSL Penalty
    if (ssl) {
        if (!ssl.valid) score -= 20;
        if (!ssl.hsts) score -= 10;
        // Check for weak protocols if needed
    } else {
        // If no SSL info (maybe scan failed or not https), huge penalty if port 443 is open
        const httpsOpen = ports.find(p => p.port === 443 && p.status === 'open');
        if (httpsOpen) score -= 10;
    }

    // 3. Headers Penalty
    if (headers) {
        headers.forEach(h => {
            if (h.status === 'bad') score -= 5;
        });
    }

    // 4. Vulnerabilities Penalty
    if (vulns) {
        vulns.forEach(v => {
            if (v.status === 'vulnerable') {
                if (v.severity === 'critical') score -= 30;
                if (v.severity === 'high') score -= 20;
                if (v.severity === 'medium') score -= 10;
                if (v.severity === 'low') score -= 5;
            }
        });
    }

    // 5. Uptime Penalty
    if (uptime) {
        const availability = uptime.availability;
        if (availability < 99.9) score -= 5;
        if (availability < 99.5) score -= 10;
        if (availability < 99.0) score -= 15;
        if (availability < 95.0) score -= 20;
    }

    return Math.max(0, Math.round(score));
};
