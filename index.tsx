/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { Logger } from "@utils/Logger";
import definePlugin from "@utils/types";
import { React } from "@webpack/common";

import { About } from "./About";
import { acquiredAt, categoryOf, Item, notePresent, presentCategories } from "./catalog";
import { reached } from "./health";
import { settings, SORTS } from "./settings";
import { commitRecent, favouriteIds, isFavourite, load, notify, recentIds, remember, tick } from "./store";
import { S } from "./strings";
import { FavButton, Live, PinnedHeader, Toolbar } from "./ui";

type Section = { section: string; items: Item[]; height: number; header: React.ReactNode; };

const logger = new Logger("CollectiblePickers");

const PLACEHOLDERS = new Set(["None", "Shop"]);
const real = (item: Item) => !PLACEHOLDERS.has(item.skuId);

const FAVOURITES = "vc-cp-favourites";
const RECENT = "vc-cp-recent";

const SEED_RECENT = 6;

type Collapsible = "collapsedFavourites" | "collapsedRecent";

let emptied = false;

function setEmptied(next: boolean) {
    if (next === emptied) return;

    emptied = next;
    queueMicrotask(notify);
}

function safely<T>(what: string, fallback: T, run: () => T): T {
    try {
        return run();
    } catch (error) {
        logger.error(`${what} failed, leaving Discord's own behaviour in place`, error);
        return fallback;
    }
}

function pick(ids: Iterable<string>, from: Section[]) {
    const byId = new Map<string, Item>();
    for (const { items } of from)
        for (const item of items)
            if (real(item)) byId.set(item.skuId, item);

    return [...ids].map(id => byId.get(id)).filter((item): item is Item => item != null);
}

function seeded(from: Section[]) {
    return from
        .flatMap(section => section.items)
        .filter(item => real(item) && acquiredAt(item) > 0)
        .sort((a, b) => acquiredAt(b) - acquiredAt(a))
        .slice(0, SEED_RECENT);
}

