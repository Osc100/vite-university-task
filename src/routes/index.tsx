import { createFileRoute } from "@tanstack/react-router";
import logo from "../logo.svg";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	return (
		<div className="text-center">
			<header className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white text-[calc(10px+2vmin)]">
				<img
					src={logo}
					className="h-[40vmin] pointer-events-none animate-[spin_30s_linear_infinite]"
					alt="logo"
				/>
				<p className="text-semibold text-4xl">
					Tarea de universidad vite de Oscar Marin
				</p>
			</header>
		</div>
	);
}
