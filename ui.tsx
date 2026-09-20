/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useForceUpdater } from "@utils/react";
import { React, SearchableSelect, useEffect, useMemo, useRef } from "@webpack/common";

import { onPresentChange, presentCategories } from "./catalog";
import { S } from "./index";
import { settings, SORTS } from "./settings";
import { favouriteIds, isFavourite, notify, recentIds, subscribe, toggleFavourite } from "./store";

function useStore() {
    const update = useForceUpdater();
    useEffect(() => subscribe(update), [update]);
    return update;
}

function Heart({ filled }: { filled: boolean; }) {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <path
                fill={filled ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
                d="M12 20.3l-7.1-7a4.4 4.4 0 0 1 0-6.3 4.6 4.6 0 0 1 6.4 0l.7.7.7-.7a4.6 4.6 0 0 1 6.4 0 4.4 4.4 0 0 1 0 6.3z"
            />
        </svg>
    );
}

export function Live({ grid }: { grid: React.ReactElement; }) {
    useStore();
    return React.cloneElement(grid);
}

export function FavButton({ skuId }: { skuId?: string; }) {
    useStore();
    if (!skuId) return null;

    const favourited = isFavourite(skuId);

    return (
        <button
            className="vc-cs-fav"
            aria-pressed={favourited}
            aria-label={favourited ? S.remove : S.add}
            data-on={favourited || undefined}
            onClick={event => {
                event.preventDefault();
                event.stopPropagation();
                toggleFavourite(skuId);
            }}
        >
            <Heart filled={favourited} />
        </button>
    );
}

function Segmented() {
    const group = useRef<HTMLDivElement>(null);

    const move = (step: number) => {
        const index = SORTS.findIndex(s => s.key === settings.store.sort);
        const next = (index + step + SORTS.length) % SORTS.length;

        settings.store.reverse = false;
        settings.store.sort = SORTS[next].key;
        notify();

        group.current?.querySelectorAll("button")[next]?.focus();
    };

    return (
        <div
            ref={group}
            className="vc-cs-segmented"
            role="group"
            aria-label={S.sortLabel}
            onKeyDown={event => {
                if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                event.preventDefault();
                move(event.key === "ArrowRight" ? 1 : -1);
            }}
        >
            {SORTS.map(({ key, label, flipped }) => {
                const active = settings.store.sort === key;
                const turned = active && settings.store.reverse;

                return (
                    <button
                        key={key}
                        className="vc-cs-seg"
                        aria-pressed={active}
                        tabIndex={active ? 0 : -1}
                        onClick={() => {
                            settings.store.reverse = active ? !settings.store.reverse : false;
                            settings.store.sort = key;
                            notify();
                        }}
                    >
                        {turned && flipped ? flipped : label}
                    </button>
                );
            })}
        </div>
    );
}

function Chevron({ open }: { open: boolean; }) {
    return (
        <svg
            className="vc-cs-chevron"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            aria-hidden="true"
            data-open={open || undefined}
        >
            <path fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" d="M8 5l8 7-8 7" />
        </svg>
    );
}

export function PinnedHeader({ label, setting }: { label: string; setting: "collapsedFavourites" | "collapsedRecent"; }) {
    useStore();
    const collapsed = settings.store[setting];

    return (
        <button
            className="vc-cs-head"
            aria-expanded={!collapsed}
            aria-label={collapsed ? S.expand : S.collapse}
            onClick={() => {
                settings.store[setting] = !collapsed;
                notify();
            }}
        >
            {label}
            <Chevron open={!collapsed} />
        </button>
    );
}

export function Toolbar({ empty }: { empty: boolean; }) {
    const update = useStore();
    useEffect(() => onPresentChange(update), [update]);

    const anyPinned = favouriteIds().size + recentIds().length;
    const categories = presentCategories();
    const chosen = categories.includes(settings.store.category) ? settings.store.category : "";
    const options = useMemo(
        () => [{ label: S.allCategories, value: "" }, ...categories.map(name => ({ label: name, value: name }))],
        [categories]
    );

    return (
        <>
            <div className="vc-cs-bar">
                {categories.length > 1 && (
                    <div className="vc-cs-select">
                        <SearchableSelect
                            options={options}
                            value={options.find(o => o.value === chosen)?.value}
                            onChange={(value: string | undefined) => {
                                settings.store.category = value ?? "";
                                notify();
                            }}
                            closeOnSelect={true}
                            placeholder={S.categoryLabel}
                        />
                    </div>
                )}

                <Segmented />
            </div>

            {(anyPinned === 0 || empty) && (
                <div className="vc-cs-empty">
                    <Heart filled={false} />
                    {empty ? S.nothingHere : S.noFavourites}
                </div>
            )}
        </>
    );
}
