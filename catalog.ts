/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { findStore } from "@webpack";

export type Item = { skuId: string; label?: string; };

type Meta = { name?: string; category?: string; purchasedAt?: string | number; };

let index: Map<string, Meta> | null = null;
let categories: string[] = [];
let builtAt = 0;

const STALE_AFTER = 30_000;

function build() {
    const next = new Map<string, Meta>();
    const names = new Set<string>();

    const catalogue = findStore("CollectiblesCategoryStore") as any;
    const owned = findStore("CollectiblesPurchaseStore") as any;

    const add = (product: any, purchasedAt?: string | number) => {
        if (!product?.items?.length) return;

        const category = product.categorySkuId
            ? catalogue?.getCategory?.(product.categorySkuId)?.name
            : undefined;
        if (category) names.add(category);

        for (const item of product.items)
            next.set(item.skuId, { name: product.name, category, purchasedAt });
    };

    for (const product of catalogue?.products?.values?.() ?? []) add(product);
    for (const purchase of owned?.purchases?.values?.() ?? []) add(purchase, purchase?.purchasedAt);

    index = next;
    categories = [...names].sort((a, b) => a.localeCompare(b));
    builtAt = Date.now();
}

function ready() {
    if (index === null || Date.now() - builtAt > STALE_AFTER) build();
    return index!;
}

export const nameOf = (item: Item) => ready().get(item.skuId)?.name ?? item.label ?? item.skuId;
export const categoryOf = (item: Item) => ready().get(item.skuId)?.category;
export function acquiredAt(item: Item) {
    const at = ready().get(item.skuId)?.purchasedAt;
    if (at == null) return 0;

    const ms = typeof at === "number" ? at : Date.parse(String(at));
    return Number.isNaN(ms) ? 0 : ms;
}

let present: string[] = [];
const watchers = new Set<() => void>();

export function onPresentChange(fn: () => void) {
    watchers.add(fn);
    return () => void watchers.delete(fn);
}

export const presentCategories = () => present;

export function notePresent(found: Set<string>) {
    const next = [...found].sort((a, b) => a.localeCompare(b));
    if (next.length === present.length && next.every((name, i) => name === present[i])) return;

    present = next;
    queueMicrotask(() => watchers.forEach(fn => fn()));
}
