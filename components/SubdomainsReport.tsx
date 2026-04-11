import { SubdomainResult } from '@/lib/subdomains';
import { Globe, CheckCircle, Network } from 'lucide-react';

interface SubdomainsReportProps {
    subdomains?: SubdomainResult[];
}

export default function SubdomainsReport({ subdomains }: SubdomainsReportProps) {
    if (!subdomains || subdomains.length === 0) {
        return (
            <div className="terminal-panel p-6 scanline">
                <div className="flex items-center gap-3 mb-4">
                    <Globe className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-bold text-gray-600 uppercase tracking-wider font-mono">
                        SUBDOMAIN_ENUM
                    </h3>
                </div>
                <div className="text-center py-12">
                    <Network className="h-16 w-16 text-gray-800 mx-auto mb-4 opacity-50" />
                    <p className="text-gray-600 font-mono text-sm">
                        // No subdomains discovered
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="terminal-panel overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 scanline">
            {/* Header */}
            <div className="p-4 border-b border-green-500/20 bg-black/40">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Network className="h-5 w-5 text-cyan-400" />
                        <h3 className="text-lg font-bold text-cyan-400 uppercase tracking-wider font-mono">
                            Subdominios encontrados
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-xs font-mono">
                        <Globe className="h-3 w-3 text-cyan-400" />
                        <span className="text-cyan-400 font-bold">{subdomains.length} FOUND</span>
                    </div>
                </div>
            </div>

            {/* Subdomain List */}
            <div className="p-6">
                <div className="space-y-2">
                    {subdomains.map((subdomain, idx) => (
                        <div
                            key={idx}
                            className="group flex items-center gap-3 p-3 bg-black/40 border border-green-500/20 rounded-lg hover:bg-green-500/5 hover:border-green-500/30 transition-all"
                        >
                            {/* Connection Line */}
                            <div className="flex flex-col items-center">
                                <div className="w-px h-3 bg-cyan-500/30" />
                                <div className="w-2 h-2 rounded-full bg-cyan-500 group-hover:bg-cyan-400 transition-colors" />
                                {idx < subdomains.length - 1 && (
                                    <div className="w-px h-3 bg-cyan-500/30" />
                                )}
                            </div>

                            {/* Subdomain Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <CheckCircle className="h-3 w-3 text-green-400 flex-shrink-0" />
                                    <code className="text-cyan-400 font-mono font-bold text-sm truncate">
                                        {subdomain.subdomain}
                                    </code>
                                </div>
                                {subdomain.ip && (
                                    <div className="text-gray-600 text-xs font-mono ml-5">
                                        IP: <span className="text-gray-500">{subdomain.ip}</span>
                                    </div>
                                )}
                            </div>

                            {/* Active Indicator */}
                            <div className="flex items-center gap-2 px-2 py-1 bg-green-500/10 border border-green-500/30 rounded text-[10px] font-bold text-green-400 uppercase tracking-wider">
                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                ACTIVE
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-black/40 border-t border-green-500/20">
                <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                        <span className="text-gray-500">Subdominios Encontrados:</span>
                        <span className="text-cyan-400 font-bold">{subdomains.length}</span>
                    </div>
                    <div className="text-gray-700">
                        ENUM_COMPLETE
                    </div>
                </div>
            </div>

            {/* Network Diagram Decoration */}
            <div className="px-6 pb-4 text-[8px] text-cyan-900 font-mono opacity-20 select-none text-center">
                ┌─────────────────────┐<br />
                │  NETWORK_TOPOLOGY   │<br />
                └─────────────────────┘
            </div>
        </div>
    );
}
