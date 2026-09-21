/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { chooseFile, saveFile } from "@utils/web";
import { Button, React, useState } from "@webpack/common";

import { missing, S } from "./index";
import { exported, importFrom } from "./store";

function Health() {
    const unreached = missing();
    if (!unreached.length) return null;

    return (
        <div className="vc-cs-broken">
            {S.unreached}: {unreached.map(part => <code key={part} className="vc-cs-chip">{part}</code>)}
        </div>
    );
}

function Backup() {
    const [note, setNote] = useState("");
    const [failed, setFailed] = useState(false);

    return (
        <div className="vc-cs-backup">
            <div className="vc-cs-row">
                <span className="vc-cs-label">{S.backup}</span>

                {note && <span className={failed ? "vc-cs-note vc-cs-note-bad" : "vc-cs-note"}>{note}</span>}

                <Button
                    size={Button.Sizes.SMALL}
                    color={Button.Colors.PRIMARY}
                    onClick={() => {
                        saveFile(new File([exported()], "collectible-shelf.json", { type: "application/json" }));
                        setFailed(false);
                        setNote(S.saved);
                    }}
                >
                    {S.save}
                </Button>

                <Button
                    size={Button.Sizes.SMALL}
                    color={Button.Colors.PRIMARY}
                    onClick={async () => {
                        const file = await chooseFile("application/json,.json");
                        if (!file) return;

                        const count = importFrom(await file.text());
                        setFailed(count === null);
                        setNote(count === null ? S.importFailed : S.imported(count));
                    }}
                >
                    {S.restore}
                </Button>
            </div>
        </div>
    );
}

export function BackupPanel() {
    return (
        <div className="vc-cs-panel">
            <Health />
            <Backup />
        </div>
    );
}
