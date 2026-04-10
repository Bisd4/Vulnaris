import { SSLResult } from '@/lib/ssl';
import { Shield, Lock, Calendar, AlertTriangle, CheckCircle, Server } from 'lucide-react';
import { clsx } from 'clsx';

interface SSLReportProps {
    ssl?: SSLResult;
}

export default function SSLReport({ ssl }: SSLReportProps) {
    if (!ssl) {
        return (
            <div className="terminal-panel p-6 scanline">
                <div className="flex items-center gap-3 mb-4">
                    <Lock className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-bold text-gray-600 uppercase tracking-wider font-mono">
                        SSL/TLS_ANALYSIS
                    </h3>
                </div>
                <div className="text-center py-12">
                    <Shield className="h-16 w-16 text-gray-800 mx-auto mb-4 opacity-50" />
                    <p className="text-gray-600 font-mono text-sm">
                        // No SSL data available<br />
                        // HTTPS not detected
                    </p>
                </div>
            </div>
        );
    }

    const isValid = ssl.valid && ssl.daysRemaining > 0;
    const hasHSTS = ssl.hsts;
    const isExpiringSoon = ssl.daysRemaining < 30 && ssl.daysRemaining > 0;

    let statusColor = 'text-green-400';
    let statusBg = 'bg-green-500/10';
    let statusBorder = 'border-green-500/30';
    let statusText = 'CERTIFICADO VÁLIDO';
    let StatusIcon = CheckCircle;

    if (!isValid) {
        statusColor = 'text-red-400';
        statusBg = 'bg-red-500/10';
        statusBorder = 'border-red-500/30';
        statusText = 'CERTIFICADO INVÁLIDO';
        StatusIcon = AlertTriangle;
    } else if (isExpiringSoon) {
        statusColor = 'text-yellow-400';
        statusBg = 'bg-yellow-500/10';
        statusBorder = 'border-yellow-500/30';
        statusText = 'EXPIRA PRONTO';
        StatusIcon = AlertTriangle;
    }

    return (
        <div className="terminal-panel overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 scanline">
            {/* Header */}
            <div className="p-4 border-b border-green-500/20 bg-black/40">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Lock className="h-5 w-5 text-cyan-400" />
                        <h3 className="text-lg font-bold text-cyan-400 uppercase tracking-wider font-mono">
                            SSL/TLS_CERTIFICATE
                        </h3>
                    </div>
                    <div className={clsx("flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-bold uppercase", statusBg, statusBorder, statusColor)}>
                        <StatusIcon className="h-3 w-3" />
                        {statusText}
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Certificate Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Issuer */}
                    <div className="bg-black/40 border border-green-500/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-2 font-mono">
                            <Server className="h-3 w-3" />
                            Issuer
                        </div>
                        <div className="text-green-400 font-mono font-bold text-sm break-all">
                            {ssl.issuer || 'Unknown'}
                        </div>
                    </div>

                    {/* Subject */}
                    <div className="bg-black/40 border border-green-500/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-2 font-mono">
                            <Shield className="h-3 w-3" />
                            Subject
                        </div>
                        <div className="text-green-400 font-mono font-bold text-sm break-all">
                            {ssl.subject || 'Unknown'}
                        </div>
                    </div>

                    {/* Valid From */}
                    <div className="bg-black/40 border border-green-500/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-2 font-mono">
                            <Calendar className="h-3 w-3" />
                            Valid From
                        </div>
                        <div className="text-cyan-400 font-mono text-sm">
                            {ssl.validFrom ? new Date(ssl.validFrom).toLocaleDateString() : 'N/A'}
                        </div>
                    </div>

                    {/* Valid To */}
                    <div className="bg-black/40 border border-green-500/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wider mb-2 font-mono">
                            <Calendar className="h-3 w-3" />
                            Valid To
                        </div>
                        <div className={clsx("font-mono text-sm font-bold", isExpiringSoon ? 'text-yellow-400' : 'text-cyan-400')}>
                            {ssl.validTo ? new Date(ssl.validTo).toLocaleDateString() : 'N/A'}
                        </div>
                    </div>
                </div>

                {/* Days Remaining */}
                <div className="bg-black/60 border-2 border-cyan-500/30 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-400 text-xs uppercase tracking-wider font-mono font-bold">
                            Tiempo Restante
                        </span>
                        <div className={clsx("w-3 h-3 rounded-full animate-pulse", isValid ? 'bg-green-500' : 'bg-red-500')} />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className={clsx("text-5xl font-black font-mono", statusColor)}>
                            {ssl.daysRemaining}
                        </span>
                        <span className="text-gray-600 font-mono text-lg">días</span>
                    </div>
                </div>

                {/* Protocol & HSTS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Protocols */}
                    <div className="bg-black/40 border border-green-500/20 rounded-lg p-4">
                        <div className="text-gray-500 text-xs uppercase tracking-wider mb-3 font-mono font-bold">
                            Protocolos
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {ssl.protocols && ssl.protocols.length > 0 ? (
                                ssl.protocols.map((protocol, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded text-xs font-mono font-bold uppercase"
                                    >
                                        {protocol}
                                    </span>
                                ))
                            ) : (
                                <span className="text-gray-700 text-xs font-mono">No protocols detected</span>
                            )}
                        </div>
                    </div>

                    {/* HSTS */}
                    <div className="bg-black/40 border border-green-500/20 rounded-lg p-4">
                        <div className="text-gray-500 text-xs uppercase tracking-wider mb-3 font-mono font-bold">
                            HSTS Enabled
                        </div>
                        <div className="flex items-center gap-3">
                            {hasHSTS ? (
                                <>
                                    <CheckCircle className="h-6 w-6 text-green-400" />
                                    <span className="text-green-400 font-mono font-bold">YES</span>
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="h-6 w-6 text-red-400" />
                                    <span className="text-red-400 font-mono font-bold">NO</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Note */}
                <div className="text-[8px] text-green-900 font-mono opacity-30 select-none text-center">
                    ╔════════════════════════════════════╗<br />
                    ║  CERTIFICATE_CHAIN_VERIFIED_OK  ║<br />
                    ╚════════════════════════════════════╝
                </div>
            </div>
        </div>
    );
}
