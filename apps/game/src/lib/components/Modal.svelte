<script lang="ts">
    import { modal } from '$lib/stores/modal';
    import { fade, fly, scale } from 'svelte/transition';

    let state = $state<any>();
    
    // Subscribe to store
    modal.subscribe(v => state = v);

    function handleConfirm() {
        if (state.onConfirm) state.onConfirm();
    }

    function handleCancel() {
        if (state.onCancel) state.onCancel();
        else modal.close();
    }
</script>

{#if state && state.isOpen}
    <div 
        class="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/40"
        transition:fade={{ duration: 200 }}
    >
        <!-- Overlay -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="absolute inset-0" onclick={handleCancel}></div>

        <!-- Modal Content -->
        <div 
            class="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0a0a0c] p-8 shadow-[0_0_80px_rgba(0,0,0,0.5)]"
            transition:scale={{ start: 0.95, duration: 300, opacity: 0 }}
        >
            <!-- Decorative Glow -->
            <div class="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-[var(--color-brand-primary)] opacity-10 blur-[100px]"></div>
            <div class="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-[var(--color-brand-secondary)] opacity-10 blur-[100px]"></div>

            <div class="relative z-10 space-y-6">
                <header>
                    <h2 class="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-brand-primary)] mb-2">
                        {state.title}
                    </h2>
                    <p class="text-lg font-black text-white tracking-tight leading-tight">
                        {state.message}
                    </p>
                </header>

                <footer class="flex items-center justify-end gap-3 pt-4">
                    {#if state.type === 'confirm'}
                        <button 
                            onclick={handleCancel}
                            class="px-6 py-3 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-all"
                        >
                            {state.cancelText || 'Cancel'}
                        </button>
                    {/if}
                    <button 
                        onclick={handleConfirm}
                        class="px-8 py-3 rounded-2xl bg-[var(--color-brand-primary)] text-[var(--color-background-dark)] text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                    >
                        {state.confirmText || 'OK'}
                    </button>
                </footer>
            </div>
        </div>
    </div>
{/if}
