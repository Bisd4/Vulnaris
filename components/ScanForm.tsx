'use client';

import { useState } from 'react';
import { Terminal, Loader2, Zap } from 'lucide-react';
import { ScanResult } from '@/lib/scanner';

interface ScanFormProps {
    onScanStart: () => void;
    onScanComplete: (data: ScanResult) => void;
    onError: (msg: string) => void;
}

export default function ScanForm({ onScanStart, onScanComplete, onError }: ScanFormProps) {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        setLoading(true);
        onScanStart();
        onError('');

        try {
            const res = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Error al escanear');
            }

            onScanComplete(data);
        } catch (err: any) {
            onError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto mb-12 relative z-10">
            <div className="terminal-panel p-6 scanline">
                {/* Terminal Header */}
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-green-500/20">
                    <Terminal className="h-5 w-5 text-green-400" />
                    <span className="text-green-400 font-bold text-sm uppercase tracking-wider font-mono">
                        Terminal de Escaneo
                    </span>
                    <div className="ml-auto flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors cursor-pointer" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors cursor-pointer" />
                        <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 transition-colors cursor-pointer animate-pulse" />
                    </div>
                </div>

                {/* Command Line Input */}
                <div className="flex flex-col sm:flex-row items-stretch gap-3">
                    <div className="flex-grow relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-cyan-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative flex items-center bg-black/60 border-2 border-green-500/30 rounded-lg overflow-hidden hover:border-green-500/50 transition-all">
                            {/* Terminal Prompt */}
                            <div className="px-4 py-4 bg-green-500/10 border-r border-green-500/30 flex items-center gap-2">
                                <span className="text-green-400 font-bold font-mono select-none">root@vulnaris</span>
                                <span className="text-gray-500 font-mono">~</span>
                                <span className="text-green-400 font-bold font-mono">$</span>
                            </div>

                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="ejm= google.com"
                                className="flex-1 px-4 py-4 bg-transparent border-none text-green-400 placeholder-green-900/50 focus:ring-0 focus:outline-none text-base font-mono font-medium"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !url}
                        className="neon-button px-8 py-4 rounded-lg font-mono flex items-center justify-center gap-2 min-w-[180px] relative z-10 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>ESCANEANDO...</span>
                            </>
                        ) : (
                            <>
                                <Zap className="h-5 w-5" />
                                <span>EJECUTAR</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Loading Animation */}
                {loading && (
                    <div className="mt-4 p-4 bg-black/60 border border-green-500/20 rounded-lg">
                        <div className="flex items-center gap-3 text-green-400 font-mono text-sm">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500">[</span>
                                    <span className="animate-pulse">●</span>
                                    <span className="text-gray-500">]</span>
                                    <span>Resolviendo DNS...</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500">[</span>
                                    <span className="animate-pulse delay-100">●</span>
                                    <span className="text-gray-500">]</span>
                                    <span>Analizando puertos...</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500">[</span>
                                    <span className="animate-pulse delay-200">●</span>
                                    <span className="text-gray-500">]</span>
                                    <span>Verificando SSL/TLS...</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500">[</span>
                                    <span className="animate-pulse delay-300">●</span>
                                    <span className="text-gray-500">]</span>
                                    <span>Escaneando vulnerabilidades...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </form>
    );
}
