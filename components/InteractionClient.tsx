"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useLabTestMeans } from "@/lib/useLabTestMeans";
import type { LabTestMean } from "@/lib/types";
import BenchCombobox from "@/components/interaction/BenchCombobox";
import SelectedBenchesBar from "@/components/interaction/SelectedBenchesBar";
import InteractionEmptyState from "@/components/interaction/InteractionEmptyState";
import SaveLoadControls from "@/components/interaction/SaveLoadControls";
import DisplaySettingsControl from "@/components/interaction/DisplaySettingsControl";
import type { DependencyGraphHandle } from "@/components/interaction/DependencyGraph";
import {
  deleteSave,
  downloadInteractionSave,
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
  const idsParam = searchParams.get("ids") ?? "";
  const selectedIds = useMemo(() => idsParam.split(",").filter(Boolean), [idsParam]);

  const [activeSaveName, setActiveSaveName] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pendingLoad, setPendingLoad] = useState<InteractionSave | null>(null);
  const [saveVersion, setSaveVersion] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const graphRef = useRef<DependencyGraphHandle>(null);

  // Stable references — an inline arrow function here would get a new
  // identity on every render (e.g. right after `handleSaveAs` itself calls
  // `setActiveSaveName`/`setDirty(false)`), and since these are also
  // dependencies of DependencyGraph's internal effects, that would spuriously
  // re-fire them and immediately flip `dirty` back to `true`.
  const handleDirty = useCallback(() => setDirty(true), []);
  const handlePendingLoadConsumed = useCallback(() => setPendingLoad(null), []);

  // `saveVersion` is a pure refresh trigger — bumped after writeSave/deleteSave
  // so this recomputes, even though `listSaves()` itself doesn't read it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saves = useMemo(() => listSaves(), [saveVersion]);

  // Ids that no longer resolve to a bench (e.g. removed from the catalogue
  // since a link was shared) are silently dropped — same behavior as the
  // previous singular `?id=`.
  const selectedBenches = useMemo(
    () =>
      selectedIds
        .map((id) => labTestMeans.find((m) => m.externalId === id))
        .filter((m): m is LabTestMean => !!m),
    [selectedIds, labTestMeans],
  );

  // Updates only the URL — used by add/remove (which also reset the active
  // save, see `handleAddBench`/`handleRemoveBench`) and by `Load` (which sets
  // its own active-save-name right after, see `handleLoadSave`).
  const updateSelectionUrl = useCallback(
    (ids: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (ids.length > 0) params.set("ids", ids.join(","));
      else params.delete("ids");
      params.delete("id"); // drop the legacy singular param if present
      router.replace(`/depgraph?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const handleAddBench = useCallback(
    (m: LabTestMean) => {
      updateSelectionUrl([...selectedIds, m.externalId]);
      setActiveSaveName(null);
      setDirty(false);
      // If the diagram isn't mounted yet (selection was empty), it'll mount
      // fresh and take the normal ELK-driven initial-layout path instead.
      graphRef.current?.addBench(m);
    },
    [selectedIds, updateSelectionUrl],
  );

  const handleRemoveBench = useCallback(
    (id: string) => {
      const next = selectedIds.filter((x) => x !== id);
      setActiveSaveName(null);
      setDirty(false);
      // Only bother mutating the (about to unmount) diagram if the selection
      // will still be non-empty afterward.
      if (next.length > 0) {
        graphRef.current?.removeBench(id);
      }
      updateSelectionUrl(next);
    },
    [selectedIds, updateSelectionUrl],
  );

  const handleSaveAs = useCallback(
    (name: string) => {
      if (selectedBenches.length === 0) return; // SaveLoadControls disables Save/Save-as in this case
      const snapshot = graphRef.current?.getSnapshot();
      if (!snapshot) return;
      const ok = writeSave(name, {
        version: 3,
        rootExternalIds: selectedBenches.map((b) => b.externalId),
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
    [selectedBenches],
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
      // Root benches that no longer exist in the catalogue (removed/renamed
      // since the save was made) are silently dropped, same as an
      // unresolvable id in `?ids=` — only abort if NONE of them resolve.
      const rootBenches = save.rootExternalIds
        .map((id) => labTestMeans.find((m) => m.externalId === id))
        .filter((m): m is LabTestMean => !!m);
      if (rootBenches.length === 0) {
        setSaveError("None of this save's root benches exist in the catalogue anymore.");
        return;
      }
      setSaveError(null);
      // Applied by DependencyGraph once its selection matches this save's
      // (catalogue-filtered) roots — immediately if it already does.
      const resolvedRootIds = rootBenches.map((b) => b.externalId);
      setPendingLoad({ ...save, rootExternalIds: resolvedRootIds });
      updateSelectionUrl(resolvedRootIds); // Load always replaces the whole selection
      setActiveSaveName(name);
      setDirty(false);
    },
    [labTestMeans, updateSelectionUrl],
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

  const handleExportActive = useCallback(() => {
    if (!activeSaveName) return;
    const snapshot = graphRef.current?.getSnapshot();
    if (!snapshot) return;
    downloadInteractionSave(activeSaveName, {
      version: 3,
      rootExternalIds: selectedBenches.map((b) => b.externalId),
      ...snapshot,
      savedAt: new Date().toISOString(),
    });
  }, [activeSaveName, selectedBenches]);

  const handleExportSave = useCallback((name: string) => {
    const save = loadSave(name);
    if (!save) {
      setSaveError("This save could not be read.");
      return;
    }
    downloadInteractionSave(name, save);
  }, []);

  const handleImport = useCallback((name: string, data: InteractionSave) => {
    const ok = writeSave(name, data);
    if (!ok) {
      setSaveError("Could not save (storage unavailable or full).");
      return;
    }
    setSaveError(null);
    setSaveVersion((v) => v + 1);
  }, []);

  const handleImportError = useCallback((message: string) => {
    setSaveError(message);
  }, []);

  if (error) throw error;
  if (loading) return <InteractionSkeleton />;

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div className="flex flex-1 flex-wrap items-start gap-3">
          <BenchCombobox
            options={labTestMeans}
            excludeIds={new Set(selectedIds)}
            onSelect={handleAddBench}
          />
          <SelectedBenchesBar benches={selectedBenches} onRemove={handleRemoveBench} />
        </div>
        <div className="flex items-center gap-1.5">
          <SaveLoadControls
            activeSaveName={activeSaveName}
            dirty={dirty}
            saves={saves}
            errorMessage={saveError}
            disableSave={selectedBenches.length === 0}
            onSaveAs={handleSaveAs}
            onSave={handleSave}
            onLoad={handleLoadSave}
            onDelete={handleDeleteSave}
            onExportActive={handleExportActive}
            onExportSave={handleExportSave}
            onImport={handleImport}
            onImportError={handleImportError}
          />
          <DisplaySettingsControl />
        </div>
      </div>
      <div className="relative flex-1">
        {selectedBenches.length > 0 ? (
          <DependencyGraph
            ref={graphRef}
            benches={selectedBenches}
            allBenches={labTestMeans}
            onDirty={handleDirty}
            pendingLoad={pendingLoad}
            onPendingLoadConsumed={handlePendingLoadConsumed}
          />
        ) : (
          <InteractionEmptyState reason="no-selection" />
        )}
      </div>
    </div>
  );
}
