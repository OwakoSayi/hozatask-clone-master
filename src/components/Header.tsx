import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

export const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1
          className="text-2xl font-bold text-primary cursor-pointer"
          onClick={() => navigate("/")}
        >
          HozaTask
        </h1>
        <nav className="flex gap-4">
          <Button variant="ghost" onClick={() => navigate("/")}>
            Browse
          </Button>
          <Button variant="ghost" onClick={() => navigate("/supplier-submission")}>
            List Service
          </Button>
        </nav>
      </div>
    </header>
  );
};
