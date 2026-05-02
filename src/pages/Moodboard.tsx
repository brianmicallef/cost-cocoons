import { MoodboardPage } from "@/components/moodboard/MoodboardPage";
import { PasswordGate } from "@/components/PasswordGate";

const Moodboard = () => (
  <PasswordGate>
    <MoodboardPage />
  </PasswordGate>
);

export default Moodboard;
