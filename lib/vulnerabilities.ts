import net from 'net';

export interface VulnResult {
    id: string;
    name: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'safe' | 'vulnerable';
    details: string;
}

export const checkVulnerabilities = async (host: string, ip: string, openPorts: number[]): Promise<VulnResult[]> => {
    const results: VulnResult[] = [];

    // 1. Check for exposed SSH (Port 22)
    if (openPorts.includes(22)) {
        results.push({
            id: 'SSH_EXPOSED',
            name: 'SSH Expuesto',
            severity: 'medium',
            status: 'vulnerable',
            details: 'El puerto 22 (SSH) está abierto a internet. Debería estar restringido por firewall o VPN.',
        });
    } else {
        results.push({
            id: 'SSH_EXPOSED',
            name: 'SSH Expuesto',
            severity: 'medium',
            status: 'safe',
            details: 'El puerto 22 está cerrado o filtrado.',
        });
    }

    // 2. Check for exposed MySQL (Port 3306)
    if (openPorts.includes(3306)) {
        results.push({
            id: 'MYSQL_EXPOSED',
            name: 'MySQL Expuesto',
            severity: 'high',
            status: 'vulnerable',
            details: 'El puerto de base de datos 3306 está abierto. Esto es un riesgo alto de seguridad.',
        });
    } else {
        results.push({
            id: 'MYSQL_EXPOSED',
            name: 'MySQL Expuesto',
            severity: 'high',
            status: 'safe',
            details: 'El puerto de base de datos no es accesible públicamente.',
        });
    }

    // 3. Check for exposed FTP (Port 21)
    if (openPorts.includes(21)) {
        results.push({
            id: 'FTP_EXPOSED',
            name: 'FTP Inseguro',
            severity: 'high',
            status: 'vulnerable',
            details: 'El servicio FTP (puerto 21) está activo. FTP transmite credenciales en texto plano.',
        });
    } else {
        results.push({
            id: 'FTP_EXPOSED',
            name: 'FTP Inseguro',
            severity: 'high',
            status: 'safe',
            details: 'No se detectó servicio FTP.',
        });
    }

    // 4. Check for .git exposure
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`http://${ip}/.git/HEAD`, {
            method: 'GET',
            headers: { 'Host': host },
            signal: controller.signal,
            redirect: 'manual'
        });
        clearTimeout(timeoutId);

        if (res.status === 200 && (await res.text()).includes('ref:')) {
            results.push({
                id: 'GIT_EXPOSED',
                name: 'Repositorio Git Expuesto',
                severity: 'critical',
                status: 'vulnerable',
                details: 'La carpeta /.git/ es accesible. Un atacante podría descargar todo el código fuente.',
            });
        } else {
            results.push({
                id: 'GIT_EXPOSED',
                name: 'Repositorio Git Expuesto',
                severity: 'critical',
                status: 'safe',
                details: 'La carpeta /.git/ no parece ser accesible.',
            });
        }
    } catch (e) {
        results.push({
            id: 'GIT_EXPOSED',
            name: 'Repositorio Git Expuesto',
            severity: 'critical',
            status: 'safe',
            details: 'No se pudo verificar o no es accesible.',
        });
    }

    // 5. Check robots.txt for sensitive info (simplified check)
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`http://${ip}/robots.txt`, {
            method: 'GET',
            headers: { 'Host': host },
            signal: controller.signal,
            redirect: 'manual'
        });
        clearTimeout(timeoutId);

        if (res.status === 200) {
            const text = await res.text();
            if (text.includes('admin') || text.includes('private') || text.includes('backup')) {
                results.push({
                    id: 'ROBOTS_SENSITIVE',
                    name: 'Robots.txt Sensible',
                    severity: 'low',
                    status: 'vulnerable',
                    details: 'El archivo robots.txt revela rutas sensibles (admin, private, backup).',
                });
            } else {
                results.push({
                    id: 'ROBOTS_SENSITIVE',
                    name: 'Robots.txt Sensible',
                    severity: 'low',
                    status: 'safe',
                    details: 'El archivo robots.txt no parece contener rutas críticas obvias.',
                });
            }
        }
    } catch (e) {
        // Ignore if no robots.txt
    }

    return results;
};
