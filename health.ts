/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export const PARTS = ["sections", "toolbar", "grid", "favourite"] as const;
export type Part = typeof PARTS[number];

const seen = new Set<Part>();

export const reached = (part: Part) => void seen.add(part);
export const missing = () => PARTS.filter(part => !seen.has(part));
