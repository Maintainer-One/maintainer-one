import { P as writable } from "./dev.js";
import "./index-server.js";
//#region src/lib/stores/modal.ts
var initialState = {
	isOpen: false,
	type: "alert",
	title: "",
	message: "",
	confirmText: "OK",
	cancelText: "Cancel"
};
function createModalStore() {
	const { subscribe, set, update } = writable(initialState);
	return {
		subscribe,
		alert: (title, message, onConfirm) => {
			set({
				isOpen: true,
				type: "alert",
				title,
				message,
				confirmText: "OK",
				onConfirm: () => {
					if (onConfirm) onConfirm();
					set(initialState);
				}
			});
		},
		confirm: (title, message, onConfirm, onCancel) => {
			set({
				isOpen: true,
				type: "confirm",
				title,
				message,
				confirmText: "Confirm",
				cancelText: "Cancel",
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
var modal = createModalStore();
//#endregion
export { modal as t };
