<svelte:options runes={true} />

<script lang="ts">
    import { onMount } from "svelte";
    import type { Meta, Section, QuestionWithSection } from "$lib/types";
    import type { PageProps } from "./$types";

    let { data }: PageProps = $props();

    let meta: Meta = $derived(data.meta);
    let sections: Section[] = $derived(data.sections);

    const allQuestions: QuestionWithSection[] = $derived(
        sections.flatMap((s) =>
            s.questions.map((q) => ({ ...q, sectionId: s.id })),
        ),
    );

    let openMap = $state<Record<string, boolean>>({});
    let closedGroups = $state<Record<string, boolean>>({});
    let drawerOpen = $state(false);
    let activeQ = $state("");
    let activeS = $state("");

    let wrapEl = $state<HTMLDivElement | null>(null);
    let sideBody = $state<HTMLDivElement | null>(null);

    const isOpen = (id: string) => !!openMap[id];

    function toggleQ(id: string) {
        openMap = { ...openMap, [id]: !openMap[id] };
    }

    function syncToggle(e: Event, id: string) {
        const el = e.currentTarget as HTMLDetailsElement;
        if (el.open !== isOpen(id)) openMap = { ...openMap, [id]: el.open };
    }

    function expandAll() {
        const m: Record<string, boolean> = {};
        for (const q of allQuestions) m[q.id] = true;
        openMap = m;
    }

    function collapseAll() {
        openMap = {};
    }

    function toggleGroup(id: string) {
        closedGroups = { ...closedGroups, [id]: !closedGroups[id] };
    }

    function scrollToId(id: string) {
        requestAnimationFrame(() => {
            const el = document.getElementById(id);
            if (el) el.scrollIntoView({ block: "start", behavior: "smooth" });
        });
    }

    function goQuestion(id: string) {
        openMap = { ...openMap, [id]: true };
        drawerOpen = false;
        scrollToId(id);
    }

    function goSection(id: string) {
        drawerOpen = false;
        scrollToId(id);
    }

    // 当前高亮的题目变化时，让侧栏跟随滚动
    $effect(() => {
        if (!activeQ || !sideBody) return;
        const link = sideBody.querySelector<HTMLAnchorElement>(
            `a[data-q="${activeQ}"]`,
        );
        if (!link) return;
        const lr = link.getBoundingClientRect();
        const br = sideBody.getBoundingClientRect();
        if (lr.top < br.top + 8) sideBody.scrollTop -= br.top + 8 - lr.top;
        else if (lr.bottom > br.bottom - 8)
            sideBody.scrollTop += lr.bottom - br.bottom + 8;
    });

    // 滚动高亮：监听 .wrap 容器而不是 window
    $effect(() => {
        const el = wrapEl;
        if (!el) return;

        let raf = 0;

        function measure() {
            raf = 0;
            const line = el!.getBoundingClientRect().top + 20;

            let s = "";
            for (const sec of sections) {
                const node = document.getElementById(sec.id);
                if (node && node.getBoundingClientRect().top <= line)
                    s = sec.id;
            }
            if (s !== activeS) activeS = s;

            let q = "";
            for (const item of allQuestions) {
                const node = document.getElementById(item.id);
                if (!node) continue;
                const r = node.getBoundingClientRect();
                if (r.top <= line) {
                    if (r.bottom > line) {
                        q = item.id;
                        break;
                    }
                } else break;
            }
            if (q !== activeQ) activeQ = q;
        }

        const onScroll = () => {
            if (!raf) raf = requestAnimationFrame(measure);
        };

        el.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        measure();

        return () => {
            el.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
            cancelAnimationFrame(raf);
        };
    });

    onMount(() => {
        const onPrint = () => expandAll();
        window.addEventListener("beforeprint", onPrint);

        const hash = decodeURIComponent(location.hash.slice(1));
        if (hash && document.getElementById(hash)) {
            openMap = { ...openMap, [hash]: true };
            scrollToId(hash);
        }

        return () => window.removeEventListener("beforeprint", onPrint);
    });
