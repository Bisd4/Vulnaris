'use client';

import { useState } from 'react';
import ScanForm from '@/components/ScanForm';
import ScanResults from '@/components/ScanResults';
import SecurityDashboard from '@/components/SecurityDashboard';
import SSLReport from '@/components/SSLReport';
import HeadersReport from '@/components/HeadersReport';
import SubdomainsReport from '@/components/SubdomainsReport';
import VulnerabilityReport from '@/components/VulnerabilityReport';
import UptimeReport from '@/components/UptimeReport';
import FingerprintReport from '@/components/FingerprintReport';
import { ScanResult } from '@/lib/scanner';
import { Terminal, AlertCircle, Cpu } from 'lucide-react';

export default function Home() {
  const [scanData, setScanData] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');

  const handleScanStart = () => {
    setScanData(null);
    setError('');
  };

  const handleScanComplete = (data: ScanResult) => {
    setScanData(data);
  };

  const handleError = (msg: string) => {
    setError(msg);
  };

  return (
    <main className="min-h-screen p-4 md:p-8 lg:p-12 relative overflow-hidden">
      {/* Scanline Overlay */}
      <div className="scanline fixed inset-0 pointer-events-none z-50" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12 space-y-6 pt-12 animate-in fade-in slide-in-from-top-8 duration-700">
          {/* Terminal Icon */}
          <div className="inline-flex items-center justify-center p-4 terminal-panel mb-6 group hover:scale-105 transition-transform">
            <Terminal className="h-14 w-14 text-green-400 group-hover:text-cyan-400 transition-colors" />
            <div className="absolute -inset-4 bg-green-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight font-mono uppercase">
              <span className="neon-text">Vulnaris</span>
            </h1>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 font-mono">
              <Cpu className="h-4 w-4" />
              <span>by: Nolberto Cerna</span>
            </div>
          </div>

          {/* Description */}
          <div className="terminal-panel max-w-3xl mx-auto p-6">
            <div className="flex items-start gap-3 text-left">
              <div className="text-green-400 text-xs font-mono font-bold mt-1 select-none">&gt;</div>
                <span className="text-cyan-400 font-bold">// DESCRIPCIÓN:</span><br />Solución de ciberseguridad diseñada para analizar, detectar y mitigar vulnerabilidades en aplicaciones y servicios web.
                <br /><br />
                <span className="text-cyan-400 font-bold">// CAPACIDADES:</span><br />
                Escaneo de puertos • Análisis SSL/TLS • Verificación de headers de seguridad •
                Detección de vulnerabilidades • Monitoreo de uptime
              </p>
            </div>
          </div>

          {/* System Status */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 font-bold">SYSTEM_ONLINE</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded">
              <span className="text-gray-500">v2.4.7</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded">
              <span className="text-purple-400">NEXT.JS</span>
            </div>
          </div>
        </div>

        {/* Scan Form */}
        <ScanForm
          onScanStart={handleScanStart}
          onScanComplete={handleScanComplete}
          onError={handleError}
        />

        {/* Error Display */}
        {error && (
          <div className="mb-8 terminal-panel p-4 border-red-500/30 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 animate-pulse" />
              <div>
                <div className="text-red-400 font-mono font-bold text-sm mb-1">ERROR:</div>
                <p className="text-red-300 font-mono text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Scan Results */}
        {scanData && (
          <div className="space-y-8 pb-20">
            {/* Security Dashboard */}
            <SecurityDashboard
              score={scanData.score}
              openPortsCount={scanData.ports.filter(p => p.status === 'open').length}
            />

            {/* Two Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ScanResults results={scanData} />
              <div>
                <SSLReport ssl={scanData.ssl} />
                {/* Fingerprinting Report */}
                {scanData.fingerprint && (
                  <FingerprintReport fingerprint={scanData.fingerprint} />
                )}
              </div>
            </div>

            {/* Uptime Report (New Feature) */}
            {scanData.uptime && (
              <UptimeReport uptime={scanData.uptime} />
            )}

            {/* Headers Report */}
            <HeadersReport headers={scanData.headers} />

            {/* Two Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <VulnerabilityReport vulns={scanData.vulnerabilities} />
              <SubdomainsReport subdomains={scanData.subdomains} />
            </div>

            {/* Footer Credits */}
            <div className="terminal-panel p-6 text-center">
              <div className="text-xs text-gray-600 font-mono space-y-1">
                <div className="text-green-400 font-bold mb-2">╔═══════════════════════════════════════╗</div>
                <div>SCAN COMPLETED SUCCESSFULLY</div>
                <div>Timestamp: {new Date(scanData.timestamp).toLocaleString()}</div>
                <div className="text-green-400 font-bold mt-2">╚═══════════════════════════════════════╝</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
