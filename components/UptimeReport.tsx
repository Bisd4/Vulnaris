'use client';

import { useState } from 'react';
import { UptimeResult } from '@/lib/uptime';
import { Activity, Clock, TrendingUp, AlertCircle, Calendar, AlertTriangle, XCircle, Info } from 'lucide-react';
import { clsx } from 'clsx';

interface UptimeReportProps {
    uptime: UptimeResult;
}

export default function UptimeReport({ uptime }: UptimeReportProps) {
    const { availability, totalChecks, uptime: records, downtimeHours, incidents, incidentDetails } = uptime;
    const [selectedDay, setSelectedDay] = useState<string | null>(null);

    // Determine status based on availability
    let statusColor = 'text-green-400';
    let statusBg = 'bg-green-500/10';
    let statusBorder = 'border-green-500/30';
    let statusText = 'OPERATIVO';

    if (availability < 99.9) {
        statusColor = 'text-yellow-400';
        statusBg = 'bg-yellow-500/10';
        statusBorder = 'border-yellow-500/30';
        statusText = 'DEGRADADO';
    }
    if (availability < 99.0) {
        statusColor = 'text-red-400';
        statusBg = 'bg-red-500/10';
        statusBorder = 'border-red-500/30';
        statusText = 'INESTABLE';
    }

    // Group records by day for calendar view
    const dayGroups = new Map<string, typeof records>();
    records.forEach(record => {
        const day = new Date(record.timestamp).toISOString().split('T')[0];
        if (!dayGroups.has(day)) {
            dayGroups.set(day, []);
        }
        dayGroups.get(day)!.push(record);
    });

    // Calculate daily availability
    const dailyStats = Array.from(dayGroups.entries()).map(([day, dayRecords]) => {
        const upCount = dayRecords.filter(r => r.status === 'up').length;
        const availability = (upCount / dayRecords.length) * 100;
        const hasIncidents = dayRecords.some(r => r.status === 'down' || r.status === 'degraded');

        // Find incidents for this day
        const dayIncidents = incidentDetails.filter(incident => {
            const incidentDate = new Date(incident.startTime).toISOString().split('T')[0];
            return incidentDate === day;
        });

        return { day, availability, hasIncidents, upCount, totalChecks: dayRecords.length, incidents: dayIncidents };
    });

    // Get incidents for selected day
    const selectedDayData = selectedDay ? dailyStats.find(s => s.day === selectedDay) : null;

    // Helper to format duration
    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    return (
        <div className="terminal-panel overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 scanline">
            {/* Header */}
            <div className="p-4 border-b border-green-500/20 bg-black/40">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <h3 className="text-lg md:text-xl font-bold neon-text flex items-center gap-2">
                            <Activity className="h-5 w-5 md:h-6 md:w-6" />
                            MONITOREO UPTIME - 30D
                        </h3>
                        <p className="text-gray-500 text-[10px] uppercase tracking-wider font-mono mt-1">
                            {totalChecks} checks • {incidents} incidentes
                        </p>
                    </div>
                    <div className={clsx(
                        "px-3 py-1.5 rounded border font-bold text-xs flex items-center gap-2",
                        statusBg, statusBorder, statusColor
                    )}>
                        <div className={clsx("w-2 h-2 rounded-full animate-pulse", statusColor.replace('text-', 'bg-'))} />
                        {statusText}
                    </div>
                </div>
            </div>

            {/* Compact Stats */}
            <div className="p-4 grid grid-cols-3 gap-2 bg-black/20 border-b border-green-500/20">
                <div className="text-center">
                    <div className="text-2xl font-black neon-text font-mono">
                        {availability.toFixed(1)}%
                    </div>
                    <div className="text-gray-500 text-[9px] uppercase tracking-wider font-mono mt-0.5">
                        Disponibilidad
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-black text-yellow-400 font-mono">
                        {downtimeHours}h
                    </div>
                    <div className="text-gray-500 text-[9px] uppercase tracking-wider font-mono mt-0.5">
                        Downtime
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-black text-red-400 font-mono">
                        {incidents}
                    </div>
                    <div className="text-gray-500 text-[9px] uppercase tracking-wider font-mono mt-0.5">
                        Incidentes
                    </div>
                </div>
            </div>

            {/* Two Column Layout: Calendar Left, Details Right (Mobile: Stacked) */}
            <div className="p-4 flex flex-col lg:flex-row gap-4 lg:gap-6">
                {/* Calendar Column */}
                <div className="flex-shrink-0">
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-cyan-400" />
                        <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider font-mono">
                            Calendario
                        </h4>
                    </div>
                    <div className="text-gray-600 text-[10px] font-mono mb-3">
                        Click en días marcados para ver detalles
                    </div>

                    <div className="grid grid-cols-7 gap-0 w-fit">
                        {/* Day Headers */}
                        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, idx) => (
                            <div key={idx} className="w-8 h-5 flex items-center justify-center text-gray-600 text-[9px] font-bold font-mono">
                                {day}
                            </div>
                        ))}

                        {/* Calendar Days - EXTRA SMALL */}
                        {dailyStats.map((stat, idx) => {
                            const date = new Date(stat.day);
                            const dayOfMonth = date.getDate();
                            const isSelected = selectedDay === stat.day;

                            // Determine color based on availability
                            let dayColor = 'bg-green-500/60 hover:bg-green-500/80';
                            let borderColor = 'border-green-400/40';
                            if (stat.availability < 99.9) {
                                dayColor = 'bg-yellow-500/60 hover:bg-yellow-500/80';
                                borderColor = 'border-yellow-400/40';
                            }
                            if (stat.availability < 99.0) {
                                dayColor = 'bg-red-500/60 hover:bg-red-500/80';
                                borderColor = 'border-red-400/40';
                            }
                            if (stat.availability < 50) {
                                dayColor = 'bg-red-700/80 hover:bg-red-700';
                                borderColor = 'border-red-500/60';
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedDay(isSelected ? null : stat.day)}
                                    className={clsx(
                                        "w-8 h-8 rounded border transition-all relative group flex items-center justify-center",
                                        dayColor,
                                        borderColor,
                                        isSelected && "ring-2 ring-cyan-400 scale-110 z-10",
                                        stat.hasIncidents && "cursor-pointer",
                                        !stat.hasIncidents && "cursor-default opacity-60"
                                    )}
                                    disabled={!stat.hasIncidents}
                                    title={`${date.toLocaleDateString('es-ES')} - ${stat.availability.toFixed(1)}%`}
                                >
                                    <div className="text-[10px] font-bold font-mono text-white">
                                        {dayOfMonth}
                                    </div>
                                    {stat.hasIncidents && (
                                        <div className="absolute -top-0.5 -right-0.5">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-lg" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center gap-3 text-[9px] font-mono mt-4 pt-3 border-t border-green-500/20">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 bg-green-500 rounded border border-green-400" />
                            <span className="text-gray-400">≥99.9%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 bg-yellow-500 rounded border border-yellow-400" />
                            <span className="text-gray-400">99-99.8%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 bg-red-500 rounded border border-red-400" />
                            <span className="text-gray-400">&lt;99%</span>
                        </div>
                    </div>
                </div>

                {/* Details Column */}
                <div className="flex-1 lg:border-l lg:border-green-500/20 lg:pl-6">
                    {selectedDayData && selectedDayData.incidents.length > 0 ? (
                        <div className="animate-in slide-in-from-right-4 lg:slide-in-from-right-8 duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-400" />
                                    <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider font-mono">
                                        Detalles
                                    </h4>
                                </div>
                                <button
                                    onClick={() => setSelectedDay(null)}
                                    className="text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    <XCircle className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="mb-3 p-2 bg-cyan-500/10 border border-cyan-500/30 rounded">
                                <div className="text-cyan-400 font-mono text-xs font-bold">
                                    {new Date(selectedDayData.day).toLocaleDateString('es-ES', {
                                        weekday: 'long',
                                        day: 'numeric',
                                        month: 'long'
                                    })}
                                </div>
                                <div className="text-gray-400 text-[10px] font-mono mt-0.5">
                                    {selectedDayData.upCount}/{selectedDayData.totalChecks} checks OK • {selectedDayData.availability.toFixed(1)}% uptime
                                </div>
                            </div>

                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                                {selectedDayData.incidents.map((incident, idx) => {
                                    const startDate = new Date(incident.startTime);
                                    const endDate = new Date(incident.endTime);

                                    let severityColor = 'text-yellow-400';
                                    let severityBg = 'bg-yellow-500/10';
                                    let severityBorder = 'border-yellow-500/30';
                                    let SeverityIcon = AlertCircle;

                                    if (incident.severity === 'major') {
                                        severityColor = 'text-orange-400';
                                        severityBg = 'bg-orange-500/10';
                                        severityBorder = 'border-orange-500/30';
                                        SeverityIcon = AlertTriangle;
                                    } else if (incident.severity === 'critical') {
                                        severityColor = 'text-red-400';
                                        severityBg = 'bg-red-500/10';
                                        severityBorder = 'border-red-500/30';
                                        SeverityIcon = XCircle;
                                    }

                                    return (
                                        <div
                                            key={idx}
                                            className={clsx(
                                                "border rounded-lg p-3 transition-all",
                                                severityBg,
                                                severityBorder
                                            )}
                                        >
                                            {/* Header */}
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <SeverityIcon className={clsx("h-4 w-4", severityColor)} />
                                                    <code className={clsx("font-mono font-bold text-xs", severityColor)}>
                                                        {incident.id}
                                                    </code>
                                                </div>
                                                <div className={clsx(
                                                    "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border",
                                                    severityBg, severityBorder, severityColor
                                                )}>
                                                    {incident.severity}
                                                </div>
                                            </div>

                                            {/* Reason */}
                                            <p className="text-white font-mono text-xs mb-2 leading-relaxed">
                                                {incident.reason}
                                            </p>

                                            {/* Time Details */}
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="bg-black/40 border border-green-500/20 rounded p-1.5">
                                                    <div className="text-gray-500 text-[8px] uppercase tracking-wider mb-0.5 font-mono">
                                                        Inicio
                                                    </div>
                                                    <div className="text-cyan-400 font-mono text-[10px] font-bold">
                                                        {startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>

                                                <div className="bg-black/40 border border-green-500/20 rounded p-1.5">
                                                    <div className="text-gray-500 text-[8px] uppercase tracking-wider mb-0.5 font-mono">
                                                        Fin
                                                    </div>
                                                    <div className="text-cyan-400 font-mono text-[10px] font-bold">
                                                        {endDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>

                                                <div className="bg-black/40 border border-green-500/20 rounded p-1.5">
                                                    <div className="text-gray-500 text-[8px] uppercase tracking-wider mb-0.5 font-mono">
                                                        Duración
                                                    </div>
                                                    <div className={clsx("font-mono text-[10px] font-bold", severityColor)}>
                                                        {formatDuration(incident.duration)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                            <Info className="h-12 w-12 text-gray-700 mb-3" />
                            <p className="text-gray-600 font-mono text-xs">
                                Selecciona un día marcado<br />para ver detalles de incidentes
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Info */}
            <div className="p-3 bg-black/40 border-t border-green-500/20">
                <div className="flex items-start gap-2 text-[10px] text-gray-400 font-mono">
                    <Info className="h-3 w-3 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <span className="text-cyan-400 font-bold">INFO:</span> Verificaciones horarias.
                        Click en días marcados para detalles.
                    </div>
                </div>
            </div>
        </div>
    );
}
