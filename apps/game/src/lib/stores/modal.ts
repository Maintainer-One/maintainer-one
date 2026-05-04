import { writable } from 'svelte/store';

export type ModalType = 'alert' | 'confirm';

export type ModalState = {
    isOpen: boolean;
    type: ModalType;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
};

const initialState: ModalState = {
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel'
};

function createModalStore() {
    const { subscribe, set, update } = writable<ModalState>(initialState);

    return {
        subscribe,
        alert: (title: string, message: string, onConfirm?: () => void) => {
            set({
                isOpen: true,
                type: 'alert',
                title,
                message,
                confirmText: 'OK',
                onConfirm: () => {
                    if (onConfirm) onConfirm();
                    set(initialState);
                }
            });
        },
        confirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
            set({
                isOpen: true,
                type: 'confirm',
                title,
                message,
                confirmText: 'Confirm',
                cancelText: 'Cancel',
                onConfirm: () => {
                    onConfirm();
                    set(initialState);
                },
                onCancel: () => {
                    if (onCancel) onCancel();
                    set(initialState);
                }
            });
        },
        close: () => set(initialState)
    };
}

export const modal = createModalStore();
