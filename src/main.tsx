import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Maps from "./pages/Maps";
import "./index.css";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<Maps />
	</StrictMode>
);
