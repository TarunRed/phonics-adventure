import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useProgress } from "../../context/ProgressContext";
import { StarBadge } from "./StarBadge";
import styles from "./Header.module.css";

interface HeaderProps {
  title?: string;
  showStars?: boolean;
  showHome?: boolean;
  /** Extra control rendered on the right, before the star badge (e.g. a help button). */
  rightExtra?: ReactNode;
}

export function Header({ title, showStars = true, showHome = true, rightExtra }: HeaderProps) {
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
      <div className={[styles.side, styles.right].join(" ")}>
        {rightExtra}
        {showStars && <StarBadge stars={stars} />}
      </div>
    </header>
  );
}
