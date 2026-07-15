import { useNavigate } from "react-router-dom";
import { useProgress } from "../../context/ProgressContext";
import { StarBadge } from "./StarBadge";
import styles from "./Header.module.css";

interface HeaderProps {
  title?: string;
  showStars?: boolean;
  showHome?: boolean;
}

export function Header({ title, showStars = true, showHome = true }: HeaderProps) {
  const navigate = useNavigate();
  const { stars } = useProgress();

  return (
    <header className={styles.header}>
      <div className={styles.side}>
        {showHome && (
          <button className={styles.homeButton} onClick={() => navigate("/")} aria-label="Go home">
            🏠
          </button>
        )}
      </div>
      {title && <h1 className={styles.title}>{title}</h1>}
      <div className={[styles.side, styles.right].join(" ")}>{showStars && <StarBadge stars={stars} />}</div>
    </header>
  );
}
