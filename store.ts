/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { DataStore } from "@api/index";
import { Logger } from "@utils/Logger";
import { UserStore } from "@webpack/common";

const logger = new Logger("CollectiblePickers");
const KEY = "CollectiblePickers_v1";
const RECENTS_CAP = 12;

type Saved = { favourites: string[]; recents: string[]; };

let favourites = new Set<string>();
let recents: string[] = [];
let loadedFor: string | null = null;
let version = 0;

const listeners = new Set<() => void>();

export const tick = () => version;

export function notify() {
    version++;
    listeners.forEach(fn => fn());
}

export function subscribe(fn: () => void) {
    listeners.add(fn);
    return () => void listeners.delete(fn);
}

function key() {
    const id = UserStore.getCurrentUser()?.id;
    return id ? `${KEY}:${id}` : null;
}

function save() {
    notify();

    if (loadedFor == null) return;

    DataStore.set(loadedFor, { favourites: [...favourites], recents } satisfies Saved)
        .catch(error => logger.error("could not save", error));
}

export async function load() {
    const k = key();
    if (!k || loadedFor === k) return;

    try {
        const saved = await DataStore.get<Saved>(k);
        favourites = new Set(saved?.favourites ?? []);
        recents = saved?.recents ?? [];
        loadedFor = k;
        notify();
    } catch (error) {
        logger.error("could not load", error);
    }
}

export const isFavourite = (skuId: string) => favourites.has(skuId);
export const favouriteIds = () => favourites;
export const recentIds = () => recents;

export function toggleFavourite(skuId: string) {
    favourites.has(skuId) ? favourites.delete(skuId) : favourites.add(skuId);
    save();
    return favourites.has(skuId);
}

let pending: string | null = null;

export const remember = (skuId: string) => void (pending = skuId);

export function commitRecent() {
    if (pending == null) return;

    recents = [pending, ...recents.filter(id => id !== pending)].slice(0, RECENTS_CAP);
    pending = null;
    save();
}

export const exported = () => JSON.stringify({ favourites: [...favourites], recents }, null, 2);

export function importFrom(text: string) {
    let parsed: Partial<Saved>;
    try {
        parsed = JSON.parse(text);
    } catch {
        return null;
    }

    if (!Array.isArray(parsed?.favourites)) return null;

    favourites = new Set(parsed.favourites.filter(id => typeof id === "string"));
    if (Array.isArray(parsed.recents)) recents = parsed.recents.filter(id => typeof id === "string");
    save();
    return favourites.size;
}
