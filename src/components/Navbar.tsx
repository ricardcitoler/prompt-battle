import { Link } from "@tanstack/react-router";
import drLogo from "@/public/dr-logo.png";

interface NavbarProps {
  showAdminLink?: boolean;
}

export function Navbar({ showAdminLink = false }: NavbarProps) {
  return (
    <nav
      style={{
        height: 96,
        display: "flex",
        flexDirection: "row",
        padding: "0 32px",
        alignItems: "center",
        background: "rgba(0, 0, 0, .3)",
        WebkitBackdropFilter: "blur(20px)",
        backdropFilter: "blur(20px)",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <img
        src={drLogo}
        alt="The Disruptive Show"
        className="h-14 object-contain mix-blend-screen"
      />
      {showAdminLink && (
        <Link
          to="/admin"
          className="absolute right-4 bottom-3 text-sm text-white/60 hover:text-white transition-colors"
        >
          Acceder como admin
        </Link>
      )}
    </nav>
  );
}
