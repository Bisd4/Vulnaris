import { ScanResult } from '@/lib/scanner';
import { CheckCircle, XCircle, AlertTriangle, Server, Terminal } from 'lucide-react';
import { clsx } from 'clsx';

interface ScanResultsProps {
    results: ScanResult;
}

export default function ScanResults({ results }: ScanResultsProps) {
    return (
        <div className="terminal-panel overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 scanline">
            {/* Terminal Header */}
            <div className="p-4 border-b border-green-500/20 bg-black/40">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Terminal className="h-5 w-5 text-green-400" />
                        <h3 className="text-lg font-bold text-green-400 uppercase tracking-wider font-mono">
                            Puertos escaneados
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-black/60 border border-green-500/30">
                        <Server className="h-4 w-4 text-cyan-400" />
                        <span className="text-xs text-gray-500 font-mono">TARGET:</span>
                        <span className="text-cyan-400 font-mono font-bold">{results.host}</span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono">
                    <thead className="bg-black/60 text-green-400 text-xs uppercase tracking-wider font-bold border-b-2 border-green-500/30">
                        <tr>
                            <th className="px-6 py-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600">#</span>
                                    <span>Puerto</span>
                                </div>
                            </th>
                            <th className="px-6 py-3">Servicio</th>
                            <th className="px-6 py-3">Estado</th>
                            <th className="px-6 py-3 text-right">Nivel de Riesgo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-green-500/10">
                        {results.ports.map((port) => {
                            const isOpen = port.status === 'open';
                            const isWebPort = [80, 443].includes(port.port);

                            // Risk Logic
                            let riskLevel = 'SEGURO';
                            let riskColor = 'text-green-400';
                            let statusBadge = 'bg-green-500/10 text-green-400 border-green-500/30';
                            let statusIcon = CheckCircle;

                            if (isOpen) {
                                if (isWebPort) {
                                    riskLevel = 'INFO';
                                    riskColor = 'text-yellow-400';
                                    statusBadge = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
                                    statusIcon = AlertTriangle;
                                } else {
                                    riskLevel = 'CRÍTICO';
                                    riskColor = 'text-red-400';
                                    statusBadge = 'bg-red-500/10 text-red-400 border-red-500/30';
                                    statusIcon = XCircle;
                                }
                            }

                            const StatusIcon = statusIcon;

                            return (
                                <tr
                                    key={port.port}
                                    className="hover:bg-green-500/5 transition-colors group border-l-2 border-transparent hover:border-green-500/50"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-gray-700 text-xs">0x</span>
                                            <span className="text-green-400 font-bold group-hover:text-green-300 transition-colors">
                                                {port.port}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 group-hover:text-gray-300 transition-colors">
                                        {port.service}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={clsx(
                                            "inline-flex items-center gap-2 px-3 py-1 rounded border text-xs font-bold uppercase tracking-wider",
                                            statusBadge
                                        )}>
                                            <StatusIcon className="h-3 w-3" />
                                            {isOpen ? 'OPEN' : 'CLOSED'}
                                        </span>
                                    </td>
                                    <td className={clsx("px-6 py-4 text-right font-bold uppercase text-sm", riskColor)}>
                                        {riskLevel}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer Stats */}
            <div className="p-4 bg-black/40 border-t border-green-500/20">
                <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-gray-500">Total Escaneados:</span>
                            <span className="text-green-400 font-bold">{results.ports.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-gray-500">Puertos Abiertos:</span>
                            <span className="text-red-400 font-bold">
                                {results.ports.filter(p => p.status === 'open').length}
                            </span>
                        </div>
                    </div>
                    <div className="text-gray-700 text-[10px]">
                        SCAN_ID: {results.timestamp.slice(0, 10)}
                    </div>
                </div>
            </div>
        </div>
    );
}
