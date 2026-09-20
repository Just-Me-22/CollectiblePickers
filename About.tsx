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

    return (
        <div className="vc-cp-row">
            <span className={unreached.length ? "vc-cp-dot vc-cp-dot-warn" : "vc-cp-dot vc-cp-dot-ok"} />
            {unreached.length
                ? <span>{S.unreached}: {unreached.map(part => <code key={part} className="vc-cp-chip">{part}</code>)}</span>
                : <span>{S.healthy}</span>}
        </div>
    );
}

function Backup() {
    const [draft, setDraft] = useState("");
    const [note, setNote] = useState("");
    const [failed, setFailed] = useState(false);

    return (
        <div className="vc-cp-backup">
            <div className="vc-cp-row">
                <span className="vc-cp-label">{S.backup}</span>

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
                    color={Button.Colors.BRAND}
                    disabled={!draft.trim()}
                    onClick={() => {
                        const count = importFrom(draft);
                        setFailed(count === null);
                        setNote(count === null ? S.importFailed : S.imported(count));
                        if (count !== null) setDraft("");
                    }}
                >
                    {S.importAction}
                </Button>

                {note && <span className={failed ? "vc-cp-note vc-cp-note-bad" : "vc-cp-note"}>{note}</span>}
            </div>

            <TextArea
                rows={2}
                value={draft}
                placeholder={S.importLabel}
                onChange={value => {
                    setDraft(value);
                    setNote("");
                }}
            />
        </div>
    );
}

export function About() {
    return (
        <div className="vc-cp-about">
            <Health />
            <Backup />
        </div>
    );
}
