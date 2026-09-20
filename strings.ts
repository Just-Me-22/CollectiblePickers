/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export const S = {
    favourites: "Favourites",
    recent: "Recent",
    allCategories: "All categories",
    sortLabel: "Sort",
    categoryLabel: "Category",
    add: "Add to favourites",
    remove: "Remove from favourites",
    noFavourites: "No favourites yet. Tragic.",
    nothingHere: "Nothing in this category.",
    collapse: "Collapse",
    expand: "Expand",

    healthy: "Working in all four pickers.",
    unreached: "Not reached yet",
    unreachedHint: "Open each picker once. Whatever is still listed has stopped matching Discord.",

    backup: "Backup",
    copy: "Copy",
    copied: "Copied",
    copyFailed: "Could not reach the clipboard",
    importLabel: "Paste a backup to restore it",
    importAction: "Restore",
    imported: (n: number) => `Restored ${n} favourites`,
    importFailed: "That is not a backup"
} as const;
