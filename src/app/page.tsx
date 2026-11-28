import CinematicJourney from "@/components/CinematicJourney";
import Event from "@/components/Event";
import LandingPage from "@/components/LandingPage";
import Packages from "@/components/Packages";

export default function Home() {
  return <CinematicJourney landing={<LandingPage />} events={<Event />} packages={<Packages />} />;
}
  