import tls from 'tls';
import https from 'https';

export interface SSLResult {
    valid: boolean;
    issuer: string;
    subject: string;
    validFrom: string;
    validTo: string;
    daysRemaining: number;
    protocols: string[];
    hsts: boolean;
}

export const analyzeSSL = (host: string, ip: string): Promise<SSLResult> => {
    return new Promise((resolve) => {
        const options = {
            host: ip,
            port: 443,
            rejectUnauthorized: false, // We want to inspect even if invalid
            servername: host,
        };

        const socket = tls.connect(options, () => {
            const cert = socket.getPeerCertificate();

            if (!cert || Object.keys(cert).length === 0) {
                resolve({
                    valid: false,
                    issuer: 'Unknown',
                    subject: 'Unknown',
                    validFrom: '',
                    validTo: '',
                    daysRemaining: 0,
                    protocols: [],
                    hsts: false,
                });
                socket.end();
                return;
            }

            const validTo = new Date(cert.valid_to);
            const validFrom = new Date(cert.valid_from);
            const daysRemaining = Math.floor((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const valid = daysRemaining > 0;

            // Check HSTS via a separate HTTPS request since it's a header
            // We'll do a quick check here or rely on the headers check. 
            // Actually, let's do a quick HEAD request to check HSTS specifically for this report if needed,
            // but usually HSTS is part of headers. 
            // The user asked for "Green: TLS modern + HSTS" in SSL section.
            // So we should check it.

            const req = https.request({
                host: ip,
                port: 443,
                method: 'HEAD',
                servername: host,
                headers: { Host: host },
                rejectUnauthorized: false
            }, (res) => {
                const hsts = !!res.headers['strict-transport-security'];

                // Determine protocols (simplified)
                // In a real scan we'd try to connect with different protocols.
                // For now, we report the one negotiated.
                const protocol = socket.getProtocol() || 'Unknown';

                resolve({
                    valid,
                    issuer: (cert.issuer as any).O || (cert.issuer as any).CN || 'Unknown',
                    subject: (cert.subject as any).CN || 'Unknown',
                    validFrom: validFrom.toISOString(),
                    validTo: validTo.toISOString(),
                    daysRemaining,
                    protocols: [protocol], // Ideally we'd test for others
                    hsts,
                });
                socket.end();
            });

            req.on('error', () => {
                // Fallback if HTTP request fails but TLS worked
                resolve({
                    valid,
                    issuer: (cert.issuer as any).O || (cert.issuer as any).CN || 'Unknown',
                    subject: (cert.subject as any).CN || 'Unknown',
                    validFrom: validFrom.toISOString(),
                    validTo: validTo.toISOString(),
                    daysRemaining,
                    protocols: [socket.getProtocol() || 'Unknown'],
                    hsts: false,
                });
                socket.end();
            });

            req.end();
        });

        socket.on('error', (err) => {
            resolve({
                valid: false,
                issuer: 'Error',
                subject: 'Error',
                validFrom: '',
                validTo: '',
                daysRemaining: 0,
                protocols: [],
                hsts: false,
            });
        });

        socket.setTimeout(5000, () => {
            socket.destroy();
            resolve({
                valid: false,
                issuer: 'Timeout',
                subject: 'Timeout',
                validFrom: '',
                validTo: '',
                daysRemaining: 0,
                protocols: [],
                hsts: false,
            });
        });
    });
};
