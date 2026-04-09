import { ProjectTracker } from "@/components/ProjectTracker";
import { PasswordGate } from "@/components/PasswordGate";

const Index = () => (
  <PasswordGate>
    <ProjectTracker />
  </PasswordGate>
);

export default Index;
