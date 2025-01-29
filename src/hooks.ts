
import { App } from 'obsidian';
import { useContext } from "react";
import { AppContext } from "./core/context"; // Ensure you have an AppContext

export const useApp = (): App => {
	const context = useContext(AppContext);
	if (!context) {
		throw new Error("useApp must be used within an AppProvider");
	}
	return context;
};
