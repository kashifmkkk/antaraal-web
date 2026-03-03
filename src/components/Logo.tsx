import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { THEME_LOOKUP } from "@/theme/theme-config";

import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";
import logoLightFull from "@/assets/logo-light-full.png";
import logoDarkFull from "@/assets/logo-dark-full.png";

type Props = {
  full?: boolean; // use the full (wordmark) logo
  alt?: string;
  className?: string;
};

const Logo: React.FC<Props> = ({ full = false, alt = "Antaraal", className = "" }) => {
  const { theme } = useTheme();
  const isDark = THEME_LOOKUP[theme]?.colorScheme === "dark";

  const src = full ? (isDark ? logoDarkFull : logoLightFull) : (isDark ? logoDark : logoLight);

  return <img src={src} alt={alt} className={className} />;
};

export default Logo;
