import { Clock, Ruler } from 'lucide-react';
import type { CobbMeasurement } from '../types/measurement';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ResultsSidebarProps = {
  measurements: CobbMeasurement[]
}

export function ResultsSidebar({ measurements }: ResultsSidebarProps) {
    return (
        <div className="w-full lg:w-80 shrink-0 space-y-4">
            <div className="clinical-card space-y-4">
                <Ruler className='w-5 h-5 text-primary' />
                <h2 className="text-lg font-semibold">Resultados</h2>

                <div className='space-y-3'>
                    {measurements.map((m, index) => {
                        return (
                            <div
                                key={m.id}
                                className="p-3 rounded-lg bg-secondary/50 border border-border animate-slide-in-right"
                            >
                                <span className='text-sm font-medium'>
                                    Ângulo de Cobb #{index + 1}:
                                </span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-gradient">
                                        {m.angle.toFixed(1)}
                                    </span>
                                    <span className="text-lg text-muted-foreground">°</span>
                                </div>

                                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                        {format(m.timestamp, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </span>
                                </div>

                            </div>

                        );
                    })}
                </div>
            </div>
        </div>
    );
}