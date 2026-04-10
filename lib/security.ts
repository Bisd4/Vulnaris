import dns from 'dns';
import util from 'util';

const lookup = util.promisify(dns.lookup);

/**
 * Checks if an IPv4 address is private, loopback, or reserved (RFC 1918, RFC 5735, etc.)
 */
export function isPrivateIP(ip: string): boolean {
    // IPv4 patterns
    const privateBlocks = [
        /^10\./,                                  // 10.0.0.0/8 (Private)
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,         // 172.16.0.0/12 (Private)
        /^192\.168\./,                            // 192.168.0.0/16 (Private)
        /^127\./,                                 // 127.0.0.0/8 (Loopback)
        /^169\.254\./,                            // 169.254.0.0/16 (Link-local / AWS Metadata)
        /^0\./,                                   // 0.0.0.0/8 (Current network)
        /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./, // 100.64.0.0/10 (CGNAT)
        /^192\.0\.0\./,                           // 192.0.0.0/24 (IETF Protocol Assignments)
        /^192\.0\.2\./,                           // 192.0.2.0/24 (TEST-NET-1)
        /^198\.51\.100\./,                        // 198.51.100.0/24 (TEST-NET-2)
        /^203\.0\.113\./,                         // 203.0.113.0/24 (TEST-NET-3)
        /^22[4-9]\./,                             // 224.0.0.0/4 (Multicast)
        /^23[0-9]\./,                             // Multicast continuation
        /^2[4-5][0-9]\./                          // 240.0.0.0/4 (Reserved)
    ];

    // IPv6 standard loopback or unique local
    const ipv6Private = [
        /^::1$/,                                  // Loopback
        /^fc00:/i,                                // Unique Local Address (ULA)
        /^fd[0-9a-f]{2}:/i,                       // ULA
        /^fe80:/i                                 // Link-local
    ];

    return privateBlocks.some((regex) => regex.test(ip)) || 
           ipv6Private.some((regex) => regex.test(ip));
}

export interface ValidationResult {
    isValid: boolean;
    ip: string | null;
    error?: string;
}

/**
 * Resolves a hostname to an IP address and verifies it is public.
 * Protects against Server-Side Request Forgery (SSRF).
 */
export async function resolveAndValidateTarget(hostname: string): Promise<ValidationResult> {
    try {
        const { address, family } = await lookup(hostname);
        
        if (isPrivateIP(address)) {
            return {
                isValid: false,
                ip: address,
                error: 'El objetivo resuelve a una dirección IP privada o reservada, lo cual no está permitido por seguridad.'
            };
        }

        return {
            isValid: true,
            ip: address
        };
    } catch (e) {
        return {
            isValid: false,
            ip: null,
            error: 'No se pudo resolver el nombre de host (DNS Lookup failed).'
        };
    }
}
