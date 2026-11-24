import CinematicJourney from "@/components/CinematicJourney";
import Event from "@/components/Event";
import LandingPage from "@/components/LandingPage";

export default function Home() {
  return <CinematicJourney landing={<LandingPage />} events={<Event />} />;
}
