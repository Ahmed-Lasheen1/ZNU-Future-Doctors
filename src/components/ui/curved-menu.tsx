import React, { useRef } from "react";
import { motion, useMotionValue } from "framer-motion";
import { Link } from "react-router-dom";

export interface CurvedMenuNavItem {
  heading: string;
  href: string;
}

interface NavLinkProps extends CurvedMenuNavItem {
  setIsActive: (isActive: boolean) => void;
  index: number;
}

const NavLink: React.FC<NavLinkProps> = ({ heading, href, setIsActive, index }) => {
  const ref = useRef<HTMLAnchorElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    const rect = ref.current!.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <motion.div
      onClick={() => setIsActive(false)}
      initial="initial"
      whileHover="whileHover"
      className="group relative flex items-center justify-between border-b border-black/30 py-4 transition-colors duration-500 md:py-8 uppercase"
    >
      <Link ref={ref} onMouseMove={handleMouseMove} to={href} className="w-full">
        <div className="relative flex items-start">
          <span className="text-black transition-colors duration-500 text-3xl md:text-4xl font-thin mr-2">
            {index}.
          </span>
          <div className="flex flex-row gap-2">
            <motion.span
              variants={{ initial: { x: 0 }, whileHover: { x: -16 } }}
              transition={{ type: "spring", staggerChildren: 0.05, delayChildren: 0.15 }}
              className="relative z-10 block text-3xl md:text-4xl font-extralight text-black transition-colors duration-500"
            >
              {heading.split("").map((letter, i) => (
                <motion.span
                  key={i}
                  variants={{ initial: { x: 0 }, whileHover: { x: 16 } }}
                  transition={{ type: "spring" }}
                  className="inline-block"
                >
                  {letter === " " ? "\u00A0" : letter}
                </motion.span>
              ))}
            </motion.span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const Curve: React.FC = () => {
  const height = typeof window !== "undefined" ? window.innerHeight : 800;
  const initialPath = `M100 0 L200 0 L200 ${height} L100 ${height} Q-100 ${height / 2} 100 0`;
  const targetPath = `M100 0 L200 0 L200 ${height} L100 ${height} Q100 ${height / 2} 100 0`;

  const curve = {
    initial: { d: initialPath },
    enter: { d: targetPath, transition: { duration: 1, ease: [0.76, 0, 0.24, 1] } },
    exit: { d: initialPath, transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } },
  };

  return (
    <svg className="absolute top-0 -left-[99px] w-[100px] stroke-none h-full" style={{ fill: "#ffffff" }}>
      <motion.path variants={curve} initial="initial" animate="enter" exit="exit" />
    </svg>
  );
};

const MENU_SLIDE_ANIMATION = {
  initial: { x: "calc(100% + 100px)" },
  enter: { x: "0", transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } },
  exit: { x: "calc(100% + 100px)", transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } },
};

interface CurvedMenuProps {
  setIsActive: (isActive: boolean) => void;
  navItems: CurvedMenuNavItem[];
  footer?: React.ReactNode;
}

// Render this wrapped in <AnimatePresence> at the call site so the
// exit animation plays — see NavMenu in App.jsx.
export default function CurvedMenu({ setIsActive, navItems, footer }: CurvedMenuProps) {
  return (
    <motion.div
      variants={MENU_SLIDE_ANIMATION}
      initial="initial"
      animate="enter"
      exit="exit"
      className="h-[100dvh] w-screen max-w-screen-sm fixed right-0 top-0 z-[1200] bg-white"
    >
      <div className="h-full pt-11 flex flex-col justify-between overflow-y-auto">
        <div className="flex flex-col text-5xl gap-3 mt-0 px-6 md:px-16">
          <div className="text-black border-b border-black/30 uppercase text-sm mb-0 pb-2">
            <p>Navigation</p>
          </div>
          <section className="bg-transparent mt-0">
            <div className="mx-auto max-w-7xl">
              {navItems.map((item, index) => (
                <NavLink key={item.href} {...item} setIsActive={setIsActive} index={index + 1} />
              ))}
            </div>
          </section>
        </div>
        {footer}
      </div>
      <Curve />
    </motion.div>
  );
}
