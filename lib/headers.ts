import https from 'https';

export interface HeaderResult {
    name: string;
    value: string | null;
    status: 'good' | 'warn' | 'bad';
    description: string;
}

export const checkHeaders = async (host: string, ip: string): Promise<HeaderResult[]> => {
    return new Promise((resolve) => {
        const checks = [
            { name: 'content-security-policy', desc: 'Previene ataques XSS definiendo fuentes de contenido permitidas.', goodIf: (val: string) => !!val },
            { name: 'x-frame-options', desc: 'Protege contra ataques de Clickjacking.', goodIf: (val: string) => ['DENY', 'SAMEORIGIN'].includes(val?.toUpperCase()) },
            // X-XSS-Protection se ha removido ya que está deprecado en navegadores modernos (Chrome, Firefox)
            { name: 'strict-transport-security', desc: 'Fuerza el uso de HTTPS.', goodIf: (val: string) => !!val },
            { name: 'referrer-policy', desc: 'Controla cuánta información de referencia se envía.', goodIf: (val: string) => !!val },
            // Permissions-Policy se removió porque no es esencial penalizar si falta en el landing principal
        ];

        const req = https.request({
            host: ip,
            port: 443,
            method: 'HEAD',
            servername: host,
            headers: { Host: host },
            rejectUnauthorized: false
        }, (res) => {
            const results = checks.map((check) => {
                const val = res.headers[check.name] as string | undefined;
                const isGood = val ? check.goodIf(val) : false;
                return {
                    name: check.name,
                    value: val || null,
                    status: (isGood ? 'good' : 'bad') as 'good' | 'bad' | 'warn',
                    description: check.desc,
                };
            });
            resolve(results);
        });

        req.on('error', () => {
            resolve([]);
        });

        req.setTimeout(3000, () => {
            req.destroy();
            resolve([]);
        });

        req.end();
    });
};
