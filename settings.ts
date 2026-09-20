/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

import { categoryOf, Item, nameOf } from "./catalog";

const byName = (a: Item, b: Item) =>
    nameOf(a).localeCompare(nameOf(b), undefined, { numeric: true, sensitivity: "base" });

const byCategory = (a: Item, b: Item) =>
    (categoryOf(a) ?? "￿").localeCompare(categoryOf(b) ?? "￿") || byName(a, b);

export const SORTS = [
    { key: "default", label: "Discord", flipped: null, compare: null },
    { key: "name", label: "A to Z", flipped: "Z to A", compare: byName },
    { key: "category", label: "Category", flipped: "Category up", compare: byCategory }
] as const;

export const settings = definePluginSettings({
    sort: {
        type: OptionType.SELECT,
        description: "Order within each section",
        hidden: true,
        options: SORTS.map(({ key, label }) => ({ value: key, label, default: key === "default" }))
    },
    reverse: {
        type: OptionType.BOOLEAN,
        description: "Turn the current sort around",
        hidden: true,
        default: false
    },
    category: {
        type: OptionType.STRING,
        description: "Only show one category",
        hidden: true,
        default: ""
    },
    collapsedFavourites: {
        type: OptionType.BOOLEAN,
        description: "Favourites row folded away",
        hidden: true,
        default: false
    },
    collapsedRecent: {
        type: OptionType.BOOLEAN,
        description: "Recent row folded away",
        hidden: true,
        default: false
    },
    showRecent: {
        type: OptionType.BOOLEAN,
        description: "Pin a row of what you picked most recently",
        default: true
    },
    seedRecent: {
        type: OptionType.BOOLEAN,
        description: "Fill that row with your newest collectibles until you have picked anything",
        default: true
    }
});
