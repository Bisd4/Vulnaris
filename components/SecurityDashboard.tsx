import { ShieldCheck, ShieldAlert, Activity, Lock, Zap } from 'lucide-react';
import { clsx } from 'clsx';

interface SecurityDashboardProps {
    score: number;
    openPortsCount: number;
}

export default function SecurityDashboard({ score, openPortsCount }: SecurityDashboardProps) {
    let status = 'SEGURO';
    let color = 'text-green-400';
    let bgColor = 'bg-green-500/10';
    let borderColor = 'border-green-500/30';
    let Icon = ShieldCheck;
    let barColor = 'bg-green-500';

    if (score < 50) {
        status = 'VULNERABLE';
        color = 'text-red-400';
        bgColor = 'bg-red-500/10';
        borderColor = 'border-red-500/30';
        Icon = ShieldAlert;
        barColor = 'bg-red-500';
    } else if (score < 80) {
        status = 'PRECAUCIÓN';
        color = 'text-yellow-400';
        bgColor = 'bg-yellow-500/10';
        borderColor = 'border-yellow-500/30';
        Icon = ShieldAlert;
        barColor = 'bg-yellow-500';
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Security Score Card */}
            <div className="terminal-panel p-6 relative overflow-hidden group scanline">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all" />

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider font-mono">
                            SEGURIDAD
                        </span>
                        <Icon className={clsx("h-8 w-8 opacity-50", color)} />
                    </div>

                    <div className="mb-4">
                        <div className="flex items-baseline gap-2 mb-2">
                            <h2 className={clsx("text-6xl font-black font-mono tracking-tighter neon-text")}>
                                {score}
                            </h2>
                            <span className="text-gray-600 font-bold text-xl">/100</span>
                        </div>
                        <div className={clsx("inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wider border", bgColor, borderColor, color)}>
                            {status}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative w-full h-3 bg-black/60 rounded-full overflow-hidden border border-green-500/20">
                        <div
                            className={clsx("h-full transition-all duration-1000 ease-out relative", barColor)}
                            style={{ width: `${score}%` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                        </div>
                    </div>

                    {/* ASCII Art Decoration */}
                    <div className="mt-4 text-[8px] text-green-900 font-mono leading-tight opacity-30 select-none">
                        ╔═══════════════════╗<br />
                        ║ SCORE_CALCULATED  ║<br />
                        ╚═══════════════════╝
                    </div>
                </div>
            </div>

            {/* Status Card */}
            <div className="terminal-panel p-6 group scanline">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400 text-xs font-bold uppercase tracking-wider font-mono">
                        ESTADO DEL SISTEMA
                    </span>
                    <div className={clsx("p-2 rounded border", bgColor, borderColor)}>
                        <Lock className={clsx("h-5 w-5", color)} />
                    </div>
                </div>

                <h3 className={clsx("text-2xl font-black mb-3 uppercase font-mono", color)}>
                    {status}
                </h3>

                <p className="text-gray-500 text-sm leading-relaxed font-mono">
                    {score >= 80
                        ? "// Sistema con protección óptima\n// Exposición mínima detectada"
                        : "// Vulnerabilidades detectadas\n// Requiere atención inmediata"}
                </p>

                {/* Status Indicator */}
                <div className="mt-4 flex items-center gap-2">
                    <div className={clsx("w-2 h-2 rounded-full animate-pulse", color.replace('text-', 'bg-'))} />
                    <span className="text-xs text-gray-600 font-mono">STATUS_ACTIVE</span>
                </div>
            </div>

            {/* Open Ports Summary */}
            <div className="terminal-panel p-6 group scanline">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-400 text-xs font-bold uppercase tracking-wider font-mono">
                        PUERTOS DETECTADOS
                    </span>
                    <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/30">
                        <Activity className="h-5 w-5 text-cyan-400" />
                    </div>
                </div>

                <div className="mb-3">
                    <h2 className="text-5xl font-black text-cyan-400 font-mono neon-text-blue">
                        {openPortsCount}
                    </h2>
                    <p className="text-xs text-gray-600 uppercase tracking-wider font-mono mt-1">
                        Puertos Abiertos
                    </p>
                </div>

                <div className="space-y-2 text-xs font-mono text-gray-500">
                    <div className="flex items-center gap-2">
                        <Zap className="h-3 w-3 text-cyan-400" />
                        <span>Escaneo completado</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Activity className="h-3 w-3 text-cyan-400" />
                        <span>Lista de puertos comunes</span>
                    </div>
                </div>

                {/* Decorative hex */}
                <div className="mt-4 text-[8px] text-cyan-900 font-mono opacity-20 select-none">
                    0x{openPortsCount.toString(16).toUpperCase().padStart(4, '0')}
                </div>
            </div>
        </div>
    );
}
