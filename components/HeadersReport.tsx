import { HeaderResult } from '@/lib/headers';
import { FileCode, CheckCircle, XCircle, Shield } from 'lucide-react';
import { clsx } from 'clsx';

interface HeadersReportProps {
    headers?: HeaderResult[];
}

export default function HeadersReport({ headers }: HeadersReportProps) {
    if (!headers || headers.length === 0) {
        return (
            <div className="terminal-panel p-6 scanline">
                <div className="flex items-center gap-3 mb-4">
                    <FileCode className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-bold text-gray-600 uppercase tracking-wider font-mono">
                        SECURITY_HEADERS
                    </h3>
                </div>
                <div className="text-center py-12">
                    <Shield className="h-16 w-16 text-gray-800 mx-auto mb-4 opacity-50" />
                    <p className="text-gray-600 font-mono text-sm">
                        // No headers data available
                    </p>
                </div>
            </div>
        );
    }

    const goodHeaders = headers.filter(h => h.status === 'good').length;
    const badHeaders = headers.filter(h => h.status === 'bad').length;
    const totalHeaders = headers.length;

    return (
        <div className="terminal-panel overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 scanline">
            {/* Header */}
            <div className="p-4 border-b border-green-500/20 bg-black/40">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <FileCode className="h-5 w-5 text-purple-400" />
                        <h3 className="text-lg font-bold text-purple-400 uppercase tracking-wider font-mono">
                            HTTP_SECURITY_HEADERS
                        </h3>
                    </div>
                    <div className="flex gap-3 text-xs font-mono">
                        <div className="flex items-center gap-2 px-3 py-1 rounded bg-green-500/10 border border-green-500/30">
                            <CheckCircle className="h-3 w-3 text-green-400" />
                            <span className="text-green-400 font-bold">{goodHeaders}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 rounded bg-red-500/10 border border-red-500/30">
                            <XCircle className="h-3 w-3 text-red-400" />
                            <span className="text-red-400 font-bold">{badHeaders}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Headers List */}
            <div className="p-6 space-y-3">
                {headers.map((header, idx) => {
                    const isGood = header.status === 'good';
                    const statusColor = isGood ? 'text-green-400' : 'text-red-400';
                    const statusBg = isGood ? 'bg-green-500/5' : 'bg-red-500/5';
                    const statusBorder = isGood ? 'border-green-500/20' : 'border-red-500/20';
                    const StatusIcon = isGood ? CheckCircle : XCircle;

                    return (
                        <div
                            key={idx}
                            className={clsx(
                                "border rounded-lg p-4 transition-all hover:border-opacity-60",
                                statusBg,
                                statusBorder,
                                "border"
                            )}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    {/* Header Name */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <StatusIcon className={clsx("h-4 w-4 flex-shrink-0", statusColor)} />
                                        <code className={clsx("font-mono font-bold text-sm", statusColor)}>
                                            {header.name}
                                        </code>
                                    </div>

                                    {/* Description */}
                                    <p className="text-gray-500 text-xs font-mono leading-relaxed ml-6">
                                        {header.description}
                                    </p>

                                    {/* Value if present */}
                                    {header.value && (
                                        <div className="mt-2 ml-6">
                                            <div className="text-[10px] text-gray-700 uppercase tracking-wider mb-1 font-mono">
                                                VALUE:
                                            </div>
                                            <code className="text-xs text-cyan-400 font-mono bg-black/40 px-2 py-1 rounded border border-cyan-500/20">
                                                {header.value}
                                            </code>
                                        </div>
                                    )}
                                </div>

                                {/* Status Badge */}
                                <div className={clsx(
                                    "px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border whitespace-nowrap",
                                    isGood
                                        ? "bg-green-500/10 text-green-400 border-green-500/30"
                                        : "bg-red-500/10 text-red-400 border-red-500/30"
                                )}>
                                    {isGood ? 'OK' : 'MISSING'}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer Stats */}
            <div className="p-4 bg-black/40 border-t border-green-500/20">
                <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                        <span className="text-gray-500">Total Headers Verificados:</span>
                        <span className="text-purple-400 font-bold">{totalHeaders}</span>
                    </div>
                    <div className="text-gray-700">
                        {((goodHeaders / totalHeaders) * 100).toFixed(1)}% compliant
                    </div>
                </div>
            </div>

            {/* ASCII Decoration */}
            <div className="px-6 pb-4 text-[8px] text-purple-900 font-mono opacity-20 select-none text-center">
                // HEADER_ANALYSIS_COMPLETE
            </div>
        </div>
    );
}
