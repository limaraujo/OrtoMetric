import { Slider } from '../ui/slider'
import InputField from '../ui/InputField'
import type { ParameterState } from './types'

type Props = {
    params: ParameterState
    isCustomConfiguration: boolean
    onChange: (nextState: ParameterState) => void
    onReset: () => void
}

export function ParameterPanel(props: Props) {
    const { params, isCustomConfiguration, onChange, onReset } = props

    return (
        <article className="clinical-card !rounded-2xl !p-5">
            <header className="mb-4 flex items-center justify-between gap-2">
                <h3 className="text-lg font-black">Parametros de medicao</h3>
                <span className={isCustomConfiguration
                    ? 'rounded-full border border-primary/40 bg-primary/20 px-3 py-1 text-xs font-bold text-primary-foreground'
                    : 'rounded-full border border-border bg-secondary px-3 py-1 text-xs font-bold text-muted-foreground'}>
                    {isCustomConfiguration ? 'Customizado' : 'Padrao'}
                </span>
            </header>

            <div className="grid gap-3">
                <label className="grid gap-2 text-sm font-semibold">
                    Threshold: <span className="text-primary">{params.threshold.toFixed(2)}</span>
                    <Slider
                        min={0.1}
                        max={1.5}
                        step={0.01}
                        value={[params.threshold]}
                        onValueChange={(values) => onChange({ ...params, threshold: Number(values[0].toFixed(2)) })}
                        className="w-full"
                    />
                </label>

                <InputField
                    id="dashboard-calibration"
                    label="Calibracao"
                    type="number"
                    value={String(params.calibration)}
                    onChange={(value) => onChange({ ...params, calibration: Number(value) })}
                    required={false}
                    containerClassName="grid gap-1"
                    labelClassName="text-sm font-semibold text-foreground"
                    inputClassName="clinical-input"
                />

                <label className="grid gap-1 text-sm font-semibold">
                    Modo
                    <select
                        className="clinical-input"
                        value={params.mode}
                        onChange={(event) => onChange({ ...params, mode: event.target.value as ParameterState['mode'] })}
                    >
                        <option>Padrao</option>
                        <option>Alta precisao</option>
                        <option>Rapida</option>
                    </select>
                </label>

                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                        type="checkbox"
                        checked={params.autoNormalize}
                        onChange={(event) => onChange({ ...params, autoNormalize: event.target.checked })}
                        className="h-4 w-4 rounded border-border bg-input text-primary focus:ring-primary"
                    />
                    Normalizacao automatica
                </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className="clinical-button clinical-button-primary">Salvar configuracao</button>
                <button type="button" className="clinical-button clinical-button-ghost" onClick={onReset}>
                    Resetar
                </button>
            </div>
        </article>
    )
}