export default definePlugin({
    name: "CollectiblePickers",
    description: "Favourite collectibles, keep the last ones you used to hand, and sort and filter every picker.",
    authors: [{ name: "Just-Me-22", id: 0n }],
    settings,
    settingsAboutComponent: About,

    patches: [
        {
            find: 'section:"premium_purchase"',
            all: true,
            replacement: [
                {
                    match: /(\.filter\(\i=>\{let\{items:\i\}=\i;return \i\.length>0\}\)\},\[)([^\]]*)\]/,
                    replace: "$1$2,$self.tick()]"
                },
                {
                    match: /return\[\{section:"purchase".+?\}\)(?=\},\[)/,
                    replace: (m: string) => `return $self.sections(${m.slice("return".length)})`
                },
                {
                    match: /(?<=onClick:\i\}\)\]\}\),)/,
                    replace: "$self.toolbar(),"
                },
                {
                    match: /(\(0,\i\.jsx\)\(\i,\{\i:[\s\S]{0,300}?onOpenShop:\i\}\))/,
                    replace: "$self.live($1)"
                },
                {
                    match: /isPurchaseSection:(\i)===(\i)\.PURCHASE/g,
                    replace: "isPurchaseSection:$1===$2.PURCHASE||$self.isPinned($1)"
                },
                {
                    match: /(onSelect|onClick):\(\)=>(\i)\((\i)\)/g,
                    replace: "$1:()=>($self.picked($3),$2($3))"
                },
                {
                    noWarn: true,
                    match: /(onSelect:\(\)=>(\i)\(\{skuId:(\i)\.skuId)/,
                    replace: "onSelect:()=>($self.picked($3),$2({skuId:$3.skuId"
                },
                {
                    noWarn: true,
                    match: /(text:\i\.intl\.string\(\i\.t\.Jh8fJz\),onClick:function\(\)\{)/,
                    replace: "$1$self.applied();"
                },
                {
                    noWarn: true,
                    match: /(onApply:function\(\)\{)/,
                    replace: "$1$self.applied();"
                },
                {
                    noWarn: true,
                    match: /(\(0,\i\.jsx\)\(\i\.\i,\{skuId:(\i(?:\.skuId)?),canUsePremiumCollectibles:)/,
                    replace: "$self.favButton($2),$1"
                },
                {
                    noWarn: true,
                    match: /(\(0,\i\.jsx\)\(\i\.\i,\{isPurchaseSection:[^}]{0,400}?skuId:(\i(?:\.skuId)?)\}\))/,
                    replace: "$self.favButton($2),$1"
                },
                {
                    noWarn: true,
                    match: /getItemKey:\((\i),(\i)\)=>(\i)\[\1\]\.items\[\2\]\.skuId/,
                    replace: "getItemKey:($1,$2)=>$1+\":\"+$3[$1].items[$2].skuId"
                },
                {
                    noWarn: true,
                    match: /(\i)\.items\.filter\((\i\.\i)\)\.map\((\i)=>(\(0,\i\.jsx\)\(\i,\{currentUser:[\s\S]{0,220}?\},)\3\.skuId\)/,
                    replace: "$1.items.filter($2).map($3=>$4$3.skuId+\":\"+$1.section)"
                }
            ]
        }
    ],

    async start() {
        await load();
    },

    flux: {
        CONNECTION_OPEN: () => void load()
    },

    tick,
    isPinned: (section: string) => section === FAVOURITES || section === RECENT,

    toolbar() {
        reached("toolbar");
        return <Toolbar empty={emptied} />;
    },

    live(grid: React.ReactElement) {
        reached("grid");
        return <Live grid={grid} />;
    },

    favButton(skuId: string) {
        reached("favourite");
        return <FavButton skuId={skuId} />;
    },

    picked: (item: Item | null) => safely("noting a selection", undefined, () => {
        if (item?.skuId) remember(item.skuId);
    }),

    applied: () => safely("recording an applied collectible", undefined, commitRecent),

    sections(list: Section[]): Section[] {
        reached("sections");

        return safely("sorting the picker", list, () => {
            const all = list;
            const found = new Set<string>();
            for (const section of list)
                for (const item of section.items) {
                    const category = real(item) && categoryOf(item);
                    if (category) found.add(category);
                }
            notePresent(found);

            const only = presentCategories().includes(settings.store.category)
                ? settings.store.category
                : "";

            if (only)
                list = list
                    .map(section => ({
                        ...section,
                        items: section.items.filter(i => !real(i) || categoryOf(i) === only)
                    }))
                    .filter(section => section.items.length > 0);

            setEmptied(!list.some(section => section.items.some(real)));

            const chosen = SORTS.find(s => s.key === settings.store.sort)?.compare;
            const compare = chosen && settings.store.reverse
                ? (a: Item, b: Item) => chosen(b, a)
                : chosen;

            const sorted = compare
                ? list.map(section => ({
                    ...section,
                    items: [
                        ...section.items.filter(i => !real(i)),
                        ...section.items.filter(real).sort(compare)
                    ]
                }))
                : list;

            const pinned: Section[] = [];

            const row = (id: string, items: Item[], label: string, setting: Collapsible) => {
                if (!items.length) return;
                pinned.push({
                    section: id,
                    items: settings.store[setting] ? [] : items,
                    height: 12,
                    header: <PinnedHeader label={label} setting={setting} />
                });
            };

            const inCategory = (item: Item) => !only || categoryOf(item) === only;

            row(FAVOURITES, pick(favouriteIds(), all).filter(inCategory), S.favourites, "collapsedFavourites");

            if (settings.store.showRecent) {
                const history = pick(recentIds(), all);
                const seeding = !history.length && settings.store.seedRecent && !only;
                const recent = (seeding ? seeded(all) : history)
                    .filter(i => !isFavourite(i.skuId))
                    .filter(inCategory);

                row(RECENT, recent, S.recent, "collapsedRecent");
            }

            return [...pinned, ...sorted];
        });
    }
});
