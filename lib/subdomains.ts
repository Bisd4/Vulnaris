import dns from 'dns';
import util from 'util';

const resolve = util.promisify(dns.resolve);

export interface SubdomainResult {
    subdomain: string;
    status: 'active' | 'inactive';
    ip?: string;
}

const COMMON_SUBDOMAINS = [
    'www',
    'mail',
    'remote',
    'blog',
    'webmail',
    'server',
    'ns1',
    'ns2',
    'smtp',
    'secure',
    'vpn',
    'api',
    'dev',
    'staging',
    'admin',
    'portal',
    'test',
    'ftp',
    'shop',
    'store'
];

export const findSubdomains = async (domain: string): Promise<SubdomainResult[]> => {
    const results: SubdomainResult[] = [];

    // Limit concurrency
    const checkSubdomain = async (sub: string) => {
        const hostname = `${sub}.${domain}`;
        try {
            const ips = await resolve(hostname);
            return {
                subdomain: hostname,
                status: 'active' as const,
                ip: ips[0]
            };
        } catch (e) {
            return null;
        }
    };

    const promises = COMMON_SUBDOMAINS.map(sub => checkSubdomain(sub));
    const found = await Promise.all(promises);

    return found.filter((r) => r !== null) as SubdomainResult[];
};
