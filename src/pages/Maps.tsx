import L from "leaflet";
import { useEffect, useState } from "react";
import {
	MapContainer,
	Marker,
	Popup,
	TileLayer,
	useMapEvents,
} from "react-leaflet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMap, faTimes } from "@fortawesome/free-solid-svg-icons";

import MarkerClusterGroup from "react-leaflet-markercluster";

import style from "./Maps.module.css";

interface MarkerData {
	id: number;
	position: [number, number];
	title: string;
}

const center: [number, number] = [46.785721, 3.11];

function Maps() {
	const [markers, setMarkers] = useState<MarkerData[]>([]);
	const [addingMarker, setAddingMarker] = useState(false);
	const [tempPosition, setTempPosition] = useState<[number, number] | null>(
		null
	);
	const [name, setName] = useState("");
	const [isLoaded, setIsLoaded] = useState(false);

	const createClusterCustomIcon = function (cluster: any) {
		return L.divIcon({
			html: `<span>${cluster.getChildCount()}</span>`,
			className: style.clusterIcon,
			iconSize: L.point(40, 40, true),
		});
	};

	// Récupération des positions des marqueurs depuis l'API
	useEffect(() => {
		fetch("https://markerme.vercel.app/api/v1/marker")
			.then((res) => res.json())
			.then((data) => {
				if (!Array.isArray(data)) {
					console.error(
						"Format API invalide, attendu un tableau :",
						data
					);
					return;
				}

				const formattedMarkers: MarkerData[] = data.map((marker) => ({
					id: marker.id,
					position: [marker.position.x, marker.position.y], // Conversion en format Leaflet
					title: marker.title,
				}));

				setMarkers(formattedMarkers);
			})
			.catch((err) => console.error("Erreur lors du fetch :", err))
			.finally(() => setIsLoaded(true));
	}, []);

	// Composant pour gérer les clics sur la carte
	function MapClickHandler() {
		useMapEvents({
			click(event) {
				if (addingMarker) {
					const { lat, lng } = event.latlng;
					setTempPosition([lat, lng]); // Sauvegarde temporairement la position
				}
			},
		});
		return null;
	}

	// Fonction pour valider et ajouter un nouveau marqueur
	const handleAddMarker = () => {
		if (tempPosition && name.trim() !== "") {
			// Création d'un nouvel ID basé sur le nombre de marqueurs (temporaire)
			const newMarker: MarkerData = {
				id: markers.length + 1,
				position: tempPosition,
				title: name,
			};

			setMarkers((prevMarkers) => [...prevMarkers, newMarker]);
			setTempPosition(null);
			setAddingMarker(false);
			setName("");

			// Envoi de la nouvelle position à l'API
			fetch("https://markerme.vercel.app/api/v1/marker", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					title: name,
					lat: tempPosition[0],
					lng: tempPosition[1],
				}),
			})
				.then((res) => res.json())
				.then((data) => {
					if (data.error) {
						console.error("Erreur lors de l'ajout :", data.error);
					} else {
						console.log("Marqueur ajouté avec succès :", data);
					}
				})
				.catch((err) => console.error("Erreur lors du fetch :", err));
		}
	};

	return (
		<div className={style.container}>
			{/* Bouton pour activer l'ajout de marqueur */}
			<button
				onClick={() => {
					setAddingMarker(!addingMarker);
					setTempPosition(null);
					setName("");
				}}
				className={`${style.addButton} ${
					addingMarker ? style.active : ""
				}`}
			>
				<FontAwesomeIcon icon={addingMarker ? faTimes : faMap} />
			</button>

			<MapContainer
				center={center}
				zoom={6}
				className={style.mapContainer}
			>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>

				{/* Gestion des clics pour ajouter un marqueur */}
				<MapClickHandler />

				{/* Affichage des marqueurs existants avec validation */}
				{isLoaded && markers.length > 0 ? (
					<MarkerClusterGroup
						showCoverageOnHover={false}
						spiderfyDistanceMultiplier={2}
						iconCreateFunction={createClusterCustomIcon}
					>
						{markers.map((marker) => (
							<Marker key={marker.id} position={marker.position}>
								<Popup>
									<strong>
										{marker.title || "Sans titre"}
									</strong>
									<br />
									Latitude: {marker.position[0].toFixed(5)}
									<br />
									Longitude: {marker.position[1].toFixed(5)}
								</Popup>
							</Marker>
						))}
					</MarkerClusterGroup>
				) : isLoaded ? (
					<p className={style.noData}>Aucun marqueur trouvé.</p>
				) : (
					<p className={style.loading}>Chargement des marqueurs...</p>
				)}
			</MapContainer>

			{/* Formulaire qui apparaît uniquement après un clic */}
			{tempPosition && (
				<div className={style.formContainer}>
					<label htmlFor="name">Comment tu t'appelles ?</label>
					<input
						type="text"
						id="name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Entre ton nom"
					/>
					<button
						onClick={handleAddMarker}
						className={style.validateButton}
					>
						Valider
					</button>
				</div>
			)}
		</div>
	);
}

export default Maps;
