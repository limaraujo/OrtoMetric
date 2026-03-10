import { Download, FileText, Clock, Ruler } from 'lucide-react';

export function ResultsSidebar() {
    return (
        <div className="w-full lg:w-80 shrink-0 space-y-4">
            <div className="clinical-card space-y-4">
                <Ruler className='w-5 h-5 text-primary' />
                <h2 className="text-lg font-semibold">Resultados</h2>
            </div>
        </div>
    );
}