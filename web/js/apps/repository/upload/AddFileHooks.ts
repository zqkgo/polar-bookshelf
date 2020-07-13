import {DocImporter, ImportedFile} from "../importers/DocImporter";
import {useLogger} from "../../../mui/MUILogger";
import {usePersistenceLayerContext} from "../../../../../apps/repository/js/persistence_layer/PersistenceLayerApp";
import {DeterminateProgressBar} from "../../../ui/progress_bar/DeterminateProgressBar";
import {ProgressTracker} from "polar-shared/src/util/ProgressTracker";
import {useDialogManager} from "../../../mui/dialogs/MUIDialogControllers";
import {WriteFileProgressListener} from "../../../datastore/Datastore";
import {FilePaths} from "polar-shared/src/util/FilePaths";

export namespace AddFileHooks {

    export function useAddFileImporter() {

        const log = useLogger();
        const {persistenceLayerProvider} = usePersistenceLayerContext()
        const dialogManager = useDialogManager();

        async function doImportFiles(files: ReadonlyArray<File>): Promise<ReadonlyArray<ImportedFile>> {

            async function doFile(idx: number, file: File) {

                console.log("Importing file: ", file);

                const updateProgress =
                    await dialogManager.taskbar({message: `Uploading file ${idx} of ${files.length} file(s)`});

                updateProgress({value: 'indeterminate'});

                try {

                    const writeFileProgressListener: WriteFileProgressListener = (progress) => {
                        updateProgress({value: progress.progress});
                    };

                    const importedFile = await doImportFile(file, writeFileProgressListener);
                    log.info("Imported file: ", importedFile);
                    result.push(importedFile);

                } catch (e) {
                    log.error("Failed to import file: ", e, file);
                } finally {

                    updateProgress({value: 100});

                    const progress = progressTracker.terminate();
                    // TODO this should be deprecated...
                    DeterminateProgressBar.update(progress);

                }

            }

            const progressTracker = new ProgressTracker({total: files.length, id: 'import-files'});

            const result: ImportedFile[] = [];

            try {

                let idx = 0;

                for (const file of files) {
                    ++idx;
                    await doFile(idx, file);
                }

                return result;

            } finally {
                // noop
            }

        }

        async function doImportFile(file: File,
                                    progressListener: WriteFileProgressListener): Promise<ImportedFile> {

            log.info("Importing file: ", file);

            return await DocImporter.importFile(persistenceLayerProvider,
                                                URL.createObjectURL(file),
                                                FilePaths.basename(file.name),
                                                {progressListener});

        }

        async function handleAddFileRequests(files: ReadonlyArray<File>) {

            if (files.length > 0) {

                // FIXME: needs to go back in after 2.0 is released
                // const accountUpgrader = new AccountUpgrader();
                //
                // if (await accountUpgrader.upgradeRequired()) {
                //     accountUpgrader.startUpgrade();
                //     return;
                // }

                try {
                    await doImportFiles(files);
                } catch (e) {
                    log.error("Unable to import files: ", files, e);
                }

            } else {
                throw new Error("Unable to upload files.  Only PDF and EPUB uploads are supported.");
            }

        }

        return (files: ReadonlyArray<File>) => {

            // we have to do three main things here:

            if (! files || files.length === 0) {
                log.warn("No dataTransfer");
            }

            async function doAsync() {
                await handleAddFileRequests(files);
            }

            doAsync()
                .catch(err => log.error("Unable to handle upload: ", err));

        }


    }


}
