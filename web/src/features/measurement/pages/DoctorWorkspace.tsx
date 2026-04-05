import { ActivitySquare, ListPlus, LogOut } from "lucide-react";
import { MeasurementTypeFormPanel } from "../components/doctor-workspace/MeasurementTypeFormPanel";
import { MeasurementTypeListPanel } from "../components/doctor-workspace/MeasurementTypeListPanel";
import { useDoctorWorkspace } from "../hooks/useDoctorWorkspace";

// ─── Main component ───────────────────────────────────────────────────────────

export default function DoctorWorkspace() {
  const {
    formRef,
    types,
    isLoadingTypes,
    isPersistingSelection,
    selectedId,
    editingId,
    form,
    formError,
    formSuccess,
    setForm,
    handleSelectType,
    resetForm,
    startEdit,
    handleSeverityChange,
    addSeverity,
    removeSeverity,
    handleSave,
    handleDelete,
    handleLogout,
    goToMeasure,
  } = useDoctorWorkspace();

  // ── Selected type ─────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex h-screen w-full max-w-screen-2xl flex-col p-4 md:p-6">
        {/* Top bar */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ListPlus className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold">Tipos de medição</h1>
            </div>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Configure medidas, intervalos de gravidade e unidades para uso no ambiente de medição.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => goToMeasure(selectedId)}
              className="clinical-button clinical-button-primary flex items-center gap-2"
            >
              <ActivitySquare className="h-4 w-4" />
              Ir para medição
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="clinical-button clinical-button-ghost flex items-center gap-2 px-3 py-2 text-sm"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-2">

          {/* ── Form panel ───────────────────────────────────────────────── */}
          <MeasurementTypeFormPanel
            formRef={formRef}
            editingId={editingId}
            form={form}
            formError={formError}
            formSuccess={formSuccess}
            setForm={setForm}
            onSeverityChange={handleSeverityChange}
            onAddSeverity={addSeverity}
            onRemoveSeverity={removeSeverity}
            onSave={() => {
              void handleSave();
            }}
            onCancel={resetForm}
          />

          {/* ── Types list panel ──────────────────────────────────────────── */}
          <MeasurementTypeListPanel
            types={types}
            isLoadingTypes={isLoadingTypes}
            isPersistingSelection={isPersistingSelection}
            selectedId={selectedId}
            onSelect={(id) => {
              void handleSelectType(id);
            }}
            onOpenMeasure={goToMeasure}
            onStartEdit={startEdit}
            onDelete={(id) => {
              void handleDelete(id);
            }}
          />
        </div>
      </main>
    </div>
  );
}
