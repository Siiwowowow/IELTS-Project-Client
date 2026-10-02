"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils"; // Optional utility for className merging

export type CardContent = {
  id: string | number;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  bgClass?: string;
  theme?: "light" | "dark";
};

type SlidingCardsProps = {
  cards: CardContent[];
  className?: string;
  cardSize?: string;
  centerIcon?: React.ReactNode;
  visibleRange?: number;
  onCardClick?: (index: number) => void;
  onSwipe?: (direction: "left" | "right") => void;
};

const SlidingCards: React.FC<SlidingCardsProps> = ({
  cards,
  className = "",
  cardSize = "w-24 h-24",
  onCardClick,
  onSwipe,
}) => {
  const cardStackRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLElement[]>([]);
  const didSwipeRef = useRef(false);

  useEffect(() => {
    const cardStack = cardStackRef.current;
    if (!cardStack) return;
    cardsRef.current = Array.from(cardStack.querySelectorAll(".card"));

    let isSwiping = false;
    let startX = 0;
    let currentX = 0;
    let animationFrameId: number | null = null;

    const getDuration = () => 300;

    const getActiveCard = () => cardsRef.current[0];

    const updatePositions = () => {
      cardsRef.current.forEach((card, i) => {
        const offset = i;
        card.style.zIndex = `${100 - offset}`;
        card.style.transform = `perspective(900px) translateZ(${-16 * offset}px) translateY(${8 * offset}px) translateX(${4 * offset}px) rotate(${offset * 0.35}deg)`;
        card.style.opacity = `1`;
      });
    };

    const applySwipeStyles = (deltaX: number) => {
      const card = getActiveCard();
      if (!card) return;
      const rotate = deltaX * 0.2;
      const opacity = 1 - Math.min(Math.abs(deltaX) / 100, 1) * 0.75;
      card.style.transform = `perspective(700px) translateZ(-12px) translateY(7px) translateX(${deltaX}px) rotateY(${rotate}deg)`;
      card.style.opacity = `${opacity}`;
    };

    const handleStart = (clientX: number) => {
      if (isSwiping) return;
      didSwipeRef.current = false;
      isSwiping = true;
      startX = currentX = clientX;
      const card = getActiveCard();
      if (card) card.style.transition = "none";
    };

    const handleMove = (clientX: number) => {
      if (!isSwiping) return;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        currentX = clientX;
        const deltaX = currentX - startX;
        applySwipeStyles(deltaX);
        if (Math.abs(deltaX) > 50) handleEnd();
      });
    };

    const handleEnd = () => {
      if (!isSwiping) return;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);

      const deltaX = currentX - startX;
      const threshold = 50;
      const duration = getDuration();
      const card = getActiveCard();

      if (card) {
        card.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`;

        if (Math.abs(deltaX) > threshold) {
          didSwipeRef.current = true;
          const direction = Math.sign(deltaX);
          card.style.transform = `perspective(700px) translateZ(-12px) translateY(7px) translateX(${direction * 300}px) rotateY(${direction * 20}deg)`;

          setTimeout(() => {
            card.style.transform = `perspective(700px) translateZ(-12px) translateY(7px) translateX(${direction * 300}px) rotateY(${-direction * 20}deg)`;
          }, duration / 2);

          setTimeout(() => {
            cardsRef.current = [...cardsRef.current.slice(1), card];
            updatePositions();
            onSwipe?.(direction < 0 ? "left" : "right");
            window.setTimeout(() => { didSwipeRef.current = false; }, 50);
          }, duration);
        } else {
          applySwipeStyles(0);
        }
      }

      isSwiping = false;
      startX = currentX = 0;
    };

    cardStack.addEventListener("pointerdown", (e) => handleStart(e.clientX));
    cardStack.addEventListener("pointermove", (e) => handleMove(e.clientX));
    cardStack.addEventListener("pointerup", handleEnd);

    updatePositions();
  }, [onSwipe]);

  return (
    <section
      ref={cardStackRef}
      className={cn(
        "relative grid w-full place-content-center touch-pan-y select-none",
        className
      )}
    >
      {cards.map(({ id, icon, bgClass = "bg-gradient-to-br from-pink-300 to-orange-200", theme = "light" }, index) => (
        <article
          key={id}
          data-card-theme={theme}
          onClick={() => { if (!didSwipeRef.current) onCardClick?.(index); }}
          className={cn(
            "card absolute inset-x-1 top-1 bottom-8 grid place-content-center overflow-hidden rounded-2xl border-2 border-neutral-950 shadow-[6px_6px_0_#171717] cursor-grab transition-transform ease-in-out sm:inset-x-4 sm:top-4 sm:bottom-8",
            bgClass
          )}
        >
          <span className={cn("grid min-h-0 min-w-0 place-content-stretch", cardSize)}>
            {icon || (
              <svg
                className="w-full h-full fill-white drop-shadow-md"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
              >
                <circle cx="8" cy="8" r="6" />
              </svg>
            )}
          </span>
        </article>
      ))}
    </section>
  );
};

export default SlidingCards;
