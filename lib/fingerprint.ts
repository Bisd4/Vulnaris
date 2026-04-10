import { OutgoingHttpHeaders } from 'http';
import https from 'https';
import http from 'http';
import { resolveAndValidateTarget } from './security';

export interface TechnologyFingerprint {
    category: 'cms' | 'language' | 'database' | 'server' | 'framework' | 'library';
    name: string;
    version?: string;
    confidence: 'high' | 'medium' | 'low';
    evidence: string[];
}

export interface FingerprintResult {
    cms: TechnologyFingerprint | null;
    language: TechnologyFingerprint | null;
    database: TechnologyFingerprint | null;
    server: TechnologyFingerprint | null;
    frameworks: TechnologyFingerprint[];
    libraries: TechnologyFingerprint[];
}

/**
 * Custom fetch to bypass Node's strict TLS checking for CDNs
 */
function fetchHTML(urlStr: string, maxRedirects = 3): Promise<{ html: string, headers: Headers }> {
    return new Promise((resolve, reject) => {
        if (maxRedirects < 0) return resolve({ html: '', headers: { get: () => null } as any });
        const isHttps = urlStr.startsWith('https');
        const client = isHttps ? https : http;
        const options: any = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)'
            }
        };
        if (isHttps) options.rejectUnauthorized = false;

        const req = client.get(urlStr, options, async (res) => {
            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                let location = res.headers.location;
                if (!location.startsWith('http')) {
                    try { location = new URL(location, urlStr).href; } 
                    catch (e) { return resolve({ html: '', headers: { get: () => null } as any }); }
                }
                
                // CRITICAL SECURITY PATCH: SSRF check on redirects
                try {
                    const redirectHostname = new URL(location).hostname;
                    const validation = await resolveAndValidateTarget(redirectHostname);
                    if (!validation.isValid) {
                        console.error('SSRF blocked on redirect:', location);
                        return resolve({ html: '', headers: { get: () => null } as any });
                    }
                } catch (e) {
                    return resolve({ html: '', headers: { get: () => null } as any });
                }

                return resolve(fetchHTML(location, maxRedirects - 1));
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const mockHeaders = {
                    get: (name: string) => {
                        const val = res.headers[name.toLowerCase()];
                        return Array.isArray(val) ? val.join(', ') : val || null;
                    }
                };
                resolve({ html: data, headers: mockHeaders as any });
            });
        });
        req.on('error', reject);
        req.setTimeout(8000, () => {
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
}

/**
 * Analyzes HTTP headers, HTML content, and response patterns to identify web technologies
 */
export const fingerprintWebsite = async (host: string, ip: string): Promise<FingerprintResult> => {
    try {
        let fetchResult;
        try {
            fetchResult = await fetchHTML(`https://${host}`);
        } catch (e) {
            try {
                fetchResult = await fetchHTML(`http://${host}`);
            } catch (e2) {
                fetchResult = await fetchHTML(`http://${ip}`);
            }
        }

        const headers = fetchResult?.headers || { get: () => null } as any;
        const html = fetchResult?.html || '';

        // Initialize result
        const result: FingerprintResult = {
            cms: null,
            language: null,
            database: null,
            server: null,
            frameworks: [],
            libraries: []
        };

        // Detect Server
        result.server = detectServer(headers);

        // Detect CMS
        result.cms = detectCMS(headers, html);

        // Detect Programming Language
        result.language = detectLanguage(headers, html, result.cms);

        // Detect Database (based on CMS/language)
        result.database = detectDatabase(result.cms, result.language, html);

        // Detect Frameworks
        result.frameworks = detectFrameworks(headers, html);

        // Detect Libraries
        result.libraries = detectLibraries(html);

        return result;

    } catch (error) {
        console.error('Fingerprinting error:', error);
        // Return empty result on error
        return {
            cms: null,
            language: null,
            database: null,
            server: null,
            frameworks: [],
            libraries: []
        };
    }
};

/**
 * Detect web server from headers
 */
function detectServer(headers: Headers): TechnologyFingerprint | null {
    const serverHeader = headers.get('server')?.toLowerCase() || '';
    const poweredBy = headers.get('x-powered-by')?.toLowerCase() || '';

    if (serverHeader.includes('nginx')) {
        const version = serverHeader.match(/nginx\/([\d.]+)/)?.[1];
        return {
            category: 'server',
            name: 'Nginx',
            version,
            confidence: 'high',
            evidence: [`Server header: ${serverHeader}`]
        };
    }

    if (serverHeader.includes('apache')) {
        const version = serverHeader.match(/apache\/([\d.]+)/)?.[1];
        return {
            category: 'server',
            name: 'Apache',
            version,
            confidence: 'high',
            evidence: [`Server header: ${serverHeader}`]
        };
    }

    if (serverHeader.includes('cloudflare') || headers.get('cf-ray')) {
        return {
            category: 'server',
            name: 'Cloudflare',
            confidence: 'high',
            evidence: ['Cloudflare headers detected']
        };
    }

    if (serverHeader.includes('microsoft-iis')) {
        const version = serverHeader.match(/microsoft-iis\/([\d.]+)/)?.[1];
        return {
            category: 'server',
            name: 'Microsoft IIS',
            version,
            confidence: 'high',
            evidence: [`Server header: ${serverHeader}`]
        };
    }

    if (poweredBy.includes('express')) {
        return {
            category: 'server',
            name: 'Express.js',
            confidence: 'high',
            evidence: [`X-Powered-By: ${poweredBy}`]
        };
    }

    return null;
}

/**
 * Detect CMS from headers and HTML content - Enhanced with more aggressive detection
 */
function detectCMS(headers: Headers, html: string): TechnologyFingerprint | null {
    const evidence: string[] = [];
    const lowerHtml = html.toLowerCase();

    // WordPress - Multiple detection methods
    if (lowerHtml.includes('wp-content') ||
        lowerHtml.includes('wp-includes') ||
        lowerHtml.includes('wordpress') ||
        lowerHtml.includes('/wp-json/') ||
        lowerHtml.includes('wp-embed') ||
        lowerHtml.includes('wp_') ||
        lowerHtml.includes('wp-admin') ||
        lowerHtml.includes('yoast') ||
        lowerHtml.includes('elementor') ||
        lowerHtml.includes('class="wp-') ||
        lowerHtml.match(/\/wp-content\/themes\//i) ||
        lowerHtml.match(/\/wp-content\/plugins\//i) ||
        lowerHtml.match(/wp-content\/uploads/i) ||
        lowerHtml.match(/\/xmlrpc\.php/i) ||
        lowerHtml.match(/<link rel=["']https:\/\/api\.w\.org\/["']/i) ||
        lowerHtml.match(/<meta name="generator" content="wordpress/i) ||
        headers.get('x-powered-by')?.toLowerCase().includes('wordpress') ||
        headers.get('link')?.includes('wp-json')) {

        evidence.push('WordPress signatures detected');

        let cmsName = 'WordPress';
        if (lowerHtml.includes('elementor')) cmsName = 'WordPress (Elementor)';
        else if (lowerHtml.includes('yoast')) cmsName = 'WordPress (Yoast SEO)';
        else if (lowerHtml.includes('woocommerce')) cmsName = 'WordPress (WooCommerce)';

        // Try to extract version
        const versionMatch = html.match(/WordPress ([\d.]+)/i) ||
            html.match(/<meta name="generator" content="WordPress ([\d.]+)"/i) ||
            html.match(/wp-includes\/js\/wp-embed\.min\.js\?ver=([\d.]+)/i);

        return {
            category: 'cms',
            name: cmsName,
            version: versionMatch?.[1],
            confidence: 'high',
            evidence
        };
    }

    // Joomla - Enhanced detection
    if (lowerHtml.includes('joomla') ||
        lowerHtml.match(/\/media\/system\/js\//i) ||
        lowerHtml.match(/\/templates\/.*\/css\//i) ||
        lowerHtml.includes('option=com_') ||
        lowerHtml.includes('joomla!') ||
        headers.get('x-content-encoded-by')?.includes('Joomla')) {

        evidence.push('Joomla patterns detected');
        const version = html.match(/Joomla! ([\d.]+)/i)?.[1];

        return {
            category: 'cms',
            name: 'Joomla',
            version,
            confidence: 'high',
            evidence
        };
    }

    // Drupal - Enhanced detection
    if (lowerHtml.includes('drupal') ||
        lowerHtml.includes('/sites/default/files/') ||
        lowerHtml.match(/drupal\.js/i) ||
        lowerHtml.includes('drupal-settings') ||
        lowerHtml.includes('/sites/all/') ||
        headers.get('x-drupal-cache') ||
        headers.get('x-generator')?.includes('Drupal')) {

        evidence.push('Drupal patterns detected');
        const version = html.match(/Drupal ([\d.]+)/i)?.[1];

        return {
            category: 'cms',
            name: 'Drupal',
            version,
            confidence: 'high',
            evidence
        };
    }

    // Shopify
    if (lowerHtml.includes('cdn.shopify.com') ||
        lowerHtml.includes('shopify.theme') ||
        lowerHtml.includes('shopify-section') ||
        lowerHtml.includes('myshopify.com')) {

        evidence.push('Shopify CDN and patterns detected');
        return {
            category: 'cms',
            name: 'Shopify',
            confidence: 'high',
            evidence
        };
    }

    // Wix
    if (lowerHtml.includes('wix.com') ||
        lowerHtml.includes('_wix') ||
        lowerHtml.includes('wixstatic.com') ||
        lowerHtml.includes('wix-code')) {

        evidence.push('Wix patterns detected');
        return {
            category: 'cms',
            name: 'Wix',
            confidence: 'high',
            evidence
        };
    }

    // Magento
    if (lowerHtml.includes('magento') ||
        lowerHtml.includes('mage.cookies') ||
        lowerHtml.includes('/skin/frontend/') ||
        lowerHtml.includes('mage/') ||
        lowerHtml.match(/var\s+mage\s*=/i)) {

        evidence.push('Magento patterns detected');
        return {
            category: 'cms',
            name: 'Magento',
            confidence: 'high',
            evidence
        };
    }

    // Squarespace
    if (lowerHtml.includes('squarespace') ||
        lowerHtml.includes('squarespace.com') ||
        lowerHtml.includes('sqsp')) {

        evidence.push('Squarespace detected');
        return {
            category: 'cms',
            name: 'Squarespace',
            confidence: 'high',
            evidence
        };
    }

    // Webflow
    if (lowerHtml.includes('webflow') ||
        lowerHtml.includes('webflow.com') ||
        lowerHtml.includes('webflow.io')) {

        evidence.push('Webflow detected');
        return {
            category: 'cms',
            name: 'Webflow',
            confidence: 'high',
            evidence
        };
    }

    // Ghost
    if (lowerHtml.includes('ghost') && lowerHtml.includes('casper') ||
        lowerHtml.includes('ghost.org')) {

        evidence.push('Ghost CMS detected');
        return {
            category: 'cms',
            name: 'Ghost',
            confidence: 'medium',
            evidence
        };
    }

    return {
        category: 'cms',
        name: 'Custom Built / Vanilla',
        confidence: 'low',
        evidence: ['No known CMS signatures detected']
    };
}

/**
 * Detect programming language - Enhanced detection
 */
function detectLanguage(headers: Headers, html: string, cms: TechnologyFingerprint | null): TechnologyFingerprint | null {
    const evidence: string[] = [];
    const poweredBy = headers.get('x-powered-by')?.toLowerCase() || '';
    const aspNetVersion = headers.get('x-aspnet-version');
    const lowerHtml = html.toLowerCase();

    // If CMS detected, infer language
    if (cms) {
        if (cms.name === 'WordPress' || cms.name === 'Joomla' || cms.name === 'Drupal' || cms.name === 'Magento') {
            return {
                category: 'language',
                name: 'PHP',
                confidence: 'high',
                evidence: [`Based on CMS: ${cms.name}`]
            };
        }
    }

    // PHP - Enhanced detection
    if (poweredBy.includes('php') ||
        headers.get('x-php-version') ||
        lowerHtml.includes('.php') ||
        lowerHtml.match(/\.php\?/i) ||
        lowerHtml.includes('phpsessid') ||
        headers.get('set-cookie')?.toLowerCase().includes('phpsessid')) {

        const version = poweredBy.match(/php\/([\d.]+)/)?.[1] || headers.get('x-php-version') || undefined;
        evidence.push(poweredBy ? `X-Powered-By: ${poweredBy}` : 'PHP patterns detected');

        return {
            category: 'language',
            name: 'PHP',
            version,
            confidence: 'high',
            evidence
        };
    }

    // ASP.NET
    if (aspNetVersion ||
        poweredBy.includes('asp.net') ||
        lowerHtml.includes('__viewstate') ||
        lowerHtml.includes('asp.net') ||
        lowerHtml.includes('.aspx') ||
        headers.get('x-aspnetmvc-version')) {

        evidence.push(aspNetVersion ? `X-AspNet-Version: ${aspNetVersion}` : 'ASP.NET patterns detected');
        return {
            category: 'language',
            name: 'ASP.NET',
            version: aspNetVersion || undefined,
            confidence: 'high',
            evidence
        };
    }

    // Node.js / Express - Enhanced
    if (poweredBy.includes('express') ||
        lowerHtml.includes('node.js') ||
        lowerHtml.includes('nodejs') ||
        headers.get('x-powered-by')?.includes('Express')) {

        evidence.push('Express/Node.js detected');
        return {
            category: 'language',
            name: 'Node.js',
            confidence: 'high',
            evidence
        };
    }

    // Python (Django/Flask) - Enhanced
    if (lowerHtml.includes('csrfmiddlewaretoken') ||
        lowerHtml.includes('__django') ||
        lowerHtml.includes('django') ||
        headers.get('x-frame-options')?.includes('DENY') && lowerHtml.includes('csrf') ||
        poweredBy.includes('python')) {

        evidence.push('Django/Python patterns detected');
        return {
            category: 'language',
            name: 'Python',
            confidence: 'high',
            evidence
        };
    }

    // Ruby on Rails - Enhanced
    if (headers.get('x-runtime') ||
        lowerHtml.includes('csrf-param') ||
        lowerHtml.includes('rails') ||
        lowerHtml.includes('authenticity_token') ||
        headers.get('x-request-id')?.match(/^[a-f0-9-]{36}$/)) {

        evidence.push('Rails patterns detected');
        return {
            category: 'language',
            name: 'Ruby',
            confidence: 'high',
            evidence
        };
    }

    // Java - Enhanced
    if (lowerHtml.includes('jsessionid') ||
        headers.get('set-cookie')?.toLowerCase().includes('jsessionid') ||
        lowerHtml.includes('.jsp') ||
        lowerHtml.includes('javax.faces') ||
        lowerHtml.includes('java')) {

        evidence.push('Java/JSP detected');
        return {
            category: 'language',
            name: 'Java',
            confidence: 'high',
            evidence
        };
    }

    // Go
    if (lowerHtml.includes('gorilla') ||
        poweredBy.includes('go') ||
        headers.get('server')?.toLowerCase().includes('go')) {

        evidence.push('Go patterns detected');
        return {
            category: 'language',
            name: 'Go',
            confidence: 'medium',
            evidence
        };
    }

    return null;
}

/**
 * Infer database based on CMS and language
 */
function detectDatabase(cms: TechnologyFingerprint | null, language: TechnologyFingerprint | null, html: string): TechnologyFingerprint | null {
    const evidence: string[] = [];

    // Based on CMS
    if (cms) {
        if (cms.name === 'WordPress' || cms.name === 'Joomla' || cms.name === 'Drupal') {
            return {
                category: 'database',
                name: 'MySQL',
                confidence: 'high',
                evidence: [`Standard database for ${cms.name}`]
            };
        }

        if (cms.name === 'Magento') {
            return {
                category: 'database',
                name: 'MySQL/MariaDB',
                confidence: 'high',
                evidence: ['Standard for Magento']
            };
        }
    }

    // Based on language
    if (language) {
        if (language.name === 'ASP.NET') {
            return {
                category: 'database',
                name: 'Microsoft SQL Server',
                confidence: 'medium',
                evidence: ['Common with ASP.NET']
            };
        }

        if (language.name === 'PHP') {
            return {
                category: 'database',
                name: 'MySQL/MariaDB',
                confidence: 'medium',
                evidence: ['Common with PHP']
            };
        }

        if (language.name === 'Node.js') {
            return {
                category: 'database',
                name: 'MongoDB',
                confidence: 'low',
                evidence: ['Common with Node.js (MERN/MEAN stack)']
            };
        }

        if (language.name === 'Python') {
            return {
                category: 'database',
                name: 'PostgreSQL',
                confidence: 'low',
                evidence: ['Common with Python/Django']
            };
        }
    }

    return null;
}

/**
 * Detect frameworks
 */
function detectFrameworks(headers: Headers, html: string): TechnologyFingerprint[] {
    const frameworks: TechnologyFingerprint[] = [];

    // React
    if (html.includes('react') || html.match(/__REACT_/)) {
        frameworks.push({
            category: 'framework',
            name: 'React',
            confidence: 'high',
            evidence: ['React patterns in HTML']
        });
    }

    // Next.js
    if (html.includes('__NEXT_DATA__') || html.includes('/_next/')) {
        frameworks.push({
            category: 'framework',
            name: 'Next.js',
            confidence: 'high',
            evidence: ['Next.js patterns detected']
        });
    }

    // Vue.js
    if (html.includes('vue') || html.match(/data-v-[\w]+/)) {
        frameworks.push({
            category: 'framework',
            name: 'Vue.js',
            confidence: 'high',
            evidence: ['Vue.js patterns in HTML']
        });
    }

    // Angular
    if (html.includes('ng-version') || html.includes('angular')) {
        const version = html.match(/ng-version="([\d.]+)"/)?.[1];
        frameworks.push({
            category: 'framework',
            name: 'Angular',
            version,
            confidence: 'high',
            evidence: ['Angular attributes detected']
        });
    }

    // Bootstrap
    if (html.includes('bootstrap') || html.match(/class="[^"]*\bcontainer\b/)) {
        frameworks.push({
            category: 'framework',
            name: 'Bootstrap',
            confidence: 'medium',
            evidence: ['Bootstrap classes detected']
        });
    }

    return frameworks;
}

/**
 * Detect JavaScript libraries
 */
function detectLibraries(html: string): TechnologyFingerprint[] {
    const libraries: TechnologyFingerprint[] = [];

    // jQuery
    const jqueryMatch = html.match(/jquery[.-]([\d.]+)/i);
    if (jqueryMatch || html.includes('jquery')) {
        libraries.push({
            category: 'library',
            name: 'jQuery',
            version: jqueryMatch?.[1],
            confidence: 'high',
            evidence: ['jQuery detected in HTML']
        });
    }

    // Google Analytics
    if (html.includes('google-analytics') || html.includes('gtag') || html.includes('ga.js')) {
        libraries.push({
            category: 'library',
            name: 'Google Analytics',
            confidence: 'high',
            evidence: ['GA tracking code detected']
        });
    }

    // Font Awesome
    if (html.includes('font-awesome') || html.includes('fontawesome')) {
        libraries.push({
            category: 'library',
            name: 'Font Awesome',
            confidence: 'high',
            evidence: ['Font Awesome detected']
        });
    }

    return libraries;
}
