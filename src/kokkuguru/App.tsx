"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import HowItWorks from "./components/HowItWorks";
import Platforms from "./components/Platforms";
import Features from "./components/Features";
import RecipeExplorer from "./components/RecipeExplorer";
import RecipeModal from "./components/RecipeModal";
import Faq from "./components/Faq";
import Footer from "./components/Footer";
import ApiKeyModal from "./components/ApiKeyModal";
import type { Recipe } from "./lib/api";

export default function App() {
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [keyModalOpen, setKeyModalOpen] = useState(false);

  useEffect(() => {
    const open = () => setKeyModalOpen(true);
    window.addEventListener("kokkuguru:open-key-modal", open);
    return () => window.removeEventListener("kokkuguru:open-key-modal", open);
  }, []);

  const openRecipe = useCallback((r: Recipe) => setSelected(r), []);
  const closeRecipe = useCallback(() => setSelected(null), []);

  return (
    <div className="grain relative min-h-screen overflow-x-clip">
      <Nav />
      <main>
        <Hero onOpenRecipe={openRecipe} />
        <Marquee />
        <HowItWorks />
        <Platforms />
        <RecipeExplorer onOpen={openRecipe} />
        <Features />
        <Faq />
      </main>
      <Footer />

      <AnimatePresence>
        {selected && <RecipeModal key={selected.id} recipe={selected} onClose={closeRecipe} />}
      </AnimatePresence>

      <AnimatePresence>
        {keyModalOpen && <ApiKeyModal isOpen={keyModalOpen} onClose={() => setKeyModalOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