</script>

<div class="ivx" class:side-open={drawerOpen}>
    <div class="col">
        <header class="top">
            <div class="head-inner">
                <div class="kicker">{meta.kicker}</div>
                <h1>{meta.title}</h1>
                <p class="sub">{meta.subtitle}</p>
                <div class="meta-row">
                    {#each meta.chips as chip}
                        <span class="chip">{chip}</span>
                    {/each}
                    <button
                        class="toc-btn"
                        type="button"
                        onclick={() => (drawerOpen = true)}>目录</button
                    >
                </div>
            </div>
        </header>

        <div class="wrap" bind:this={wrapEl}>
            <div class="wrap-inner">
                {#each sections as sec (sec.id)}
                    <h2 class="sec" id={sec.id}>
                        <span class="idx">{sec.idx}</span>{sec.title}
                    </h2>
                    {#if sec.note}
                        <p class="sec-note">{sec.note}</p>
                    {/if}

                    {#each sec.questions as q (q.id)}
                        <details
                            class="qa"
                            id={q.id}
                            open={isOpen(q.id)}
                            ontoggle={(e) => syncToggle(e, q.id)}
                        >
                            <summary>
                                <span class="qn">{q.qn}</span>
                                <span>{q.title}</span>
                                <span class="lv {q.level}">{q.levelText}</span>
                            </summary>
                            <div class="ans">{@html q.html}</div>
                        </details>
                    {/each}
                {/each}

                <!-- <footer>
                    {meta.footer}<br />
                    配套《java-后端面试题库》使用 · 答案可根据团队实际技术栈调整
                </footer> -->
            </div>
        </div>
    </div>

    <aside class="side" id="side">
        <div class="side-head">
            <div class="side-head-row">
                <h2>目录</h2>
                <button
                    class="side-close"
                    type="button"
                    aria-label="关闭目录"
                    onclick={() => (drawerOpen = false)}>×</button
                >
            </div>
            <div class="side-acts">
                <button type="button" onclick={expandAll}>展开全部</button>
                <button type="button" onclick={collapseAll}>收起全部</button>
            </div>
            <p class="side-hint">点击二级条目定位并自动展开该题</p>
        </div>

        <div class="side-body" bind:this={sideBody}>
            <ol class="toc-l1">
                {#each sections as sec (sec.id)}
                    <li class="grp" class:closed={closedGroups[sec.id]}>
                        <div class="sec-row">
                            <a
                                class="sec-link"
                                class:active={activeS === sec.id}
                                href="#{sec.id}"
                                onclick={(e) => {
                                    e.preventDefault();
                                    goSection(sec.id);
                                }}
                            >
                                <span class="n">{sec.idx}</span>
                                <span class="t">{sec.title}</span>
                            </a>
                            <button
                                class="caret"
                                type="button"
                                aria-label="折叠该章"
                                aria-expanded={!closedGroups[sec.id]}
                                onclick={() => toggleGroup(sec.id)}
                            ></button>
                        </div>
                        <ol class="sub">
                            {#each sec.questions as q (q.id)}
                                <li>
                                    <a
                                        href="#{q.id}"
                                        data-q={q.id}
                                        class:active={activeQ === q.id}
                                        title={q.title}
                                        onclick={(e) => {
                                            e.preventDefault();
                                            goQuestion(q.id);
                                        }}
                                    >
                                        <span class="n">{q.qn}</span>{q.title}
                                    </a>
                                </li>
                            {/each}
                        </ol>
                    </li>
                {/each}
            </ol>
        </div>
    </aside>

    <div
        class="side-mask"
        role="button"
        tabindex="-1"
        aria-label="关闭目录"
        onclick={() => (drawerOpen = false)}
        onkeydown={(e) => {
            if (e.key === "Enter" || e.key === " ") drawerOpen = false;
        }}
    ></div>

    <button
        class="side-toggle"
        type="button"
        aria-label="打开目录"
        onclick={() => (drawerOpen = true)}>目录</button
    >
</div>

<style>

</style>
