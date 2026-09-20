/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button, React, TextArea, useState } from "@webpack/common";

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
    const [draft, setDraft] = useState("");
    const [note, setNote] = useState("");
    const [failed, setFailed] = useState(false);
    const [restoring, setRestoring] = useState(false);

    return (
        <div className="vc-cs-backup">
            <div className="vc-cs-row">
                <span className="vc-cs-label">{S.backup}</span>

                {note && <span className={failed ? "vc-cs-note vc-cs-note-bad" : "vc-cs-note"}>{note}</span>}

                <Button
                    size={Button.Sizes.SMALL}
                    color={Button.Colors.PRIMARY}
                    onClick={() => {
                        navigator.clipboard.writeText(exported())
                            .then(() => { setFailed(false); setNote(S.copied); })
                            .catch(() => { setFailed(true); setNote(S.copyFailed); });
                    }}
                >
                    {S.copy}
                </Button>

                <Button
                    size={Button.Sizes.SMALL}
                    color={Button.Colors.PRIMARY}
                    onClick={() => {
                        setRestoring(!restoring);
                        setNote("");
                        setDraft("");
                    }}
                >
                    {S.restoreToggle}
                </Button>
            </div>

            {restoring && (
                <div className="vc-cs-restore">
                    <TextArea
                        rows={2}
                        value={draft}
                        placeholder={S.importLabel}
                        onChange={value => {
                            setDraft(value);
                            setNote("");
                        }}
                    />

                    <Button
                        size={Button.Sizes.SMALL}
                        color={Button.Colors.BRAND}
                        disabled={!draft.trim()}
                        onClick={() => {
                            const count = importFrom(draft);
                            setFailed(count === null);
                            setNote(count === null ? S.importFailed : S.imported(count));
                            if (count !== null) {
                                setDraft("");
                                setRestoring(false);
                            }
                        }}
                    >
                        {S.importAction}
                    </Button>
                </div>
            )}
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
