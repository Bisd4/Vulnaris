import { FingerprintResult, TechnologyFingerprint } from '@/lib/fingerprint';
import { Code, Database, Server, Layers, Package, Info, Shield } from 'lucide-react';
import { clsx } from 'clsx';

interface FingerprintReportProps {
    fingerprint: FingerprintResult;
}

export default function FingerprintReport({ fingerprint }: FingerprintReportProps) {
    const { cms, language, database, server, frameworks, libraries } = fingerprint;

    // Check if we have any data
    const hasData = cms || language || database || server || frameworks.length > 0 || libraries.length > 0;

    if (!hasData) {
        return (
            <div className="terminal-panel p-6 scanline mt-6">
                <div className="flex items-center gap-3 mb-4">
                    <Shield className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-bold text-gray-600 uppercase tracking-wider font-mono">
                        FINGERPRINTING
                    </h3>
                </div>
                <div className="text-center py-8">
                    <Info className="h-12 w-12 text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-600 font-mono text-sm">
                        No se pudo detectar información de tecnologías
                    </p>
                </div>
            </div>
        );
    }

    const TechBadge = ({ tech }: { tech: TechnologyFingerprint }) => {
        let confidenceColor = 'text-blue-400 border-blue-500/30 bg-blue-500/10';
        if (tech.confidence === 'high') confidenceColor = 'text-green-400 border-green-500/30 bg-green-500/10';
        else if (tech.confidence === 'medium') confidenceColor = 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
        else if (tech.confidence === 'low') confidenceColor = 'text-gray-400 border-gray-500/30 bg-gray-500/10';

        return (
            <div className={clsx("border rounded p-4 transition-all hover:scale-105", confidenceColor)}>
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className={clsx("font-mono font-bold text-base flex-1", confidenceColor.split(' ')[0])}>
                        {tech.name}
                        {tech.version && <span className="text-sm ml-2 opacity-70">v{tech.version}</span>}
                    </div>
                    <div className={clsx(
                        "text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border flex-shrink-0",
                        confidenceColor
                    )}>
                        {tech.confidence}
                    </div>
                </div>
                {tech.evidence.length > 0 && (
                    <div className="text-xs text-gray-500 font-mono mt-3 space-y-1">
                        {tech.evidence.slice(0, 2).map((ev, idx) => (
                            <div key={idx} className="flex items-start gap-1">
                                <span className="text-cyan-400">•</span>
                                <span className="leading-tight break-words">{ev}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="terminal-panel overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400 scanline mt-6">
            {/* Header */}
            <div className="p-4 border-b border-green-500/20 bg-black/40">
                <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-purple-400" />
                    <h3 className="text-lg font-bold text-purple-400 uppercase tracking-wider font-mono">
                        FINGERPRINTING
                    </h3>
                </div>
                <p className="text-gray-500 text-[10px] uppercase tracking-wider font-mono mt-1">
                    Detección de tecnologías web
                </p>
            </div>

            <div className="p-6 space-y-6">
                {/* Primary Technologies - 2x2 Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* CMS */}
                    <div className="bg-black/40 border border-cyan-500/20 rounded-lg p-5">
                        <div className="flex items-center gap-2 text-cyan-400 text-sm uppercase tracking-wider mb-4 font-mono font-bold">
                            <Package className="h-5 w-5" />
                            CMS
                        </div>
                        {cms ? (
                            <TechBadge tech={cms} />
                        ) : (
                            <div className="text-gray-600 font-mono text-sm py-4 text-center">
                                No detectado
                            </div>
                        )}
                    </div>

                    {/* Language */}
                    <div className="bg-black/40 border border-green-500/20 rounded-lg p-5">
                        <div className="flex items-center gap-2 text-green-400 text-sm uppercase tracking-wider mb-4 font-mono font-bold">
                            <Code className="h-5 w-5" />
                            Lenguaje
                        </div>
                        {language ? (
                            <TechBadge tech={language} />
                        ) : (
                            <div className="text-gray-600 font-mono text-sm py-4 text-center">
                                No detectado
                            </div>
                        )}
                    </div>

                    {/* Database */}
                    <div className="bg-black/40 border border-yellow-500/20 rounded-lg p-5">
                        <div className="flex items-center gap-2 text-yellow-400 text-sm uppercase tracking-wider mb-4 font-mono font-bold">
                            <Database className="h-5 w-5" />
                            Base de Datos
                        </div>
                        {database ? (
                            <TechBadge tech={database} />
                        ) : (
                            <div className="text-gray-600 font-mono text-sm py-4 text-center">
                                No detectada
                            </div>
                        )}
                    </div>

                    {/* Server */}
                    <div className="bg-black/40 border border-purple-500/20 rounded-lg p-5">
                        <div className="flex items-center gap-2 text-purple-400 text-sm uppercase tracking-wider mb-4 font-mono font-bold">
                            <Server className="h-5 w-5" />
                            Servidor
                        </div>
                        {server ? (
                            <TechBadge tech={server} />
                        ) : (
                            <div className="text-gray-600 font-mono text-sm py-4 text-center">
                                No detectado
                            </div>
                        )}
                    </div>
                </div>

                {/* Frameworks & Libraries */}
                {(frameworks.length > 0 || libraries.length > 0) && (
                    <div className="space-y-4 pt-4 border-t border-green-500/20">
                        {/* Frameworks */}
                        {frameworks.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 text-orange-400 text-xs uppercase tracking-wider mb-3 font-mono font-bold">
                                    <Layers className="h-4 w-4" />
                                    Frameworks ({frameworks.length})
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {frameworks.map((fw, idx) => (
                                        <TechBadge key={idx} tech={fw} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Libraries */}
                        {libraries.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 text-blue-400 text-xs uppercase tracking-wider mb-3 font-mono font-bold">
                                    <Package className="h-4 w-4" />
                                    Librerías ({libraries.length})
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {libraries.map((lib, idx) => (
                                        <TechBadge key={idx} tech={lib} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer Info */}
            <div className="p-4 bg-black/40 border-t border-green-500/20">
                <div className="flex items-start gap-2 text-[10px] text-gray-400 font-mono">
                    <Info className="h-3 w-3 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <span className="text-purple-400 font-bold">INFO:</span> Detección pasiva basada en headers HTTP, contenido HTML y patrones de código.
                        Niveles de confianza: HIGH (confirmado), MEDIUM (probable), LOW (posible).
                    </div>
                </div>
            </div>

            {/* ASCII Footer */}
            <div className="px-6 pb-4 text-[8px] text-purple-900 font-mono opacity-20 select-none text-center">
                ╔════════════════════════════╗<br />
                ║  TECH_FINGERPRINT_v1.0  ║<br />
                ╚════════════════════════════╝
            </div>
        </div>
    );
}
