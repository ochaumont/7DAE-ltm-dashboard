"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useLabTestMeans } from "@/lib/useLabTestMeans";
import type { LabTestMean } from "@/lib/types";
import BenchCombobox from "@/components/interaction/BenchCombobox";
import InteractionEmptyState from "@/components/interaction/InteractionEmptyState";
import SaveLoadControls from "@/components/interaction/SaveLoadControls";
import type { DependencyGraphHandle } from "@/components/interaction/DependencyGraph";
import type { ElkAlgorithm } from "@/components/interaction/useElkLayout";
import {
  deleteSave,
  listSaves,
  loadSave,
  writeSave,
  type InteractionSave,
} from "@/lib/interactionSaves";

const DependencyGraph = dynamic(
  () => import("@/components/interaction/DependencyGraph"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-surface-2 skeleton-pulse" />
    ),
  },
);

const ALGORITHM_LABELS: Record<ElkAlgorithm, string> = {
  layered: "Layered",
  radial: "Radial",
};

function InteractionSkeleton() {
  return (
    <div className="h-[calc(100vh-57px)] bg-surface-2 skeleton-pulse flex items-center justify-center">
      <span className="text-sm text-muted font-mono">Loading benches…</span>
    </div>
  );
}

export default function InteractionClient() {
  const { labTestMeans, loading, error } = useLabTestMeans();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedExternalId = searchParams.get("id") ?? null;

  const [algorithm, setAlgorithm] = useState<ElkAlgorithm>("layered");
  const [activeSaveName, setActiveSaveName] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pendingLoad, setPendingLoad] = useState<InteractionSave | null>(null);
  const [saveVersion, setSaveVersion] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const graphRef = useRef<DependencyGraphHandle>(null);

  // `saveVersion` is a pure refresh trigger — bumped after writeSave/deleteSave
  // so this recomputes, even though `listSaves()` itself doesn't read it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saves = useMemo(() => listSaves(), [saveVersion]);

  const selected = selectedExternalId
    ? labTestMeans.find((m) => m.externalId === selectedExternalId) ?? null
    : null;

  // Updates only the URL — used both by manual bench selection (which also
  // resets the active save, see `handleComboboxChange`) and by `Load`
  // (which sets its own active-save-name right after, see `handleLoadSave`).
  const updateBenchUrl = useCallback(
    (m: LabTestMean | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (m) params.set("id", m.externalId);
      else params.delete("id");
      router.replace(`/interaction?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const handleComboboxChange = useCallback(
    (m: LabTestMean | null) => {
      updateBenchUrl(m);
      setActiveSaveName(null);
      setDirty(false);
    },
    [updateBenchUrl],
  );

  const handleAlgorithmChange = useCallback((next: ElkAlgorithm) => {
    setAlgorithm(next);
    setActiveSaveName(null);
    setDirty(false);
  }, []);

  const handleSaveAs = useCallback(
    (name: string) => {
      if (!selected) return; // SaveLoadControls disables Save/Save-as in this case
      const snapshot = graphRef.current?.getSnapshot();
      if (!snapshot) return;
      const ok = writeSave(name, {
        version: 1,
        rootExternalId: selected.externalId,
        algorithm,
        ...snapshot,
        savedAt: new Date().toISOString(),
      });
      if (!ok) {
        setSaveError("Could not save (storage unavailable or full).");
        return;
      }
      setSaveError(null);
      setActiveSaveName(name);
      setDirty(false);
      setSaveVersion((v) => v + 1);
    },
    [selected, algorithm],
  );

  const handleSave = useCallback(() => {
    if (!activeSaveName) return; // SaveLoadControls routes this to Save-as instead
    handleSaveAs(activeSaveName);
  }, [activeSaveName, handleSaveAs]);

  const handleLoadSave = useCallback(
    (name: string) => {
      const save = loadSave(name);
      if (!save) {
        setSaveError("This save could not be read.");
        return;
      }
      const rootBench = labTestMeans.find((m) => m.externalId === save.rootExternalId);
      if (!rootBench) {
        setSaveError("This save's root bench no longer exists in the catalogue.");
        return;
      }
      setSaveError(null);
      // Applied by DependencyGraph once its ELK layout is ready for this
      // bench/algorithm — immediately if both already match.
      setPendingLoad(save);
      if (save.algorithm !== algorithm) setAlgorithm(save.algorithm);
      if (!selected || selected.externalId !== rootBench.externalId) {
        updateBenchUrl(rootBench);
      }
      setActiveSaveName(name);
      setDirty(false);
    },
    [labTestMeans, algorithm, selected, updateBenchUrl],
  );

  const handleDeleteSave = useCallback(
    (name: string) => {
      deleteSave(name);
      if (activeSaveName === name) {
        setActiveSaveName(null);
        setDirty(false);
      }
      setSaveVersion((v) => v + 1);
    },
    [activeSaveName],
  );

  if (error) throw error;
  if (loading) return <InteractionSkeleton />;

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <BenchCombobox
          options={labTestMeans}
          value={selected}
          onChange={handleComboboxChange}
        />
        <div className="flex items-center gap-1.5">
          <label className="flex items-center gap-2 rounded-card border border-border bg-surface px-2.5 py-1.5 text-xs text-muted">
            Layout
            <select
              value={algorithm}
              onChange={(e) => handleAlgorithmChange(e.target.value as ElkAlgorithm)}
              className="rounded border border-border bg-surface px-1.5 py-0.5 text-xs text-fg"
            >
              {(Object.keys(ALGORITHM_LABELS) as ElkAlgorithm[]).map((a) => (
                <option key={a} value={a}>
                  {ALGORITHM_LABELS[a]}
                </option>
              ))}
            </select>
          </label>
          <SaveLoadControls
            activeSaveName={activeSaveName}
            dirty={dirty}
            saves={saves}
            errorMessage={saveError}
            disableSave={!selected}
            onSaveAs={handleSaveAs}
            onSave={handleSave}
            onLoad={handleLoadSave}
            onDelete={handleDeleteSave}
          />
        </div>
      </div>
      <div className="relative flex-1">
        {selected ? (
          <DependencyGraph
            ref={graphRef}
            bench={selected}
            allBenches={labTestMeans}
            algorithm={algorithm}
            onDirty={() => setDirty(true)}
            pendingLoad={pendingLoad}
            onPendingLoadConsumed={() => setPendingLoad(null)}
          />
        ) : (
          <InteractionEmptyState reason="no-selection" />
        )}
      </div>
    </div>
  );
}
