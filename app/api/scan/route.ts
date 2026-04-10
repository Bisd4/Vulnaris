import { NextRequest, NextResponse } from 'next/server';
import { scanPort, COMMON_PORTS, calculateScore, ScanResult } from '@/lib/scanner';
import { analyzeSSL } from '@/lib/ssl';
import { checkHeaders } from '@/lib/headers';
import { findSubdomains } from '@/lib/subdomains';
import { checkVulnerabilities } from '@/lib/vulnerabilities';
import { generateUptimeHistory, analyzeUptime } from '@/lib/uptime';
import { fingerprintWebsite } from '@/lib/fingerprint';
import { resolveAndValidateTarget, ValidationResult } from '@/lib/security';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
    try {
        // Rate Limiting
        const clientIp = getClientIp(req);
        const isLimited = await checkRateLimit(clientIp);
        if (isLimited) {
            return NextResponse.json({ error: 'Demasiadas solicitudes. Por favor, intenta más tarde.' }, { status: 429 });
        }

        const { url } = await req.json();

        if (!url || typeof url !== 'string' || url.length > 2048) {
            return NextResponse.json({ error: 'URL is required and must be valid' }, { status: 400 });
        }

        // Extract hostname from URL
        let hostname = url;
        try {
            if (!url.startsWith('http')) {
                hostname = new URL(`http://${url}`).hostname;
            } else {
                hostname = new URL(url).hostname;
            }
        } catch (e) {
            return NextResponse.json({ error: 'Formato de URL inválido' }, { status: 400 });
        }

        // Validate target (SSRF Protection)
        const validation: ValidationResult = await resolveAndValidateTarget(hostname);
        if (!validation.isValid || !validation.ip) {
            return NextResponse.json({ error: validation.error || 'Destino inválido o no permitido' }, { status: 400 });
        }
        
        const targetIp = validation.ip;

        // 1. Port Scan
        const scanPromises = COMMON_PORTS.map((p) => scanPort(targetIp, p.port)); // Uses targetIp to prevent DNS rebinding
        const portResults = await Promise.all(scanPromises);
        const openPorts = portResults.filter(p => p.status === 'open').map(p => p.port);

        // 2. SSL Analysis
        const sslResult = await analyzeSSL(hostname, targetIp);

        // 3. Headers Check
        const headersResult = await checkHeaders(hostname, targetIp);

        // 4. Subdomains (Runs in parallel, only does DNS lookups)
        const subdomainsResult = await findSubdomains(hostname);

        // 5. Vulnerabilities
        const vulnsResult = await checkVulnerabilities(hostname, targetIp, openPorts);

        // 6. Uptime Monitoring (Mock/historical data primarily)
        const uptimeHistory = generateUptimeHistory(hostname);
        const uptimeResult = analyzeUptime(uptimeHistory);

        // 7. Technology Fingerprinting
        const fingerprintResult = await fingerprintWebsite(hostname, targetIp);

        // Calculate Score
        const score = calculateScore(portResults, sslResult, headersResult, vulnsResult, uptimeResult);

        const response: ScanResult = {
            host: hostname,
            ports: portResults,
            ssl: sslResult,
            headers: headersResult,
            subdomains: subdomainsResult,
            vulnerabilities: vulnsResult,
            uptime: uptimeResult,
            fingerprint: fingerprintResult,
            score,
            timestamp: new Date().toISOString(),
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('Scan error:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
